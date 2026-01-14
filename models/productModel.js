import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    mrp: { type: Number, required: true },
    stock: {type: Number,min: 0, max: 99, required:true },
    hsnCode: { type: String, required: true },
    gst: { type: Number, required: true },
    image: [{ type: String, required: true }],     // ✅ ARRAY
    public_id: [{ type: String }],                 // ✅ ARRAY
  },
  { timestamps: true }
);
/* ✅ ADD INDEX FOR FAST STOCK QUERIES */
productSchema.index({ stock: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;


