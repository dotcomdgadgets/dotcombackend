import mongoose from "mongoose";

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
      match: [/^[6-9]\d{9}$/, "Invalid mobile number"], // Indian mobile validation
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",      // Email becomes optional
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
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("userDetails", userDetails);
export default User;
