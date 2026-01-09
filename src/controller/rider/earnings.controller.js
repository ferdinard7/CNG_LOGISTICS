import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

const startOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const riderEarningsSummary = async (req, res) => {
  try {
    const riderId = req.user.id;

    const from = req.query.from ? new Date(req.query.from) : startOfWeek();
    const to = req.query.to ? new Date(req.query.to) : new Date();

    const completed = await prisma.order.findMany({
      where: {
        driverId: riderId,
        status: "COMPLETED",
        completedAt: { gte: from, lte: to },
      },
      select: { amount: true, tipAmount: true, completedAt: true },
      orderBy: { completedAt: "asc" },
    });

    let total = 0;
    let tips = 0;
    const byDay = {}; // YYYY-MM-DD -> sum

    for (const o of completed) {
      const amt = Number(o.amount || 0);
      const tip = Number(o.tipAmount || 0);
      total += amt + tip;
      tips += tip;

      const dt = o.completedAt ? new Date(o.completedAt) : null;
      if (dt) {
        const key = dt.toISOString().slice(0, 10);
        byDay[key] = (byDay[key] || 0) + (amt + tip);
      }
    }

    const deliveries = completed.length;
    const avgPerDelivery = deliveries > 0 ? Number((total / deliveries).toFixed(2)) : 0;

    // v1 “hours worked” placeholder. When you add shift sessions, we’ll compute properly.
    const hoursWorked = 0;
    const hourlyRate = hoursWorked > 0 ? Number((total / hoursWorked).toFixed(2)) : 0;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Earnings summary fetched",
      data: {
        from,
        to,
        weekTotal: total,
        tipsEarned: tips,
        totalDeliveries: deliveries,
        averagePerDelivery: avgPerDelivery,
        hoursWorked,
        hourlyRate,
        dailyBreakdown: byDay, // frontend can render Mon..Sun
      },
    });
  } catch (err) {
    logger.error("riderEarningsSummary error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};