import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },

  address: {
    street: String,
    area: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
    country: String,
  },

  createdAt: { type: Date, default: Date.now },
});

const Location = mongoose.model("Location", locationSchema);
export default Location;
