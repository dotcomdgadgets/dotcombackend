import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
});



export default mongoose.model("Otp", otpSchema);
