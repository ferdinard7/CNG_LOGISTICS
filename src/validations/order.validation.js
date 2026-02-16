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

const packageInfoSchema = Joi.object({
  itemName: Joi.string().min(2),
  itemDetails: Joi.string().min(2),
  quantity: Joi.number().integer().min(1).default(1),
  weightKg: Joi.number().min(0).optional(),
  isFragile: Joi.boolean().default(false),
})
  .custom((val, helpers) => {
    if (!val.itemName && !val.itemDetails) {
      return helpers.error("any.required");
    }
    // normalize
    return {
      ...val,
      itemName: val.itemName || val.itemDetails,
    };
  })
  .required();

export const createDispatchOrderSchema = Joi.object({
  pickup: dispatchLocationSchema,
  dropoff: dispatchLocationSchema,
  packageInfo: packageInfoSchema,

  packageSize: Joi.string().valid("SMALL", "MEDIUM", "LARGE").required(),
  urgency: Joi.string().valid("STANDARD", "EXPRESS", "SAME_DAY").required(),

  deliveryTime: Joi.date().iso().optional(), // ✅ new
  note: Joi.string().max(500).allow("").optional(),
  tipAmount: Joi.number().min(0).optional(),
}).options({ abortEarly: false });

export const orderIdParamSchema = Joi.object({
  orderId: Joi.string().trim().required(),
}).options({ abortEarly: false });

const parkNgoHouseSizeEnum = [
  "STUDIO",
  "1_BEDROOM",
  "2_BEDROOM",
  "3_BEDROOM",
  "4_BEDROOM",
  "5PLUS_BEDROOM",
];

const parkNgoServiceTypeEnum = [
  "FULL_SERVICE",     // Full Service (Pack & Move)
  "PACKING_ONLY",
  "MOVING_ONLY",
  "UNPACKING_SERVICE",
];

const parkNgoEstimatedItemsEnum = [
  "LIGHT",            // Light (Few items)
  "MEDIUM",           // Medium (Standard household)
  "HEAVY",            // Heavy (Full house)
  "COMMERCIAL_OFFICE",
];

export const createParkNgoOrderSchema = Joi.object({
  currentAddress: Joi.string().min(3).required(),
  newAddress: Joi.string().min(3).required(),

  // Expect ISO date string from frontend
  movingDate: Joi.date().iso().required(),

  houseSize: Joi.string()
    .valid(...parkNgoHouseSizeEnum)
    .required(),

  serviceType: Joi.string()
    .valid(...parkNgoServiceTypeEnum)
    .required(),

  estimatedItems: Joi.string()
    .valid(...parkNgoEstimatedItemsEnum)
    .required(),

  contactPhone: Joi.string().min(7).max(20).required(),

  notes: Joi.string().max(1000).allow("").optional(),

  // estimated fee should be sent from frontend (or admin/pricing later)
  estimatedFee: Joi.number().min(0).required(),
}).options({ abortEarly: false });

export const createWastePickupOrderSchema = Joi.object({
  pickupAddress: Joi.string().trim().min(5).max(300).required(),

  wasteTypes: Joi.array()
    .items(
      Joi.string()
        .trim()
        .valid("PLASTIC", "PAPER", "GLASS", "METAL", "ELECTRONICS", "TEXTILES")
    )
    .min(1)
    .unique()
    .required(),

  estimatedWeight: Joi.number()
    .min(5) // matches UI
    .max(100000)
    .required(),

  quantity: Joi.string()
    .valid("SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE")
    .required(),

  condition: Joi.string()
    .valid("CLEAN_SORTED", "MIXED_CLEAN", "NEEDS_SORTING")
    .required(),

  preferredPickupTime: Joi.date()
    .iso()
    .optional()
    .allow(null, ""),

  notes: Joi.string().trim().allow("").max(1000).optional(),

  estimatedFee: Joi.number().min(0).optional().default(0),
}).options({ abortEarly: false });