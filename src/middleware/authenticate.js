import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma.js";
import { verifyAccessToken } from "../utils/token.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    const token = header.split(" ")[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { 
        id: true, 
        role: true, 
        kycStatus: true, 
        isActive: true,
        isOnline: true,
        availabilityStatus: true,
        maxActiveOrders: true
   },
    });

    if (!user || !user.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch(err) {
    console.error("JWT VERIFY ERROR:", err.message);
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
  }
};


/** Optional auth: attaches user to req if valid token present; does not reject when absent */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }
    const token = header.split(" ")[1];
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, kycStatus: true, isActive: true, isOnline: true, availabilityStatus: true, maxActiveOrders: true },
    });
    req.user = user && user.isActive ? user : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};