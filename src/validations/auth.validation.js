import Joi from "joi";

export const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  role: Joi.string().valid("CONSUMER", "RIDER", "TRUCK_DRIVER", "WASTE_DRIVER", "ADMIN").required(),
  password: Joi.string().min(6).max(100).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  acceptTerms: Joi.boolean().valid(true).required(),
});

export const loginSchema = Joi.object({
  identifier: Joi.string().trim().min(3).required(), // email OR phone
  password: Joi.string().required(),
});