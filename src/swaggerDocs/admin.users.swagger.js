/**
 * @swagger
 * tags:
 *   name: Admin Users
 *   description: Admin management of platform users
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "user_uuid"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           example: "+2348012345678"
 *         role:
 *           type: string
 *           example: RIDER
 *         kycStatus:
 *           type: string
 *           example: APPROVED
 *         isActive:
 *           type: boolean
 *           example: true
 *         isOnline:
 *           type: boolean
 *           example: false
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AdminUsersStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 120
 *         active:
 *           type: integer
 *           example: 90
 *         inactive:
 *           type: integer
 *           example: 30
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get user statistics grouped by role
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats fetched
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
 *                   example: User stats fetched
 *                 data:
 *                   type: object
 *                   example:
 *                     CONSUMER: { total: 50, active: 40, inactive: 10 }
 *                     RIDER: { total: 30, active: 20, inactive: 10 }
 *                     TRUCK_DRIVER: { total: 20, active: 15, inactive: 5 }
 *                     WASTE_DRIVER: { total: 20, active: 15, inactive: 5 }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/admin:
 *   get:
 *     summary: List users (Admin)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CONSUMER, RIDER, TRUCK_DRIVER, WASTE_DRIVER, ADMIN]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           example: true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "john"
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
 *         description: Users fetched
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
 *                   example: Users fetched
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AdminUser'
 *                     total:
 *                       type: integer
 *                       example: 120
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
 * /api/admin/{userId}/activate:
 *   patch:
 *     summary: Activate a user account
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User activated
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
 *                   example: User activated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/admin/{userId}/deactivate:
 *   patch:
 *     summary: Deactivate a user account
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deactivated
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
 *                   example: User deactivated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *                     isOnline:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */