import prisma from "../../config/prisma.js";


const generateOrderCode = (prefix) => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${year}-${rand}`;
};


export const createDispatchOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      pickupAddress,
      deliveryAddress,
      itemDescription,
      packageSize,
      urgency,
      deliveryTime,
      estimatedFee,
    } = req.body;

    const order = await prisma.order.create({
      data: {
        orderCode: generateOrderCode("DP"),
        serviceType: "DISPATCH",
        amount: estimatedFee,
        customerId: userId,
        metadata: {
          pickupAddress,
          deliveryAddress,
          itemDescription,
          packageSize,
          urgency,
          deliveryTime,
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Dispatch order created",
      data: order,
    });
  } catch (err) {
    logger.error("createDispatchOrder error", { err });
    return res.status(500).json({ success: false, message: "Internal server error" });
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