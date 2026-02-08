/**
 * @swagger
 * /api/rider/dashboard/overview:
 *   get:
 *     summary: Rider dashboard overview
 *     description: |
 *       Returns today's earnings, active deliveries, completed deliveries,
 *       current delivery details, and recent completed deliveries for the rider.
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Rider overview fetched successfully
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
 *                   example: Rider overview fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     todayEarnings:
 *                       type: number
 *                       example: 7500
 *                     activeDeliveries:
 *                       type: integer
 *                       example: 2
 *                     completedToday:
 *                       type: integer
 *                       example: 5
 *                     rating:
 *                       type: number
 *                       example: 4.9
 *                     currentDelivery:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         orderCode:
 *                           type: string
 *                         status:
 *                           type: string
 *                           example: IN_PROGRESS
 *                         pickupAddress:
 *                           type: string
 *                           nullable: true
 *                         deliveryAddress:
 *                           type: string
 *                           nullable: true
 *                         customerName:
 *                           type: string
 *                           nullable: true
 *                         customerPhone:
 *                           type: string
 *                           nullable: true
 *                         amount:
 *                           type: number
 *                         currency:
 *                           type: string
 *                           example: NGN
 *                     todaysCompleted:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           orderCode:
 *                             type: string
 *                           customerName:
 *                             type: string
 *                             nullable: true
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                           amount:
 *                             type: number
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/earnings/summary:
 *   get:
 *     summary: Rider earnings summary
 *     description: |
 *       Returns earnings summary for a rider within a date range.
 *       Defaults to the current week (Monday → today) if no dates are provided.
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD). Defaults to start of current week.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD). Defaults to today.
 *     responses:
 *       200:
 *         description: Earnings summary fetched successfully
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
 *                   example: Earnings summary fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: string
 *                       format: date-time
 *                     to:
 *                       type: string
 *                       format: date-time
 *                     weekTotal:
 *                       type: number
 *                       example: 18500
 *                     tipsEarned:
 *                       type: number
 *                       example: 2500
 *                     totalDeliveries:
 *                       type: integer
 *                       example: 14
 *                     averagePerDelivery:
 *                       type: number
 *                       example: 1321.43
 *                     hoursWorked:
 *                       type: number
 *                       example: 0
 *                     hourlyRate:
 *                       type: number
 *                       example: 0
 *                     dailyBreakdown:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                       example:
 *                         "2026-01-06": 3500
 *                         "2026-01-07": 4200
 *                         "2026-01-08": 5600
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: KYC not approved
 *       500:
 *         description: Internal server error
 */


/**
 * RIDER ORDERS SWAGGER
 * Mounted at: /api/rider
 * Orders mounted at: /api/rider/orders
 *
 * Source:
 * - rider/orders.route.js
 * - rider/orders.controller.js
 */

/**
 * @swagger
 * tags:
 *   - name: Rider - Orders
 *     description: Rider order endpoints (Dispatch / Ride Booking) + wallet
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
 *         data:
 *           nullable: true
 *
 *     RiderStatusUpdateRequest:
 *       type: object
 *       required: [isOnline]
 *       properties:
 *         isOnline:
 *           type: boolean
 *           example: true
 *
 *     RiderState:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         isOnline:
 *           type: boolean
 *           example: true
 *         availabilityStatus:
 *           type: string
 *           example: "AVAILABLE"
 *         maxActiveOrders:
 *           type: integer
 *           example: 1
 *         activeOrdersCount:
 *           type: integer
 *           example: 0
 *
 *     RiderAvailableOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderCode:
 *           type: string
 *           example: "DP-2026-0009"
 *         serviceType:
 *           type: string
 *           example: "DISPATCH"
 *         status:
 *           type: string
 *           example: "AVAILABLE"
 *         pickupAddress:
 *           type: string
 *           nullable: true
 *         deliveryAddress:
 *           type: string
 *           nullable: true
 *         customerName:
 *           type: string
 *           nullable: true
 *           example: "Jane Doe"
 *         distanceKm:
 *           type: number
 *           nullable: true
 *           example: 7.2
 *         etaMinutes:
 *           type: integer
 *           nullable: true
 *           example: 17
 *         amount:
 *           type: number
 *           example: 3450
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
 *           example: 517.5
 *         driverEarning:
 *           type: number
 *           example: 2932.5
 *         youWillEarn:
 *           type: number
 *           example: 2932.5
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     PaginatedAvailableOrders:
 *       type: object
 *       properties:
 *         rider:
 *           type: object
 *           properties:
 *             isOnline:
 *               type: boolean
 *             availabilityStatus:
 *               type: string
 *             activeOrdersCount:
 *               type: integer
 *             maxActiveOrders:
 *               type: integer
 *             canAcceptMore:
 *               type: boolean
 *             allowedServiceTypes:
 *               type: array
 *               items:
 *                 type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RiderAvailableOrderItem'
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
 *     ActiveOrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderCode:
 *           type: string
 *           example: "DP-2026-0009"
 *         status:
 *           type: string
 *           example: "ASSIGNED"
 *         pickupAddress:
 *           type: string
 *           nullable: true
 *         deliveryAddress:
 *           type: string
 *           nullable: true
 *         customerName:
 *           type: string
 *           nullable: true
 *         customerPhone:
 *           type: string
 *           nullable: true
 *         amount:
 *           type: number
 *           example: 3450
 *         currency:
 *           type: string
 *           example: "NGN"
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderCode:
 *           type: string
 *         serviceType:
 *           type: string
 *         status:
 *           type: string
 *         amount:
 *           type: number
 *         tipAmount:
 *           type: number
 *         currency:
 *           type: string
 *         pickupAddress:
 *           type: string
 *           nullable: true
 *         deliveryAddress:
 *           type: string
 *           nullable: true
 *         distanceKm:
 *           type: number
 *           nullable: true
 *         etaMinutes:
 *           type: integer
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
 *             email:
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
 *         tipAmount:
 *           type: number
 *         feePercent:
 *           type: number
 *         platformFee:
 *           type: number
 *         driverEarning:
 *           type: number
 *         creditedAmount:
 *           type: number
 *         credited:
 *           type: boolean
 *
 *     DriverStateAfterComplete:
 *       type: object
 *       properties:
 *         availabilityStatus:
 *           type: string
 *           example: "AVAILABLE"
 *         activeOrdersCount:
 *           type: integer
 *           example: 0
 *         maxActiveOrders:
 *           type: integer
 *           example: 1
 *         walletBalanceAfter:
 *           type: number
 *           example: 12000
 *
 *     CompleteOrderResponseData:
 *       allOf:
 *         - $ref: '#/components/schemas/Order'
 *         - type: object
 *           properties:
 *             earnings:
 *               $ref: '#/components/schemas/EarningsBreakdown'
 *             driverState:
 *               $ref: '#/components/schemas/DriverStateAfterComplete'
 *
 *     WalletTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *           example: "CREDIT"
 *         amount:
 *           type: number
 *           example: 2000
 *         balanceBefore:
 *           type: number
 *           example: 10000
 *         balanceAfter:
 *           type: number
 *           example: 12000
 *         orderId:
 *           type: string
 *           nullable: true
 *         note:
 *           type: string
 *           example: "Earning from order DP-2026-0009"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     WalletResponseData:
 *       type: object
 *       properties:
 *         balance:
 *           type: number
 *           example: 12000
 *         transactions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WalletTransaction'
 */

/**
 * @swagger
 * /api/rider/orders/status:
 *   patch:
 *     summary: Set rider online/offline status
 *     description: Updates isOnline and availabilityStatus (requires KYC approved).
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RiderStatusUpdateRequest'
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RiderState'
 *       400:
 *         description: Bad request (isOnline must be boolean)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (KYC not approved / role not allowed)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/active:
 *   get:
 *     summary: Get active orders assigned to rider
 *     description: Returns orders with status ASSIGNED or IN_PROGRESS (requires KYC approved).
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active deliveries fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActiveOrderItem'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (KYC not approved)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/available:
 *   get:
 *     summary: List available orders for rider role
 *     description: Lists PENDING unassigned orders for allowed service types by role (RIDER => DISPATCH/RIDE_BOOKING). Requires KYC approved.
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           example: "DISPATCH"
 *         description: "Optional. If provided, must be allowed for your role or request fails with 400."
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
 *         description: Available orders fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedAvailableOrders'
 *       400:
 *         description: Invalid serviceType for role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (KYC not approved)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/{orderId}:
 *   get:
 *     summary: Get order details (rider)
 *     description: Rider can view an order if it's assigned to them OR still available (PENDING + unassigned). Requires KYC approved.
 *     tags: [Rider]
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
 *         description: Order details fetched
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
 *         description: Forbidden (no access to order)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/{orderId}/accept:
 *   post:
 *     summary: Accept an order (rider)
 *     description: Claims an available order (must be PENDING + unassigned) and assigns it to the rider. Requires KYC approved.
 *     tags: [Rider]
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
 *         description: Unauthorized / inactive
 *       403:
 *         description: Forbidden (offline / wrong role / KYC not approved / wrong service type)
 *       409:
 *         description: Conflict (capacity full or order no longer available)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/{orderId}/start:
 *   patch:
 *     summary: Start an assigned order (rider)
 *     description: Sets order status to IN_PROGRESS (only if order is ASSIGNED to the rider).
 *     tags: [Rider]
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
 *       400:
 *         description: Order cannot be started
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/{orderId}/complete:
 *   patch:
 *     summary: Complete an order (rider)
 *     description: Marks order as COMPLETED and credits wallet (prevents double credit). Requires KYC approved.
 *     tags: [Rider]
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
 *       400:
 *         description: Order cannot be completed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/wallet:
 *   get:
 *     summary: Get rider wallet balance + last 20 transactions
 *     description: Returns wallet balance and recent wallet transactions (requires KYC approved).
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WalletResponseData'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (KYC not approved)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/profile:
 *   get:
 *     summary: Get rider profile
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Rider profile fetched successfully
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
 *                   example: Profile fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: RIDER
 *                     kycStatus:
 *                       type: string
 *                       example: APPROVED
 *                     isOnline:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     kycProfile:
 *                       type: object
 *                       nullable: true
 *                     stats:
 *                       type: object
 *                       properties:
 *                         rating:
 *                           type: number
 *                           example: 4.9
 *                         totalDeliveries:
 *                           type: integer
 *                           example: 120
 *                         completionRate:
 *                           type: number
 *                           example: 96.5
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/profile:
 *   patch:
 *     summary: Update rider profile
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Profile updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/profile/location:
 *   patch:
 *     summary: Update rider live location
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *                 example: 6.5244
 *               lng:
 *                 type: number
 *                 example: 3.3792
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Location updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     lastLat:
 *                       type: number
 *                     lastLng:
 *                       type: number
 *                     lastLocationUpdatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: lat and lng must be numbers
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: KYC not approved
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/available:
 *   get:
 *     summary: Get available orders (rider)
 *     description: Returns a paginated list of available orders (PENDING and unassigned). Also returns rider capacity state and earning preview (85/15 + tips).
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [DISPATCH, PARK_N_GO, WASTE_PICKUP, RIDE_BOOKING]
 *         description: Filter by service type.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Available orders fetched
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
 *                   example: Available orders fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     rider:
 *                       type: object
 *                       properties:
 *                         isOnline:
 *                           type: boolean
 *                           example: true
 *                         availabilityStatus:
 *                           type: string
 *                           enum: [OFFLINE, AVAILABLE, BUSY]
 *                           example: AVAILABLE
 *                         activeOrdersCount:
 *                           type: integer
 *                           example: 0
 *                         maxActiveOrders:
 *                           type: integer
 *                           example: 1
 *                         canAcceptMore:
 *                           type: boolean
 *                           example: true
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           orderCode:
 *                             type: string
 *                             example: DP-2026-1234
 *                           serviceType:
 *                             type: string
 *                             enum: [DISPATCH, PARK_N_GO, WASTE_PICKUP, RIDE_BOOKING]
 *                           status:
 *                             type: string
 *                             example: AVAILABLE
 *                           pickupAddress:
 *                             type: string
 *                           deliveryAddress:
 *                             type: string
 *                           customerName:
 *                             type: string
 *                             nullable: true
 *                             example: John Doe
 *                           distanceKm:
 *                             type: number
 *                             nullable: true
 *                             example: 12.4
 *                           etaMinutes:
 *                             type: integer
 *                             nullable: true
 *                             example: 30
 *                           amount:
 *                             type: number
 *                             example: 3500
 *                           tipAmount:
 *                             type: number
 *                             example: 200
 *                           currency:
 *                             type: string
 *                             example: NGN
 *                           feePercent:
 *                             type: number
 *                             example: 15
 *                           platformFee:
 *                             type: number
 *                             example: 525
 *                           driverEarning:
 *                             type: number
 *                             example: 2975
 *                           youWillEarn:
 *                             type: number
 *                             example: 3175
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (KYC required)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/orders/{orderId}/complete:
 *   patch:
 *     summary: Complete an order (rider)
 *     description: Completes an assigned/in-progress order. Credits rider wallet once (idempotent by orderId). Stores platformFee and driverEarning. Updates rider availabilityStatus based on remaining active orders and maxActiveOrders.
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order completed
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
 *                   example: Order completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     orderCode:
 *                       type: string
 *                       example: DP-2026-1234
 *                     serviceType:
 *                       type: string
 *                       enum: [DISPATCH, PARK_N_GO, WASTE_PICKUP, RIDE_BOOKING]
 *                     status:
 *                       type: string
 *                       enum: [PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED]
 *                       example: COMPLETED
 *                     amount:
 *                       type: number
 *                       example: 3500
 *                     tipAmount:
 *                       type: number
 *                       example: 200
 *                     currency:
 *                       type: string
 *                       example: NGN
 *                     platformFee:
 *                       type: number
 *                       example: 525
 *                     driverEarning:
 *                       type: number
 *                       example: 2975
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     earnings:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           example: 3500
 *                         tipAmount:
 *                           type: number
 *                           example: 200
 *                         feePercent:
 *                           type: number
 *                           example: 15
 *                         platformFee:
 *                           type: number
 *                           example: 525
 *                         driverEarning:
 *                           type: number
 *                           example: 2975
 *                         creditedAmount:
 *                           type: number
 *                           example: 3175
 *                     riderState:
 *                       type: object
 *                       properties:
 *                         availabilityStatus:
 *                           type: string
 *                           enum: [OFFLINE, AVAILABLE, BUSY]
 *                           example: AVAILABLE
 *                         activeOrdersCount:
 *                           type: integer
 *                           example: 0
 *                         maxActiveOrders:
 *                           type: integer
 *                           example: 1
 *       400:
 *         description: Order cannot be completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (KYC required / not your order)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */