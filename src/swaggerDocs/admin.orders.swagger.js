/**
 * @swagger
 * tags:
 *   - name: Admin Orders
 *     description: Admin order management (list, details, status updates, assign driver, eligible drivers, waste pickup accept)
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
 *     ApiSuccess:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string, example: "OK" }
 *         data: { type: object }
 *
 *     ApiError:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: false }
 *         message: { type: string, example: "Validation error" }
 *         data:
 *           oneOf:
 *             - type: array
 *               items: { type: string }
 *             - type: object
 *
 *     AdminOrderListItem:
 *       type: object
 *       properties:
 *         id: { type: string, example: "ckx123abc456" }
 *         orderCode: { type: string, example: "CNC-ORD-12345" }
 *         type:
 *           type: string
 *           enum: [DISPATCH, PARK_N_GO, WASTE_PICKUP, RIDE_BOOKING]
 *           example: PARK_N_GO
 *         customer: { type: string, nullable: true, example: "John Doe" }
 *         driver: { type: string, nullable: true, example: "Jane Rider" }
 *         amount: { type: number, nullable: true, example: 2500 }
 *         status:
 *           type: string
 *           enum: [PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED]
 *           example: PENDING
 *         date: { type: string, format: date-time }
 *
 *     PaginatedAdminOrders:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: "#/components/schemas/AdminOrderListItem" }
 *         total: { type: integer, example: 120 }
 *         page: { type: integer, example: 1, minimum: 1  }
 *         limit: { type: integer, example: 20, minimum: 1, maximum: 50  }
 *
 *     AdminOrderDetails:
 *       type: object
 *       description: Full order returned by Prisma include(customer, driver)
 *       properties:
 *         id: { type: string }
 *         orderCode: { type: string }
 *         serviceType:
 *           type: string
 *           enum: [DISPATCH, PARK_N_GO, WASTE_PICKUP, RIDE_BOOKING]
 *         status:
 *           type: string
 *           enum: [PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         amount: { type: number, example: 2500 }
 *         currency: { type: string, example: "NGN" }
 *         customerId: { type: string }
 *         driverId: { type: string, nullable: true }
 *         pickupAddress: { type: string, nullable: true }
 *         deliveryAddress: { type: string, nullable: true }
 *         metadata: { type: object, nullable: true, additionalProperties: true }
 *         acceptedAt: { type: string, format: date-time, nullable: true }
 *         startedAt: { type: string, format: date-time, nullable: true }
 *         completedAt: { type: string, format: date-time, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         customer:
 *           type: object
 *           nullable: true
 *           properties:
 *             id: { type: string }
 *             firstName: { type: string }
 *             lastName: { type: string }
 *             email: { type: string }
 *             phone: { type: string }
 *         driver:
 *           type: object
 *           nullable: true
 *           properties:
 *             id: { type: string }
 *             firstName: { type: string }
 *             lastName: { type: string }
 *             role: { type: string, enum: [RIDER, TRUCK_DRIVER, WASTE_DRIVER] }
 *             phone: { type: string }
 *
 *     UpdateOrderStatusBody:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED]
 *           example: IN_PROGRESS
 *
 *     AssignDriverBody:
 *       type: object
 *       required: [driverId]
 *       properties:
 *         driverId: { type: string, example: "ckx_driver_123" }
 *
 *     EligibleDriver:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         firstName: { type: string }
 *         lastName: { type: string }
 *         phone: { type: string }
 *         role: { type: string, enum: [RIDER, TRUCK_DRIVER, WASTE_DRIVER] }
 *         isOnline: { type: boolean }
 *         availabilityStatus: { type: string, enum: [OFFLINE, AVAILABLE, BUSY] }
 *         maxActiveOrders: { type: number, example: 1 }
 *         activeOrdersCount: { type: number, example: 0 }
 *         canTakeMore: { type: boolean, example: true }
 *         lastLat: { type: number, nullable: true }
 *         lastLng: { type: number, nullable: true }
 *         lastLocationUpdatedAt: { type: string, format: date-time, nullable: true }
 *
 *     PaginatedEligibleDrivers:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: "#/components/schemas/EligibleDriver" }
 *         total: { type: integer, example: 120 }
 *         page: { type: integer, example: 1, minimum: 1 }
 *         limit: { type: integer, example: 20, minimum: 1, maximum: 50 }
 */

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     tags: [Admin Orders]
 *     security: [{ bearerAuth: [] }]
 *     summary: List orders (admin)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [DISPATCH, PARK_N_GO, WASTE_PICKUP, RIDE_BOOKING] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED] }
 *       - in: query
 *         name: from
 *         description: ISO date-time
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         description: ISO date-time
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: number, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: number, example: 20 }
 *     responses:
 *       200:
 *         description: Orders fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/PaginatedAdminOrders" }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 *       403: { description: Admin access required, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 */

/**
 * @swagger
 * /api/admin/orders/eligible-drivers:
 *   get:
 *     tags: [Admin Orders]
 *     security: [{ bearerAuth: [] }]
 *     summary: List eligible drivers for assignment
 *     description: |
 *       Returns KYC-approved drivers filtered by serviceType/role and availabilityStatus, and also enforces capacity (activeOrdersCount < maxActiveOrders).
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema: { type: string, enum: [DISPATCH, PARK_N_GO, WASTE_PICKUP, RIDE_BOOKING] }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [RIDER, TRUCK_DRIVER, WASTE_DRIVER] }
 *       - in: query
 *         name: availability
 *         schema: { type: string, enum: [OFFLINE, AVAILABLE, BUSY], example: AVAILABLE }
 *       - in: query
 *         name: includeBusy
 *         description: If true, does not filter by availabilityStatus (still applies capacity filter).
 *         schema: { type: boolean, example: false }
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1, minimum: 1  }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20, minimum: 1, maximum: 50  }
 *     responses:
 *       200:
 *         description: Eligible drivers fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/PaginatedEligibleDrivers" }
 *       400: { description: Bad request, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 *       403: { description: Admin access required, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 */

/**
 * @swagger
 * /api/admin/orders/waste-pickup/{orderId}/accept:
 *   get:
 *     tags: [Admin Orders]
 *     security: [{ bearerAuth: [] }]
 *     summary: Accept a waste pickup request (admin)
 *     description: Changes a WASTE_PICKUP order from PENDING to ASSIGNED and generates a wasteRequestId in metadata.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Waste pickup accepted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/AdminOrderDetails" }
 *       404: { description: Request not found, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 *       409: { description: Invalid state, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 */

/**
 * @swagger
 * /api/admin/orders/{orderId}:
 *   get:
 *     tags: [Admin Orders]
 *     security: [{ bearerAuth: [] }]
 *     summary: Get single order details (admin)
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/AdminOrderDetails" }
 *       404: { description: Order not found, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 */

/**
 * @swagger
 * /api/admin/orders/{orderId}/status:
 *   patch:
 *     tags: [Admin Orders]
 *     security: [{ bearerAuth: [] }]
 *     summary: Update order status (admin)
 *     description: |
 *       - Admin can set COMPLETED only for WASTE_PICKUP.
 *       - For DISPATCH/PARK_N_GO/RIDE_BOOKING: driver must complete (wallet credit logic).
 *       - Finalized orders (COMPLETED/CANCELLED) cannot be updated.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/UpdateOrderStatusBody" }
 *     responses:
 *       200: { description: Order status updated, content: { application/json: { schema: { $ref: "#/components/schemas/ApiSuccess" } } } }
 *       400: { description: Bad request, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 *       404: { description: Order not found, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 *       409: { description: Conflict, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 */

/**
 * @swagger
 * /api/admin/orders/{orderId}/assign-driver:
 *   patch:
 *     tags: [Admin Orders]
 *     security: [{ bearerAuth: [] }]
 *     summary: Assign a driver to an order (admin)
 *     description: |
 *       Service → Role enforcement:
 *       - DISPATCH → RIDER
 *       - PARK_N_GO → TRUCK_DRIVER
 *       - RIDE_BOOKING → RIDER
 *       - WASTE_PICKUP → not assignable (internal handling)
 *       Capacity enforcement:
 *       - activeOrdersCount must be < maxActiveOrders.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/AssignDriverBody" }
 *     responses:
 *       200:
 *         description: Driver assigned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/ApiSuccess"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/AdminOrderDetails" }
 *       400: { description: Bad request, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 *       404: { description: Not found, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 *       409: { description: Conflict, content: { application/json: { schema: { $ref: "#/components/schemas/ApiError" } } } }
 */