import User from "../models/userModel.js";
import Product from "../models/productModel.js";

/* ============================
   🧹 HELPER: CLEAN BROKEN CART
============================ */
const cleanCart = async (userId) => {
  const user = await User.findById(userId).populate("cart.product");
  if (!user) return null;

  // remove items where product is deleted
  user.cart = user.cart.filter(item => item.product !== null);

  await user.save();
  return user.cart;
};

/* ============================
   ✅ ADD TO CART
============================ */
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size = "M" } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product id required" });
    }

    const qty = Math.max(1, Number(quantity));

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ensure cart exists
    if (!user.cart) user.cart = [];

    // check existing item
    const existingItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      user.cart.push({
        product: productId,
        quantity: qty,
        size,
        priceAtThatTime: product.price, // 🔐 price snapshot
      });
    }

    await user.save();

    const cleanCartItems = await cleanCart(user._id);
    res.status(200).json(cleanCartItems);

  } catch (err) {
    console.error("ADD TO CART ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   ✅ GET MY CART
============================ */
export const getCart = async (req, res) => {
  try {
    const cartItems = await cleanCart(req.user._id);

    if (!cartItems) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(cartItems);

  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   ✅ REMOVE FROM CART (productId)
============================ */
export const removeFromCart = async (req, res) => {
  try {
    const productId = req.params.id;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );

    await user.save();

    const cleanCartItems = await cleanCart(user._id);
    res.status(200).json(cleanCartItems);

  } catch (err) {
    console.error("REMOVE CART ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================
   ✅ UPDATE CART QUANTITY
============================ */
export const updateCartQty = async (req, res) => {
  try {
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    const qty = Math.max(1, Number(quantity));

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const item = user.cart.find(
      (c) => c._id.toString() === cartItemId
    );

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.quantity = qty;
    await user.save();

    const cleanCartItems = await cleanCart(user._id);
    res.status(200).json(cleanCartItems);

  } catch (err) {
    console.error("UPDATE CART QTY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
