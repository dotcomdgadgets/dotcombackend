export const calculateOrderPrice = (items) => {
  const GST_RATE = 18;

  // ✅ Product prices already include GST
  const subTotal = items.reduce(
    (sum, item) => sum + item.priceAtThatTime * item.quantity,
    0
  );

  const deliveryCharge = subTotal >= 1000 ? 0 : 49;
  const promiseFee = subTotal >= 1000 ? 9 : 0;

  // ✅ FINAL AMOUNT CUSTOMER PAYS
  const grandTotal = +(
    subTotal +
    deliveryCharge +
    promiseFee
  ).toFixed(2);

  // ✅ EXTRACT GST FROM GRAND TOTAL (NOT ADD)
  const taxableValue = +(grandTotal / (1 + GST_RATE / 100)).toFixed(2);
  const gstAmount = +(grandTotal - taxableValue).toFixed(2);
  const cgst = +(gstAmount / 2).toFixed(2);
  const sgst = +(gstAmount / 2).toFixed(2);

  return {
    subTotal,          // price incl. GST (products only)
    taxableValue,      // base value
    gstAmount,
    cgst,
    sgst,
    deliveryCharge,
    promiseFee,
    grandTotal,        // FINAL PAID AMOUNT
  };
};
