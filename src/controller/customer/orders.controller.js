import prisma from "../../config/prisma.js";
import { orderIdParamSchema,
  estimateDispatchOrderSchema,
  createDispatchOrderSchema,
createParkNgoOrderSchema,
createWastePickupOrderSchema } from "../../validations/order.validation.js";
import {
  estimateDispatchDistanceAndEta,
  estimateDispatchPrice,
} from "../../services/pricing.service.js";
import { StatusCodes } from "http-status-codes";
import logger from "../../config/logger.js";
import { generateOrderCode, isPrismaUniqueViolation } from "../../utils/orderCode.js";

const DRIVER_ROLES = new Set(["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"]);

export const createDispatchOrder = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    const { error, value } = createDispatchOrderSchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    const pickup = value.pickup;
    const dropoff = value.dropoff;

    const { distanceKm, etaMinutes } = estimateDispatchDistanceAndEta({
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      deliveryLat: dropoff.lat,
      deliveryLng: dropoff.lng,
    });

    const amount = estimateDispatchPrice({
      distanceKm,
      packageSize: value.packageSize,
      urgency: value.urgency,
    });

    const created = await prisma.order.create({
      data: {
        orderCode: generateOrderCode("DISPATCH"),
        serviceType: "DISPATCH",
        status: "PENDING",
        customerId,

        pickupAddress: pickup.address,
        deliveryAddress: dropoff.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        deliveryLat: dropoff.lat,
        deliveryLng: dropoff.lng,

        distanceKm,
        etaMinutes,

        amount, // ✅ store calculated price
        currency: "NGN",
        tipAmount: value.tipAmount ?? 0,

        metadata: {
        pickup,
        dropoff,
        packageInfo: value.packageInfo,
        note: value.note || "",
        packageSize: value.packageSize,
        urgency: value.urgency,
        deliveryTime: value.deliveryTime ? new Date(value.deliveryTime).toISOString() : null,
        },
      },
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Dispatch order created successfully",
      data: created,
    });
  } catch (err) {
    logger.error("createDispatchOrder error", { err });

    // optional uniqueness handler if you import isPrismaUniqueViolation
    // if (isPrismaUniqueViolation(err)) ...

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const createParkNgoOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    const { error, value } = createParkNgoOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const {
      currentAddress,
      newAddress,
      movingDate,
      houseSize,
      serviceType,      // <- dropdown value (FULL_SERVICE, PACKING_ONLY, ...)
      estimatedItems,
      contactPhone,
      notes,
      estimatedFee,
    } = value;

    const order = await prisma.order.create({
      data: {
        orderCode: generateOrderCode("PARK_N_GO"),
        serviceType: "PARK_N_GO",
        status: "PENDING",
        customerId: userId,

        // store a useful searchable summary too
        pickupAddress: currentAddress,
        deliveryAddress: newAddress,

        amount: estimatedFee,
        currency: "NGN",

        metadata: {
          parkNgo: {
            currentAddress,
            newAddress,
            movingDate: new Date(movingDate).toISOString(),
            houseSize,
            moveServiceType: serviceType,
            estimatedItems,
            contactPhone,
            notes: notes || "",
          },
        },
      },
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Park N Go order created",
      data: order,
    });
  } catch (err) {
    logger.error("createParkNgoOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const createWastePickupOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { error, value } = createWastePickupOrderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const {
      pickupAddress,
      wasteTypes,
      estimatedWeight,
      quantity,
      condition,
      preferredPickupTime,
      notes,
      estimatedFee,
    } = value;

    // ✅ schema enforces min 5kg already, but keep this for UI display/business logic
    const isBuyBackEligible = estimatedWeight >= 5;

    // ✅ normalize fee (optional)
    const amount = estimatedFee != null ? Number(estimatedFee) : 0;

    const created = await prisma.order.create({
      data: {
        orderCode: generateOrderCode("WASTE_PICKUP"),
        serviceType: "WASTE_PICKUP",
        status: "PENDING",
        customerId: userId,

        pickupAddress,

        amount,
        currency: "NGN",

        metadata: {
          wastePickup: {
            pickupAddress,
            wasteTypes,
            estimatedWeight,
            quantity,
            condition,
            preferredPickupTime: preferredPickupTime
              ? new Date(preferredPickupTime).toISOString()
              : null,
            notes: notes || "",
            isBuyBackEligible,
          },

          // Admin can fill later (optional)
          wasteRequestId: null,
        },
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
      },
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Waste pickup request created",
      data: created,
    });
  } catch (err) {
    logger.error("createWastePickupOrder error", {
      message: err?.message,
      stack: err?.stack,
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const canViewOrder = ({ user, order }) => {
  if (!user) return false;

  if (user.role === "ADMIN") return true;

  if (user.role === "CONSUMER") {
    return order.customerId === user.id;
  }

  if (DRIVER_ROLES.has(user.role)) {
    return order.driverId === user.id;
  }

  return false;
};

export const getOrderDetails = async (req, res) => {
  try {
    const { error, value } = orderIdParamSchema.validate(req.params, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const { orderId } = value;
    const user = req.user;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true, role: true, kycStatus: true },
        },
      },
    });

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!canViewOrder({ user, order })) {
      logger.warn("Unauthorized order access attempt", {
        userId: user?.id,
        role: user?.role,
        orderId,
      });

      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You do not have access to this order",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order fetched",
      data: {
        id: order.id,
        orderCode: order.orderCode,
        serviceType: order.serviceType,
        status: order.status,

        // amounts (Decimal -> Number)
        amount: order.amount != null ? Number(order.amount) : null,
        tipAmount: order.tipAmount != null ? Number(order.tipAmount) : null,
        currency: order.currency,

        customerId: order.customerId,
        driverId: order.driverId,

        pickupAddress: order.pickupAddress,
        deliveryAddress: order.deliveryAddress,
        pickupLat: order.pickupLat,
        pickupLng: order.pickupLng,
        deliveryLat: order.deliveryLat,
        deliveryLng: order.deliveryLng,

        distanceKm: order.distanceKm,
        etaMinutes: order.etaMinutes,

        acceptedAt: order.acceptedAt,
        startedAt: order.startedAt,
        completedAt: order.completedAt,

        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        customer: order.customer,
        driver: order.driver,

        // payment tracking (Interswitch/Paystack)
        paymentStatus: order.paymentStatus || "pending",
        paymentReference: order.paymentReference,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt,

        // your structured payload (pickup/dropoff/packageInfo/note/packageSize/urgency...)
        meta: order.metadata || null,
      },
    });
  } catch (err) {
    logger.error("getOrderDetails error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const estimateDispatchOrder = async (req, res) => {
  try {
    const { error, value } = estimateDispatchOrderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const pickup = value.pickup;
    const dropoff = value.dropoff;

    const { distanceKm, etaMinutes } = estimateDispatchDistanceAndEta({
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      deliveryLat: dropoff.lat,
      deliveryLng: dropoff.lng,
    });

    const amount = estimateDispatchPrice({
      distanceKm,
      packageSize: value.packageSize,
      urgency: value.urgency,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Dispatch estimate generated",
      data: {
        serviceType: "DISPATCH",
        currency: "NGN",
        amount,
        distanceKm,
        etaMinutes,
        breakdown: {
          packageSize: value.packageSize,
          urgency: value.urgency,
          packageInfo: value.packageInfo,
        },
      },
    });
  } catch (err) {
    logger.error("estimateDispatchOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getMyOrders = async (req, res) => {
  try {
    const user = req.user;
    const { status, serviceType, customerId, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Only customer or admin
    if (user.role !== "CONSUMER" && user.role !== "ADMIN") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only customers or admins can view orders list",
      });
    }

    const where = {};

    // scope
    if (user.role === "CONSUMER") {
      where.customerId = user.id;
    } else if (user.role === "ADMIN") {
      // optional admin filter
      if (customerId) where.customerId = customerId;
    }

    // validate enums
    const allowedStatus = new Set(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
    const allowedService = new Set(["DISPATCH", "PARK_N_GO", "WASTE_PICKUP", "RIDE_BOOKING"]);

    if (status && !allowedStatus.has(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid status. Allowed: ${Array.from(allowedStatus).join(", ")}`,
      });
    }

    if (serviceType && !allowedService.has(serviceType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Invalid serviceType. Allowed: ${Array.from(allowedService).join(", ")}`,
      });
    }

    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, phone: true, role: true } },
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
          serviceType: o.serviceType,
          status: o.status,
          amount: o.amount != null ? Number(o.amount) : null,
          tipAmount: o.tipAmount != null ? Number(o.tipAmount) : null,
          currency: o.currency,
          paymentStatus: o.paymentStatus || "pending",
          pickupAddress: o.pickupAddress,
          deliveryAddress: o.deliveryAddress,
          distanceKm: o.distanceKm,
          etaMinutes: o.etaMinutes,
          driver: o.driver || null,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("getMyOrders error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get order by tracking code (orderCode) - PUBLIC, no auth required.
 * Used for Tracking page - user enters DP-2025-1234 or PNG-2025-1234 etc.
 */
export const getOrderByTrackingCode = async (req, res) => {
  try {
    const { orderCode } = req.params;
    if (!orderCode || !String(orderCode).trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Order code is required",
      });
    }

    const code = String(orderCode).trim();
    const order = await prisma.order.findFirst({
      where: {
        orderCode: { equals: code, mode: "insensitive" },
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true, role: true },
        },
      },
    });

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Order not found for this tracking code",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order found",
      data: {
        id: order.id,
        orderCode: order.orderCode,
        serviceType: order.serviceType,
        status: order.status,
        paymentStatus: order.paymentStatus || "pending",
        amount: order.amount != null ? Number(order.amount) : null,
        tipAmount: order.tipAmount != null ? Number(order.tipAmount) : null,
        currency: order.currency,
        pickupAddress: order.pickupAddress,
        deliveryAddress: order.deliveryAddress,
        distanceKm: order.distanceKm,
        etaMinutes: order.etaMinutes,
        acceptedAt: order.acceptedAt,
        startedAt: order.startedAt,
        completedAt: order.completedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: order.customer,
        driver: order.driver,
        meta: order.metadata || null,
      },
    });
  } catch (err) {
    logger.error("getOrderByTrackingCode error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const user = req.user;

    const { error, value } = orderIdParamSchema.validate(req.params, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    if (user.role !== "CONSUMER") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only customers can cancel orders",
      });
    }

    const { orderId } = value;

    // check existence + ownership
    const existing = await prisma.order.findFirst({
      where: { id: orderId, customerId: user.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Order not found",
      });
    }

    if (existing.status !== "PENDING") {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Order cannot be cancelled (only pending orders can be cancelled)",
      });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order cancelled",
      data: order,
    });
  } catch (err) {
    logger.error("cancelOrder error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};