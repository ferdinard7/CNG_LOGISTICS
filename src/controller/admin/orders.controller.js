import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

export const adminListOrders = async (req, res) => {
  try {
    const { type, status, from, to, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // For DISPATCH and PARK_N_GO: only show orders after payment is successful.
    // WASTE_PICKUP and RIDE_BOOKING: show all (waste doesn't require upfront payment).
    const paymentRequiredTypes = ["DISPATCH", "PARK_N_GO"];
    const needsPaymentFilter = !type || paymentRequiredTypes.includes(type);

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
      // Only show DISPATCH/PARK_N_GO orders that have been paid
      ...(needsPaymentFilter
        ? {
            OR: [
              { serviceType: { notIn: paymentRequiredTypes } },
              { serviceType: { in: paymentRequiredTypes }, paymentStatus: "paid" },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderCode: true,
          serviceType: true,
          amount: true,
          status: true,
          createdAt: true,

          // ✅ payout tracking
          isPayoutProcessed: true,
          payoutAmount: true,
          payoutProcessedAt: true,

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
          amount: o.amount != null ? Number(o.amount) : null,
          status: o.status,
          date: o.createdAt,

          // ✅ payout info for UI
          isPayoutProcessed: !!o.isPayoutProcessed,
          payoutAmount: o.payoutAmount != null ? Number(o.payoutAmount) : null,
          payoutProcessedAt: o.payoutProcessedAt || null,

          // helpful: show if Pay button should appear
          canPay: o.status === "COMPLETED" && !o.isPayoutProcessed && !!o.driver,
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

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order fetched",
      data: {
        ...order,
        amount: order.amount != null ? Number(order.amount) : null,
        tipAmount: order.tipAmount != null ? Number(order.tipAmount) : null,
        platformFee: order.platformFee != null ? Number(order.platformFee) : null,
        driverEarning: order.driverEarning != null ? Number(order.driverEarning) : null,

        // ✅ payout info for UI
        isPayoutProcessed: !!order.isPayoutProcessed,
        payoutAmount: order.payoutAmount != null ? Number(order.payoutAmount) : null,
        payoutProcessedAt: order.payoutProcessedAt || null,
        payoutProcessedBy: order.payoutProcessedBy || null,

        canPay: order.status === "COMPLETED" && !order.isPayoutProcessed && !!order.driverId,
      },
    });
  } catch (err) {
    logger.error("adminGetOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: `Internal server error ${err}` });
  }
};

export const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowed = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!allowed.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed.join(", ")}`,
      });
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        serviceType: true,
        driverId: true,
        acceptedAt: true,
        startedAt: true,
        completedAt: true,
      },
    });

    if (!existing) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }

    // prevent nonsense transitions
    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Finalized orders cannot be updated",
      });
    }

    // ✅ COMPLETED rules:
    // - Waste pickup is handled by company/admin internally -> admin CAN complete
    // - Everything else: drivers must complete (wallet credit logic)
    if (status === "COMPLETED" && existing.serviceType !== "WASTE_PICKUP") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Admin cannot mark order as COMPLETED. Driver must complete the order.",
      });
    }

    // ASSIGNED should have a driver (still true for waste if you decide to use it; but mostly waste will be admin-managed)
    if (status === "ASSIGNED" && !existing.driverId && existing.serviceType !== "WASTE_PICKUP") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Cannot set ASSIGNED without assigning a driver",
      });
    }

    const data = { status };

    // timestamps
    if (status === "ASSIGNED" && !existing.acceptedAt) data.acceptedAt = new Date();
    if (status === "IN_PROGRESS" && !existing.startedAt) data.startedAt = new Date();
    if (status === "COMPLETED" && !existing.completedAt) data.completedAt = new Date();

    const updated = await prisma.order.update({
      where: { id: orderId },
      data,
    });

    logger.info("Admin updated order status", { orderId, status, serviceType: existing.serviceType });

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

    if (!driverId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "driverId is required",
      });
    }

    // Map serviceType -> allowed roles (MVP)
    const serviceRoleMap = {
      DISPATCH: ["RIDER"],
      PARK_N_GO: ["TRUCK_DRIVER"],
      RIDE_BOOKING: ["RIDER"],
      // Waste is handled internally by company/admin (no assignment)
      WASTE_PICKUP: [],
    };

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, driverId: true, serviceType: true, paymentStatus: true },
      });

      if (!order) return { error: "ORDER_NOT_FOUND" };

      // 🚫 Do not assign for waste pickup
      if (order.serviceType === "WASTE_PICKUP") {
        return { error: "WASTE_NO_ASSIGN" };
      }

      // For DISPATCH and PARK_N_GO: order must be paid before admin can assign driver
      if (["DISPATCH", "PARK_N_GO"].includes(order.serviceType) && order.paymentStatus !== "paid") {
        return { error: "PAYMENT_REQUIRED" };
      }

      // MVP: only assign if still pending and unassigned
      if (order.status !== "PENDING" || order.driverId) {
        return { error: "ORDER_NOT_ASSIGNABLE" };
      }

      const driver = await tx.user.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          role: true,
          kycStatus: true,
          isActive: true,
          isOnline: true,
          availabilityStatus: true,
          maxActiveOrders: true,
        },
      });

      if (!driver || !driver.isActive) return { error: "INVALID_DRIVER" };

      if (!["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"].includes(driver.role)) {
        return { error: "NOT_A_DRIVER" };
      }

      if (driver.kycStatus !== "APPROVED") return { error: "KYC_NOT_APPROVED" };

      // ✅ enforce serviceType ↔ role match
      const allowedRoles = serviceRoleMap[order.serviceType] || [];
      if (!allowedRoles.includes(driver.role)) {
        return { error: "ROLE_NOT_ALLOWED", allowedRoles, role: driver.role, serviceType: order.serviceType };
      }

      const activeCount = await tx.order.count({
        where: { driverId, status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      });

      const max = driver.maxActiveOrders ?? 1;

      if (activeCount >= max) {
        // capacity full -> mark BUSY for consistency
        await tx.user.update({
          where: { id: driverId },
          data: { availabilityStatus: "BUSY" },
        });

        return { error: "DRIVER_CAPACITY_FULL", activeCount, max };
      }

      // concurrency-safe: update only if still pending + unassigned
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING", driverId: null },
        data: {
          driverId,
          status: "ASSIGNED",
          acceptedAt: new Date(),
        },
      });

      if (updated.count === 0) return { error: "ORDER_RACE_LOST" };

      const newActiveCount = activeCount + 1;
      const availabilityStatus = !driver.isOnline ? "OFFLINE" : newActiveCount >= max ? "BUSY" : "AVAILABLE";

      await tx.user.update({
        where: { id: driverId },
        data: { availabilityStatus },
      });

      const freshOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          driver: { select: { id: true, firstName: true, lastName: true, phone: true, role: true } },
        },
      });

      return { order: freshOrder, activeCount: newActiveCount, max, availabilityStatus };
    });

    if (result.error === "ORDER_NOT_FOUND") {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }
    if (result.error === "PAYMENT_REQUIRED") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Order must be paid by customer before a driver can be assigned.",
      });
    }
    if (result.error === "WASTE_NO_ASSIGN") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Waste pickup requests are handled internally and cannot be assigned to drivers.",
      });
    }
    if (result.error === "ORDER_NOT_ASSIGNABLE") {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Order cannot be assigned (not pending or already assigned)",
      });
    }
    if (result.error === "INVALID_DRIVER") {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid driver" });
    }
    if (result.error === "NOT_A_DRIVER") {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "User is not a driver/rider" });
    }
    if (result.error === "KYC_NOT_APPROVED") {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Driver KYC not approved" });
    }
    if (result.error === "ROLE_NOT_ALLOWED") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Driver role '${result.role}' cannot be assigned to service '${result.serviceType}'. Allowed: ${(
          result.allowedRoles || []
        ).join(", ")}`,
      });
    }
    if (result.error === "DRIVER_CAPACITY_FULL") {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Driver has reached active order limit",
        data: { activeOrdersCount: result.activeCount, maxActiveOrders: result.max },
      });
    }
    if (result.error === "ORDER_RACE_LOST") {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Order is no longer available for assignment",
      });
    }

    logger.info("Admin assigned driver to order", {
      orderId,
      driverId: result.order?.driverId,
      availabilityStatus: result.availabilityStatus,
      activeOrdersCount: result.activeCount,
      maxActiveOrders: result.max,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Driver assigned successfully",
      data: result.order,
    });
  } catch (err) {
    logger.error("adminAssignDriver error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminListEligibleDrivers = async (req, res) => {
  try {
    const {
      serviceType,
      role,
      availability = "AVAILABLE", // OFFLINE | AVAILABLE | BUSY
      page = 1,
      limit = 20,
      includeBusy = "false", // optional: include drivers even if BUSY
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const serviceRoleMap = {
      DISPATCH: ["RIDER"],
      PARK_N_GO: ["TRUCK_DRIVER"],
      WASTE_PICKUP: ["WASTE_DRIVER"],
      RIDE_BOOKING: ["RIDER"],
    };

    const allowedDriverRoles = ["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"];

    const roles = role
      ? [role]
      : serviceType && serviceRoleMap[serviceType]
      ? serviceRoleMap[serviceType]
      : allowedDriverRoles;

    const validAvailability = new Set(["OFFLINE", "AVAILABLE", "BUSY"]);
    if (availability && !validAvailability.has(availability)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid availability. Allowed: ${Array.from(validAvailability).join(", ")}`,
      });
    }

    const where = {
      isActive: true,
      kycStatus: "APPROVED",
      role: { in: roles },
      // If includeBusy=true, don't force availability filter
      ...(String(includeBusy) === "true"
        ? {}
        : availability
        ? { availabilityStatus: availability }
        : {}),
    };

    const [drivers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isOnline: true,
          availabilityStatus: true,
          maxActiveOrders: true,
          lastLat: true,
          lastLng: true,
          lastLocationUpdatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const driverIds = drivers.map((d) => d.id);

    const counts = driverIds.length
      ? await prisma.order.groupBy({
          by: ["driverId"],
          where: {
            driverId: { in: driverIds },
            status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          },
          _count: { _all: true },
        })
      : [];

    const countMap = new Map(counts.map((c) => [c.driverId, c._count._all]));

    const items = drivers.map((d) => {
      const activeOrdersCount = countMap.get(d.id) || 0;
      const cap = d.maxActiveOrders ?? 1;

      return {
        ...d,
        activeOrdersCount,
        canTakeMore: activeOrdersCount < cap,
      };
    });

    // capacity filter (default behavior)
    const eligible = items.filter((d) => d.canTakeMore);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Eligible drivers fetched",
      data: {
        items: eligible,
        total, // base where total (before cap filter)
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("adminListEligibleDrivers error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const adminAcceptWastePickup = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.serviceType !== "WASTE_PICKUP") return { notFound: true };
      if (order.status !== "PENDING") return { badState: true, status: order.status };

      const wasteRequestId = `WST-${Date.now()}`; // simple MVP (you can refine)

      const meta = order.metadata || {};
      const nextMeta = {
        ...meta,
        wasteRequestId,
      };

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "ASSIGNED",
          acceptedAt: new Date(),
          metadata: nextMeta,
        },
      });

      return { updated };
    });

    if (result.notFound) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Request not found" });
    if (result.badState) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: `Request cannot be accepted in status: ${result.status}`,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Waste pickup accepted",
      data: result.updated,
    });
  } catch (err) {
    logger.error("adminAcceptWastePickup error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};


export const adminPayDriverForOrder = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { orderId } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderCode: true,
          status: true,
          driverId: true,
          driverEarning: true,
          tipAmount: true,
          isPayoutProcessed: true,
        },
      });

      if (!order) return { error: "NOT_FOUND" };
      if (order.status !== "COMPLETED") return { error: "NOT_COMPLETED" };
      if (!order.driverId) return { error: "NO_DRIVER" };
      if (order.isPayoutProcessed) return { error: "ALREADY_PAID" };

      // extra safety: prevent double-pay via unique WalletTransaction(orderId)
      const existingTx = await tx.walletTransaction.findUnique({
        where: { orderId },
        select: { id: true },
      });
      if (existingTx) return { error: "ALREADY_PAID" };

      const earning = order.driverEarning != null ? Number(order.driverEarning) : 0;
      const tip = order.tipAmount != null ? Number(order.tipAmount) : 0;
      const payout = Number((earning + tip).toFixed(2));

      const driver = await tx.user.findUnique({
        where: { id: order.driverId },
        select: { id: true, walletBalance: true, isActive: true },
      });

      if (!driver || !driver.isActive) return { error: "INVALID_DRIVER" };

      const before = driver.walletBalance != null ? Number(driver.walletBalance) : 0;
      const after = Number((before + payout).toFixed(2));

      await tx.user.update({
        where: { id: driver.id },
        data: { walletBalance: after },
      });

      await tx.walletTransaction.create({
        data: {
          userId: driver.id,
          type: "CREDIT",
          amount: payout,
          balanceBefore: before,
          balanceAfter: after,
          orderId,
          note: `Admin payout for order ${order.orderCode}`,
        },
      });

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          isPayoutProcessed: true,
          payoutProcessedAt: new Date(),
          payoutProcessedBy: adminId,
          payoutAmount: payout,
        },
      });

      return { updatedOrder, payout, after };
    });

    if (result.error === "NOT_FOUND") {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Order not found" });
    }
    if (result.error === "NOT_COMPLETED") {
      return res.status(StatusCodes.CONFLICT).json({ success: false, message: "Order is not completed yet" });
    }
    if (result.error === "NO_DRIVER") {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Order has no driver assigned" });
    }
    if (result.error === "ALREADY_PAID") {
      return res.status(StatusCodes.CONFLICT).json({ success: false, message: "Order payout already processed" });
    }
    if (result.error === "INVALID_DRIVER") {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid or inactive driver" });
    }

    logger.info("Admin payout processed", { orderId, payout: result.payout, adminId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Driver credited successfully",
      data: {
        order: result.updatedOrder,
        payoutAmount: result.payout,
        driverWalletBalance: result.after,
      },
    });
  } catch (err) {
    logger.error("adminPayDriverForOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};