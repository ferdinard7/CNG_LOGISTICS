import { StatusCodes } from "http-status-codes";
import logger from "../config/logger.js";
import prisma from "../config/prisma.js";
import { paymentService } from "../services/payment/payment.service.js";

function getRawBody(req) {
  if (req.rawBody) return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;
  if (req.body && typeof req.body === "object") return JSON.stringify(req.body);
  return "";
}

function parseJsonPayload(rawBody, label) {
  if (!rawBody) return {};
  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error(`Invalid ${label} payload`);
  }
}

export const getPaymentMethods = async (req, res) => {
  try {
    const methods = await paymentService.listMethods();
    return res.status(StatusCodes.OK).json({ success: true, data: methods });
  } catch (err) {
    logger.error("getPaymentMethods error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message || "Failed to fetch payment methods",
    });
  }
};

export const processPayment = async (req, res) => {
  try {
    const { orderId, amount, currency, paymentMethodId, metadata = {} } = req.body;
    const user = req.user;
    if (!user?.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Order not found" });
    }
    if (order.customerId !== user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Not your order" });
    }

    const orderAmount = Number(order.amount) || 0;
    let amountToUse = amount;
    if (amountToUse == null || amountToUse <= 0) {
      amountToUse = currency === "NGN" ? Math.round(orderAmount * 100) : orderAmount;
    }
    if (!amountToUse || amountToUse <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Payment amount must be greater than zero. For NGN send amount in kobo.",
      });
    }

    const customerEmail = metadata.customerEmail || order.customer?.email || user.email || "";
    const customerName = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || "Customer";

    const result = await paymentService.processPayment({
      orderId,
      amount: amountToUse,
      currency: currency || "NGN",
      paymentMethodId,
      customerId: user.id,
      metadata: { ...metadata, customerEmail, customerName },
      customerEmail,
      customerName,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        ...result,
        redirectUrl: result.payment.authorizationUrl,
        paymentRequest: result.payment.paymentRequest,
        provider: result.payment.provider,
      },
    });
  } catch (err) {
    logger.error("processPayment error", { err });
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Payment processing failed",
    });
  }
};

export const paystackInitialize = async (req, res) => {
  try {
    const { email, amount, orderId, callback_url } = req.body;
    const user = req.user;
    if (!user?.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });
    if (!order) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Order not found" });
    }
    if (order.customerId !== user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Not your order" });
    }

    const method = await paymentService.getMethodById("paystack");
    const provider = (await import("../services/payment/providers/index.js")).createPaymentProvider(method);

    const amountNaira = Number(amount) || Number(order.amount) || 0;
    const amountKobo = Math.round(amountNaira * 100);
    if (!amountKobo || amountKobo <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    const customerEmail = email || order.customer?.email || user.email || "";
    if (!customerEmail?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email is required for Paystack",
      });
    }

    const initResult = await provider.initialize({
      orderId,
      amount: amountNaira,
      currency: "NGN",
      metadata: {
        customerEmail: customerEmail.trim(),
        returnUrl: callback_url,
      },
    });

    await prisma.paymentTransaction.create({
      data: {
        orderId,
        paymentMethodId: method.id,
        amount: amountKobo,
        currency: "NGN",
        providerReference: initResult.providerReference,
        status: "pending",
        metadata: { provider: "paystack", providerInit: initResult.providerResponse },
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        authorization_url: initResult.authorizationUrl,
        reference: initResult.providerReference,
      },
    });
  } catch (err) {
    logger.error("paystackInitialize error", { err });
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Paystack initialization failed",
    });
  }
};

export const paystackVerify = async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await paymentService.reconcilePayment({
      provider: "paystack",
      reference,
    });
    return res.status(StatusCodes.OK).json({
      success: true,
      data: { status: result.status, transaction: result.transaction },
    });
  } catch (err) {
    logger.error("paystackVerify error", { err });
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Verification failed",
    });
  }
};

export const paystackCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_BASE_URL || "https://your-frontend-url.com";
  try {
    const reference = req.query.reference;
    if (!reference) {
      return res.redirect(`${frontendUrl}/payment/return?success=false&message=Missing+reference`);
    }
    const result = await paymentService.reconcilePayment({
      provider: "paystack",
      reference,
    });
    const redirectUrl = `${frontendUrl}/payment/return?reference=${reference}&success=${result.status === "success"}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    logger.error("paystackCallback error", { err });
    return res.redirect(`${frontendUrl}/payment/return?success=false&message=Verification+failed`);
  }
};

export const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];
    if (!signature) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Missing Paystack signature" });
    }

    const rawBody = getRawBody(req);
    const payload = parseJsonPayload(rawBody, "Paystack webhook");

    if (payload.event !== "charge.success") {
      return res.status(StatusCodes.OK).json({ received: true });
    }

    const reference = payload?.data?.reference;
    if (!reference) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Missing reference" });
    }

    const result = await paymentService.reconcilePayment({
      provider: "paystack",
      reference,
      payload,
      rawBody,
      signature,
      type: "webhook",
    });

    await paymentService.recordWebhookNotification({
      provider: "paystack",
      paymentReference: reference,
      orderId: result.transaction?.orderId,
      status: result.status,
      payload,
      rawBody,
    });

    return res.status(StatusCodes.OK).json({ received: true });
  } catch (err) {
    logger.error("paystackWebhook error", { err });
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Webhook processing failed",
    });
  }
};

export const interswitchCallback = async (req, res) => {
  try {
    const reference = req.query.paymentReference || req.query.reference;
    const frontendUrl = process.env.FRONTEND_BASE_URL || "https://your-frontend-url.com";
    if (!reference) {
      return res.redirect(`${frontendUrl}/payment/return?success=false&message=Missing+reference`);
    }
    const result = await paymentService.reconcilePayment({
      provider: "interswitch",
      reference,
    });
    const redirectUrl = `${frontendUrl}/payment/return?paymentReference=${reference}&success=${result.status === "success"}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    logger.error("interswitchCallback error", { err });
    const frontendUrl = process.env.FRONTEND_BASE_URL || "https://your-frontend-url.com";
    return res.redirect(`${frontendUrl}/payment/return?success=false&message=Verification+failed`);
  }
};

export const interswitchWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-interswitch-signature"];
    if (!signature) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Missing Interswitch signature" });
    }

    const rawBody = getRawBody(req);
    const payload = parseJsonPayload(rawBody, "Interswitch webhook");

    const reference = payload?.paymentReference || payload?.reference;
    if (!reference) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Missing reference" });
    }

    const result = await paymentService.reconcilePayment({
      provider: "interswitch",
      reference,
      payload,
      rawBody,
      signature,
      type: "webhook",
    });

    await paymentService.recordWebhookNotification({
      provider: "interswitch",
      paymentReference: reference,
      orderId: result.transaction?.orderId,
      status: result.status,
      payload,
      rawBody,
    });

    return res.status(StatusCodes.OK).json({ received: true });
  } catch (err) {
    logger.error("interswitchWebhook error", { err });
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.message || "Webhook processing failed",
    });
  }
};

export const listTransactions = async (req, res) => {
  try {
    const user = req.user;
    const { orderId, status, page, limit } = req.query;

    const result = await paymentService.listTransactions({
      userId: user.role === "ADMIN" ? null : user.id,
      orderId,
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.rows,
      meta: result.meta,
    });
  } catch (err) {
    logger.error("listTransactions error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message || "Failed to list transactions",
    });
  }
};

export const listWebhookNotifications = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "ADMIN") {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Admin only" });
    }

    const { page, limit } = req.query;
    const result = await paymentService.listWebhookNotifications({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result.rows,
      meta: result.meta,
    });
  } catch (err) {
    logger.error("listWebhookNotifications error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message || "Failed to list webhook notifications",
    });
  }
};
