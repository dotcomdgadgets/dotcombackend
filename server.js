import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import locationRoutes from "./routes/locationRoutes.js";

dotenv.config();
const app=express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;

app.get("/",(req,res)=>{
    res.send("hello Dotcom");

})
// Connect MongoDB
connectDB();

// Routes
app.use("/api/location", locationRoutes);

app.listen(PORT,()=>{
    console.log('====================================');
    console.log(`App is running on ${PORT}`);
    console.log('====================================');
})
