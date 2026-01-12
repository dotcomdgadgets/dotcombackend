import PDFDocument from "pdfkit";

export const generatePackingSlip = (order, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 0 });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=packing-slip-${order._id}.pdf`
  );
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  /* ================= LAYOUT ================= */
  const START_X = 30;
  const START_Y = 30;
  const BOX_WIDTH = 280;   // 🔒 1/4 A4 width
  const BOX_HEIGHT = 380;

  let y = START_Y;

  /* ================= OUTER BORDER ================= */
  doc
    .roundedRect(START_X, START_Y, BOX_WIDTH, BOX_HEIGHT, 8)
    .lineWidth(1)
    .stroke("#000000");

  y += 14;

  /* ================= HEADER ================= */
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("DOTCOM GADGETS", START_X + 12, y, {
      width: BOX_WIDTH - 24,
      align: "left",
    });

  y += 18;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("gray")
    .text("PACKING SLIP • Not a text invoice", START_X + 12, y, {
      width: BOX_WIDTH - 24,
    });

  doc.fillColor("black");
  y += 10;

  doc
    .moveTo(START_X + 10, y)
    .lineTo(START_X + BOX_WIDTH - 10, y)
    .stroke();

  y += 12;

  /* ================= ORDER INFO ================= */
  doc.font("Helvetica").fontSize(8);
  doc.text(`Order ID: ${order._id}`, START_X + 12, y);
  y += 12;
  doc.text(
    `Order Date: ${new Date(order.createdAt).toDateString()}`,
    START_X + 12,
    y
  );
  y += 12;
  doc.text(`Payment: ${order.paymentMethod}`, START_X + 12, y);

  y += 14;

  /* ================= SHIPPING ADDRESS ================= */
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Shipping address", START_X + 12, y);
  y += 12;

  doc.font("Helvetica").fontSize(8);
  doc.text(order.address.fullName, START_X + 12, y, {
    width: BOX_WIDTH - 24,
  });
  y += 10;

  doc.text(
    `${order.address.houseNo}, ${order.address.area}`,
    START_X + 12,
    y,
    { width: BOX_WIDTH - 24 }
  );
  y += 10;

  doc.text(
    `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
    START_X + 12,
    y,
    { width: BOX_WIDTH - 24 }
  );
  y += 10;

  doc.text(`Phone: ${order.address.phone}`, START_X + 12, y);

  y += 14;

  doc
    .moveTo(START_X + 10, y)
    .lineTo(START_X + BOX_WIDTH - 10, y)
    .stroke();

  y += 12;

  /* ================= ITEMS ================= */
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("ITEMS", START_X + 12, y);
  y += 12;

  doc.font("Helvetica").fontSize(8);

  order.items.forEach((item, index) => {
    doc.text(
      `${index + 1}. ${item.product?.name || "Product"} × ${item.quantity}`,
      START_X + 12,
      y,
      { width: BOX_WIDTH - 24 }
    );
    y += 12;
  });

  /* ================= FOOTER ================= */
  y = START_Y + BOX_HEIGHT - 40;

  doc
    .fontSize(7)
    .fillColor("gray")
    .text(
      "Packed & fulfilled by Dotcom Gadgets",
      START_X + 12,
      y,
      {
        width: BOX_WIDTH - 24,
        align: "center",
      }
    );

  doc.end();
};
