import express, { Router } from "express";
import isAuthenticated from "../../../../packages/middleware/isAuthenticated";
import { isAdmin } from "../../../../packages/middleware/authorizeRoles";
import { addNewAdmin, getAllAdmins, getAllCustomizations, getAllEvents, getAllNotifications, getAllProducts, getAllSellers, getAllUsers, getUserNotifications } from "../controllers/admin.controller";




const router: Router = express.Router()

router.get("/get-all-products", isAuthenticated, isAdmin, getAllProducts)
router.get("/get-all-events", isAuthenticated, isAdmin, getAllEvents)
router.get("/get-all-admins", isAuthenticated, isAdmin, getAllAdmins)
router.get("/get-all-users", isAuthenticated, isAdmin, getAllUsers)
router.get("/get-all-sellers", isAuthenticated, isAdmin, getAllSellers)
router.post("/add-new-admin", isAuthenticated, isAdmin, addNewAdmin)
router.get("/get-all", getAllCustomizations)
router.get("/get-all-notifications", isAuthenticated, isAdmin, getAllNotifications)
router.get("/get-user-notifications", isAuthenticated, getUserNotifications)


export default router;