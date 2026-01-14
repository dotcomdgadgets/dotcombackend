import mongoose from "mongoose";

const payWithRewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid mobile number"],
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    rewardCoins: {
      type: Number,
      required: true,
    },

    // 🆕 REDEMPTION STATUS
    status: {
      type: String,
      enum: ["Pending", "Redeemed"],
      default: "Pending",
    },

    redeemedAt: {
      type: Date,
    },

    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userDetails", // admin
    },
  },
  { timestamps: true }
);

const PayWithReward = mongoose.model("payWithReward", payWithRewardSchema);
export default PayWithReward;


