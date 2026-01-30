/**
 * @swagger
 * /api/rider/wallet:
 *   get:
 *     summary: Get my wallet
 *     tags: [Rider - Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet fetched
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/rider/withdrawals:
 *   post:
 *     summary: Request withdrawal
 *     tags: [Rider - Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, bankName, accountName, accountNumber]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 2500
 *               bankName:
 *                 type: string
 *                 example: "GTBank"
 *               accountName:
 *                 type: string
 *                 example: "Boss IK"
 *               accountNumber:
 *                 type: string
 *                 example: "0123456789"
 *     responses:
 *       201:
 *         description: Withdrawal requested
 *       400:
 *         description: Validation error / insufficient wallet balance
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 *   get:
 *     summary: List my withdrawals
 *     tags: [Rider - Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: PENDING
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Withdrawals fetched
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */


/**
 * @swagger
 * /api/admin/withdrawals:
 *   get:
 *     summary: List withdrawals (admin)
 *     tags: [Admin - Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: PENDING
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Withdrawals fetched
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/admin/withdrawals/{withdrawalId}/review:
 *   post:
 *     summary: Review a withdrawal (approve/reject/mark paid)
 *     tags: [Admin - Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: withdrawalId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT, MARK_PAID]
 *               rejectionReason:
 *                 type: string
 *                 example: "Account details mismatch"
 *               paymentRef:
 *                 type: string
 *                 example: "TRX-2026-000123"
 *     responses:
 *       200:
 *         description: Withdrawal updated
 *       400:
 *         description: Validation error / insufficient wallet
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Withdrawal not found
 *       409:
 *         description: Invalid state transition / already paid
 */