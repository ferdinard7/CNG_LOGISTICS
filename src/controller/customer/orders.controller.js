import prisma from "../../config/prisma.js";
import { orderIdParamSchema, estimateDispatchOrderSchema } from "../../validations/order.validation.js";
import {
  estimateDispatchDistanceAndEta,
  estimateDispatchPrice,
} from "../../services/pricing.service.js";


const DRIVER_ROLES = new Set(["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"]);


const generateDispatchOrderCode = () => {
  const year = new Date().getFullYear();
  const random4 = String(Math.floor(1000 + Math.random() * 9000));
  return `DP-${year}-${random4}`;
};

const isUniqueConstraintError = (err) => err?.code === "P2002";

export const createDispatchOrder = async (req, res) => {
  try {
    const { error, value } = createDispatchOrderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (role !== "CONSUMER") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only customers can create dispatch orders",
      });
    }

    const {
      pickupAddress,
      deliveryAddress,
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      itemDetails,
      packageSize,
      urgency,
      deliveryTime,
    } = value;

    // compute distance/eta + price
    const { distanceKm, etaMinutes } = estimateDispatchDistanceAndEta({
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
    });

    const amount = estimateDispatchPrice({
      distanceKm,
      packageSize,
      urgency,
    });

    // Retry on unique collision for orderCode
    let order = null;

    for (let attempt = 1; attempt <= 5; attempt++) {
      const orderCode = generateDispatchOrderCode();

      try {
        order = await prisma.order.create({
          data: {
            orderCode,
            serviceType: "DISPATCH",
            status: "PENDING",
            customerId: userId,

            pickupAddress,
            deliveryAddress,
            pickupLat: typeof pickupLat === "number" ? pickupLat : null,
            pickupLng: typeof pickupLng === "number" ? pickupLng : null,
            deliveryLat: typeof deliveryLat === "number" ? deliveryLat : null,
            deliveryLng: typeof deliveryLng === "number" ? deliveryLng : null,

            distanceKm: typeof distanceKm === "number" ? distanceKm : null,
            etaMinutes: typeof etaMinutes === "number" ? etaMinutes : null,

            amount,
            currency: "NGN",

            metadata: {
              itemDetails,
              packageSize,
              urgency,
              deliveryTime: deliveryTime ? new Date(deliveryTime).toISOString() : null,
            },
          },
          include: {
            customer: {
              select: { id: true, firstName: true, lastName: true, phone: true },
            },
            driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        });

        // success - break out
        break;
      } catch (err) {
        // only retry for unique collision (orderCode)
        if (isUniqueConstraintError(err)) {
          logger.warn("Order code collision, retrying...", {
            attempt,
            orderCode,
            prismaCode: err.code,
          });

          if (attempt < 5) continue;
        }

        // not a collision, or retries exhausted
        throw err;
      }
    }

    if (!order) {
      logger.error("Failed to create order after retries", { customerId: userId });
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Could not create order at this time. Please try again.",
      });
    }

    logger.info("Dispatch order created", {
      orderId: order.id,
      orderCode: order.orderCode,
      customerId: userId,
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Dispatch order created successfully",
      data: order,
    });
  } catch (err) {
    logger.error("createDispatchOrder error", { err });
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
        orderCode: generateOrderCode("PNG"),
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
        orderCode: generateOrderCode("WP"),
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
    const user = req.user; // from authenticate middleware

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

    // NOTE: Your UI shows pickup/delivery addresses, ETA, distance, item details, etc.
    // Those fields are not yet in your Order model.
    // For now, we return what exists + related user info.
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Order fetched",
      data: {
        id: order.id,
        orderCode: order.orderCode,
        serviceType: order.serviceType,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        customerId: order.customerId,
        driverId: order.driverId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: order.customer,
        driver: order.driver,

        // placeholders for future delivery-details screen:
        meta: {
          pickup: null,
          dropoff: null,
          etaMinutes: null,
          distanceKm: null,
          progressPercent: null,
          notes: null,
        },
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

    const {
      pickupAddress,
      deliveryAddress,
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      itemDetails,
      packageSize,
      urgency,
      deliveryTime,
    } = value;

    const { distanceKm, etaMinutes } = estimateDispatchDistanceAndEta({
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
    });

    const amount = estimateDispatchPrice({
      distanceKm,
      packageSize,
      urgency,
    });

    logger.info("Dispatch estimate generated", {
      pickupAddress,
      deliveryAddress,
      distanceKm,
      etaMinutes,
      amount,
      packageSize,
      urgency,
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
          packageSize,
          urgency,
          itemDetails,
          deliveryTime: deliveryTime ? new Date(deliveryTime).toISOString() : null,
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