import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/orderModel.js";

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
      orderData,
    } = req.body;

    const body = razorpayOrderId + "|" + razorpayPaymentId;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // ✅ Create Order AFTER payment verified
    const order = new Order({
      ...orderData,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    await order.save();

    res.status(201).json({ message: "Payment verified", order });
  } catch (error) {
    res.status(500).json({ message: "Payment verification failed" });
  }
};
