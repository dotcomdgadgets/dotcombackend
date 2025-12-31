import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import payWithReward from "../models/payWithRewardModels.js"; // ⭐ IMPORTANT
import Otp from "../models/otpModel.js";
import axios from "axios";


export const signup = async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      return res
        .status(400)
        .json({ message: "Name, mobile and password are required" });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Mobile number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      mobile,
      password: hashedPassword,
      role: "user",
    });

    // ⭐ Fetch all payments done before signup
    const previousPayments = await payWithReward.find({ mobile });

    // ⭐ Calculate total rewardCoins
    const totalCoins = previousPayments.reduce(
      (sum, record) => sum + Number(record.rewardCoins || 0),
      0
    );

    // ⭐ Update user rewardCoins
    if (totalCoins > 0) {
      await User.findByIdAndUpdate(newUser._id, {
        $set: { rewardCoins: totalCoins },
      });
    }

    // ⭐ Final return (AFTER updating coins)
    return res.status(201).json({
      message: "Signup successful",
      rewardCoinsAdded: totalCoins,
    });

  } catch (err) {
    console.error("🔥 Signup Error:", err);
    return res.status(500).json({
      message: "Signup failed",
      error: err.message,
    });
  }
};


export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password are required" });
    }

    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }

    const token = jwt.sign(
      { id: user._id, mobile: user.mobile, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        rewardCoins: user.rewardCoins,
        avatar: user.avatar,
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error during login" });
  }
};




export const updateProfile = async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ message: "Name and mobile are required" });
    }

    // Mobile should not match someone else's
    const existingMobile = await User.findOne({
      mobile,
      _id: { $ne: req.user._id },
    });

    if (existingMobile) {
      return res.status(400).json({ message: "Mobile already used by another user" });
    }

    const updateData = { name, mobile };

    if (req.file) {
      const serverUrl = process.env.SERVER_URL || `${req.protocol}://${req.get("host")}`;
      updateData.avatar = `${serverUrl}/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      updatedUser,
    });

  } catch (err) {
    console.error("Profile Update Error:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};


export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });

  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const allUser = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 }); // DESC order

    return res.status(200).json({ users });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to fetch user data" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Role updated successfully",
      updatedUser
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error while updating role" });
  }
};


// Address controller

export const addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  const newAddress = req.body;

  // if first address → make default
  if (user.addresses.length === 0) {
    newAddress.isDefault = true;
  }

  user.addresses.push(newAddress);
  await user.save();

  res.json({ addresses: user.addresses });
};

export const getAddresses = async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.addresses);
};

export const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(
    (a) => a._id.toString() !== req.params.id
  );
  await user.save();
  res.json({ addresses: user.addresses });
};

export const updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  const index = user.addresses.findIndex(
    (a) => a._id.toString() === req.params.id
  );

  user.addresses[index] = { ...user.addresses[index], ...req.body };
  await user.save();

  res.json({ addresses: user.addresses });
};

export const setDefaultAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  user.addresses.forEach((addr) => {
    addr.isDefault = addr._id.toString() === req.params.id;
  });

  await user.save();
  res.json({ addresses: user.addresses });
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ============================
   ✅ CHANGE PASSWORD
============================ */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// WhatsApp OTP via Gupshup
export const sendOtp = async (req, res) => {
  console.log("SEND OTP HIT");

  console.log("KEY:", process.env.GUPSHUP_API_KEY);
  console.log("SOURCE:", process.env.GUPSHUP_SOURCE);
  return res.json({ message: "OTP test success" });
};






export const verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  // 1️⃣ Find OTP record
  const record = await Otp.findOne({ mobile });

  if (!record) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // 2️⃣ Block after 3 wrong attempts
  if (record.attempts >= 3) {
    return res.status(429).json({
      message: "Too many attempts. Please request a new OTP.",
    });
  }

  // 3️⃣ Check OTP value
  if (record.otp !== otp) {
    record.attempts += 1;
    await record.save();

    return res.status(400).json({ message: "Incorrect OTP" });
  }

  // 4️⃣ Prevent reuse
  if (record.verified) {
    return res.status(400).json({ message: "OTP already used" });
  }

  // 5️⃣ Expiry check
  if (record.expiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  // 6️⃣ Mark verified
  record.verified = true;
  await record.save();

  res.json({ message: "OTP verified successfully" });
};




export const resetPassword = async (req, res) => {
  const { mobile, newPassword } = req.body;

  const otpRecord = await Otp.findOne({ mobile, verified: true });
  if (!otpRecord) {
    return res.status(400).json({ message: "OTP not verified" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findOneAndUpdate(
    { mobile },
    { password: hashedPassword }
  );

  // 🔒 Cleanup OTPs
  await Otp.deleteMany({ mobile });

  res.json({ message: "Password reset successful" });
};







