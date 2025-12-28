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
 } from "../controllers/userController.js";
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { checkAdmin } from "../middleware/checkAdmin.js";
import { uploadAvatar } from "../middleware/uploadAvatar.js";

const router=express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.get("/allUser",allUser);
router.put("/update-role",authMiddleware,checkAdmin,updateUserRole);
router.delete("/delete-user/:id",authMiddleware,checkAdmin,deleteUser);

router.put("/update-profile", authMiddleware, uploadAvatar.single("avatar"), updateProfile);
router.get("/me", authMiddleware, getMyProfile);

router.post("/add-address", authMiddleware, addAddress);
router.get("/addresses", authMiddleware, getAddresses);
router.put("/address/:id", authMiddleware, updateAddress);
router.delete("/address/:id", authMiddleware, deleteAddress);

export default router;