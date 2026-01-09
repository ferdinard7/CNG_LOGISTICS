import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const adminListOrders = async (req, res) => {
  try {
    const { type, status, from, to, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      ...(type ? { serviceType: type } : {}),
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          driver: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Orders fetched",
      data: {
        items: items.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          type: o.serviceType,
          customer: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : null,
          driver: o.driver ? `${o.driver.firstName} ${o.driver.lastName}` : null,
          amount: o.amount,
          status: o.status,
          date: o.createdAt,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("adminListOrders error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const adminGetOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        driver: { select: { id: true, firstName: true, lastName: true, role: true, phone: true } },
      },
    });

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    return res.status(StatusCodes.OK).json({ success: true, message: "Order fetched", data: order });
  } catch (err) {
    logger.error("adminGetOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowed = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!allowed.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed.join(", ")}`,
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    logger.info("Order status updated", { orderId, status });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order status updated",
      data: updated,
    });
  } catch (err) {
    logger.error("adminUpdateOrderStatus error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const adminAssignDriver = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: { id: true, role: true, kycStatus: true, isActive: true },
    });

    if (!driver || !driver.isActive) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid driver" });
    }

    if (!["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"].includes(driver.role)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "User is not a driver/rider" });
    }

    if (driver.kycStatus !== "APPROVED") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Driver KYC not approved",
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { driverId },
    });

    logger.info("Order driver assigned", { orderId, driverId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Driver assigned successfully",
      data: updated,
    });
  } catch (err) {
    logger.error("adminAssignDriver error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};