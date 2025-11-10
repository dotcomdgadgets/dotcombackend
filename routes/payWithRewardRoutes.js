import express from "express";
import {  savePaymentDetail } from "../controllers/payWithRewardController.js";

const router = express.Router();

router.post("/", savePaymentDetail);

// ✅ GET: Fetch all locations
// router.get("/", getLocations);

export default router;