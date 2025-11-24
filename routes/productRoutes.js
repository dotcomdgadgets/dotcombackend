import express from "express";
import upload from "../middleware/upload.js";
import {
  addProduct,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Add product (with image)
router.post("/add", upload.single("image"), addProduct);

// All products
router.get("/", getAllProducts);

// Single product
router.get("/:id", getSingleProduct);

// Delete product
router.delete("/:id", deleteProduct);

export default router;
