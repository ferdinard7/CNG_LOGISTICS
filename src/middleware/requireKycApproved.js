import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma.js";

const DRIVER_ROLES = new Set(["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"]);

export const requireKycApproved = async (req, res, next) => {
  const userId = req.user?.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true, isActive: true },
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

  next();
};