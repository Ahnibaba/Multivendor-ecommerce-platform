import { Response, Request, NextFunction } from "express"
import { getBanksHelper, handleChargeCompleted } from "../utils/flutterwave"
import { ValidationError } from "../../../../packages/error-handler"
import prisma from "../../../../packages/libs/prisma"
import axios from "axios"
import redis from "../../../../packages/libs/redis"
import crypto from "crypto"



export const getBanks = async (req: Request, res: Response) => {
  try {
    const result = await getBanksHelper()
    res.status(200).json({
      success: true,
      message: "Banks fetched successfully",
      banks: result
    })
  } catch (error) {
    console.error("Error in getBanks route", error)
  }
}

// create payment intent
export const createPaymentIntent = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { cart, shippingAddressId, coupon } = req.body

  try {
    const userId = req.user.id

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return next(new ValidationError("Cart is empty or invalid."))
    }

    const normalizedCart = JSON.stringify(
      cart
        .map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          sale_price: item.sale_price,
          shopId: item.shopId,
          selectedOptions: item.selectedOptions || {}
        }))
        .sort((a, b) => a.id.localeCompare(b.id))
    )

    const keys = await redis.keys("payment-session:*")
    for (const key of keys) {
      const data = await redis.get(key)
      if (data) {
        const session = JSON.parse(data)
        if (session.userId === userId) {
          const existingCart = JSON.stringify(
            session.cart.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              sale_price: item.sale_price,
              shopId: item.shopId,
              selectedOptions: item.selectedOptions || {}
            }))
              .sort((a: any, b: any) => a.id.localeCompare(b.id))
          )

          if (existingCart === normalizedCart) {
            return res.status(200).json({ sessionId: key.split(":")[1] })
          } else {
            await redis.del(key)
          }
        }
      }
    }

    // fetch sellers and their flutterwave account
    const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId))]

    const shops = await prisma.shops.findMany({
      where: {
        id: { in: uniqueShopIds }
      },
      select: {
        id: true,
        sellerId: true,
        subAccount: {
          select: {
            subaccount_id: true,
            currency: true,
            country: true,
            business_name: true
          }
        }
      }
    })

    const shopGrouped = cart.reduce((acc: any, item: any) => {
      if (!acc[item.shopId]) {
        acc[item.shopId] = []
      }
      acc[item.shopId].push(item)
      return acc
    }, {})

    const sellerData = shops.map((shop) => {
      const orderItems = shopGrouped[shop.id] || []

      // each seller's total based on their items in cart

      let orderTotal = orderItems.reduce(
        (sum: number, p: any) => sum + p.quantity * p.sale_price,
        0
      )

      let discountedItem
      if (
        coupon &&
        coupon?.discountedProductId &&
        orderItems.some((item: any) => item.id === coupon?.discountedProductId)
      ) {
        discountedItem = orderItems.find(
          (item: any) => item.id === coupon?.discountedProductId
        )

        if (discountedItem) {
          const discount =
            coupon.discountPercent > 0
              ? (discountedItem.sale_price * discountedItem.quantity * coupon.discountPercent) / 100
              : coupon.discountAmount
          orderTotal -= discount
        }
      }

      return {
        shopId: shop.id,
        sellerId: shop.sellerId,
        sellerSubaccountId: shop?.subAccount?.subaccount_id,
        currency: shop?.subAccount?.currency,
        sellerTotal: orderTotal,
        productId: discountedItem?.id || null
      }
    })


    // ✅ calculate total directly from cart before the loop
    let totalAmount = cart.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.sale_price
    }, 0)

    // apply coupon discount if applicable
    if (coupon && coupon.discountedProductId) {
      const discountedItem = cart.find((item: any) => item.id === coupon.discountedProductId)

      if (discountedItem) {
        const discount =
          coupon.discountPercent > 0
            ? (discountedItem.sale_price * discountedItem.quantity * coupon.discountPercent) / 100
            : coupon.discountAmount
        totalAmount -= discount
      }
    }

    // create session payload
    const sessionId = crypto.randomUUID()

    const sessionData = {
      sessionId,
      userId,
      cart,
      sellers: sellerData,
      totalAmount,
      shippingAddressId: shippingAddressId || null,
      coupon: coupon || null,
      currency: "NGN"
    }

    await redis.setex(
      `payment-session:${sessionId}`,
      600,
      JSON.stringify(sessionData)
    )

    return res.status(201).json({ sessionId })
  } catch (error) {
    return next(error)
  }
}


// verifying payment session
export const verifyingPaymentSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.query.sessionId as string
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" })
    }

    // Fetch session from Redis
    const sessionKey = `payment-session:${sessionId}`
    const sessionData = await redis.get(sessionKey)

    if (!sessionData) {
      return res.status(404).json({ error: "Session not found or expired." })
    }

    // Parse and return session
    const session = JSON.parse(sessionData)

    return res.status(200).json({
      success: true,
      session
    })
  } catch (error) {
    return next(error)
  }
}

// initialize payment
export const initializePayment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
     const { sessionId } = req.body  // ✅ just receive sessionId

    // fetch session from Redis internally
    const sessionData = await redis.get(`payment-session:${sessionId}`)
    if (!sessionData) return next(new ValidationError("Session not found"))
    
    const session = JSON.parse(sessionData)

    const userId = req.user.id
    if (!userId) {
      return new ValidationError("UserId is required")
    }

    console.log("USERID", userId);
    console.log("SESSIONUSERID", session?.userId);


    if (userId.toString() !== session?.userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden"
      })
    }

    const user = await prisma.users.findUnique({
      where: {
        id: userId
      }
    })

    if (!user) {
      return new ValidationError("User with this id does not exist!")
    }

    const subaccountsArr = session?.sellers
      ?.filter((item: any) => item.sellerSubaccountId) // ✅ skip sellers with no subaccount
      ?.map((item: any) => ({
        id: item.sellerSubaccountId,
        transaction_split_ratio: item.sellerTotal
      }))




    const options = {
      method: "POST",
      url: `${process.env.FLW_BASE_URL}/payments`,
      headers: {
        Authorization: `Bearer ${process.env.FLW_PROD_SECRET_KEY}`,
        "Content-Type": "application/json",
        accept: "application/json"
      },
      data: {
        tx_ref: session?.sessionId,
        amount: session?.totalAmount,
        currency: "NGN",
        redirect_url: `${process.env.CLIENT_URL}/payment/callback`,
        customer: {
          email: req.user.email,
          name: req.user.name
        },
        subaccounts: subaccountsArr,
        meta: {
          sessionId: session?.sessionId,
          userId: req.user.id,
        },
        customizations: {
          title: "Eshop Payment",
          logo: "https://cdn.dribbble.com/userupload/21350256/file/original-81ded13d3fb58b4790156c86b4a0f5c8.jpg?resize=752x&vertical=center"
        }
      }
    }

    const response = await axios.request(options)

    const sellerSubaccountIds = session?.sellers?.map((item: any) => (
      item.sellerSubaccountId
    ))

   const initiatedTransaction = await prisma.transaction.upsert({
    where: { sessionId: session?.sessionId },
    update: {
        // update if already exists
        amount: session?.totalAmount,
        currency: "NGN",
        sellerSubaccountId: sellerSubaccountIds,
        cart: session?.cart,
        coupon: session?.coupon,
        shippingAddressId: session?.shippingAddressId
    },
    create: {
        // create if doesn't exist
        sessionId: session?.sessionId,
        userId: user?.id,
        amount: session?.totalAmount,
        currency: "NGN",
        sellerSubaccountId: sellerSubaccountIds,
        cart: session?.cart,
        coupon: session?.coupon,
        shippingAddressId: session?.shippingAddressId
    }
})
    res.status(200).json({
      paymentLink: response.data.data.link,
      initiatedTransaction
    })
  } catch (error) {
    console.log("Error in initializing payment function", error);
    return next(error)
  }
}

// create order
export const flutterwaveWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("I HAVE BEEN PINGED");  
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET
    const signature = req.headers["verif-hash"]

    if (!signature || signature !== secretHash) {
      return res.status(401).json({
        message: "Invalid webhook signature"
      })
    }

    const { event, data } = req.body

    console.log("EVENT", event);
    console.log("DATA", data);
    
    
    if (event === "charge.completed") {
      await handleChargeCompleted(data)
    }
    res.status(200).json({ received: true })
  } catch (error) {
    console.log("Error in the flutterwaveWebhook function", error);

    return next(error)
  }
}




