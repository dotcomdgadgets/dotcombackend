import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createRazorpayOrder);
router.post("/verify", authMiddleware, verifyPayment);


export default router;



