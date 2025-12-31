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

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    /* ================= HEADER ================= */
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("DOTCOM GADGETS", { align: "center" });

    doc
      .moveDown(0.5)
      .fontSize(10)
      .font("Helvetica")
      .fillColor("gray")
      .text("GST Invoice", { align: "center" });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    /* ================= INVOICE META ================= */
    doc
      .fillColor("black")
      .fontSize(11)
      .text(`Invoice ID: ${order._id}`)
      .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
      .moveDown(1);

    /* ================= BILLING DETAILS ================= */
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Billing & Shipping Details");

    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11);

    doc.text(`Name: ${order.address.fullName}`);
    doc.text(`Phone: ${order.address.phone}`);
    doc.text(
      `Address: ${order.address.houseNo}, ${order.address.area},`
    );
    doc.text(
      `${order.address.city}, ${order.address.state} - ${order.address.pincode}`
    );

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

   /* ================= ITEMS ================= */
doc.font("Helvetica-Bold").fontSize(14).text("Order Items");
doc.moveDown(0.8);

// Table Header
const tableTop = doc.y;

doc.fontSize(11).font("Helvetica-Bold");
doc.text("Item", 50, tableTop);
doc.text("Qty", 360, tableTop, { width: 50, align: "center" });
doc.text("Price", 420, tableTop, { width: 60, align: "right" });
doc.text("Total", 500, tableTop, { width: 60, align: "right" });

doc.moveDown(0.5);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

doc.font("Helvetica").fontSize(11);
doc.moveDown(0.5);

order.items.forEach((item, index) => {
  const y = doc.y; // 🔥 SAME Y FOR ENTIRE ROW
  const itemTotal = item.quantity * item.priceAtThatTime;

  doc.text(
    `${index + 1}. ${item.product?.name || "Product removed"}`,
    50,
    y,
    { width: 280 }
  );

  doc.text(item.quantity.toString(), 360, y, {
    width: 50,
    align: "center",
  });

  doc.text(`₹${item.priceAtThatTime}`, 420, y, {
    width: 60,
    align: "right",
  });

  doc.text(`₹${itemTotal}`, 500, y, {
    width: 60,
    align: "right",
  });

  doc.moveDown(1); // move AFTER row is done
});

doc.moveDown(0.5);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown(1);

/* ================= GRAND TOTAL BOX ================= */

doc.moveDown(1.5);

// separator line
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown(0.8);

const boxTop = doc.y;
const boxHeight = 40;

// Draw background box
doc
  .rect(350, boxTop, 195, boxHeight)
  .fill("#f5f5f5")
  .stroke("#000");

// Label
doc
  .fillColor("#333")
  .font("Helvetica-Bold")
  .fontSize(12)
  .text("Grand Total", 360, boxTop + 12);

// Amount
doc
  .fontSize(14)
  .text(`₹ ${order.totalAmount}`, 360, boxTop + 10, {
    width: 170,
    align: "right",
  });

// reset color
doc.fillColor("#000");
doc.moveDown(3);
    doc.end();
  } catch (error) {
    console.error("Invoice error:", error);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};









