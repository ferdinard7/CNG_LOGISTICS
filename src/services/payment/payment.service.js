import prisma from "../../config/prisma.js";
import { createPaymentProvider } from "./providers/index.js";

export const paymentService = {
  async listMethods() {
    return prisma.paymentMethod.findMany({
      where: { isActive: true },
    });
  },

  async getMethodById(id) {
    if (id === "interswitch" || id === "Interswitch") {
      const method = await prisma.paymentMethod.findFirst({
        where: { provider: "INTERSWITCH", isActive: true },
      });
      if (!method) throw new Error("No active Interswitch payment method configured.");
      return method;
    }
    if (id === "paystack" || id === "Paystack") {
      const method = await prisma.paymentMethod.findFirst({
        where: { provider: "PAYSTACK", isActive: true },
      });
      if (!method) throw new Error("No active Paystack payment method configured.");
      return method;
    }
    const method = await prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!method) throw new Error("Payment method not found");
    return method;
  },

  async processPayment({ orderId, amount, currency, paymentMethodId, customerId, metadata = {}, customerEmail, customerName }) {
    if (!orderId) throw new Error("orderId is required");
    if (!amount || amount <= 0) throw new Error("amount must be greater than zero");
    if (!currency) throw new Error("currency is required");

    const method = await this.getMethodById(paymentMethodId);
    if (!method.isActive) throw new Error("Payment method is not active");

    const provider = createPaymentProvider(method);
    const initResult = await provider.initialize({
      orderId,
      amount,
      currency,
      metadata: {
        ...metadata,
        customerId,
        customerName: customerName || metadata.customerName,
        customerEmail: customerEmail || metadata.customerEmail,
      },
    });

    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId,
        paymentMethodId: method.id,
        amount,
        currency,
        providerReference: initResult.providerReference,
        status: "pending",
        metadata: {
          ...metadata,
          customerId,
          provider: method.provider,
          providerInit: initResult.providerResponse,
        },
      },
    });

    return {
      transaction,
      payment: {
        provider: method.provider,
        reference: initResult.providerReference,
        authorizationUrl: initResult.authorizationUrl,
        paymentRequest: initResult.paymentRequest,
        providerResponse: initResult.providerResponse,
      },
    };
  },

  async reconcilePayment({ provider, reference, payload = null, rawBody = null, signature = null, type = "callback" }) {
    if (!reference) throw new Error("provider reference is required");

    const transaction = await prisma.paymentTransaction.findFirst({
      where: { providerReference: reference },
      include: { paymentMethod: true, order: true },
    });
    if (!transaction) throw new Error("Payment transaction not found");

    const method = transaction.paymentMethod;
    if (String(method.provider).toUpperCase() !== String(provider).toUpperCase()) {
      throw new Error("Payment provider mismatch for this transaction");
    }

    const providerInstance = createPaymentProvider(method);

    if (type === "webhook" && !providerInstance.verifyWebhookSignature(rawBody, signature)) {
      throw new Error("Invalid webhook signature");
    }

    const verification = await providerInstance.verify(reference, { payload });
    const status = providerInstance.mapStatus(verification.status, verification.data);

    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status,
        providerReference: verification.providerReference || transaction.providerReference,
        metadata: {
          ...(transaction.metadata || {}),
          lastProviderResponse: verification.providerResponse,
          lastNotification: payload,
        },
      },
    });

    if (status === "success" && transaction.orderId) {
      const ref = verification.providerReference || transaction.providerReference;
      const paymentMethodName = method.name || method.provider || "payment";
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: "paid",
          paidAt: new Date(),
          paymentReference: ref || undefined,
          paymentMethod: paymentMethodName,
        },
      });
    }

    return {
      transaction: { ...transaction, status },
      providerResponse: verification.providerResponse,
      status,
    };
  },

  async recordWebhookNotification({ provider, paymentReference, orderId, status, payload, rawBody }) {
    return prisma.paymentWebhookNotification.create({
      data: {
        provider,
        paymentReference,
        orderId,
        status,
        payload: payload || {},
        rawBody: rawBody ? String(rawBody).slice(0, 10000) : null,
      },
    });
  },

  async listTransactions({ userId = null, orderId = null, status = null, page = 1, limit = 20 }) {
    const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
    const take = Math.min(50, Math.max(1, limit));

    const where = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (userId) {
      where.order = { customerId: userId };
    }

    const [rows, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          paymentMethod: true,
          order: {
            include: {
              customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
          },
        },
      }),
      prisma.paymentTransaction.count({ where }),
    ]);

    return {
      rows,
      meta: {
        total,
        page: Math.max(1, page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  async listWebhookNotifications({ page = 1, limit = 50 }) {
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    const [rows, total] = await Promise.all([
      prisma.paymentWebhookNotification.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentWebhookNotification.count(),
    ]);

    return {
      rows,
      meta: {
        total,
        page: Math.max(1, page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  },
};
