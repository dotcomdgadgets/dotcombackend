import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import PDFDocument from "pdfkit";
/* ===================================================
   ⭐ CREATE ORDER
   Called when user clicks "Place Order"
=================================================== */

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId, paymentMethod } = req.body;

    // Get user details
    const user = await User.findById(userId);

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Fetch selected address
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Build order items from user's cart
    const items = user.cart.map((cartItem) => ({
      product: cartItem.product,
      quantity: cartItem.quantity,
      priceAtThatTime: cartItem.priceAtThatTime,
      size: cartItem.size,
    }));

    // Calculate total amount
    const totalAmount = items.reduce(
      (acc, item) => acc + item.priceAtThatTime * item.quantity,
      0
    );

    // Build address snapshot
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

    // Create order
    const order = await Order.create({
      user: userId,
      items,
      address: addressSnapshot,
      paymentMethod,
      totalAmount,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      orderStatus: "Pending",
    });

    // Clear user cart after order
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


export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name mobile")
      .populate("items.product", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ HEADERS FIRST
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=invoice-${order._id}.pdf`
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    // ✅ PIPE AFTER HEADERS
    doc.pipe(res);

    /* ================= HEADER ================= */
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("TAX INVOICE", { align: "center" });

    doc.moveDown();

    doc.fontSize(10).font("Helvetica");
    doc.text("Sold By: DOTCOM GADGETS PRIVATE LIMITED");
    doc.text("GSTIN: 29ABCDE1234F1Z5");
    doc.text("Bengaluru, Karnataka - 560103");

    doc.moveDown();

    doc.text(`Invoice No: INV-${order._id.slice(-8)}`);
    doc.text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Order ID: ${order._id}`);

    doc.moveDown(1.5);

    /* ================= BILLING ================= */
    doc.font("Helvetica-Bold").text("Billing Address");
    doc.font("Helvetica");
    doc.text(order.address.fullName);
    doc.text(
      `${order.address.houseNo}, ${order.address.area}`
    );
    doc.text(
      `${order.address.city}, ${order.address.state} - ${order.address.pincode}`
    );
    doc.text(`Phone: ${order.address.phone}`);

    doc.moveDown();

    /* ================= TABLE ================= */
    doc.font("Helvetica-Bold");
    doc.text("Product", 40, doc.y);
    doc.text("Qty", 300, doc.y);
    doc.text("Price", 350, doc.y);
    doc.text("Total", 430, doc.y);

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();

    doc.font("Helvetica");
    let y = doc.y + 8;

    order.items.forEach((item) => {
      const total = item.quantity * item.priceAtThatTime;

      doc.text(item.product?.name || "Product removed", 40, y, { width: 240 });
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`₹${item.priceAtThatTime}`, 350, y);
      doc.text(`₹${total}`, 430, y);

      y += 25;
    });

    doc.moveTo(40, y).lineTo(550, y).stroke();

    doc.moveDown();

    /* ================= TOTAL ================= */
    doc.font("Helvetica-Bold");
    doc.text(`Grand Total: ₹${order.totalAmount}`, {
      align: "right",
    });

    doc.moveDown(2);

    doc.fontSize(9).font("Helvetica");
    doc.text(
      "This is a system generated invoice. No signature required.",
      { align: "center" }
    );

    // ✅ VERY IMPORTANT
    doc.end();

  } catch (error) {
    console.error("Invoice error:", error);

    // ⚠️ NEVER send JSON after piping PDF
    if (!res.headersSent) {
      res.status(500).json({ message: "Invoice generation failed" });
    }
  }
};








