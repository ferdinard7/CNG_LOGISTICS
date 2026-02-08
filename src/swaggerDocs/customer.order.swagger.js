/**
 * CUSTOMER ORDERS SWAGGER
 * Mounted at: /api/customer/orders
 * Routes source: orders.route.js
 */

/**
 * @swagger
 * tags:
 *   - name: Customer - Orders
 *     description: Customer order endpoints (Dispatch, Park N Go, Waste Pickup)
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
 *     DispatchCreateRequest:
 *       type: object
 *       required: [pickup, dropoff, packageInfo, packageSize, urgency]
 *       properties:
 *         pickup:
 *           $ref: '#/components/schemas/DispatchLocation'
 *         dropoff:
 *           $ref: '#/components/schemas/DispatchLocation'
 *         packageInfo:
 *           $ref: '#/components/schemas/DispatchPackageInfo'
 *         packageSize:
 *           type: string
 *           enum: [SMALL, MEDIUM, LARGE]
 *           example: SMALL
 *         urgency:
 *           type: string
 *           enum: [STANDARD, EXPRESS, SAME_DAY]
 *           example: STANDARD
 *         note:
 *           type: string
 *           example: "Handle with care"
 *         tipAmount:
 *           type: number
 *           example: 0
 *         deliveryTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     DispatchEstimateRequest:
 *       type: object
 *       required: [pickup, dropoff, packageInfo, packageSize, urgency]
 *       properties:
 *         pickup:
 *           $ref: '#/components/schemas/DispatchLocation'
 *         dropoff:
 *           $ref: '#/components/schemas/DispatchLocation'
 *         packageInfo:
 *           $ref: '#/components/schemas/DispatchPackageInfo'
 *         packageSize:
 *           type: string
 *           enum: [SMALL, MEDIUM, LARGE]
 *           example: SMALL
 *         urgency:
 *           type: string
 *           enum: [STANDARD, EXPRESS, SAME_DAY]
 *           example: STANDARD
 *
 *     DispatchEstimateResponseData:
 *       type: object
 *       properties:
 *         serviceType:
 *           type: string
 *           example: "DISPATCH"
 *         currency:
 *           type: string
 *           example: "NGN"
 *         amount:
 *           type: number
 *           example: 3450
 *         distanceKm:
 *           type: number
 *           example: 7.2
 *         etaMinutes:
 *           type: integer
 *           example: 17
 *         breakdown:
 *           type: object
 *           properties:
 *             packageSize:
 *               type: string
 *               example: "SMALL"
 *             urgency:
 *               type: string
 *               example: "STANDARD"
 *             packageInfo:
 *               $ref: '#/components/schemas/DispatchPackageInfo'
 *
 *     ParkNgoCreateRequest:
 *       type: object
 *       required: [currentAddress, newAddress, movingDate, houseSize, serviceType, contactPhone, estimatedFee]
 *       properties:
 *         currentAddress:
 *           type: string
 *           example: "12 Allen Ave, Ikeja"
 *         newAddress:
 *           type: string
 *           example: "55 Admiralty Way, Lekki"
 *         movingDate:
 *           type: string
 *           format: date-time
 *           example: "2026-02-12T10:00:00.000Z"
 *         houseSize:
 *           type: string
 *           example: "2-BEDROOM"
 *         serviceType:
 *           type: string
 *           description: "Dropdown value for Park N Go service type"
 *           example: "FULL_SERVICE"
 *         estimatedItems:
 *           type: string
 *           example: "3 boxes, 1 TV, 1 table"
 *         contactPhone:
 *           type: string
 *           example: "+2348012345678"
 *         notes:
 *           type: string
 *           example: "Fragile items included"
 *         estimatedFee:
 *           type: number
 *           example: 25000
 *
 *     WastePickupCreateRequest:
 *       type: object
 *       required: [pickupAddress, wasteTypes, quantity, preferredPickupTime, estimatedFee]
 *       properties:
 *         pickupAddress:
 *           type: string
 *           example: "12 Allen Ave, Ikeja"
 *         wasteTypes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["PLASTIC", "PAPER"]
 *         estimatedWeight:
 *           type: number
 *           example: 12.5
 *         quantity:
 *           type: number
 *           example: 3
 *         condition:
 *           type: string
 *           example: "BAGGED"
 *         preferredPickupTime:
 *           type: string
 *           format: date-time
 *           example: "2026-02-12T10:00:00.000Z"
 *         notes:
 *           type: string
 *           example: "Call on arrival"
 *         estimatedFee:
 *           type: number
 *           example: 5000
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
 *           nullable: true
 *         deliveryAddress:
 *           type: string
 *           nullable: true
 *         pickupLat:
 *           type: number
 *           nullable: true
 *         pickupLng:
 *           type: number
 *           nullable: true
 *         deliveryLat:
 *           type: number
 *           nullable: true
 *         deliveryLng:
 *           type: number
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         metadata:
 *           type: object
 *           nullable: true
 *
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
 *     PaginatedOrders:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         total:
 *           type: integer
 *           example: 120
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 */

/**
 * @swagger
 * /api/customer/orders/dispatch:
 *   post:
 *     summary: Create a dispatch order
 *     description: Creates a DISPATCH order (computes distance/ETA and price server-side) and stores structured payload in metadata.
 *     tags: [Customer - Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DispatchCreateRequest'
 *     responses:
 *       201:
 *         description: Dispatch order created successfully
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
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
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
 *             $ref: '#/components/schemas/DispatchEstimateRequest'
 *     responses:
 *       200:
 *         description: Dispatch estimate generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DispatchEstimateResponseData'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
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
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParkNgoCreateRequest'
 *     responses:
 *       201:
 *         description: Park N Go order created
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
 *         description: Validation error
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
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WastePickupCreateRequest'
 *     responses:
 *       201:
 *         description: Waste pickup request created
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
 *         description: Validation error
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
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ckx123abc456"
 *     responses:
 *       200:
 *         description: Order fetched
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
 *     summary: List my orders (customer) / list orders (admin)
 *     description: Returns a paginated list of orders. Customer sees only their own orders; Admin can optionally filter by customerId.
 *     tags: [Customer - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         example: PENDING
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *           enum: [DISPATCH, PARK_N_GO, WASTE_PICKUP, RIDE_BOOKING]
 *         example: DISPATCH
 *       - in: query
 *         name: customerId
 *         description: "Admin-only filter"
 *         schema:
 *           type: string
 *         example: "ckxCustomerId123"
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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedOrders'
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
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: "ckx123abc456"
 *     responses:
 *       200:
 *         description: Order cancelled
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
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *       409:
 *         description: Order cannot be cancelled (only pending orders can be cancelled)
 *       500:
 *         description: Internal server error
 */