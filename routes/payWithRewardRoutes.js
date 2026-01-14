import express from "express";
import {  savePaymentDetail,getPaymentDetail,redeemReward } from "../controllers/payWithRewardController.js";
import { checkAdmin } from "../middleware/checkAdmin.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/",authMiddleware, checkAdmin, savePaymentDetail);
router.get("/", authMiddleware, checkAdmin, getPaymentDetail);
router.post("/redeem", authMiddleware, checkAdmin, redeemReward);


export default router;