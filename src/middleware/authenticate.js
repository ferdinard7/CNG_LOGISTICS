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
      select: { id: true, role: true, kycStatus: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
  }
};