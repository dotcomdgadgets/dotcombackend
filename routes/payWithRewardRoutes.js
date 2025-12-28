import express from "express";
import {  savePaymentDetail,getPaymentDetail } from "../controllers/payWithRewardController.js";
import { checkAdmin } from "../middleware/checkAdmin.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/",authMiddleware, checkAdmin, savePaymentDetail);
router.get("/", authMiddleware, checkAdmin, getPaymentDetail);
// ✅ GET: Fetch all locations
// router.get("/", getLocations);

export default router;