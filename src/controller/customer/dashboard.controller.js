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

/**
 * GET /api/customer/dashboard/overview
 * Returns summary for all customer dashboard tabs: orders, waste, park n go, payments.
 * Similar to admin and rider dashboard overview endpoints.
 */
export const customerOverview = async (req, res) => {
  try {
    const customerId = req.user.id;
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [
      totalOrders,
      activeOrdersCount,
      completedOrdersCount,
      totalSpentAgg,
      walletBalance,
      dispatchCount,
      parkNGoCount,
      wasteCount,
      recentOrders,
      paidOrdersCount,
    ] = await Promise.all([
      prisma.order.count({ where: { customerId } }),
      prisma.order.count({
        where: {
          customerId,
          status: { in: ["PENDING", "ASSIGNED", "IN_PROGRESS"] },
          serviceType: { in: ["DISPATCH", "PARK_N_GO", "RIDE_BOOKING"] },
        },
      }),
      prisma.order.count({
        where: {
          customerId,
          status: "COMPLETED",
          serviceType: { in: ["DISPATCH", "PARK_N_GO", "RIDE_BOOKING"] },
        },
      }),
      prisma.order.aggregate({
        where: {
          customerId,
          status: { not: "CANCELLED" },
          serviceType: { in: ["DISPATCH", "PARK_N_GO", "RIDE_BOOKING"] },
        },
        _sum: { amount: true, tipAmount: true },
      }),
      prisma.user.findUnique({
        where: { id: customerId },
        select: { walletBalance: true },
      }),
      prisma.order.count({
        where: {
          customerId,
          serviceType: "DISPATCH",
        },
      }),
      prisma.order.count({
        where: {
          customerId,
          serviceType: "PARK_N_GO",
        },
      }),
      prisma.order.count({
        where: {
          customerId,
          serviceType: "WASTE_PICKUP",
        },
      }),
      prisma.order.findMany({
        where: { customerId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.order.count({
        where: {
          customerId,
          paymentStatus: "paid",
          serviceType: { in: ["DISPATCH", "PARK_N_GO", "RIDE_BOOKING"] },
        },
      }),
    ]);

    const totalSpent = Number(totalSpentAgg._sum.amount || 0) + Number(totalSpentAgg._sum.tipAmount || 0);
    const wallet = walletBalance?.walletBalance != null ? Number(walletBalance.walletBalance) : 0;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Customer overview fetched",
      data: {
        totalOrders,
        activeOrders: activeOrdersCount,
        completedOrders: completedOrdersCount,
        totalSpent,
        walletBalance: wallet,
        paidOrdersCount,
        byType: {
          dispatch: dispatchCount,
          parkNGo: parkNGoCount,
          waste: wasteCount,
        },
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          serviceType: o.serviceType,
          status: o.status,
          amount: o.amount != null ? Number(o.amount) : null,
          currency: o.currency,
          paymentStatus: o.paymentStatus || "pending",
          pickupAddress: o.pickupAddress,
          deliveryAddress: o.deliveryAddress,
          driver: o.driver ? `${o.driver.firstName} ${o.driver.lastName}` : null,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (err) {
    logger.error("customerOverview error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};
