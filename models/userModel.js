import mongoose from "mongoose";

/* =========================
   ✅ ADDRESS SCHEMA
========================= */
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    pincode: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    houseNo: { type: String, required: true },
    area: { type: String, required: true },
    landmark: { type: String },

    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

/* =========================
   CART ITEM SCHEMA
========================= */
const cartItemModel = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    size: {
      type: String,
      default: "M",
    },

    priceAtThatTime: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

/* =========================
   USER SCHEMA
========================= */
const userDetails = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid mobile number"],
    },

    password: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    avatar: {
      type: String,
      default: "",
    },

    rewardCoins: {
      type: Number,
      default: 0,
    },

    // =============================
    // ⭐ USER ADDRESSES 
    // =============================
    addresses: {
      type: [addressSchema],
      default: [],
    },

    // =============================
    // ⭐ CLOUD CART 
    // =============================
    cart: {
      type: [cartItemModel],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("userDetails", userDetails);
export default User;
