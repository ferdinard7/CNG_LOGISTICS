import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const riderGetProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        kycStatus: true,
        isOnline: true,
        createdAt: true,
        kycProfile: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "User not found" });
    }

    // total deliveries + completion rate
    const [totalAssigned, totalCompleted] = await Promise.all([
      prisma.order.count({ where: { driverId: userId } }),
      prisma.order.count({ where: { driverId: userId, status: "COMPLETED" } }),
    ]);

    const completionRate = totalAssigned > 0 ? Number(((totalCompleted / totalAssigned) * 100).toFixed(1)) : 0;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile fetched",
      data: {
        ...user,
        stats: {
          rating: 4.9, // v1 placeholder
          totalDeliveries: totalCompleted,
          completionRate,
        },
      },
    });
  } catch (err) {
    logger.error("riderGetProfile error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const riderUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName ? { firstName: String(firstName).trim() } : {}),
        ...(lastName ? { lastName: String(lastName).trim() } : {}),
        ...(phone ? { phone: String(phone).trim() } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile updated",
      data: updated,
    });
  } catch (err) {
    logger.error("riderUpdateProfile error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const riderUpdateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "lat and lng must be numbers",
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastLocationUpdatedAt: new Date(),
      },
      select: { id: true, lastLat: true, lastLng: true, lastLocationUpdatedAt: true },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Location updated",
      data: updated,
    });
  } catch (err) {
    logger.error("riderUpdateLocation error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};