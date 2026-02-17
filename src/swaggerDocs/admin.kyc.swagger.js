/**
 * @swagger
 * tags:
 *   name: Admin KYC
 *   description: Admin management of KYC requests
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminKycListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "kyc_uuid"
 *         userId:
 *           type: string
 *           example: "user_uuid"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         type:
 *           type: string
 *           example: RIDER
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           example: PENDING
 *         premblyStatus:
 *           type: string
 *           description: Prembly verification status (VERIFIED, FAILED, NOT_STARTED)
 *           example: VERIFIED
 *
 *     RejectKycRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           example: "Document mismatch"
 */

/**
 * @swagger
 * /api/admin/kyc:
 *   get:
 *     summary: List KYC requests (Admin)
 *     tags: [Admin KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: PENDING
 *         description: Filter by KYC status
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           example: RIDER
 *         description: Filter by user role
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
 *         description: KYC requests fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: KYC requests fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AdminKycListItem'
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/admin/kyc/{kycId}:
 *   get:
 *     summary: Get a single KYC request
 *     tags: [Admin KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kycId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KYC request fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: KYC request fetched
 *                 data:
 *                   type: object
 *       404:
 *         description: KYC request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/admin/kyc/{kycId}/prembly-verification:
 *   get:
 *     summary: Get Prembly verification status for a KYC request
 *     description: Returns Prembly verification status and safe summary (no PII) for admin KYC review.
 *     tags: [Admin KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kycId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prembly verification status fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Prembly verification status fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     premblyStatus:
 *                       type: string
 *                       example: VERIFIED
 *                     summary:
 *                       type: object
 *                       properties:
 *                         provider:
 *                           type: string
 *                           example: nin
 *                         verified:
 *                           type: boolean
 *                         status:
 *                           type: string
 *                         message:
 *                           type: string
 *       404:
 *         description: KYC request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/admin/kyc/{kycId}/approve:
 *   patch:
 *     summary: Approve a KYC request
 *     tags: [Admin KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kycId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KYC approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: KYC approved successfully
 *       404:
 *         description: KYC request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/admin/kyc/{kycId}/reject:
 *   patch:
 *     summary: Reject a KYC request
 *     tags: [Admin KYC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kycId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RejectKycRequest'
 *     responses:
 *       200:
 *         description: KYC rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: KYC rejected successfully
 *       400:
 *         description: Rejection reason is required
 *       404:
 *         description: KYC request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */