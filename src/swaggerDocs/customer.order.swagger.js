/**
 * @swagger
 * /api/customer/orders/dispatch:
 *   post:
 *     summary: Create a dispatch order
 *     description: Allows a customer to create a dispatch delivery order.
 *     tags: [Customer - Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupAddress
 *               - deliveryAddress
 *               - pickupLat
 *               - pickupLng
 *               - deliveryLat
 *               - deliveryLng
 *               - packageSize
 *               - urgency
 *             properties:
 *               pickupAddress:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               pickupLat:
 *                 type: number
 *               pickupLng:
 *                 type: number
 *               deliveryLat:
 *                 type: number
 *               deliveryLng:
 *                 type: number
 *               itemDetails:
 *                 type: string
 *               packageSize:
 *                 type: string
 *                 example: SMALL
 *               urgency:
 *                 type: string
 *                 example: NORMAL
 *               deliveryTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Dispatch order created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Customers only)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/customer/orders/dispatch/estimate:
 *   post:
 *     summary: Estimate dispatch delivery cost
 *     description: Returns estimated price, distance and ETA for a dispatch order.
 *     tags: [Customer - Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupLat
 *               - pickupLng
 *               - deliveryLat
 *               - deliveryLng
 *               - packageSize
 *               - urgency
 *             properties:
 *               pickupAddress:
 *                 type: string
 *               deliveryAddress:
 *                 type: string
 *               pickupLat:
 *                 type: number
 *               pickupLng:
 *                 type: number
 *               deliveryLat:
 *                 type: number
 *               deliveryLng:
 *                 type: number
 *               itemDetails:
 *                 type: string
 *               packageSize:
 *                 type: string
 *               urgency:
 *                 type: string
 *               deliveryTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Dispatch estimate generated
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/customer/orders/waste-pickup:
 *   post:
 *     summary: Create waste pickup order
 *     description: Allows a customer to request waste pickup service.
 *     tags: [Customer - Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pickupAddress:
 *                 type: string
 *               wasteTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               estimatedWeight:
 *                 type: number
 *               quantity:
 *                 type: number
 *               condition:
 *                 type: string
 *               preferredPickupTime:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               estimatedFee:
 *                 type: number
 *     responses:
 *       201:
 *         description: Waste pickup order created
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/customer/orders/{orderId}:
 *   get:
 *     summary: Get order details
 *     description: Returns order details for customer, assigned driver, or admin.
 *     tags: [Customer - Orders]
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
 *         description: Order fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */