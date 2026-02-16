/**
 * @swagger
 * /api/customer/dashboard/overview:
 *   get:
 *     summary: Customer dashboard overview
 *     description: |
 *       Returns summary for all customer dashboard tabs: total orders, active, completed,
 *       total spent, wallet balance (recycling earnings), breakdown by type (dispatch, park n go, waste),
 *       and recent orders.
 *     tags: [Customer - Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer overview fetched successfully
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
 *                   example: Customer overview fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       example: 12
 *                     activeOrders:
 *                       type: integer
 *                       example: 2
 *                     completedOrders:
 *                       type: integer
 *                       example: 8
 *                     totalSpent:
 *                       type: number
 *                       example: 45000
 *                     walletBalance:
 *                       type: number
 *                       example: 2500
 *                       description: Recycling earnings from waste pickup
 *                     paidOrdersCount:
 *                       type: integer
 *                       example: 10
 *                     byType:
 *                       type: object
 *                       properties:
 *                         dispatch:
 *                           type: integer
 *                           example: 5
 *                         parkNGo:
 *                           type: integer
 *                           example: 3
 *                         waste:
 *                           type: integer
 *                           example: 4
 *                     recentOrders:
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
 *                           amount:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           paymentStatus:
 *                             type: string
 *                             example: paid
 *                           pickupAddress:
 *                             type: string
 *                             nullable: true
 *                           deliveryAddress:
 *                             type: string
 *                             nullable: true
 *                           driver:
 *                             type: string
 *                             nullable: true
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
