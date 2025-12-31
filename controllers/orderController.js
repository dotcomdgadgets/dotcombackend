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

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    /* ================= HEADER ================= */
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", { align: "center" });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Sold By: DOTCOM GADGETS PRIVATE LIMITED");
    doc.text("GSTIN: 29ABCDE1234F1Z5");
    doc.text("Registered Office: Bengaluru, Karnataka - 560103");

    doc.moveDown();

    doc
      .fontSize(10)
      .text(`Invoice No: INV-${order._id.slice(-8)}`, 350, 90);
    doc.text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 350, 105);
    doc.text(`Order ID: ${order._id}`, 350, 120);

    doc.moveDown(2);

    /* ================= BILLING ================= */
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Billing Address");

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(order.address.fullName);
    doc.text(
      `${order.address.houseNo}, ${order.address.area}`
    );
    doc.text(
      `${order.address.city}, ${order.address.state} - ${order.address.pincode}`
    );
    doc.text(`Phone: ${order.address.phone}`);

    doc.moveDown(1.5);

    /* ================= TABLE HEADER ================= */
    const tableTop = doc.y;
    const colX = {
      desc: 40,
      qty: 300,
      price: 350,
      total: 430,
    };

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Description", colX.desc, tableTop);
    doc.text("Qty", colX.qty, tableTop);
    doc.text("Price ₹", colX.price, tableTop);
    doc.text("Total ₹", colX.total, tableTop);

    doc
      .moveTo(40, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    /* ================= TABLE ROWS ================= */
    let y = tableTop + 25;

    order.items.forEach((item, i) => {
      const itemTotal = item.quantity * item.priceAtThatTime;

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(item.product?.name || "Product removed", colX.desc, y, {
          width: 240,
        });

      doc.text(item.quantity.toString(), colX.qty, y);
      doc.text(item.priceAtThatTime.toFixed(2), colX.price, y);
      doc.text(itemTotal.toFixed(2), colX.total, y);

      y += 25;
    });

    doc
      .moveTo(40, y)
      .lineTo(550, y)
      .stroke();

    /* ================= TOTAL ================= */
    y += 15;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Grand Total", colX.price, y);
    doc.text(`₹ ${order.totalAmount.toFixed(2)}`, colX.total, y);

    /* ================= FOOTER ================= */
    doc.moveDown(4);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "This is a system generated invoice and does not require a signature.",
        { align: "center" }
      );

    doc.moveDown(1);

    doc
      .font("Helvetica-Bold")
      .text("Authorized Signatory", { align: "right" });

    doc.end();
  } catch (error) {
    console.error("Invoice error:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};







