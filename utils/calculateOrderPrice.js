export const calculateOrderPrice = (items) => {
  const subTotal = items.reduce(
    (sum, item) => sum + item.priceAtThatTime * item.quantity,
    0
  );

  const GST_RATE = 0.18;
  const deliveryCharge = subTotal >= 1000 ? 0 : 49;
  const promiseFee = subTotal >= 1000 ? 9 : 0;

  const gstAmount = +(subTotal * GST_RATE).toFixed(2);
  const cgst = +(gstAmount / 2).toFixed(2);
  const sgst = +(gstAmount / 2).toFixed(2);

  const grandTotal = +(
    subTotal +
    gstAmount +
    deliveryCharge +
    promiseFee
  ).toFixed(2);

  return {
    subTotal,
    deliveryCharge,
    promiseFee,
    gstAmount,
    cgst,
    sgst,
    grandTotal,
  };
};
