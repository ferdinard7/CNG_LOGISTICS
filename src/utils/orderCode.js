export const generateOrderCode = (serviceType) => {
  const year = new Date().getFullYear();
  const random4 = String(Math.floor(1000 + Math.random() * 9000));

  const prefixMap = {
    DISPATCH: "DP",
    PARK_N_GO: "PNG",
    WASTE_PICKUP: "WP",
    RIDE_BOOKING: "RD",
  };

  const prefix = prefixMap[serviceType] || "OD";
  return `${prefix}-${year}-${random4}`;
};

export const isPrismaUniqueViolation = (err) => {
  // Prisma unique constraint error code: P2002
  return err?.code === "P2002";
};