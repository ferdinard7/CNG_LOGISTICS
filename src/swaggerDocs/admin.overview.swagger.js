/**
 * @swagger
 * /api/admin/summary:
 *   get:
 *     summary: Get admin overview summary
 *     description: Returns dashboard metrics including users, orders, revenue, and role breakdown.
 *     tags: [Admin - Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin overview summary fetched successfully
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
 *                     totalUsers:
 *                       type: integer
 *                       example: 1200
 *                     activeOrders:
 *                       type: integer
 *                       example: 45
 *                     todayRevenue:
 *                       type: number
 *                       example: 56000
 *                     activeRidersDrivers:
 *                       type: integer
 *                       example: 18
 *                     userBreakdown:
 *                       type: array
 *                       description: User count grouped by role
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             example: RIDER
 *                           _count:
 *                             type: object
 *                             properties:
 *                               _all:
 *                                 type: integer
 *                                 example: 120
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/admin/recent-orders:
 *   get:
 *     summary: Get recent orders
 *     description: Fetches the most recent orders for admin dashboard view.
 *     tags: [Admin - Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           example: 10
 *         description: Number of recent orders to return
 *     responses:
 *       200:
 *         description: Recent orders fetched successfully
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       orderCode:
 *                         type: string
 *                       serviceType:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                         example: NGN
 *                       customer:
 *                         type: string
 *                         nullable: true
 *                       driver:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Internal server error
 */