import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

const SERVICE_TYPE = "PARK_N_GO";
const DRIVER_ROLE = "TRUCK_DRIVER";
const ACTIVE_STATUSES = ["ASSIGNED", "IN_PROGRESS"];

const computeAvailability = ({ isOnline, activeCount, maxActiveOrders }) => {
  if (!isOnline) return "OFFLINE";
  if (activeCount >= maxActiveOrders) return "BUSY";
  return "AVAILABLE";
};

export const truckAvailableOrders = async (req, res) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== DRIVER_ROLE) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only truck drivers can access this",
      });
    }

    const { serviceType = SERVICE_TYPE, page = 1, limit = 20 } = req.query;

    // Truck driver should only see PARK_N_GO
    if (serviceType !== SERVICE_TYPE) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid serviceType for truck orders. Use ${SERVICE_TYPE}`,
      });
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 15);

    const where = {
      status: "PENDING",
      driverId: null,
      serviceType: SERVICE_TYPE,
    };

    const [items, total, activeCount, me] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
        },
      }),
      prisma.order.count({ where }),
      prisma.order.count({
        where: { driverId, status: { in: ACTIVE_STATUSES } },
      }),
      prisma.user.findUnique({
        where: { id: driverId },
        select: { isOnline: true, availabilityStatus: true, maxActiveOrders: true },
      }),
    ]);

    const maxActiveOrders = me?.maxActiveOrders ?? 1;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Available Park N Go orders fetched",
      data: {
        driver: {
          isOnline: !!me?.isOnline,
          availabilityStatus: me?.availabilityStatus || "OFFLINE",
          activeOrdersCount: activeCount,
          maxActiveOrders,
          canAcceptMore: !!me?.isOnline && activeCount < maxActiveOrders,
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

            amount,
            tipAmount,
            currency: o.currency,

            feePercent,
            platformFee,
            driverEarning,
            youWillEarn,

            createdAt: o.createdAt,
            customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : null,
            customerPhone: o.customer?.phone || null,
            meta: o.metadata || null, // contains parkNgo payload
          };
        }),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("truckAvailableOrders error", { err });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
  }
};

export const truckAcceptOrder = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { orderId } = req.params;

    if (!driverId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== DRIVER_ROLE) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Only truck drivers can accept" });
    }

    if (req.user.kycStatus !== "APPROVED") {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "KYC not approved" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const me = await tx.user.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          isActive: true,
          isOnline: true,
          availabilityStatus: true,
          maxActiveOrders: true,
        },
      });

      if (!me || !me.isActive) return { error: "INACTIVE" };
      if (!me.isOnline || me.availabilityStatus === "OFFLINE") return { error: "OFFLINE" };

      const activeCount = await tx.order.count({
        where: { driverId, status: { in: ACTIVE_STATUSES } },
      });

      const max = me.maxActiveOrders ?? 1;

      if (activeCount >= max) {
        await tx.user.update({
          where: { id: driverId },
          data: { availabilityStatus: "BUSY" },
        });
        return { error: "CAPACITY_FULL", activeCount, max };
      }

      // claim order if still available
      const updated = await tx.order.updateMany({
        where: {
          id: orderId,
          status: "PENDING",
          driverId: null,
          serviceType: SERVICE_TYPE,
        },
        data: {
          driverId,
          status: "ASSIGNED",
          acceptedAt: new Date(),
        },
      });

      if (updated.count === 0) return { error: "NOT_AVAILABLE" };

      const newActiveCount = activeCount + 1;
      const availabilityStatus = computeAvailability({
        isOnline: me.isOnline,
        activeCount: newActiveCount,
        maxActiveOrders: max,
      });

      await tx.user.update({
        where: { id: driverId },
        data: { availabilityStatus },
      });

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          driver: { select: { id: true, firstName: true, lastName: true, phone: true, role: true } },
        },
      });

      return { order, activeCount: newActiveCount, max, availabilityStatus };
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
    if (result.error === "NOT_AVAILABLE") {
      return res.status(StatusCodes.CONFLICT).json({ success: false, message: "Order is no longer available" });
    }

    logger.info("Truck driver accepted Park N Go order", {
      orderId,
      driverId,
      activeOrdersCount: result.activeCount,
      maxActiveOrders: result.max,
      availabilityStatus: result.availabilityStatus,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order accepted successfully",
      data: result.order,
    });
  } catch (err) {
    logger.error("truckAcceptOrder error", { err });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
  }
};

export const truckStartOrder = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { orderId } = req.params;

    if (req.user.role !== DRIVER_ROLE) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only truck drivers can start Park N Go orders",
      });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.driverId !== driverId || order.serviceType !== SERVICE_TYPE) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (order.status === "IN_PROGRESS") {
      return res.status(StatusCodes.OK).json({ success: true, message: "Order already started", data: order });
    }

    if (order.status !== "ASSIGNED") {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Order cannot be started" });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });

    return res.status(StatusCodes.OK).json({ success: true, message: "Order started", data: updated });
  } catch (err) {
    logger.error("truckStartOrder error", { err });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
  }
};

export const truckCompleteOrder = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { orderId } = req.params;

    if (!driverId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role !== DRIVER_ROLE) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only truck drivers can complete Park N Go orders",
      });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.driverId !== driverId || order.serviceType !== SERVICE_TYPE) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    if (!["ASSIGNED", "IN_PROGRESS"].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Order cannot be completed" });
    }

    const amount = order.amount != null ? Number(order.amount) : 0;
    const tipAmount = order.tipAmount != null ? Number(order.tipAmount) : 0;

    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT || 15);
    const platformFee = Number(((amount * feePercent) / 100).toFixed(2));
    const driverEarning = Number((amount - platformFee).toFixed(2));
    const creditAmount = Number((driverEarning + tipAmount).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // prevent double credit (wallet tx unique by orderId)
      const existingTx = await tx.walletTransaction.findUnique({
        where: { orderId },
        select: { id: true },
      });

      if (existingTx) {
        const fresh = await tx.order.findUnique({ where: { id: orderId } });

        const remainingActive = await tx.order.count({
          where: { driverId, status: { in: ACTIVE_STATUSES } },
        });

        const me = await tx.user.findUnique({
          where: { id: driverId },
          select: { isOnline: true, maxActiveOrders: true },
        });

        const max = me?.maxActiveOrders ?? 1;
        const availabilityStatus = computeAvailability({
          isOnline: !!me?.isOnline,
          activeCount: remainingActive,
          maxActiveOrders: max,
        });

        await tx.user.update({
          where: { id: driverId },
          data: { availabilityStatus },
        });

        return { order: fresh, credited: false, availabilityStatus, remainingActive, max };
      }

      const me = await tx.user.findUnique({
        where: { id: driverId },
        select: { walletBalance: true, isOnline: true, maxActiveOrders: true },
      });

      const before = me?.walletBalance != null ? Number(me.walletBalance) : 0;
      const after = Number((before + creditAmount).toFixed(2));

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          platformFee,
          driverEarning,
        },
      });

      await tx.user.update({
        where: { id: driverId },
        data: { walletBalance: after },
      });

      await tx.walletTransaction.create({
        data: {
          userId: driverId,
          type: "CREDIT",
          amount: creditAmount,
          balanceBefore: before,
          balanceAfter: after,
          orderId,
          note: `Earning from Park N Go order ${updatedOrder.orderCode}`,
        },
      });

      const remainingActive = await tx.order.count({
        where: { driverId, status: { in: ACTIVE_STATUSES } },
      });

      const max = me?.maxActiveOrders ?? 1;
      const availabilityStatus = computeAvailability({
        isOnline: !!me?.isOnline,
        activeCount: remainingActive,
        maxActiveOrders: max,
      });

      await tx.user.update({
        where: { id: driverId },
        data: { availabilityStatus },
      });

      return {
        order: updatedOrder,
        credited: true,
        creditAmount,
        walletBalanceAfter: after,
        availabilityStatus,
        remainingActive,
        max,
      };
    });

    logger.info("Park N Go order completed by truck driver", { orderId, driverId, ...result });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order completed",
      data: {
        ...result.order,
        earnings: {
          amount,
          tipAmount,
          feePercent,
          platformFee,
          driverEarning,
          creditedAmount: creditAmount,
        },
        driverState: {
          availabilityStatus: result.availabilityStatus,
          activeOrdersCount: result.remainingActive,
          maxActiveOrders: result.max,
        },
      },
    });
  } catch (err) {
    logger.error("truckCompleteOrder error", { err });
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Internal server error" });
  }
};