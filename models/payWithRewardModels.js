import mongoose from "mongoose";

const payWithRewardSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    amount:{
        type:Number,
        required:true,
        min:1,
    },
    rewardCoins: {
        type: Number,
        default: 0,
    },

},
    { timestamps: true } 
)

const payWithReward=mongoose.model("payWithReward",payWithRewardSchema);
export default payWithReward;
