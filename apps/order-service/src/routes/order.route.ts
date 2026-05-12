import express, { Router } from "express"
import { createPaymentIntent, flutterwaveWebhook, getAllOrders, getBanks, getOrderDetails, getSellerOrders, getUserOrders, initializePayment, updateDeliveryStatus, verifyCouponCode, verifyingPaymentSession } from "../controllers/order.controller"
import isAuthenticated from "../../../../packages/middleware/isAuthenticated"
import { isAdmin, isSeller } from "../../../../packages/middleware/authorizeRoles"

const router: Router = express.Router()


router.get("/flutterwave/get-banks", getBanks)
router.post("/verify-coupon-code", isAuthenticated, verifyCouponCode)
router.post("/create-payment-intent", isAuthenticated, createPaymentIntent)
router.post("/verifying-payment-session", isAuthenticated, verifyingPaymentSession)
router.post("/create-payment-session", isAuthenticated, initializePayment)
router.post("/webhooks/flutterwave", flutterwaveWebhook)

router.get("/get-seller-orders", isAuthenticated, isSeller, getSellerOrders)
router.get("/get-order-details/:id", isAuthenticated, getOrderDetails)
router.put("/update-status/:orderId", isAuthenticated, isSeller, updateDeliveryStatus)
router.put("/verify-coupon", isAuthenticated, verifyCouponCode)
router.get("/get-user-orders", isAuthenticated, getUserOrders)


router.get("/get-all-orders", isAuthenticated, isAdmin, getAllOrders)

export default router