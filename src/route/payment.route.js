/**
 * Payment routes - Interswitch and Paystack integration
 * Mounted at: /api/v1/payment
 * @swagger
 * tags:
 *   - name: Payment
 *     description: Customer payment endpoints (Interswitch, Paystack)
 */
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import {
  getPaymentMethods,
  processPayment,
  paystackInitialize,
  paystackVerify,
  paystackCallback,
  paystackWebhook,
  interswitchCallback,
  interswitchWebhook,
  listTransactions,
  listWebhookNotifications,
} from "../controller/payment.controller.js";

const router = Router();

// Public / no auth
router.get("/methods", getPaymentMethods);
router.get("/paystack/verify/:reference", paystackVerify);
router.get("/paystack/callback", paystackCallback);
router.get("/interswitch/callback", interswitchCallback);

// Webhooks are mounted directly in app.js (before express.json) for raw body

// Auth required
router.post("/process", authenticate, processPayment);
router.post("/paystack/initialize", authenticate, paystackInitialize);
router.get("/transactions", authenticate, listTransactions);
router.get("/transactions/self", authenticate, listTransactions);

// Admin only - webhook notifications
router.get("/webhook-notifications", authenticate, requireAdmin, listWebhookNotifications);

export default router;
