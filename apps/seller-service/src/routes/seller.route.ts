import express from "express"
import { createFlutterwaveSubAccount, flutterWebhook, getSeller, initializePayment } from "../controllers/seller.controller"
import isAuthenticated from "../../../../packages/middleware/isAuthenticated"


const router = express.Router()

router.post("/create-subaccount", isAuthenticated, createFlutterwaveSubAccount)
router.post("/initialize-payment", isAuthenticated, initializePayment)
router.post("/webhooks/flutterwave", flutterWebhook)
router.get("get-seller/:id", isAuthenticated, getSeller)



export default router