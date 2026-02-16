/**
 * Interswitch payment provider for CNG Logistics.
 * Test mode: https://docs.interswitchgroup.com/docs/test-cards
 */
import crypto from "crypto";
import axios from "axios";
import { env } from "../../../config/env.js";

export class InterswitchProvider {
  constructor(method) {
    this.method = method;
    const config = method?.config || {};
    this.initUrl = config.initUrl || env.INTERSWITCH_INIT_URL || "https://newwebpay.qa.interswitchng.com/collections/w/pay";
    this.verifyUrl = config.verifyUrl || env.INTERSWITCH_VERIFY_URL || "https://sandbox.interswitchng.com/api/v3/purchases/verify";
    this.hmacSecret = config.hmacSecret || env.INTERSWITCH_HMAC_SECRET;
    this.mode = config.mode || env.INTERSWITCH_MODE || "TEST";
    this.merchantCode = config.merchantCode || env.INTERSWITCH_MERCHANT_CODE;
    this.payItemId = config.payItemId || env.INTERSWITCH_PAY_ITEM_ID;
    this.currencyNumeric = config.currencyNumeric || Number(env.INTERSWITCH_CURRENCY_NUMERIC) || 566;
    this.signatureHeader = config.signatureHeader || env.INTERSWITCH_SIGNATURE_HEADER || "x-interswitch-signature";

    const baseUrl = env.BASE_URL || "";
    this.callbackUrl = config.callbackUrl || `${baseUrl}/api/v1/payment/interswitch/callback`;
    this.siteRedirectUrl = config.siteRedirectUrl || env.INTERSWITCH_SITE_REDIRECT_URL || this.callbackUrl;

    if (!this.merchantCode || !this.payItemId) {
      throw new Error("Interswitch merchant credentials are not configured");
    }
    if (!this.hmacSecret) {
      throw new Error("Interswitch signing secret is missing");
    }
  }

  buildReference(orderId) {
    const raw = (orderId || "order").toString().replace(/-/g, "");
    const suffix = String(Date.now()).slice(-8);
    const ref = `ISW${raw.slice(0, 32)}${suffix}`;
    return ref.length <= 50 ? ref : ref.slice(0, 50);
  }

  normalizeAmount(amount) {
    const multiplier = Number(this.method?.config?.amountMultiplier ?? 1);
    return Math.round(Number(amount) * multiplier);
  }

  async initialize({ amount, currency, orderId, metadata = {}, reference }) {
    const payloadReference = reference || this.buildReference(orderId);
    const amountValue = this.normalizeAmount(amount);
    if (!amountValue || amountValue <= 0) {
      throw new Error("Payment amount must be greater than zero. Send amount in kobo for NGN.");
    }

    // Interswitch redirects to backend callback; backend verifies and redirects to frontend
    const baseUrl = process.env.BASE_URL || process.env.APP_BASE_URL || "";
    const backendCallback = `${baseUrl}/api/v1/payment/interswitch/callback`;
    const redirectUrl = backendCallback || this.siteRedirectUrl;

    const cust_name = metadata.customerName || "Customer";
    const cust_email = metadata.customerEmail || "";
    if (!cust_email || !cust_email.trim()) {
      throw new Error("Customer email is required for Interswitch.");
    }

    const paymentRequest = {
      merchant_code: this.merchantCode,
      pay_item_id: this.payItemId,
      txn_ref: payloadReference,
      site_redirect_url: redirectUrl,
      amount: amountValue,
      currency: this.currencyNumeric,
      mode: this.mode,
      cust_name,
      cust_email: cust_email.trim(),
      cust_id: metadata.customerId || "",
    };

    return {
      providerReference: payloadReference,
      paymentRequest,
      authorizationUrl: this.initUrl,
    };
  }

  async verify(reference, { payload } = {}) {
    if (payload) {
      return {
        data: payload,
        status: payload.status || payload.responseCode || payload.responseDescription,
        providerReference: payload.paymentReference || payload.reference || reference,
        providerResponse: payload,
      };
    }

    if (!this.verifyUrl) {
      throw new Error("Interswitch verification URL is not configured");
    }

    const separator = this.verifyUrl.includes("?") ? "&" : "?";
    const url = `${this.verifyUrl}${separator}paymentReference=${encodeURIComponent(reference)}`;
    const response = await axios.get(url);

    if (![200, 201].includes(response.status) || !response.data) {
      throw new Error("Unable to verify Interswitch transaction");
    }

    const payloadData = response.data;
    return {
      data: payloadData,
      status: payloadData.status || payloadData.responseCode || payloadData.responseDescription,
      providerReference: reference,
      providerResponse: response.data,
    };
  }

  verifyWebhookSignature(rawBody, signature) {
    if (!signature || !rawBody) return false;
    const hmac = crypto.createHmac("sha512", this.hmacSecret);
    hmac.update(rawBody);
    return hmac.digest("hex") === signature;
  }

  mapStatus(status, data) {
    const fallback = data?.responseCode || data?.status || data?.responseDescription;
    const normalized = String(status || fallback || "").toLowerCase();
    if (["success", "approved", "00"].includes(normalized)) return "success";
    if (["failed", "declined", "01", "02", "03"].includes(normalized)) return "failed";
    return "pending";
  }
}
