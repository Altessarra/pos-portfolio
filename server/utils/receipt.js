export const generateReceiptNo = () => {
  const date = new Date();
  const compact = date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `POS-${compact}-${random}`;
};
