import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import locationRoutes from "./routes/locationRoutes.js";

dotenv.config();
const app = express();

// ✅ CORS setup - must be at top
app.use(
  cors({
    origin: ["http://localhost:5173", "https://dotcomfrontend.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight (OPTIONS)
app.options("*", cors());

// ✅ Middleware
app.use(express.json());

// ✅ MongoDB connection
connectDB();

// ✅ Routes
app.get("/", (req, res) => {
  res.send("Dotcom backend is live 🚀");
});

app.use("/api/location", locationRoutes);

// ✅ Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
