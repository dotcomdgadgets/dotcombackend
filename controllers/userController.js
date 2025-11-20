export const signup = async (req, res) => {
  try {
    const { name, mobile, password, email } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ message: "Name, mobile and password are required" });
    }

    // Check if mobile already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "Mobile number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      mobile,
      email: email || "",   // optional
      password: hashedPassword,
      role: "user",
    });

    return res.status(201).json({
      message: "Signup successful",
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server Error" });
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
        email: user.email,
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
    const { name, mobile, email } = req.body;

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

    const updateData = { name, mobile, email };

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