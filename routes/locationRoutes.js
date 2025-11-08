import express from "express";
import { saveLocation, getLocations } from "../controllers/locationController.js";

const router = express.Router();

router.post("/", saveLocation);

// ✅ GET: Fetch all locations
router.get("/", getLocations);

export default router;
