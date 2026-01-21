/**
 * @swagger
 * components:
 *   schemas:
 *     DispatchLocation:
 *       type: object
 *       required: [address, lat, lng, contactName, contactPhone]
 *       properties:
 *         address:
 *           type: string
 *           example: "12 Allen Avenue, Ikeja, Lagos"
 *         lat:
 *           type: number
 *           example: 6.6059
 *         lng:
 *           type: number
 *           example: 3.3491
 *         contactName:
 *           type: string
 *           example: "John Doe"
 *         contactPhone:
 *           type: string
 *           example: "+2348012345678"
 *
 *     DispatchPackageInfo:
 *       type: object
 *       required: [itemName]
 *       properties:
 *         itemName:
 *           type: string
 *           example: "Documents"
 *         quantity:
 *           type: integer
 *           example: 1
 *         weightKg:
 *           type: number
 *           example: 1.5
 *         isFragile:
 *           type: boolean
 *           example: false
 *
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderCode:
 *           type: string
 *           example: "DP-2026-1234"
 *         serviceType:
 *           type: string
 *           example: "DISPATCH"
 *         status:
 *           type: string
 *           example: "PENDING"
 *         amount:
 *           type: number
 *           example: 3450
 *         currency:
 *           type: string
 *           example: "NGN"
 *         tipAmount:
 *           type: number
 *           example: 0
 *         customerId:
 *           type: string
 *         driverId:
 *           type: string
 *           nullable: true
 *         pickupAddress:
 *           type: string
 *         deliveryAddress:
 *           type: string
 *         pickupLat:
 *           type: number
 *         pickupLng:
 *           type: number
 *         deliveryLat:
 *           type: number
 *         deliveryLng:
 *           type: number
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         metadata:
 *           type: object
 *           nullable: true
 */

/**
 * @swagger
 * /api/customer/orders/dispatch:
 *   post:
 *     summary: Create a dispatch order
 *     description: Creates a DISPATCH order, computes distance/ETA and price on the server, and stores structured payload in metadata.
 *     tags: [Customer - Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickup, dropoff, packageInfo, packageSize, urgency]
 *             properties:
 *               pickup:
 *                 $ref: '#/components/schemas/DispatchLocation'
 *               dropoff:
 *                 $ref: '#/components/schemas/DispatchLocation'
 *               packageInfo:
 *                 $ref: '#/components/schemas/DispatchPackageInfo'
 *               packageSize:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE]
 *                 example: SMALL
 *               urgency:
 *                 type: string
 *                 enum: [STANDARD, EXPRESS, SAME_DAY]
 *                 example: STANDARD
 *               note:
 *                 type: string
 *                 example: "Handle with care"
 *               tipAmount:
 *                 type: number
 *                 example: 0
 *     responses:
 *       201:
 *         description: Dispatch order created successfully
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
 *                   example: "Dispatch order created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
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
 *             required: [pickup, dropoff, packageInfo, packageSize, urgency]
 *             properties:
 *               pickup:
 *                 $ref: '#/components/schemas/DispatchLocation'
 *               dropoff:
 *                 $ref: '#/components/schemas/DispatchLocation'
 *               packageInfo:
 *                 $ref: '#/components/schemas/DispatchPackageInfo'
 *               packageSize:
 *                 type: string
 *                 enum: [SMALL, MEDIUM, LARGE]
 *                 example: SMALL
 *               urgency:
 *                 type: string
 *                 enum: [STANDARD, EXPRESS, SAME_DAY]
 *                 example: STANDARD
 *     responses:
 *       200:
 *         description: Dispatch estimate generated
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
 *                   example: "Dispatch estimate generated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     serviceType:
 *                       type: string
 *                       example: "DISPATCH"
 *                     currency:
 *                       type: string
 *                       example: "NGN"
 *                     amount:
 *                       type: number
 *                       example: 3450
 *                     distanceKm:
 *                       type: number
 *                       example: 7.2
 *                     etaMinutes:
 *                       type: integer
 *                       example: 17
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         packageSize:
 *                           type: string
 *                           example: "SMALL"
 *                         urgency:
 *                           type: string
 *                           example: "STANDARD"
 *                         packageInfo:
 *                           $ref: '#/components/schemas/DispatchPackageInfo'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/customer/orders/park-n-go:
 *   post:
 *     summary: Create Park N Go order
 *     description: Allows a customer to create a PARK_N_GO order.
 *     tags: [Customer - Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentAddress, newAddress, movingDate, houseSize, serviceType, contactPhone, estimatedFee]
 *             properties:
 *               currentAddress:
 *                 type: string
 *                 example: "12 Allen Ave, Ikeja"
 *               newAddress:
 *                 type: string
 *                 example: "55 Admiralty Way, Lekki"
 *               movingDate:
 *                 type: string
 *                 format: date-time
 *               houseSize:
 *                 type: string
 *                 example: "2-BEDROOM"
 *               serviceType:
 *                 type: string
 *                 example: "MOVING"
 *               estimatedItems:
 *                 type: string
 *                 example: "3 boxes, 1 TV, 1 table"
 *               contactPhone:
 *                 type: string
 *                 example: "+2348012345678"
 *               notes:
 *                 type: string
 *                 example: "Fragile items included"
 *               estimatedFee:
 *                 type: number
 *                 example: 25000
 *     responses:
 *       201:
 *         description: Park N Go order created
 *       401:
 *         description: Unauthorized
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
 *             required: [pickupAddress, wasteTypes, quantity, preferredPickupTime, estimatedFee]
 *             properties:
 *               pickupAddress:
 *                 type: string
 *                 example: "12 Allen Ave, Ikeja"
 *               wasteTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["PLASTIC", "PAPER"]
 *               estimatedWeight:
 *                 type: number
 *                 example: 12.5
 *               quantity:
 *                 type: number
 *                 example: 3
 *               condition:
 *                 type: string
 *                 example: "BAGGED"
 *               preferredPickupTime:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *                 example: "Call on arrival"
 *               estimatedFee:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       201:
 *         description: Waste pickup request created
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
 *     description: Returns order details for customer, assigned driver, or admin (based on access control).
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
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/customer/orders:
 *   get:
 *     summary: List customer orders
 *     description: Returns a paginated list of orders for the authenticated customer (admin may see all if enabled).
 *     tags: [Customer - Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: PENDING
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           example: DISPATCH
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
 *         description: Orders fetched
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/customer/orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an order
 *     description: Allows a customer to cancel their order only if the status is still PENDING.
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
 *         description: Order cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Order cannot be cancelled (not found or not pending)
 *       500:
 *         description: Internal server error
 */