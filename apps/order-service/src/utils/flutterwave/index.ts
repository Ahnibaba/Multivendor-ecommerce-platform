import axios from "axios"
import prisma from "../../../../../packages/libs/prisma"
import redis from "../../../../../packages/libs/redis"
import { Prisma } from "@prisma/client"
import { sendEmail } from "../send-email"



export const getBanksHelper = async () => {
  const response = await axios.get(
    `${process.env.FLW_BASE_URL}/banks/NG`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_PROD_SECRET_KEY}`,
        "X-Trace-Id": crypto.randomUUID()
      }
    }
  )
  return response.data
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const verifyFlutterwaveTransaction = async (transactionId: string, retries = 0): Promise<any> => {
  try {
    const options = {
      method: "GET",
      url: `${process.env.FLW_BASE_URL}/transactions/${transactionId}/verify`,
      headers: {
        Authorization: `Bearer ${process.env.FLW_PROD_SECRET_KEY}`
      }
    }

    const response = await axios.request(options)

    if (response.status === 503) {
      if (retries >= MAX_RETRIES) {
        throw new Error(
          `Flutterwave is unavailable after ${MAX_RETRIES} retries.
          Transaction ${transactionId} status is unknown. Please verify manually.`
        )
      }
      console.log(`Flutterwave returned 503 for transaction ${transactionId}.
      Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS)
      return verifyFlutterwaveTransaction(transactionId, retries + 1)
    }

    if (response.data.data.status === "pending") {
      if (retries >= MAX_RETRIES) {
        throw new Error(
          `Transaction ${transactionId} is still pending after ${MAX_RETRIES} retries.
          A webhook will be sent when it completes.`
        )
      }
      console.log(`Transaction ${transactionId} is pending.
      Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS)
      return verifyFlutterwaveTransaction(transactionId, retries + 1)
    }

    console.log("VERIFIED SUCCESSFULLY", response.data.data);
    

    return response.data.data

  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 503 && retries < MAX_RETRIES) {
      console.log(`Axios caught 503 for transaction ${transactionId}.
      Retrying in ${RETRY_DELAY_MS / 1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS)
      return verifyFlutterwaveTransaction(transactionId, retries + 1)
    }

    if (error instanceof TypeError && retries < MAX_RETRIES) {
      console.log(`Network error for transaction ${transactionId}.
      Retrying... (attempt ${retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS)
      return verifyFlutterwaveTransaction(transactionId, retries + 1)
    }

    throw error
  }
}


export const handleChargeCompleted = async (data: any) => {
  const tx = await verifyFlutterwaveTransaction(data.id)
  console.log("✅ 1. Transaction verified")

  if (tx.status !== "successful") return

  const transaction = await prisma.transaction.findUnique({
    where: { sessionId: tx.tx_ref }
  })
  console.log("✅ 2. Transaction found:", transaction?.id)

  if (!transaction) throw new Error("Transaction not found")
  if (transaction.status === "SUCCESS") return

  const aligns =
    transaction.currency === tx.currency &&
    transaction.amount === tx.charged_amount
  console.log("✅ 3. Aligns:", aligns)

  if (!aligns) throw new Error("Invalid Transaction")

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      transactionId: tx.id.toString(),
      status: "SUCCESS",
      payment_type: tx.payment_type,
      metadata: tx,
      verified: true
    }
  })
  console.log("✅ 4. Transaction updated")

  const sessionId = tx.meta.sessionId
  const userId = tx.meta.userId

  const sessionKey = `payment-session:${sessionId}`
  const sessionData = await redis.get(sessionKey)
  console.log("✅ 5. Session data:", sessionData ? "found" : "missing")

  if (!sessionData) {
    console.warn("Session data expired or missing for", sessionId)
    throw new Error("No session found. skipping order creation")
  }

  const stored = await prisma.transaction.findUnique({
    where: { sessionId }
  })
  console.log("✅ 6. Stored transaction:", stored?.id)

  if (!stored) throw new Error("Invalid sessionId")

  const { cart, amount, shippingAddressId, coupon } = stored
  console.log("✅ 7. Cart items:", (cart as any[]).length)

  const user = await prisma.users.findUnique({ where: { id: userId } })
  console.log("✅ 8. User found:", user?.email)

  const name = user?.name!
  const email = user?.email!

  const cartItems = cart as any[]
  const couponData = coupon as any

  const shopGrouped = cartItems.reduce((acc: any, item: any) => {
    if (!acc[item.shopId]) acc[item.shopId] = []
    acc[item.shopId].push(item)
    return acc
  }, {})
  console.log("✅ 9. Shop groups:", Object.keys(shopGrouped))

  let existingAnalytics = await prisma.userAnalytics.findUnique({
    where: { userId }
  })
  console.log("✅ 10. Existing analytics:", existingAnalytics ? "found" : "none")

  for (const shopId in shopGrouped) {
    console.log(`✅ 11. Processing shop: ${shopId}`)
    const orderItems = shopGrouped[shopId]

    let orderTotal = orderItems.reduce(
      (sum: number, p: any) => sum + p.quantity * p.sale_price,
      0
    )

    if (
      coupon &&
      couponData.discountedProductId &&
      orderItems.some((item: any) => item.id === couponData.discountedProductId)
    ) {
      const discountedItem = orderItems.find(
        (item: any) => item.id === couponData.discountedProductId
      )

      if (discountedItem) {
          const discount =
          couponData.discountPercent > 0
            ? (discountedItem.sale_price * discountedItem.quantity * couponData.discountPercent) / 100
            : couponData.discountAmount
        orderTotal -= discount
      }
    }
    console.log(`✅ 12. Order total for shop ${shopId}: ${orderTotal}`)

    await prisma.orders.create({
      data: {
        userId,
        shopId,
        total: orderTotal,
        paymentStatus: "Paid",
        status: "Processing",
        shippingAddressId: shippingAddressId || null,
        couponCode: couponData?.code || null,
        discountAmount: couponData?.discountPercent || couponData?.discountAmount || 0,
        items: {
          create: orderItems.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.sale_price,
            selectedOptions: item.selectedOptions
          }))
        }
      }
    })
    console.log(`✅ 13. Order created for shop: ${shopId}`)

    for (const item of orderItems) {
      const { id: productId, quantity } = item
      console.log(`✅ 14. Processing product: ${productId}`)

      await prisma.products.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
          totalSales: { increment: quantity }
        }
      })
      console.log(`✅ 15. Product stock updated: ${productId}`)

      await prisma.productAnalytics.upsert({
        where: { productId },
        create: {
          productId,
          shopId,
          purchases: quantity,
          lastviewedAt: new Date()
        },
        update: {
          purchases: { increment: quantity }
        }
      })
      console.log(`✅ 16. Product analytics updated: ${productId}`)

      const newAction = {
        productId,
        shopId,
        action: "purchase",
        timestamp: Date.now()
      }

      const currentActions = Array.isArray(existingAnalytics?.actions)
        ? (existingAnalytics!.actions as Prisma.JsonArray)
        : []

      if (existingAnalytics) {
        await prisma.userAnalytics.update({
          where: { userId },
          data: {
            lastVisited: new Date(),
            actions: [...currentActions, newAction]
          }
        })
        console.log(`✅ 17. User analytics updated`)
      } else {
        existingAnalytics = await prisma.userAnalytics.create({
          data: {
            userId,
            lastVisited: new Date(),
            actions: [newAction]
          }
        })
        console.log(`✅ 17. User analytics created`)
      }
    }
  }

  console.log("✅ 18. Sending confirmation email to:", email)
  await sendEmail(
    email,
    "🛍 Your Eshop Order Confirmation",
    "order-confirmation",
    {
      name,
      cart,
      totalAmount: couponData?.discountAmount
        ? amount - couponData?.discountAmount
        : amount,
      trackingUrl: `https://eshop.com/order/${sessionId}`
    }
  )
  console.log("✅ 19. Email sent")

  const createdShopIds = Object.keys(shopGrouped)
  const sellerShops = await prisma.shops.findMany({
    where: { id: { in: createdShopIds } },
    select: { id: true, sellerId: true, name: true }
  })
  console.log("✅ 20. Seller shops found:", sellerShops.length)

  for (const shop of sellerShops) {
    const firstProduct = shopGrouped[shop.id][0]
    const productTitle = firstProduct?.title || "a new item"

    await prisma.notifications.create({
      data: {
        title: "🛒 New Order Received",
        message: `A customer just purchased ${productTitle} from your shop.`,
        creatorId: userId,
        receiverId: shop.sellerId,
        redirect_link: `https://eshop.com/order/${sessionId}`
      }
    })
    console.log(`✅ 21. Seller notification created for: ${shop.sellerId}`)
  }

  await prisma.notifications.create({
    data: {
      title: "📦 Platform Order Alert",
      message: `A new order was placed by ${name}.`,
      creatorId: userId,
      receiverId: "6965a586bcd6ca59e76084f5", // admin
      redirect_link: `https://eshop.com/order/${sessionId}`
    }
  })
  console.log("✅ 22. Admin notification created")

  await redis.del(sessionKey)
  console.log("✅ 23. Session deleted — handleChargeCompleted COMPLETE ✅")
}