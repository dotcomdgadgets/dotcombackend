import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import PaymentLog from "../models/paymentLogModel.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ===========================
   CREATE RAZORPAY ORDER
=========================== */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100, // rupees → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Payment order creation failed" });
  }
};

/* ===========================
   VERIFY PAYMENT & SAVE ORDER
=========================== */


export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      addressId,
      totalAmount,
    } = req.body;

    const userId = req.user._id;

    /* =====================
       1️⃣ VERIFY SIGNATURE
    ===================== */
    const body = razorpayOrderId + "|" + razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
  await PaymentLog.create({
    user: userId,
    razorpayOrderId,
    razorpayPaymentId,
    status: "FAILED",
    reason: "Invalid Razorpay signature",
  });

  return res.status(400).json({
    message: "Invalid payment signature",
  });
}


    /* =====================
       2️⃣ FETCH USER
    ===================== */
    const user = await User.findById(userId);

    if (!user || user.cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    /* =====================
       3️⃣ BUILD ITEMS SNAPSHOT
    ===================== */
    const items = user.cart.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      priceAtThatTime: item.priceAtThatTime,
      size: item.size,
    }));

    /* =====================
       4️⃣ ADDRESS SNAPSHOT
    ===================== */
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const addressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      houseNo: address.houseNo,
      area: address.area,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
    };

    /* =====================
       5️⃣ CREATE ORDER
    ===================== */
    const order = await Order.create({
      user: userId,
      items,
      address: addressSnapshot,
      totalAmount,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      orderStatus: "Pending",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    /* =====================
       6️⃣ CLEAR CART
    ===================== */
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: "Payment verified & order created",
      order,
    });
  } catch (error) {
  console.error("Verify payment error:", error);

  await PaymentLog.create({
    user: req.user?._id,
    status: "FAILED",
    reason: error.message || "Unknown server error",
  });

  res.status(500).json({ message: "Payment verification failed" });
}
};








