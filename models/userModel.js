import mongoose from "mongoose";

/* =========================
   ⭐ ADDRESS SCHEMA (SAFE)
   - No "required" fields (prevents signup crash)
   - Backend/front-end will validate required fields
========================= */
const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    pincode: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    houseNo: { type: String, trim: true },
    area: { type: String, trim: true },
    landmark: { type: String, trim: true },

    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);


/* =========================
   ⭐ CART ITEM SCHEMA
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
   ⭐ USER SCHEMA
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

    // ⭐ USER ADDRESSES (Amazon-style)
    addresses: {
      type: [addressSchema],
      default: [],
    },

    // ⭐ CLOUD CART (Flipkart-style)
    cart: {
      type: [cartItemModel],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent "OverwriteModelError"
mongoose.models = {};

const User = mongoose.model("userDetails", userDetails);
export default User;
