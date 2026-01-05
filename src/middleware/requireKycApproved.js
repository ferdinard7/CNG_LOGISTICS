import { StatusCodes } from "http-status-codes";

const DRIVER_ROLES = new Set(["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"]);

export const requireKycApproved = (req, res, next) => {
  const user = req.user;

  if (DRIVER_ROLES.has(user.role) && user.kycStatus !== "APPROVED") {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "KYC approval required to perform this action",
      data: { kycStatus: user.kycStatus },
    });
  }

  next();
};