import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderDetails,
  adminUpdateOrderStatus,
  getAllOrdersAdmin,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkAdmin } from "../middleware/checkAdmin.js";

const router = express.Router();

// ==============================
// ⭐ USER ROUTES
// ==============================

// Create new order
router.post("/create", authMiddleware, createOrder);

// Get logged-in user's order history
router.get("/my-orders", authMiddleware, getMyOrders);

// Get details of a specific order
router.get("/details/:id", authMiddleware, getOrderDetails);


// ==============================
// ⭐ ADMIN ROUTES
// ==============================

// Admin update order status
router.put("/update-status/:id", authMiddleware, checkAdmin, adminUpdateOrderStatus);
router.get("/admin/all", authMiddleware, checkAdmin, getAllOrdersAdmin);

export default router;






