import express, { Router } from "express"
import { createPaymentIntent, flutterwaveWebhook, getBanks, initializePayment, verifyCoupon, verifyingPaymentSession } from "../controllers/order.controller"
import isAuthenticated from "../../../../packages/middleware/isAuthenticated"

const router: Router = express.Router()


router.get("/flutterwave/get-banks", getBanks)
router.post("/verify-coupon-code", isAuthenticated, verifyCoupon)
router.post("/create-payment-intent", isAuthenticated, createPaymentIntent)
router.post("/verifying-payment-session", isAuthenticated, verifyingPaymentSession)
router.post("/create-payment-session", isAuthenticated, initializePayment)
router.post("/webhooks/flutterwave", flutterwaveWebhook)


export default router