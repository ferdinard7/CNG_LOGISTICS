/**
 * Paystack payment provider for CNG Logistics.
 */
import crypto from "crypto";
import axios from "axios";
import { env } from "../../../config/env.js";

export class PaystackProvider {
  constructor(method) {
    this.method = method;
    this.baseUrl = method?.config?.baseUrl || "https://api.paystack.co";
    const raw = method?.config?.secretKey || env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY;
    this.secretKey = raw ? String(raw).trim() : "";

    const baseUrl = env.BASE_URL || "";
    this.callbackUrl = method?.config?.callbackUrl || `${baseUrl}/api/v1/payment/paystack/callback`;

    if (!this.secretKey) {
      throw new Error("Paystack secret key is missing. Set PAYSTACK_SECRET_KEY in .env");
    }
  }

  buildReference(orderId) {
    const raw = (orderId || "order").toString().replace(/-/g, "");
    const suffix = String(Date.now()).slice(-8);
    return `PSK_${raw.slice(0, 24)}_${suffix}`;
  }

  normalizeAmount(amount) {
    const multiplier = Number(this.method?.config?.amountMultiplier ?? 100);
    return Math.round(Number(amount) * multiplier);
  }

  buildHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  async initialize({ amount, currency, orderId, metadata = {}, reference }) {
    const payloadReference = reference || this.buildReference(orderId);
    const customerEmail = metadata?.customerEmail || this.method?.config?.defaultEmail;
    if (!customerEmail || !String(customerEmail).trim()) {
      throw new Error("Customer email is required for Paystack.");
    }
    const amountKobo = this.normalizeAmount(amount);
    if (!amountKobo || amountKobo <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    // Paystack redirects to backend callback; backend verifies and redirects to frontend
    const baseUrl = process.env.BASE_URL || process.env.APP_BASE_URL || "";
    const backendCallback = `${baseUrl}/api/v1/payment/paystack/callback`;
    const callbackUrl = backendCallback || this.callbackUrl;

    const body = {
      email: String(customerEmail).trim(),
      amount: amountKobo,
      reference: payloadReference,
      callback_url: callbackUrl,
      metadata: { orderId: orderId || "" },
    };
    if (currency) body.currency = String(currency).toUpperCase();

    const response = await axios.post(`${this.baseUrl}/transaction/initialize`, body, {
      headers: this.buildHeaders(),
    });

    if (!response.data || response.data.status !== true) {
      const msg = response.data?.message || "Failed to initialize Paystack payment";
      throw new Error(msg);
    }

    const data = response.data.data;
    return {
      authorizationUrl: data.authorization_url,
      providerReference: data.reference || payloadReference,
      providerResponse: response.data,
      paymentRequest: null,
    };
  }

  async verify(reference, { payload } = {}) {
    if (payload?.data && payload.data.reference) {
      const data = payload.data;
      return {
        data,
        status: data.status,
        providerReference: data.reference,
        providerResponse: payload,
      };
    }

    const ref = reference || payload?.data?.reference;
    const response = await axios.get(`${this.baseUrl}/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: this.buildHeaders(),
    });

    if (!response.data || response.data.status !== true) {
      throw new Error("Unable to verify Paystack transaction");
    }

    const data = response.data.data;
    return {
      data,
      status: data.status,
      providerReference: data.reference,
      providerResponse: response.data,
    };
  }

  verifyWebhookSignature(rawBody, signature) {
    if (!signature || !rawBody) return false;
    const hmac = crypto.createHmac("sha512", this.secretKey);
    hmac.update(rawBody);
    return hmac.digest("hex") === signature;
  }

  mapStatus(status, data) {
    const normalized = (status || data?.status || "").toString().toLowerCase();
    if (["success", "confirmed"].includes(normalized)) return "success";
    if (["failed", "abandoned", "cancelled", "declined"].includes(normalized)) return "failed";
    return "pending";
  }
}
