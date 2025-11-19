import payWithReward from "../models/payWithRewardModels.js";

// Save payment details to MongoDB
export const savePaymentDetail = async (req, res) => {
  try {
    const { name, email, amount, rewardCoins } = req.body;

    // Validate data
    if (!name || !email || !amount) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Convert amount safely
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Create new payment entry
    const newPayment = new payWithReward({
      name,
      email,
      amount: numericAmount,
      rewardCoins: rewardCoins || 0,
    });

    // Save to database
    await newPayment.save();
    // Add reward coins to user profile
    await User.findOneAndUpdate(
      { email: email },                      // find user by email
      { $inc: { rewardCoins: rewardCoins } }, // increase coins
      { new: true }
    );

    res.status(201).json({
      message: "✅ Payment details saved successfully",
      data: newPayment,
    });
  } catch (err) {
    console.log("====================================");
    console.log("Error in savePaymentDetail:", err.message);
    console.log("====================================");
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all payments
export const getPaymentDetail = async (req, res) => {
  try {
    const allPayRewardData = await payWithReward.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "✅ Payment record fetched successfully",
      data: allPayRewardData,
    });
  } catch (error) {
    console.log("====================================");
    console.log("Error in getPaymentDetail:", error.message);
    console.log("====================================");
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
