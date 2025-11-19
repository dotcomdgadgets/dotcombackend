import mongoose, { Mongoose } from "mongoose";

const userDetails= new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique: true, // prevents duplicate emails
        lowercase: true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        trim:true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",  // everyone becomes USER by default
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
    timestamps:true
}
)


const User=mongoose.model("userDetails",userDetails);
export default User;

