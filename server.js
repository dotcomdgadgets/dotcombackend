import 'dotenv/config';
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import locationRoutes from "./routes/locationRoutes.js";
import payWithRewardRoutes from "./routes/payWithRewardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
// import adminPaymentRoutes from "./routes/adminPaymentRoutes.js";

const app = express();

// ✅ FULL CORS CONFIG
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://dotcombackend-xu8o.onrender.com",
    "http://dotcomgadgets.in",
    "https://dotcomgadgets.in",
    "http://www.dotcomgadgets.in",
    "https://www.dotcomgadgets.in"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));


// Middleware
app.use(express.json());


// Connect DB
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("Dotcom backend is live 🚀");
});

app.use("/api/location", locationRoutes);
app.use("/api/paywithreward", payWithRewardRoutes);
app.use("/api/useroutes", userRoutes);

// app.use("/uploads", express.static("uploads"));
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);

// payment
app.use("/api/payment", paymentRoutes);
// app.use("/api/admin", adminPaymentRoutes);

// Start Server
const PORT = process.env.PORT || 7000;

app.listen(PORT, () => {
  console.log("====================================");
  console.log(`✅ App running on port ${PORT}`);
  console.log("====================================");
});




