export const computeEarnings = ({ amount, tipAmount = 0, feePercent = 15 }) => {
  const fee = Number(((amount * feePercent) / 100).toFixed(2));
  const earning = Number((amount - fee).toFixed(2));
  const totalToRider = Number((earning + tipAmount).toFixed(2));
  return { fee, earning, totalToRider };
};