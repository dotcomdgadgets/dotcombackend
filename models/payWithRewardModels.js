import mongoose from "mongoose";

const payWithRewardSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
    },
    mobile: {
        type: String,
        required: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"],
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
