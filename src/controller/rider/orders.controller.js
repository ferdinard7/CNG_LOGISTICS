import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const riderSetOnlineStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "isOnline must be boolean",
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isOnline },
      select: { id: true, isOnline: true },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Status updated",
      data: updated,
    });
  } catch (err) {
    logger.error("riderSetOnlineStatus error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const riderAvailableOrders = async (req, res) => {
  try {
    const { serviceType, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      status: "PENDING",
      driverId: null,
      ...(serviceType ? { serviceType } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Available orders fetched",
      data: {
        items: items.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          serviceType: o.serviceType,
          status: "AVAILABLE",
          pickupAddress: o.pickupAddress,
          deliveryAddress: o.deliveryAddress,
          customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : null,
          distanceKm: o.distanceKm,
          etaMinutes: o.etaMinutes,
          amount: o.amount,
          currency: o.currency,
          createdAt: o.createdAt,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("riderAvailableOrders error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const riderAcceptOrder = async (req, res) => {
  try {
    const riderId = req.user?.id;
    const role = req.user?.role;
    const { orderId } = req.params;

    if (!riderId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (role !== "RIDER") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only riders can accept orders",
      });
    }

    const rider = await prisma.user.findUnique({
      where: { id: riderId },
      select: { id: true, isActive: true, isOnline: true, kycStatus: true },
    });

    if (!rider || !rider.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Account inactive",
      });
    }

    if (!rider.isOnline) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You must be online to accept orders",
      });
    }

    if (rider.kycStatus !== "APPROVED") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Complete KYC verification to accept orders",
      });
    }

    // Concurrency-safe claim:
    // update only if: PENDING + driverId null
    const updated = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: "PENDING",
        driverId: null,
        serviceType: "DISPATCH",
      },
      data: {
        driverId: riderId,
        status: "IN_PROGRESS",
        acceptedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Order is no longer available",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    logger.info("Rider accepted order", { orderId, riderId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order accepted successfully",
      data: order,
    });
  } catch (err) {
    logger.error("riderAcceptOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const riderActiveOrders = async (req, res) => {
  try {
    const riderId = req.user.id;

    const items = await prisma.order.findMany({
      where: { driverId: riderId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      orderBy: { acceptedAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Active deliveries fetched",
      data: items.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        status: o.status,
        pickupAddress: o.pickupAddress,
        deliveryAddress: o.deliveryAddress,
        customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : null,
        customerPhone: o.customer?.phone || null,
        amount: o.amount,
        currency: o.currency,
      })),
    });
  } catch (err) {
    logger.error("riderActiveOrders error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const riderStartOrder = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.driverId !== riderId) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "ASSIGNED") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Order cannot be started",
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order started",
      data: updated,
    });
  } catch (err) {
    logger.error("riderStartOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const riderCompleteOrder = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.driverId !== riderId) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (!["ASSIGNED", "IN_PROGRESS"].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Order cannot be completed",
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    logger.info("Order completed by rider", { orderId, riderId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order completed",
      data: updated,
    });
  } catch (err) {
    logger.error("riderCompleteOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const riderGetOrderDetails = async (req, res) => {
  try {
    const riderId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Order not found",
      });
    }

    // Riders should only access:
    // - orders assigned to them
    // - OR available orders (unassigned) so they can view details before accepting
    const isAssignedToMe = order.driverId === riderId;
    const isAvailable = order.driverId === null && order.status === "PENDING";

    if (!isAssignedToMe && !isAvailable) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You do not have access to this order",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order details fetched",
      data: order,
    });
  } catch (err) {
    logger.error("riderGetOrderDetails error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};