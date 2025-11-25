import Product from "../models/productModel.js";

export const addProduct = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Product image is required" });
    }

    if (!name || !price || !category) {
      return res.status(400).json({ message: "All fields required" });
    }

    const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;

    const product = new Product({
      name,
      price,
      category,
      description,
      image: `${serverUrl}/uploads/products/${req.file.filename}`,
    });

    await product.save();

    res.status(201).json({
      message: "Product added successfully",
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



