import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import PDFDocument from "pdfkit";
import { calculateOrderPrice } from "../utils/calculateOrderPrice.js";
import { generatePackingSlip } from "../utils/generatePackingSlip.js";
import axios from "axios";
import Product from "../models/productModel.js";

/* ===================================================
   ⭐ CREATE ORDER
   Called when user clicks "Place Order"
=================================================== */
export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId, paymentMethod } = req.body;

    // 1️⃣ Get user
    const user = await User.findById(userId);

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2️⃣ Get address
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // 3️⃣ Build order items
    const items = user.cart.map((cartItem) => ({
      product: cartItem.product,
      quantity: cartItem.quantity,
      priceAtThatTime: cartItem.priceAtThatTime,
      size: cartItem.size,
    }));

    // 4️⃣ PRICE (SAME LOGIC AS CHECKOUT)
    const price = calculateOrderPrice(items);

    // 5️⃣ Address snapshot
    const addressSnapshot = {
      fullName: address.fullName,
      phone: address.phone,
      houseNo: address.houseNo,
      area: address.area,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
    };

      // 🔴 STOCK VALIDATION (prevent overselling)
      for (const item of items) {
        const product = await Product.findById(item.product);

        if (!product) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `${product.name} is out of stock`,
          });
        }
      }

    // Create order
    const order = await Order.create({
      user: userId,
      items,
      address: addressSnapshot,
      paymentMethod,

      //PRICE BREAKUP (CONSISTENT)
      taxableValue: price.taxableValue,
      gstAmount: price.gstAmount,
      deliveryCharge: price.deliveryCharge,
      promiseFee: price.promiseFee,
      grandTotal: price.grandTotal,

      totalAmount: price.grandTotal,

      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      orderStatus: "Pending",
    });
    // 🔥 DECREASE PRODUCT STOCK
      const bulkOps = items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: -item.quantity } },
        },
      }));

      await Product.bulkWrite(bulkOps);

    // 7️⃣ Clear cart
    user.cart = [];
    await user.save();

    res.status(201).json({
      message: "Order created successfully",
      orderId: order._id,
      order,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Server error creating order" });
  }
};



/* ===================================================
   ⭐ GET MY ORDERS (User Order History)
=================================================== */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
  .populate("items.product")   // FIX: fetch product details
  .sort({ createdAt: -1 });


    res.status(200).json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Server error fetching orders" });
  }
};

/* ===================================================
   ⭐ GET ORDER DETAILS
=================================================== */
export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Order detail error:", error);
    res.status(500).json({ message: "Server error fetching order details" });
  }
};

/* ===================================================
   ⭐ ADMIN: UPDATE ORDER STATUS
   (Confirmed → Shipped → Delivered → Cancelled)
=================================================== */
export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Status updated", order });
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({ message: "Server error updating order" });
  }
};


/* ===================================================
   ⭐ ADMIN: GET ALL ORDERS
=================================================== */
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name mobile")
      .populate("items.product", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Admin get orders error:", error);
    res.status(500).json({ message: "Server error fetching all orders" });
  }
};


export const getCheckoutSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    /* ================= ITEMS ================= */
    const items = user.cart.map((item) => ({
      productId: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0],
      quantity: item.quantity,
      priceAtThatTime: item.priceAtThatTime,
      total: item.priceAtThatTime * item.quantity,
    }));

    /* ================= PRICE (SINGLE SOURCE) ================= */
    const price = calculateOrderPrice(items);

    res.json({
      items,
      price,
    });
  } catch (error) {
    console.error("Checkout summary error:", error);
    res.status(500).json({ message: "Failed to load checkout summary" });
  }
};


export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    let logoBuffer = null;
    try {
      const logoRes = await axios.get(
        process.env.COMPANY_LOGO_URL,
        { responseType: "arraybuffer" }
      );
      logoBuffer = logoRes.data;
    } catch (err) {
      console.warn("⚠ Logo load failed, continuing without logo");
    }

    /* ================= SAFE PRICE READ ================= */
    const taxableValue = Number(order.taxableValue || 0);
    const gstAmount = Number(order.gstAmount || 0);
    const deliveryCharge = Number(order.deliveryCharge || 0);
    const promiseFee = Number(order.promiseFee || 0);
    const grandTotal = Number(order.grandTotal || 0);

    const cgst = +(gstAmount / 2).toFixed(2);
    const sgst = +(gstAmount / 2).toFixed(2);

    /* ================= PDF INIT ================= */
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    /* ================= HEADER ================= */
const PAGE_WIDTH = 595;
const MARGIN = 50;
const LOGO_WIDTH = 80;
const LOGO_X = PAGE_WIDTH - MARGIN - LOGO_WIDTH;
// 🟢 LEFT SIDE – COMPANY DETAILS
doc
  .font("Helvetica-Bold")
  .fontSize(18)
  .text("DOTCOM GADGETS", 50, 45);

doc
  .moveDown(0.3)
  .font("Helvetica")
  .fontSize(9)
  .fillColor("gray-600")
  .text(
    "Registered Office:\n" +
      "Dotcom Gadgets Pvt Ltd\n" +
      "Rohtash Nagar Shahadra\n" +
      "Delhi, 110032\n" +
      "GSTIN: 07AAKCD3151A1Z5",
    50,
    70
  );

doc.fillColor("black");

//  LOGO
// 🟢 RIGHT SIDE – LOGO
if (logoBuffer) {
  doc.image(logoBuffer, LOGO_X, 45, {
    width: LOGO_WIDTH,
  });
}

// Divider
doc.moveDown(4);
doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).stroke();


/* ================= INVOICE META ================= */
    doc.moveDown(1);

    doc
      .font("Helvetica")
      .fontSize(11)
      .text(`Invoice ID: ${order._id}`, 50);

    doc
      .text(
        `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`,
        50
      );


    /* ================= CUSTOMER ================= */
doc.moveDown(1);

doc
  .font("Helvetica-Bold")
  .fontSize(13)
  .text("Billing & Shipping Details", 50);

doc.moveDown(0.4);

doc
  .font("Helvetica")
  .fontSize(11)
  .text(`Name: ${order.address.fullName}`, 50);

doc.text(`Phone: ${order.address.phone}`, 50);

doc.text(
  `Address: ${order.address.houseNo}, ${order.address.area}, ` +
  `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
  50
);

    /* ================= ITEMS TABLE ================= */
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(13).text("Order Items");
    doc.moveDown(0.6);

    const tableTop = doc.y;

    doc.fontSize(11);
    doc.text("Item", 50, tableTop);
    doc.text("Qty", 350, tableTop, { width: 50, align: "center" });
    doc.text("Price", 490, tableTop, { width: 60, align: "right" });

    doc.moveDown(0.4);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    doc.font("Helvetica").fontSize(11);
    doc.moveDown(0.6);

    order.items.forEach((item, index) => {
      const y = doc.y;

      doc.text(`${index + 1}. ${item.product?.name || "Product"}`, 50, y, {
        width: 280,
      });

      doc.text(String(item.quantity || 0), 350, y, {
        width: 50,
        align: "center",
      });

      doc.text(
        `Rs ${Number(item.priceAtThatTime || 0).toFixed(2)}`,
        490,
        y,
        { width: 60, align: "right" }
      );

      doc.moveDown(1);
    });

    /* ================= BILL SUMMARY ================= */
    const summaryWidth = 500;
    const summaryX = 49;
    let summaryY = doc.y + 15;

    doc
      .roundedRect(summaryX - 10, summaryY - 10, summaryWidth + 20, 170, 6)
      .fill("#f5f5f5");

    doc.fillColor("black");

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("Bill Summary", summaryX, summaryY);

    summaryY += 25;
    doc.font("Helvetica").fontSize(11);

    const row = (label, value, bold = false) => {
      const safeValue = Number(value || 0);

      doc.font(bold ? "Helvetica-Bold" : "Helvetica");

      doc.text(label, summaryX, summaryY, {
        width: summaryWidth - 90,
      });

      doc.text(`Rs ${safeValue.toFixed(2)}`, summaryX, summaryY, {
        width: summaryWidth,
        align: "right",
      });

      summaryY += 18;
    };

    row("Taxable Value", taxableValue);
    row("CGST (9%)", cgst);
    row("SGST (9%)", sgst);
    row("Delivery Charges", deliveryCharge);

    if (promiseFee > 0) {
      row("Promise Fee", promiseFee);
    }

    summaryY += 5;
    doc
      .moveTo(summaryX, summaryY)
      .lineTo(summaryX + summaryWidth, summaryY)
      .stroke();

    summaryY += 10;
    row("Grand Total", grandTotal, true);

    /* ================= FOOTER ================= */
    doc.moveDown(4);
    doc
      .fontSize(9)
      .fillColor("gray")
      .text(
        "This is a system generated GST invoice. No signature required.",
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    console.error("Invoice error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  }
};



export const downloadPackingSlip = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    generatePackingSlip(order, res);
  } catch (error) {
    console.error("Packing slip error:", error);
    res.status(500).json({ message: "Failed to generate packing slip" });
  }
};

