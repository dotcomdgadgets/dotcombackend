import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup=async(req,res)=>{
    try{
        const { name, email, password } = req.body;

        if(!name || !email || !password){
            return res.status(400).json({message:"All fields are required"});
        }
        const existingUser= await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"User alreay registered"});
        }
         // 3️⃣ Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser= await User.create({
            name,
            email,
            password:hashedPassword,
            role:"user",
        });

        return res.status(200).json({
            message:"SignUp Successfull",
        })


    }catch(err){
        console.error("Signup error:", err);
        res.status(500).json({ message: "Server Error" });
    }

}

export const login = async (req, res) => {
  try {
    console.log("== LOGIN HIT ==");
    console.log("req.body:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Validation failed - missing fields");
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    console.log("found user:", user);

    if (!user) {
      console.log("No user found for email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // check password exists on user object
    if (!user.password) {
      console.log("User has no password field!", user);
      return res.status(500).json({ message: "Server error: user record invalid (no password)" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("bcrypt.compare result:", isMatch);

    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // generate token (optional, keep short secret for debug)
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "debug_secret", { expiresIn: "7d" });

    console.log("Login success, sending response");
    return res.status(200).json({
      message: "Login successful!",
      token,
      user: { id: user._id, name: user.name, email: user.email,role: user.role }
    });
  } catch (err) {
    console.error("Login error (stack):", err && err.stack ? err.stack : err);
    // Return error message so frontend shows it too (temporary)
    return res.status(500).json({ message: "Server Error during login", error: err?.message || err });
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




