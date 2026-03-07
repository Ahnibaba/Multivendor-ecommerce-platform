import express, { Router } from "express"
import { getBanks } from "../controllers/order.controller"

const router: Router = express.Router()


router.get("/flutterwave/get-banks", getBanks)


export default router