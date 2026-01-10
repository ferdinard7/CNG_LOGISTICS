/**
 * @swagger
 * /api/rider/overview:
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
 * /api/rider/summary:
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
 * @swagger
 * /api/rider/status:
 *   patch:
 *     summary: Set rider online or offline
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
 *               - isOnline
 *             properties:
 *               isOnline:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *                   example: Status updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     isOnline:
 *                       type: boolean
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: KYC not approved
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/available:
 *   get:
 *     summary: Get available delivery orders
 *     description: Returns unassigned pending orders available for riders
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           example: DISPATCH
 *         description: Filter by service type
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           orderCode:
 *                             type: string
 *                           serviceType:
 *                             type: string
 *                           status:
 *                             type: string
 *                             example: AVAILABLE
 *                           pickupAddress:
 *                             type: string
 *                           deliveryAddress:
 *                             type: string
 *                           customerName:
 *                             type: string
 *                           distanceKm:
 *                             type: number
 *                           etaMinutes:
 *                             type: number
 *                           amount:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: KYC not approved
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details fetched
 *       403:
 *         description: Access denied
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/{orderId}/accept:
 *   post:
 *     summary: Accept an available order
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order accepted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Rider not eligible or KYC not approved
 *       409:
 *         description: Order no longer available
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/active:
 *   get:
 *     summary: Get active rider deliveries
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active deliveries fetched
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: KYC not approved
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/{orderId}/start:
 *   patch:
 *     summary: Start an assigned order
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order started
 *       400:
 *         description: Order cannot be started
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/rider/{orderId}/complete:
 *   patch:
 *     summary: Complete an order
 *     tags: [Rider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order completed successfully
 *       400:
 *         description: Order cannot be completed
 *       404:
 *         description: Order not found
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