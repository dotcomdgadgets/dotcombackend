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

    // ✅ HEADERS FIRST (VERY IMPORTANT)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    // ✅ PIPE AFTER HEADERS
    doc.pipe(res);

    /* ================= HEADER ================= */
    doc.fontSize(18).text("TAX INVOICE", { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(10)
      .text("Sold By: Dotcom Gadgets Private Limited")
      .text("GSTIN: 29ABCDE1234F1Z5")
      .text("Bengaluru, Karnataka, India");

    doc.moveDown();

    doc.fontSize(10)
      .text(`Invoice Number: DCG-${order._id.slice(-8)}`)
      .text(`Order ID: ${order._id}`)
      .text(`Invoice Date: ${new Date().toLocaleDateString()}`)
      .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);

    doc.moveDown(1.5);

    /* ================= BILLING ADDRESS ================= */
    doc.fontSize(12).text("Billing Address", { underline: true });
    doc.fontSize(10)
      .text(order.address.fullName)
      .text(`${order.address.houseNo}, ${order.address.area}`)
      .text(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`)
      .text(`Phone: ${order.address.phone}`);

    doc.moveDown(1.5);

    /* ================= TABLE HEADER ================= */
    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text("Description", 40, tableTop);
    doc.text("Qty", 260, tableTop);
    doc.text("Price ₹", 300, tableTop);
    doc.text("Tax ₹", 360, tableTop);
    doc.text("Total ₹", 430, tableTop);

    doc.moveTo(40, tableTop + 15)
       .lineTo(550, tableTop + 15)
       .stroke();

    let y = tableTop + 25;

    /* ================= TABLE ROWS ================= */
    order.items.forEach((item) => {
      const price = item.priceAtThatTime * item.quantity;
      const tax = (price * 0.18).toFixed(2);
      const total = (price + Number(tax)).toFixed(2);

      doc.text(item.product?.name || "Product", 40, y, { width: 200 });
      doc.text(item.quantity, 260, y);
      doc.text(price.toFixed(2), 300, y);
      doc.text(tax, 360, y);
      doc.text(total, 430, y);

      y += 20;
    });

    doc.moveDown(2);

    /* ================= GRAND TOTAL ================= */
    doc.fontSize(12).text(
      `Grand Total: ₹${order.totalAmount}`,
      { align: "right" }
    );

    doc.moveDown(3);

    /* ================= SIGNATURE ================= */
    doc.fontSize(10)
      .text("For Dotcom Gadgets Private Limited", { align: "right" })
      .moveDown()
      .text("Authorized Signatory", { align: "right" });

    // ✅ MUST END DOCUMENT
    doc.end();

  } catch (error) {
    console.error("Invoice error:", error);
    return res.status(500).json({ message: "Failed to generate invoice" });
  }
};








