import { StatusCodes } from "http-status-codes";

const DRIVER_ROLES = new Set(["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"]);

export const requireDriverRole = (req, res, next) => {
  const role = req.user?.role;
  if (!role || !DRIVER_ROLES.has(role)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Access denied (driver only)",
    });
  }
  next();
};