import payWithReward from "../models/payWithRewardModels.js";
import User from "../models/userModel.js";   // ⭐ VERY IMPORTANT

// Save payment details to MongoDB
export const savePaymentDetail = async (req, res) => {
  try {
    const { name, email, amount, rewardCoins } = req.body;

    if (!name || !email || !amount) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // create new payment entry
    const newPayment = new payWithReward({
      name,
      email,
      amount: numericAmount,
      rewardCoins: Number(rewardCoins) || 0,
    });

    await newPayment.save();

    // ⭐ Clean email before update
    const cleanEmail = email.trim().toLowerCase();

    // ⭐ Update only if user exists
    const updatedUser = await User.findOneAndUpdate(
      { email: cleanEmail },
      { $inc: { rewardCoins: Number(rewardCoins) || 0 } },
      { new: true }
    );

    console.log("Updated User:", updatedUser); // ⭐ Check if user updated

    res.status(201).json({
      message: "✅ Payment details saved successfully",
      data: newPayment,
    });

  } catch (err) {
    console.log("Error in savePaymentDetail:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
