import { 
    signup,
    login,
    allUser,
    updateUserRole,
    updateProfile, 
    getMyProfile,
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    deleteUser,
    changePassword,
    sendOtp,
    verifyOtp,
    resetPassword,
 } from "../controllers/userController.js";
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { checkAdmin } from "../middleware/checkAdmin.js";
import { uploadAvatar } from "../middleware/uploadAvatar.js";

const router=express.Router();

router.use((req, res, next) => {
  console.log("USER ROUTE HIT:", req.method, req.originalUrl);
  next();
});

router.post("/signup",signup);
router.post("/login",login);
router.get("/allUser",authMiddleware,checkAdmin,allUser);
router.put("/update-role",authMiddleware,checkAdmin,updateUserRole);
router.delete("/delete-user/:id",authMiddleware,checkAdmin,deleteUser);
router.put("/change-password", authMiddleware, changePassword);

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.put("/update-profile", authMiddleware, uploadAvatar.single("avatar"), updateProfile);
router.get("/me", authMiddleware, getMyProfile);

router.post("/add-address", authMiddleware, addAddress);
router.get("/addresses", authMiddleware, getAddresses);
router.put("/address/:id", authMiddleware, updateAddress);
router.delete("/address/:id", authMiddleware, deleteAddress);

export default router;

