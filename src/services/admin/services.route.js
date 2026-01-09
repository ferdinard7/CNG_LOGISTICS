import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

const SERVICE_TYPES = ["DISPATCH", "PARK_N_GO", "WASTE_PICKUP", "RIDE_BOOKING"];

export const adminServiceStats = async (req, res) => {
  try {
    const { from, to } = req.query;

    const createdAt =
      from || to
        ? {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          }
        : undefined;

    const whereBase = createdAt ? { createdAt } : {};

    const results = await Promise.all(
      SERVICE_TYPES.map(async (serviceType) => {
        const where = { ...whereBase, serviceType };

        const [totalOrders, activeOrders, completedOrders, revenueAgg] = await Promise.all([
          prisma.order.count({ where }),
          prisma.order.count({ where: { ...where, status: { in: ["PENDING", "IN_PROGRESS"] } } }),
          prisma.order.count({ where: { ...where, status: "COMPLETED" } }),
          prisma.order.aggregate({
            where: { ...where, status: { not: "CANCELLED" } },
            _sum: { amount: true },
          }),
        ]);

        const revenue = revenueAgg._sum.amount || 0;
        const completionRate = totalOrders > 0 ? Number(((completedOrders / totalOrders) * 100).toFixed(1)) : 0;

        return {
          serviceType,
          totalOrders,
          activeOrders,
          completedOrders,
          revenue,
          completionRate,
        };
      })
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Service stats fetched",
      data: results,
    });
  } catch (err) {
    logger.error("adminServiceStats error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};