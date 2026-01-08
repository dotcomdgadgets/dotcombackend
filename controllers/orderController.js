import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import PDFDocument from "pdfkit";
import { calculateOrderPrice } from "../utils/calculateOrderPrice.js";

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

    // 6️⃣ Create order
    const order = await Order.create({
      user: userId,
      items,
      address: addressSnapshot,
      paymentMethod,

      // 🔥 PRICE BREAKUP (CONSISTENT)
      subTotal: price.subTotal,
      gstAmount: price.gstAmount,
      deliveryCharge: price.deliveryCharge,
      promiseFee: price.promiseFee,
      grandTotal: price.grandTotal,

      totalAmount: price.grandTotal,

      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      orderStatus: "Pending",
    });

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

    /* ================= READ FROM DB ================= */
    const subTotal = order.subTotal;
    const gstAmount = order.gstAmount;
    const deliveryCharge = order.deliveryCharge;
    const promiseFee = order.promiseFee || 0;
    const grandTotal = order.grandTotal;

    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

   /* ================= HEADER ================= */

// Company Name
doc
  .font("Helvetica-Bold")
  .fontSize(20)
  .fillColor("black")
  .text("DOTCOM GADGETS", {
    align: "center",
  });

// Invoice type
doc
  .moveDown(0.2)
  .fontSize(10)
  .fillColor("gray")
  .text("GST Invoice", {
    align: "center",
  });

// GSTIN + Location
doc
  .moveDown(0.2)
  .fontSize(9)
  .text("GSTIN: 07AAKCD3151A1Z5 | Delhi", {
    align: "center",
  });

// Reset color
doc.fillColor("black");

// Divider line (full width, centered)
doc.moveDown(0.6);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();


    /* ================= INVOICE META ================= */
    doc.moveDown(1);
    doc.fontSize(11);
    doc.text(`Invoice ID: ${order._id}`);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);

    /* ================= CUSTOMER ================= */
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(13).text("Billing & Shipping Details");
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(11);

    doc.text(`Name: ${order.address.fullName}`);
    doc.text(`Phone: ${order.address.phone}`);
    doc.text(
      `Address: ${order.address.houseNo}, ${order.address.area}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`
    );

    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    /* ================= ITEMS TABLE ================= */
doc.moveDown(1);
doc.font("Helvetica-Bold").fontSize(13).text("Order Items");
doc.moveDown(0.6);

const tableTop = doc.y;

// ---- Table Header ----
doc.fontSize(11).font("Helvetica-Bold");
doc.text("Item", 50, tableTop);
doc.text("Qty", 350, tableTop, { width: 50, align: "center" });
doc.text("Price", 490, tableTop, { width: 60, align: "right" });

doc.moveDown(0.4);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

// ---- Table Rows ----
doc.font("Helvetica").fontSize(11);
doc.moveDown(0.6);

order.items.forEach((item, index) => {
  const rowY = doc.y; // 🔒 LOCK Y POSITION

  doc.text(`${index + 1}. ${item.product?.name}`, 50, rowY, {
    width: 280,
  });

  doc.text(item.quantity.toString(), 350, rowY, {
    width: 50,
    align: "center",
  });

  doc.text(`Rs. ${item.priceAtThatTime.toFixed(2)}`, 490, rowY, {
    width: 60,
    align: "right",
  });

  doc.moveDown(1); // row height
});

    /* ================= BILL SUMMARY (RIGHT BOX) ================= */
    const summaryWidth = 500;
    const summaryX = 49;
    let summaryY = doc.y + 15;

    // background box
    doc
      .roundedRect(summaryX - 10, summaryY - 10, summaryWidth + 20, 170, 6)
      .fill("#f5f5f5");

    doc.fillColor("black");

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("Bill Summary", summaryX, summaryY, {
        width: summaryWidth,
      });

    summaryY += 25;
    doc.font("Helvetica").fontSize(11);

    const row = (label, value, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica");

      doc.text(label, summaryX, summaryY, {
        width: summaryWidth - 90,
      });

      doc.text(`Rs. ${value.toFixed(2)}`, summaryX, summaryY, {
        width: summaryWidth,
        align: "right",
      });

      summaryY += 18;
    };

    row("Subtotal", subTotal);
    row("Delivery Charges", deliveryCharge);
    row("CGST (9%)", cgst);
    row("SGST (9%)", sgst);

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
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};












