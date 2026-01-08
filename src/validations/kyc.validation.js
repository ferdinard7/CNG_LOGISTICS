import Joi from "joi";

export const submitRiderKycSchema = Joi.object({
  nin: Joi.string().pattern(/^\d{11}$/).required(),
  motorcycleType: Joi.string().trim().min(2).max(50).required(),
  motorcycleMake: Joi.string().trim().min(2).max(50).required(),
  motorcycleModel: Joi.string().trim().min(1).max(50).required(),
  motorcycleYear: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).required(),
  motorcyclePlate: Joi.string().trim().min(3).max(20).required(),

  ninDocUrl: Joi.string().uri().required(),
  motorcycleRegDocUrl: Joi.string().uri().required(),
});

export const submitTruckKycSchema = Joi.object({
  driversLicenseNumber: Joi.string().trim().min(5).max(50).required(),
  vehicleMake: Joi.string().trim().min(2).max(50).required(),
  vehicleModel: Joi.string().trim().min(1).max(50).required(),
  vehicleYear: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).required(),
  vehiclePlate: Joi.string().trim().min(3).max(20).required(),

  driversLicenseDocUrl: Joi.string().uri().required(),
  vehicleRegDocUrl: Joi.string().uri().required(),
});