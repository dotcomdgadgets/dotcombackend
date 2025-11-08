import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String }, // ✅ Make sure this line exists
  createdAt: { type: Date, default: Date.now },
});

const Location = mongoose.model("Location", locationSchema);
export default Location;
