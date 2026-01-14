import mongoose from "mongoose";

/* =========================
   ⭐ ORDER ITEM SCHEMA
========================= */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: { type: Number, required: true },
    priceAtThatTime: { type: Number, required: true }, // snapshot price
    size: { type: String },
  },
  { _id: false }
);

/* =========================
   ⭐ ADDRESS SNAPSHOT
   - We copy user address so even if user changes address later,
     order stores old address
========================= */
const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    houseNo: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
  },
  { _id: false }
);

/* =========================
   ⭐ MAIN ORDER SCHEMA
========================= */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userDetails",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    address: {
      type: addressSnapshotSchema,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    // 💰 PRICE BREAKUP (IMPORTANT)
    taxableValue: {
      type: Number,
      required: true,
    },

    gstAmount: {
      type: Number,
      required: true,
    },

    deliveryCharge: {
      type: Number,
      required: true,
    },
    promiseFee: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },

    // 🔁 backward compatibility (optional)
    totalAmount: {
      type: Number,
      required: true,
    },

    // 💳 Razorpay
    razorpayPaymentId: String,
    razorpayOrderId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);


// Fix model overwrite error in development
mongoose.models = {};

const Order = mongoose.model("Order", orderSchema);
export default Order;
