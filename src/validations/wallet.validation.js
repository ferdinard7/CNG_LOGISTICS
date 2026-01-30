import Joi from "joi";

export const withdrawalRequestSchema = Joi.object({
  amount: Joi.number().min(100).required(), // min ₦100 (adjust)
  bankName: Joi.string().min(2).max(60).required(),
  accountName: Joi.string().min(2).max(80).required(),
  accountNumber: Joi.string().min(8).max(20).required(),
}).options({ abortEarly: false });

export const adminReviewWithdrawalSchema = Joi.object({
  action: Joi.string().valid("APPROVE", "REJECT", "MARK_PAID").required(),
  rejectionReason: Joi.when("action", {
    is: "REJECT",
    then: Joi.string().min(3).max(200).required(),
    otherwise: Joi.string().optional().allow(""),
  }),
  paymentRef: Joi.when("action", {
    is: "MARK_PAID",
    then: Joi.string().min(3).max(120).required(),
    otherwise: Joi.string().optional().allow(""),
  }),
}).options({ abortEarly: false });

export const withdrawalIdParamSchema = Joi.object({
  withdrawalId: Joi.string().trim().required(),
}).options({ abortEarly: false });