import { Response, Request, NextFunction } from "express"
import { getBanksHelper, handleChargeCompleted } from "../utils/flutterwave"
import { NotFoundError, ValidationError } from "../../../../packages/error-handler"
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

// export const verifyCoupon = async (req: any, res: Response) => {
//   const { couponCode } = req.body
//   try {
//     const userId = req.user.id

//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized!" })
//     }

//     if (!couponCode) {
//       return res.status(400).json({ success: false, message: "Coupon code is required!" })
//     }

//     const foundCoupon = await prisma.discount_codes.findUnique({
//       where: {
//         discountCode: couponCode
//       }
//     })

//     if (!foundCoupon) {
//       return res.status(400).json({ success: false, message: "Invalid Coupon Code!" })
//     }

//     const coupon = {
//       code: foundCoupon.discountCode,
//       discountPercent: foundCoupon.discountPercent,
//       discountAmount: foundCoupon.discountAmount,
//       discountedProductId: foundCoupon.discountedProductId
//     }

//     return res.status(200).json({ success: true, message: "Coupon verified successfully", coupon })

//   } catch (error) {
//     console.log("Error in the verifyCoupon function", error)
//     return res.status(500).json({ success: false, message: "Server Error" })
//   }
// }

// create payment intent
export const createPaymentIntent = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { cart, shippingAddressId, coupon } = req.body

  console.log(cart);


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
            })).sort((a: any, b: any) => a.id.localeCompare(b.id))
          )

          // ✅ Also compare coupon — different coupon = different session
          const existingCoupon = JSON.stringify(session.coupon || null)
          const incomingCoupon = JSON.stringify(coupon || null)

          if (existingCart === normalizedCart && existingCoupon === incomingCoupon) {
            return res.status(200).json({ sessionId: key.split(":")[1] })
          } else {
            await redis.del(key)  // ✅ delete stale session
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


    let discount

    // ✅ calculate total directly from cart before the loop
    let totalAmount = cart.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.sale_price
    }, 0)

    // apply coupon discount if applicable
    if (coupon && coupon.discountedProductId) {
      const discountedItem = cart.find((item: any) => item.id === coupon.discountedProductId)

      if (discountedItem) {
        discount =
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
      currency: "NGN",
      discountAmount: discount
    }

    await redis.setex(
      `payment-session:${sessionId}`,
      600,
      JSON.stringify(sessionData)
    )

    return res.status(201).json({ sessionId, cart })
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

    console.log("REDIRECTURL", process.env.CLIENT_URL);


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

    // ✅ Respond to Flutterwave IMMEDIATELY
    res.status(200).json({ received: true })

    // ✅ Process in background — errors won't affect the 200 response
    if (event === "charge.completed") {
      handleChargeCompleted(data).catch((error) => {
        console.error("Error in handleChargeCompleted", error)
      })
    }

  } catch (error) {
    console.log("Error in the flutterwaveWebhook function", error);
    // ✅ Still send 200 even if something fails — so Flutterwave doesn't retry
    if (!res.headersSent) {
      res.status(200).json({ received: true })
    }
  }
}


// get sellers orders
export const getSellerOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const shop = await prisma.shops.findUnique({
      where: {
        sellerId: req.seller.id
      }
    })

    // fetch all orders for this shop
    const orders = await prisma.orders.findMany({
      where: {
        shopId: shop?.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })


    res.status(201).json({ success: true, orders })
  } catch (error) {
    next(error)
  }
}


// get order details
export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.id

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      }
    })

    if (!order) {
      return next(new NotFoundError("Order not found with the id!"))
    }

    const shippingAddress = order.shippingAddressId
      ?  await prisma.shippingAddress.findUnique({
          where: { id: order.shippingAddressId }
         })
      : null  
      
    const coupon = order.couponCode
      ? await prisma?.discount_codes.findUnique({
      where: {
        discountCode: order.couponCode
      }
    }) 
    : null 

    // fetch all products details in one go
    const productIds = order.items.map((item) => item.productId)

    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds }
      },
      select: {
        id: true,
        title: true,
        images: true
      }
    })


    const productMap = new Map((products.map((p) => [p.id, p])))

    const items = order.items.map((item) => ({
       ...item,
       selectedOptions: item.selectedOptions,
       product: productMap.get(item.productId) || null,
    }))

    res.status(200).json({
      success: true,
      order: {
        ...order,
        items,
        shippingAddress,
        couponCode: coupon
      }
    })
  } catch (error) {
    next(error)
  }
}

// update order status
export const updateDeliveryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
     const { orderId } = req.params
     const { deliveryStatus } = req.body

     if (!orderId || !deliveryStatus) {
       return res.status(400).json({ error: "Missing order ID or delivery status." })
     }

     const allowedStatuses = [
       "Ordered",
       "Packed",
       "Shipped",
       "Out for Delivery",
       "Delivered"
     ]

     if (!allowedStatuses.includes(deliveryStatus)) {
       return next(new ValidationError("Invalid delivery status."))
     }

     const existingOrder = await prisma.orders.findUnique({
        where: { id: orderId }
     })

     if (!existingOrder) {
       return next(new NotFoundError("Order not found!"))
     }

     const updatedOrder = await prisma.orders.update({
        where: { id: orderId },
        data: {
           status: deliveryStatus,
           updatedAt: new Date()  
        }
     })

     return res.status(200).json({
       success: true,
       message: "Delivery status updated successfully.",
       order: updatedOrder
     })
  } catch (error) {
    return next(error)
  }
}


// verify coupon code
export const verifyCouponCode = async (req: any, res: Response, next: NextFunction) => {
  try {
     const { couponCode, cart } = req.body

     if (!couponCode || !cart || cart.length === 0) {
       return next(new ValidationError("Coupon code and cart are required!"))
     }

     // Fetch the discount code
     const discount = await prisma.discount_codes.findUnique({
       where: { discountCode: couponCode }
     })

     if (!discount) {
       return next(new ValidationError("Coupon code isn't valid!"))
     }

     // Find matching product that includes this discount code
     const matchingProduct = cart.find((item: any) => 
       item.discount_codes?.some((d: any) => d === discount.id)
     )

     if (!matchingProduct) {
       return res.status(200).json({
         valid: false,
         discount: 0,
         discountAmount: 0,
         message: "No matching product found in cart for this coupon"
       })
     }

     let discountAmount = 0
     const price = matchingProduct.sale_price * matchingProduct.quantity

     if (discount.discountType === "percentage") {
       discountAmount = (price * discount.discountValue!) / 100
     } else if (discount.discountType === "flat") {
       discountAmount = discount.discountValue!
     }

     // prevent discount from being greater than total price
     discountAmount = Math.min(discountAmount, price)

     res.status(200).json({
       valid: true,
       discount: discount.discountValue,
       discountAmount: discountAmount.toFixed(2),
       discountedProductId: matchingProduct.id,
       discountType: discount.discountType,
       message: "Discount applied to 1 eligible product"
     })

  } catch (error) {
    next(error)
  }
}

// get user orders
export const getUserOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    })

    res.status(201).json({
      success: true,
      orders
    })
  } catch (error) {
    return next(error)
  }
}


// get all orders
export const getAllOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    
    // fetch all orders for this shop
    const orders = await prisma.orders.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })


    res.status(201).json({ success: true, orders })
  } catch (error) {
    next(error)
  }
}

// (async () => {
//   const updateOrders = await prisma.orders.updateMany({
//     data: {
//       couponCode: "flash_back_offer_2"
//     }
//   })

//   console.log(`Updated ${updateOrders.count} orders`)
//   await prisma.$disconnect()
// })()
