import { Response, Request, NextFunction } from "express"
import { getBanksHelper } from "../utils/flutterwave"
import { ValidationError } from "../../../../packages/error-handler"
import prisma from "../../../../packages/libs/prisma"
import axios from "axios"
import redis from "../../../../packages/libs/redis"
import crypto from "crypto"



export const getBanks = async (req: Request, res: Response) => {
  try {
    const result = await getBanksHelper()
    res.status(200).json({
      success: false,
      message: "Banks fetched successfully",
      banks: result
    })
  } catch (error) {
    console.error("Error in getBanks route", error)
  }
}

export const initializePayment = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerAmount, sellerSubaccountId, currency } = req.body

    const userId = req.user.id
    if (!userId) {
      return new ValidationError("UserId is required!")
    }

    const user = await prisma.users.findUnique({
      where: {
        id: userId
      }
    })

    if (!user) {
      return new ValidationError("User with this id does not exist!")
    }

    const sessionId = `eshop_checkout_${user.id}_${Date.now()}`

    const options = {
      method: "POST",
      url: `${process.env.FLW_BASE_URL}/payments`,
      headers: {
        Authorization: `Bearer ${process.env.FLW_PROD_SECRET_KEY}`,
        "Content-Type": "application/json",
        accept: "application/json"
      },
      data: {
        tx_ref: sessionId,
        amount: customerAmount,
        currency,
        redirect_url: `${process.env.CLIENT_URL}/payment/callback`,
        customer: {
          email: req.user.email,
          name: req.user.name
        },
        subaccounts: [
          {
            id: sellerSubaccountId,
          }
        ],
        meta: {
          sessionId,
          userId: req.user.id
        },
        customizations: {
          title: "Eshop Payment"
        }
      }
    }

    const response = await axios.request(options)

    const initiatedTransaction = await prisma.transaction.create({
      data: {
        sessionId,
        userId: user.id,
        sellerSubaccountId,
        amount: customerAmount,
        currency,
      }
    })

    res.status(200).json({
      paymentLink: response.data.data.link,
      initiatedTransaction
    })
  } catch (error) {
    console.error("Error in the initializePayment function", error);
    return next(error)
  }
}

// create payment session
export const createPaymentSession = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cart, selectedAddressId, coupon } = req.body

    const userId = req.user.id

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return next(new ValidationError("Cart is empty or invalid."))
    }

    const normalizedCart = JSON.stringify(
      cart.map((item: any) => ({
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
         sellers: {
           select: {
              flutterwaveId: true
           }
         }
       }
    })

    const sellerData = shops.map((shop) => ({
       shopId: shop.id,
       sellerId: shop.sellerId,
       flutterwaveAccountId: shop?.sellers?.flutterwaveId
    }))

    // calculate total amount
    const totalAmount = cart.reduce((total: number, item: any) => {
       return total + item.quantity * item.sale_price 
    }, 0)

    // create session payload
    const sessionId = crypto.randomUUID()

    const sessionData = {
      
    }
  } catch (error) {
    next(error)
  }
}