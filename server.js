import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import locationRoutes from "./routes/locationRoutes.js";

dotenv.config();
const app = express();

// ✅ CORS (safe global version)
app.use(cors({
  origin: ["http://localhost:5173", "https://dotcomfrontend.onrender.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ JSON body parser
app.use(express.json());

// ✅ MongoDB connection
connectDB();

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Dotcom backend is live 🚀");
});

// ✅ API routes
app.use("/api/location", locationRoutes);

// ✅ Start server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`App is running on ${PORT}`);
  console.log("====================================");
});
