import mongoose from "mongoose";

const paymentLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,

    amount: Number,

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      required: true,
    },

    reason: String, // failure reason

    paymentMethod: {
      type: String,
      enum: ["Online"],
      default: "Online",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentLog", paymentLogSchema);




