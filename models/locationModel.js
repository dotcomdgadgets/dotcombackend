import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String },          // 👈 store the human-readable address
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Location", locationSchema);
