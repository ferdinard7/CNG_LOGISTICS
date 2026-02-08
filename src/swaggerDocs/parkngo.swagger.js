/**
 * DRIVER (TRUCK) ORDERS SWAGGER
 * Mounted at: /api/driver
 * Orders mounted at: /api/driver/orders
 *
 * Source:
 * - orders.route.js
 * - orders.controller.js
 */

/**
 * @swagger
 * tags:
 *   - name: Driver - Orders
 *     description: Truck driver order endpoints (Park N Go)
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     ApiSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *
 *     ApiErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation error"
 *         data:
 *           nullable: true
 *
 *     DriverState:
 *       type: object
 *       properties:
 *         isOnline:
 *           type: boolean
 *           example: true
 *         availabilityStatus:
 *           type: string
 *           example: "AVAILABLE"
 *         activeOrdersCount:
 *           type: integer
 *           example: 0
 *         maxActiveOrders:
 *           type: integer
 *           example: 1
 *         canAcceptMore:
 *           type: boolean
 *           example: true
 *
 *     DriverAvailableOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderCode:
 *           type: string
 *           example: "PNG-2026-0001"
 *         serviceType:
 *           type: string
 *           example: "PARK_N_GO"
 *         status:
 *           type: string
 *           example: "AVAILABLE"
 *         pickupAddress:
 *           type: string
 *           nullable: true
 *         deliveryAddress:
 *           type: string
 *           nullable: true
 *         amount:
 *           type: number
 *           example: 25000
 *         tipAmount:
 *           type: number
 *           example: 0
 *         currency:
 *           type: string
 *           example: "NGN"
 *         feePercent:
 *           type: number
 *           example: 15
 *         platformFee:
 *           type: number
 *           example: 3750
 *         driverEarning:
 *           type: number
 *           example: 21250
 *         youWillEarn:
 *           type: number
 *           example: 21250
 *         createdAt:
 *           type: string
 *           format: date-time
 *         customerName:
 *           type: string
 *           nullable: true
 *           example: "Jane Doe"
 *         customerPhone:
 *           type: string
 *           nullable: true
 *           example: "+2348012345678"
 *         meta:
 *           type: object
 *           nullable: true
 *           description: "Order metadata containing Park N Go payload"
 *
 *     PaginatedAvailableOrders:
 *       type: object
 *       properties:
 *         driver:
 *           $ref: '#/components/schemas/DriverState'
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DriverAvailableOrderItem'
 *         total:
 *           type: integer
 *           example: 25
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderCode:
 *           type: string
 *           example: "PNG-2026-0001"
 *         serviceType:
 *           type: string
 *           example: "PARK_N_GO"
 *         status:
 *           type: string
 *           example: "ASSIGNED"
 *         amount:
 *           type: number
 *           example: 25000
 *         tipAmount:
 *           type: number
 *           example: 0
 *         currency:
 *           type: string
 *           example: "NGN"
 *         pickupAddress:
 *           type: string
 *           nullable: true
 *         deliveryAddress:
 *           type: string
 *           nullable: true
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         startedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         metadata:
 *           type: object
 *           nullable: true
 *         customer:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             phone:
 *               type: string
 *         driver:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             phone:
 *               type: string
 *             role:
 *               type: string
 *
 *     EarningsBreakdown:
 *       type: object
 *       properties:
 *         amount:
 *           type: number
 *           example: 25000
 *         tipAmount:
 *           type: number
 *           example: 0
 *         feePercent:
 *           type: number
 *           example: 15
 *         platformFee:
 *           type: number
 *           example: 3750
 *         driverEarning:
 *           type: number
 *           example: 21250
 *         creditedAmount:
 *           type: number
 *           example: 21250
 *
 *     CompleteOrderResponseData:
 *       allOf:
 *         - $ref: '#/components/schemas/Order'
 *         - type: object
 *           properties:
 *             earnings:
 *               $ref: '#/components/schemas/EarningsBreakdown'
 *             driverState:
 *               type: object
 *               properties:
 *                 availabilityStatus:
 *                   type: string
 *                   example: "AVAILABLE"
 *                 activeOrdersCount:
 *                   type: integer
 *                   example: 0
 *                 maxActiveOrders:
 *                   type: integer
 *                   example: 1
 */

/**
 * @swagger
 * /api/driver/orders/available:
 *   get:
 *     summary: List available Park N Go orders (Truck driver)
 *     description: Returns available (PENDING, unassigned) PARK_N_GO orders. Also returns driver capacity info and earnings breakdown preview.
 *     tags: [Driver - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         description: "Must be PARK_N_GO (server rejects other values)"
 *         schema:
 *           type: string
 *           example: "PARK_N_GO"
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
 *         description: Available Park N Go orders fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedAvailableOrders'
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Forbidden (not TRUCK_DRIVER / KYC not approved / role checks)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/driver/orders/{orderId}/accept:
 *   post:
 *     summary: Accept a Park N Go order (Truck driver)
 *     description: Claims an available order (must be PENDING, unassigned, PARK_N_GO). Requires KYC approved.
 *     tags: [Driver - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ckxOrderId123"
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized (missing/invalid token or inactive account)
 *       403:
 *         description: Forbidden (not online / role/kyc checks)
 *       409:
 *         description: Conflict (capacity full or order no longer available)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/driver/orders/{orderId}/start:
 *   patch:
 *     summary: Start a Park N Go order (Truck driver)
 *     description: Marks order as IN_PROGRESS (only if currently ASSIGNED to this driver). Requires KYC approved.
 *     tags: [Driver - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ckxOrderId123"
 *     responses:
 *       200:
 *         description: Order started (or already started)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (role/kyc checks)
 *       404:
 *         description: Order not found (not assigned to driver / wrong serviceType)
 *       400:
 *         description: Order cannot be started
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/driver/orders/{orderId}/complete:
 *   patch:
 *     summary: Complete a Park N Go order (Truck driver)
 *     description: Marks order as COMPLETED and credits driver wallet (prevents double-credit). Requires KYC approved.
 *     tags: [Driver - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ckxOrderId123"
 *     responses:
 *       200:
 *         description: Order completed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CompleteOrderResponseData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (role/kyc checks)
 *       404:
 *         description: Order not found (not assigned to driver / wrong serviceType)
 *       400:
 *         description: Order cannot be completed
 *       500:
 *         description: Internal server error
 */