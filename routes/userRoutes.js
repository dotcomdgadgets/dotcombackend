import { signup,login,allUser,updateUserRole } from "../controllers/userController.js";
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { checkAdmin } from "../middleware/checkAdmin.js";

const router=express.Router();

router.post("/signup",signup);
router.post("/login",login);
router.get("/allUser",allUser);
router.put(
  "/update-role",
  authMiddleware,   // check token
  checkAdmin,       // check admin role
  updateUserRole    // controller
);

export default router;