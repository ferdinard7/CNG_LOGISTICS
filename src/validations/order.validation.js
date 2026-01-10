import Joi from "joi";

export const orderIdParamSchema = Joi.object({
  orderId: Joi.string().trim().required(),
});

export const estimateDispatchOrderSchema = Joi.object({
  pickupAddress: Joi.string().trim().min(3).required(),
  deliveryAddress: Joi.string().trim().min(3).required(),

  pickupLat: Joi.number().min(-90).max(90).optional(),
  pickupLng: Joi.number().min(-180).max(180).optional(),
  deliveryLat: Joi.number().min(-90).max(90).optional(),
  deliveryLng: Joi.number().min(-180).max(180).optional(),

  itemDetails: Joi.string().trim().min(3).max(2000).required(),
  packageSize: Joi.string().valid("SMALL", "MEDIUM", "LARGE").required(),
  urgency: Joi.string().valid("STANDARD", "EXPRESS", "SAME_DAY").required(),

  deliveryTime: Joi.date().iso().optional(),
});