import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export const adminOverviewSummary = async (req, res) => {
  try {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [
      totalUsers,
      activeOrders,
      todayRevenueAgg,
      activeRidersDrivers,
      userBreakdown,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count({
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          isOnline: true,
          role: { in: ["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"] },
        },
      }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { _all: true },
        where: { role: { in: ["CONSUMER", "RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"] } },
      }),
    ]);

    const todayRevenue = todayRevenueAgg._sum.amount || 0;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Admin overview summary fetched",
      data: {
        totalUsers,
        activeOrders,
        todayRevenue,
        activeRidersDrivers,
        userBreakdown, // role -> count
      },
    });
  } catch (err) {
    logger.error("adminOverviewSummary error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        driver: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Recent orders fetched",
      data: orders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        serviceType: o.serviceType,
        status: o.status,
        amount: o.amount,
        currency: o.currency,
        customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : null,
        driver: o.driver ? `${o.driver.firstName} ${o.driver.lastName}` : null,
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    logger.error("adminRecentOrders error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};