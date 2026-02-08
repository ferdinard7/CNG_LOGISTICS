import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma.js";

const DRIVER_ROLES = new Set(["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"]);

export const requireKycApproved = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        kycStatus: true,
        isActive: true,
        isOnline: true,
        availabilityStatus: true,
        maxActiveOrders: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Account inactive",
      });
    }

    if (user.kycStatus !== "APPROVED") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "KYC not approved. Complete verification to continue.",
      });
    }

    // ✅ refresh req.user with latest DB values
    req.user = user;

    next();
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};