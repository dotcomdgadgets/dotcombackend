import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "dotcom_products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

export default upload;
