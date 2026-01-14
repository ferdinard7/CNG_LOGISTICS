import prisma from "../../config/prisma.js";
import { orderIdParamSchema,
  estimateDispatchOrderSchema,
  createDispatchOrderSchema, } from "../../validations/order.validation.js";
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
    const userId = req.user.id;
    const {
      currentAddress,
      newAddress,
      movingDate,
      houseSize,
      serviceType,
      estimatedItems,
      contactPhone,
      notes,
      estimatedFee,
    } = req.body;

    const order = await prisma.order.create({
      data: {
        orderCode: generateOrderCode("PARK_N_GO"),
        serviceType: "PARK_N_GO",
        amount: estimatedFee,
        customerId: userId,
        metadata: {
          currentAddress,
          newAddress,
          movingDate,
          houseSize,
          serviceType,
          estimatedItems,
          contactPhone,
          notes,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Park N Go order created",
      data: order,
    });
  } catch (err) {
    logger.error("createParkNgoOrder error", { err });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createWastePickupOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      pickupAddress,
      wasteTypes,
      estimatedWeight,
      quantity,
      condition,
      preferredPickupTime,
      notes,
      estimatedFee,
    } = req.body;

    const order = await prisma.order.create({
      data: {
        orderCode: generateOrderCode("WASTE_PICKUP"),
        serviceType: "WASTE_PICKUP",
        amount: estimatedFee,
        customerId: userId,
        metadata: {
          pickupAddress,
          wasteTypes,
          estimatedWeight,
          quantity,
          condition,
          preferredPickupTime,
          notes,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Waste pickup request created",
      data: order,
    });
  } catch (err) {
    logger.error("createWastePickupOrder error", { err });
    return res.status(500).json({ success: false, message: "Internal server error" });
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