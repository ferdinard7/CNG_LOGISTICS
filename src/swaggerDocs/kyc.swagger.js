/**
 * @swagger
 * tags:
 *   name: KYC
 *   description: Know Your Customer (KYC) operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     KycProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "uuid"
 *         userId:
 *           type: string
 *           example: "uuid"
 *         status:
 *           type: string
 *           example: PENDING
 *         premblyStatus:
 *           type: string
 *           example: VERIFIED
 *         premblyReference:
 *           type: string
 *           example: "PREMBLY_REF_123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     RiderKycRequest:
 *       type: object
 *       required:
 *         - nin
 *         - motorcyclePlate
 *       properties:
 *         nin:
 *           type: string
 *           example: "12345678901"
 *         motorcyclePlate:
 *           type: string
 *           example: "ABC-123XY"
 *
 *     VehicleDriverKycRequest:
 *       type: object
 *       required:
 *         - driversLicenseNumber
 *         - vehiclePlate
 *       properties:
 *         driversLicenseNumber:
 *           type: string
 *           example: "DL-90877654"
 *         vehiclePlate:
 *           type: string
 *           example: "KJA-456TR"
 */

/**
 * @swagger
 * /api/kyc/me:
 *   get:
 *     summary: Get my KYC profile
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC fetched successfully
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
 *                   example: KYC fetched
 *                 data:
 *                   $ref: '#/components/schemas/KycProfile'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/kyc/rider/submit:
 *   post:
 *     summary: Submit Rider KYC
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RiderKycRequest'
 *     responses:
 *       200:
 *         description: Rider KYC submitted successfully
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
 *                   example: KYC submitted successfully
 *                 data:
 *                   $ref: '#/components/schemas/KycProfile'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Only riders can submit this KYC
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/kyc/vehicle-driver/submit:
 *   post:
 *     summary: Submit Vehicle Driver KYC (Truck/Waste drivers)
 *     tags: [KYC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehicleDriverKycRequest'
 *     responses:
 *       200:
 *         description: Vehicle driver KYC submitted successfully
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
 *                   example: KYC submitted successfully
 *                 data:
 *                   $ref: '#/components/schemas/KycProfile'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Only truck or waste drivers can submit this KYC
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */