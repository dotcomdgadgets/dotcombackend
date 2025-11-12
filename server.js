import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import locationRoutes from "./routes/locationRoutes.js";
import payWithRewardRoutes from "./routes/payWithRewardRoutes.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dotcomfrontend.onrender.com",
    "http://dotcomgadgets.in",
    "https://dotcomgadgets.in",
    "https://www.dotcomgadgets.in"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Handle all preflight OPTIONS requests
  app.options("*", cors());

// ✅ JSON body parser
app.use(express.json());

// ✅ MongoDB connection
connectDB();
// payWithRewardRoutes
// ✅ Test route
app.get("/", (req, res) => {
  res.send("Dotcom backend is live 🚀");
});

// ✅ API routes
app.use("/api/location", locationRoutes);
app.use("/api/paywithreward", payWithRewardRoutes);
// ✅ Start server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`App is running on ${PORT}`);
  console.log("====================================");
});
