/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Interswitch and Paystack payment integration
 */

/**
 * @swagger
 * /api/v1/payment/methods:
 *   get:
 *     summary: Get available payment methods
 *     description: Returns active payment methods (Interswitch, Paystack). Used at checkout. No auth required.
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       provider: { type: string, enum: [INTERSWITCH, PAYSTACK] }
 *                       isActive: { type: boolean }
 *                       supportedCurrencies: { type: array, items: { type: string } }
 */
// (route handles this)

/**
 * @swagger
 * /api/v1/payment/process:
 *   post:
 *     summary: Initiate payment for an order
 *     description: Starts payment session. For Interswitch returns paymentRequest for POST form; for Paystack use /paystack/initialize. Amount must be in kobo for NGN.
 *     tags: [Payment]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, currency, paymentMethodId]
 *             properties:
 *               orderId: { type: string }
 *               amount: { type: number, description: "In kobo for NGN (e.g. 50000 = ₦500)" }
 *               currency: { type: string, example: "NGN" }
 *               paymentMethodId: { type: string }
 *               metadata:
 *                 type: object
 *                 properties:
 *                   returnUrl: { type: string }
 *                   customerEmail: { type: string }
 *                   customerName: { type: string }
 *     responses:
 *       200:
 *         description: Payment init data with redirectUrl/paymentRequest
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     redirectUrl: { type: string }
 *                     paymentRequest: { type: object }
 *                     provider: { type: string }
 *       400: { description: Invalid request or order not found }
 *       401: { description: Unauthorized }
 */
// (route handles this)

/**
 * @swagger
 * /api/v1/payment/paystack/initialize:
 *   post:
 *     summary: Initialize Paystack payment
 *     description: Creates Paystack transaction and returns authorization_url for redirect. Amount in Naira (not kobo).
 *     tags: [Payment]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, amount, orderId, callback_url]
 *             properties:
 *               email: { type: string, format: email }
 *               amount: { type: number, description: "Amount in Naira (e.g. 500)" }
 *               orderId: { type: string }
 *               callback_url: { type: string, description: "Frontend URL for redirect after payment" }
 *     responses:
 *       200:
 *         description: authorization_url and reference
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorization_url: { type: string }
 *                     reference: { type: string }
 *       400: { description: Invalid request }
 *       401: { description: Unauthorized }
 */
// (route handles this)

/**
 * @swagger
 * /api/v1/payment/paystack/verify/{reference}:
 *   get:
 *     summary: Verify Paystack payment
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Verification result }
 */
// (route handles this)

/**
 * @swagger
 * /api/v1/payment/paystack/webhook:
 *   post:
 *     summary: Paystack webhook (charge.success)
 *     description: Register https://cng-logistics.onrender.com/api/v1/payment/paystack/webhook in Paystack dashboard
 *     tags: [Payment]
 *     parameters:
 *       - in: header
 *         name: x-paystack-signature
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: received }
 */
// (route in app.js)

/**
 * @swagger
 * /api/v1/payment/interswitch/callback:
 *   get:
 *     summary: Interswitch redirect callback
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: paymentReference
 *         schema: { type: string }
 *     responses:
 *       302: { description: Redirect to frontend }
 */
// (route handles this)

/**
 * @swagger
 * /api/v1/payment/interswitch/webhook:
 *   post:
 *     summary: Interswitch webhook
 *     tags: [Payment]
 *     parameters:
 *       - in: header
 *         name: x-interswitch-signature
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: received }
 */
// (route in app.js)

/**
 * @swagger
 * /api/v1/payment/transactions:
 *   get:
 *     summary: List payment transactions
 *     description: Same as /transactions/self. Returns paginated transactions for the authenticated user.
 *     tags: [Payment]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, success, failed] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated transactions (amount in kobo for NGN)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object, properties: { id: {}, orderId: {}, amount: {}, currency: {}, status: {}, providerReference: {}, createdAt: {}, order: { type: object, properties: { orderCode: {} } } } } }
 *                 meta: { type: object, properties: { total: {}, page: {}, limit: {}, totalPages: {} } }
 */
// (route handles this)

/**
 * @swagger
 * /api/v1/payment/transactions/self:
 *   get:
 *     summary: List my payment transactions
 *     description: Alias for GET /transactions. Returns paginated transactions for the authenticated user.
 *     tags: [Payment]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated transactions }
 */
// (route handles this)

/**
 * @swagger
 * /api/v1/payment/webhook-notifications:
 *   get:
 *     summary: List payment webhook notifications (admin)
 *     tags: [Payment]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Webhook notifications with payment ref, order id, status }
 */
// (route handles this)
