import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

const ROLE_SERVICE_MAP = {
  RIDER: ["DISPATCH", "RIDE_BOOKING"],
  TRUCK_DRIVER: ["PARK_N_GO"],
  WASTE_DRIVER: ["WASTE_PICKUP"],
};

const getAllowedServiceTypesForRole = (role) => ROLE_SERVICE_MAP[role] || [];

const computeAvailability = ({ isOnline, activeCount, max }) => {
  if (!isOnline) return "OFFLINE";
  return activeCount >= max ? "BUSY" : "AVAILABLE";
};


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

    // Only drivers should use this (optional strictness)
    if (!["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"].includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only drivers can update online status",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const me = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isOnline: true, maxActiveOrders: true },
      });

      const activeCount = await tx.order.count({
        where: { driverId: userId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      });

      const max = me?.maxActiveOrders ?? 1;

      const availabilityStatus = !isOnline
        ? "OFFLINE"
        : activeCount >= max
        ? "BUSY"
        : "AVAILABLE";

      const u = await tx.user.update({
        where: { id: userId },
        data: { isOnline, availabilityStatus },
        select: { id: true, isOnline: true, availabilityStatus: true, maxActiveOrders: true },
      });

      return { user: u, activeCount };
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Status updated",
      data: {
        ...updated.user,
        activeOrdersCount: updated.activeCount,
      },
    });
  } catch (err) {
    logger.error("riderSetOnlineStatus error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const riderAvailableOrders = async (req, res) => {
  try {
    const riderId = req.user.id;
    const role = req.user.role;

    const { serviceType, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedServiceTypes = getAllowedServiceTypesForRole(role);

    // ✅ If caller passes serviceType, validate it; else default to role’s allowed set
    const serviceFilter = serviceType
      ? allowedServiceTypes.includes(serviceType)
        ? { serviceType }
        : null
      : allowedServiceTypes.length
      ? { serviceType: { in: allowedServiceTypes } }
      : {};

    if (serviceFilter === null) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid serviceType for role ${role}. Allowed: ${allowedServiceTypes.join(", ")}`,
      });
    }

    // For DISPATCH, PARK_N_GO, RIDE_BOOKING: only show orders that have been paid.
    // WASTE_PICKUP: no payment required (company picks up, may pay customer).
    const paymentRequiredTypes = ["DISPATCH", "PARK_N_GO", "RIDE_BOOKING"];
    const paymentFilter =
      allowedServiceTypes.length && allowedServiceTypes.some((t) => paymentRequiredTypes.includes(t))
        ? {
            OR: [
              { serviceType: { notIn: paymentRequiredTypes } },
              { serviceType: { in: paymentRequiredTypes }, paymentStatus: "paid" },
            ],
          }
        : {};

    const where = {
      status: "PENDING",
      driverId: null,
      ...serviceFilter,
      ...paymentFilter,
    };

    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 15);

    const [items, total, activeCount, me] = await Promise.all([
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
      prisma.order.count({
        where: { driverId: riderId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      }),
      prisma.user.findUnique({
        where: { id: riderId },
        select: { isOnline: true, availabilityStatus: true, maxActiveOrders: true },
      }),
    ]);

    const maxActiveOrders = me?.maxActiveOrders ?? 1;
    const canAcceptMore = !!me?.isOnline && activeCount < maxActiveOrders && me?.availabilityStatus !== "OFFLINE";

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Available orders fetched",
      data: {
        rider: {
          isOnline: !!me?.isOnline,
          availabilityStatus: me?.availabilityStatus || "OFFLINE",
          activeOrdersCount: activeCount,
          maxActiveOrders,
          canAcceptMore,
          allowedServiceTypes,
        },
        items: items.map((o) => {
          const amount = o.amount != null ? Number(o.amount) : 0;
          const tipAmount = o.tipAmount != null ? Number(o.tipAmount) : 0;

          const platformFee = Number(((amount * feePercent) / 100).toFixed(2));
          const driverEarning = Number((amount - platformFee).toFixed(2));
          const youWillEarn = Number((driverEarning + tipAmount).toFixed(2));

          return {
            id: o.id,
            orderCode: o.orderCode,
            serviceType: o.serviceType,
            status: "AVAILABLE",

            pickupAddress: o.pickupAddress,
            deliveryAddress: o.deliveryAddress,

            customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : null,

            distanceKm: o.distanceKm,
            etaMinutes: o.etaMinutes,

            amount,
            tipAmount,
            currency: o.currency,

            feePercent,
            platformFee,
            driverEarning,
            youWillEarn,

            createdAt: o.createdAt,
          };
        }),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("riderAvailableOrders error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const riderAcceptOrder = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const role = req.user?.role;
    const { orderId } = req.params;

    if (!driverId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    if (!["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"].includes(role)) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Only drivers can accept orders" });
    }

    if (req.user.kycStatus !== "APPROVED") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Complete KYC verification to accept orders",
      });
    }

    const allowedServiceTypes = getAllowedServiceTypesForRole(role);

    const result = await prisma.$transaction(async (tx) => {
      const driver = await tx.user.findUnique({
        where: { id: driverId },
        select: { id: true, isActive: true, isOnline: true, availabilityStatus: true, maxActiveOrders: true },
      });

      if (!driver || !driver.isActive) return { error: "INACTIVE" };
      if (!driver.isOnline || driver.availabilityStatus === "OFFLINE") return { error: "OFFLINE" };

      const activeCount = await tx.order.count({
        where: { driverId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      });

      const max = driver.maxActiveOrders ?? 1;

      if (activeCount >= max) {
        await tx.user.update({ where: { id: driverId }, data: { availabilityStatus: "BUSY" } });
        return { error: "CAPACITY_FULL", activeCount, max };
      }

      // ✅ read the order to validate serviceType for this driver role
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, driverId: true, serviceType: true },
      });

      if (!order || order.status !== "PENDING" || order.driverId) return { error: "NOT_AVAILABLE" };

      if (allowedServiceTypes.length && !allowedServiceTypes.includes(order.serviceType)) {
        return { error: "WRONG_SERVICE", serviceType: order.serviceType, allowedServiceTypes };
      }

      // claim order if still available (concurrency safe)
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING", driverId: null },
        data: { driverId, status: "ASSIGNED", acceptedAt: new Date() },
      });

      if (updated.count === 0) return { error: "NOT_AVAILABLE" };

      const newActiveCount = activeCount + 1;
      const availabilityStatus = newActiveCount >= max ? "BUSY" : "AVAILABLE";

      await tx.user.update({
        where: { id: driverId },
        data: { availabilityStatus },
      });

      const full = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      });

      return { order: full, activeCount: newActiveCount, max, availabilityStatus };
    });

    if (result.error === "INACTIVE") {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Account inactive" });
    }
    if (result.error === "OFFLINE") {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "You must be online to accept orders" });
    }
    if (result.error === "CAPACITY_FULL") {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "You have reached your active order limit",
        data: { activeOrdersCount: result.activeCount, maxActiveOrders: result.max },
      });
    }
    if (result.error === "WRONG_SERVICE") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `You cannot accept ${result.serviceType} orders with role ${role}`,
        data: { allowedServiceTypes: result.allowedServiceTypes },
      });
    }
    if (result.error === "NOT_AVAILABLE") {
      return res.status(StatusCodes.CONFLICT).json({ success: false, message: "Order is no longer available" });
    }

    logger.info("Driver accepted order", { orderId, driverId, ...result });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order accepted successfully",
      data: result.order,
    });
  } catch (err) {
    logger.error("riderAcceptOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
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

    if (order.status === "IN_PROGRESS") {
  return res.status(StatusCodes.OK).json({ success: true, message: "Order already started", data: order });
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
    const driverId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.driverId !== driverId) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    // Allow idempotent call when already completed
    if (!["ASSIGNED", "IN_PROGRESS", "COMPLETED"].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Order cannot be completed",
      });
    }

    const amount = order.amount != null ? Number(order.amount) : 0;
    const tipAmount = order.tipAmount != null ? Number(order.tipAmount) : 0;

    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 15);
    const platformFee = Number(((amount * feePercent) / 100).toFixed(2));
    const driverEarning = Number((amount - platformFee).toFixed(2));

    // what admin will pay later
    const payoutAmount = Number((driverEarning + tipAmount).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      const me = await tx.user.findUnique({
        where: { id: driverId },
        select: { isOnline: true, maxActiveOrders: true },
      });

      const max = me?.maxActiveOrders ?? 1;

      // Mark completed if not yet completed
      const completedOrder =
        order.status === "COMPLETED"
          ? await tx.order.findUnique({ where: { id: orderId } })
          : await tx.order.update({
              where: { id: orderId },
              data: {
                status: "COMPLETED",
                completedAt: new Date(),
                platformFee,
                driverEarning,

                // ✅ payout is now admin-controlled
                isPayoutProcessed: false,
                payoutAmount,
                payoutProcessedAt: null,
                payoutProcessedBy: null,
              },
            });

      // recompute availability AFTER completion (completed is not active)
      const remainingActive = await tx.order.count({
        where: { driverId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      });

      const availabilityStatus = computeAvailability({
        isOnline: !!me?.isOnline,
        activeCount: remainingActive,
        max,
      });

      await tx.user.update({ where: { id: driverId }, data: { availabilityStatus } });

      return {
        order: completedOrder,
        availabilityStatus,
        remainingActive,
        max,
      };
    });

    logger.info("Order completed by driver (payout pending)", { orderId, driverId, ...result });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order completed (awaiting admin payout)",
      data: {
        ...result.order,
        earnings: {
          amount,
          tipAmount,
          feePercent,
          platformFee,
          driverEarning,

          // ✅ what admin will credit later
          payoutAmount,
          payoutProcessed: !!result.order?.isPayoutProcessed,
        },
        driverState: {
          availabilityStatus: result.availabilityStatus,
          activeOrdersCount: result.remainingActive,
          maxActiveOrders: result.max,
        },
      },
    });
  } catch (err) {
    logger.error("riderCompleteOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
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

export const riderWallet = async (req, res) => {
  try {
    const riderId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: riderId },
      select: { id: true, walletBalance: true },
    });

    const txs = await prisma.walletTransaction.findMany({
      where: { userId: riderId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Wallet fetched",
      data: {
        balance: user?.walletBalance != null ? Number(user.walletBalance) : 0,
        transactions: txs.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          balanceBefore: Number(t.balanceBefore),
          balanceAfter: Number(t.balanceAfter),
          orderId: t.orderId,
          note: t.note,
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (err) {
    logger.error("riderWallet error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const driverCompletedOrders = async (req, res) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    if (!DRIVER_ROLES.has(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only drivers can access completed orders",
      });
    }

    const { serviceType, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      driverId,
      status: "COMPLETED",
      ...(serviceType ? { serviceType } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { completedAt: "desc" },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Completed orders fetched",
      data: {
        items: items.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          serviceType: o.serviceType,
          status: o.status,

          pickupAddress: o.pickupAddress,
          deliveryAddress: o.deliveryAddress,

          amount: o.amount != null ? Number(o.amount) : null,
          tipAmount: o.tipAmount != null ? Number(o.tipAmount) : null,
          currency: o.currency,

          // if you added payout fields on Order, expose them for rider UI
          isPayoutProcessed: o.isPayoutProcessed ?? false,
          payoutAmount: o.payoutAmount != null ? Number(o.payoutAmount) : null,
          payoutProcessedAt: o.payoutProcessedAt || null,

          customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : null,
          customerPhone: o.customer?.phone || null,

          completedAt: o.completedAt,
          createdAt: o.createdAt,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("driverCompletedOrders error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};