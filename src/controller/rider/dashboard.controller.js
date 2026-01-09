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

export const riderOverview = async (req, res) => {
  try {
    const riderId = req.user.id;
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [todayCompleted, activeCount, todayEarningsAgg, currentDelivery, todayCompletedList] =
      await Promise.all([
        prisma.order.count({
          where: {
            driverId: riderId,
            status: "COMPLETED",
            completedAt: { gte: todayStart, lte: todayEnd },
          },
        }),
        prisma.order.count({
          where: { driverId: riderId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        }),
        prisma.order.aggregate({
          where: {
            driverId: riderId,
            status: "COMPLETED",
            completedAt: { gte: todayStart, lte: todayEnd },
          },
          _sum: { amount: true, tipAmount: true },
        }),
        prisma.order.findFirst({
          where: { driverId: riderId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
          orderBy: { acceptedAt: "desc" },
          include: {
            customer: { select: { firstName: true, lastName: true, phone: true } },
          },
        }),
        prisma.order.findMany({
          where: {
            driverId: riderId,
            status: "COMPLETED",
            completedAt: { gte: todayStart, lte: todayEnd },
          },
          orderBy: { completedAt: "desc" },
          take: 5,
          include: { customer: { select: { firstName: true, lastName: true } } },
        }),
      ]);

    const todayEarnings = Number(todayEarningsAgg._sum.amount || 0) + Number(todayEarningsAgg._sum.tipAmount || 0);

    // v1 rating placeholder (until you add a Review table)
    const rating = 4.9;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Rider overview fetched",
      data: {
        todayEarnings,
        activeDeliveries: activeCount,
        completedToday: todayCompleted,
        rating,
        currentDelivery: currentDelivery
          ? {
              id: currentDelivery.id,
              orderCode: currentDelivery.orderCode,
              status: currentDelivery.status,
              pickupAddress: currentDelivery.pickupAddress,
              deliveryAddress: currentDelivery.deliveryAddress,
              customerName: currentDelivery.customer
                ? `${currentDelivery.customer.firstName} ${currentDelivery.customer.lastName}`
                : null,
              customerPhone: currentDelivery.customer?.phone || null,
              amount: currentDelivery.amount,
              currency: currentDelivery.currency,
            }
          : null,
        todaysCompleted: todayCompletedList.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : null,
          completedAt: o.completedAt,
          amount: o.amount,
        })),
      },
    });
  } catch (err) {
    logger.error("riderOverview error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};