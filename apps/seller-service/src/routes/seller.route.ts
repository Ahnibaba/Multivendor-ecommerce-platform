import express from "express"
import { createFlutterwaveSubAccount, flutterWebhook, followShop, getSeller, getSellerEvents, getSellerProducts, getShopFollowers, initializePayment, markNotificationAsRead, sellerNotifications, unfollowShop } from "../controllers/seller.controller"
import isAuthenticated from "../../../../packages/middleware/isAuthenticated"
import { isSeller } from "../../../../packages/middleware/authorizeRoles"


const router = express.Router()

router.post("/create-subaccount", isAuthenticated, createFlutterwaveSubAccount)
router.post("/initialize-payment", isAuthenticated, initializePayment)
router.post("/webhooks/flutterwave", flutterWebhook)
router.get("/get-seller/:id", getSeller)
router.get("/get-seller-products/:id", getSellerProducts)
router.get("/get-seller-events/:id", getSellerEvents)
router.get("/is-following/id", getShopFollowers)
router.get("/follow/:1d", isAuthenticated, followShop)
router.get("/unfollow/:id", isAuthenticated, unfollowShop)
router.get("/seller-notifications", isAuthenticated, isSeller, sellerNotifications)
router.get("/mark-notification-as-read", isAuthenticated, markNotificationAsRead)



export default router