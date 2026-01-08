import Product from "../models/productModel.js";

export const addProduct = async (req, res) => {
  try {
    console.log("REQ.BODY →", req.body);
    console.log("REQ.FILES →", req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const { name, price, category, description,hsnCode, gst, stock, mrp } = req.body;

    if (!name || !price || !category || !hsnCode || !gst ||!mrp || stock === undefined) {
      return res.status(400).json({ message: "All fields required" });
    }

    // ✅ Store array of cloudinary URLs
    const imageUrls = req.files.map(file => file.path);
    const publicIds = req.files.map(file => file.filename);

    const product = new Product({
      name,
      price,
      category,
      description,
      hsnCode,
      gst,
      mrp,
      stock: Number(stock),
      image: imageUrls,        // ✅ ARRAY
      public_id: publicIds,    // ✅ ARRAY
    });

    await product.save();
    res.status(201).json({
      message: "✅ Product added successfully",
      product,
    });

  } catch (err) {
    console.log("🔥 PRODUCT ADD ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};





export const getAllProducts = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = {};

    // ✅ CATEGORY FILTER
    if (category && category.trim() !== "") {
      query.category = category;
    }

    // ✅ SEARCH FILTER (FIXED)
    if (search && search.trim() !== "") {
      query.name = {
        $regex: search.trim(),
        $options: "i", // case-insensitive
      };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (err) {
    console.error("Product fetch error:", err);
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
    const productId = req.params.id;

    // ✅ 1. Delete product
    const deleted = await Product.findByIdAndDelete(productId);

    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ 2. REMOVE this product from ALL user carts
    await User.updateMany(
      {},
      { $pull: { cart: { product: productId } } }
    );

    res.status(200).json({
      message: "Product deleted and removed from all carts",
    });

  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};




