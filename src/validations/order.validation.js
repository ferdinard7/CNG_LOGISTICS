import Joi from "joi";


export const dispatchLocationSchema = Joi.object({
  address: Joi.string().min(3).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  contactName: Joi.string().min(2).required(),
  contactPhone: Joi.string().min(7).required(),
}).required();

export const dispatchPackageSchema = Joi.object({
  itemName: Joi.string().min(2).required(),
  quantity: Joi.number().integer().min(1).default(1),
  weightKg: Joi.number().min(0).optional(),
  isFragile: Joi.boolean().default(false),
}).required();

export const estimateDispatchOrderSchema = Joi.object({
  pickup: dispatchLocationSchema,
  dropoff: dispatchLocationSchema,
  packageInfo: dispatchPackageSchema,

  packageSize: Joi.string().valid("SMALL", "MEDIUM", "LARGE").required(),
  urgency: Joi.string().valid("STANDARD", "EXPRESS", "SAME_DAY").required(),
}).options({ abortEarly: false });

export const createDispatchOrderSchema = Joi.object({
  pickup: dispatchLocationSchema,
  dropoff: dispatchLocationSchema,
  packageInfo: dispatchPackageSchema,

  packageSize: Joi.string().valid("SMALL", "MEDIUM", "LARGE").required(),
  urgency: Joi.string().valid("STANDARD", "EXPRESS", "SAME_DAY").required(),

  note: Joi.string().max(500).allow("").optional(),
  tipAmount: Joi.number().min(0).optional(),
}).options({ abortEarly: false });

export const orderIdParamSchema = Joi.object({
  orderId: Joi.string().trim().required(),
}).options({ abortEarly: false });

// export const estimateDispatchOrderSchema = Joi.object({
//   pickupAddress: Joi.string().trim().min(3).required(),
//   deliveryAddress: Joi.string().trim().min(3).required(),

//   pickupLat: Joi.number().min(-90).max(90).optional(),
//   pickupLng: Joi.number().min(-180).max(180).optional(),
//   deliveryLat: Joi.number().min(-90).max(90).optional(),
//   deliveryLng: Joi.number().min(-180).max(180).optional(),

//   itemDetails: Joi.string().trim().min(3).max(2000).required(),
//   packageSize: Joi.string().valid("SMALL", "MEDIUM", "LARGE").required(),
//   urgency: Joi.string().valid("STANDARD", "EXPRESS", "SAME_DAY").required(),

//   deliveryTime: Joi.date().iso().optional(),
// });