import payWithReward from "../models/payWithRewardModels.js";

// Save payment details to MongoDB
export const savePaymentDetail = async (req, res) => {
  try {
    const { name, email, amount, rewardCoins } = req.body;

    // Validate data
    if (!name || !email || !amount) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate mobile format (extra safety)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ message: "Invalid mobile number format" });
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
      rewardCoins: rewardCoins || 0, // default to 0 if not provided
    });

    // Save to database
    await newPayment.save();

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

    if (!allPayRewardData || allPayRewardData.length === 0) {
      return res.status(404).json({ message: "No payment records found" });
    }

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
