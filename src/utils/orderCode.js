/**
 * Generate unique trackable order code.
 * Format: CNC-{DP|PNG|WP|RD}-{YYYY}-{8 random alphanumeric}
 * e.g. CNC-DP-2025-A1B2C3D4, CNC-PNG-2025-X9Y8Z7W6
 * Used for tracking page - user enters code to monitor order status.
 */
export const generateOrderCode = (serviceType) => {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 8; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const prefixMap = {
    DISPATCH: "DP",
    PARK_N_GO: "PNG",
    WASTE_PICKUP: "WP",
    RIDE_BOOKING: "RD",
  };

  const prefix = prefixMap[serviceType] || "OD";
  return `CNC-${prefix}-${year}-${randomPart}`;
};

export const isPrismaUniqueViolation = (err) => {
  // Prisma unique constraint error code: P2002
  return err?.code === "P2002";
};