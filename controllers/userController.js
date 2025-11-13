import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

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
        });

        return res.status(200).json({
            message:"SignUp Successfull",
        })


    }catch(err){
        console.error("Signup error:", err);
        res.status(500).json({ message: "Server Error" });
    }

}



