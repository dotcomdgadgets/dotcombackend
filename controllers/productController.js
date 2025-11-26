import Product from "../models/productModel.js";
import { v2 as cloudinary } from "cloudinary";

export const addProduct = async (req, res) => {
  try {
    console.log("REQ.FILE →", req.file);  // <=== MUST PRINT

    if (!req.file) {
      return res.status(400).json({ message: "Image not received" });
    }

    const { name, price, category, description } = req.body;

    const product = new Product({
      name,
      price,
      category,
      description,
      image: req.file.path,       // Cloudinary URL
      public_id: req.file.filename,
    });

    await product.save();

    res.status(201).json({
      message: "Product added",
      product,
    });

  } catch (err) {
    console.log("🔥 PRODUCT ADD ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "Products fetched", products });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ product });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



