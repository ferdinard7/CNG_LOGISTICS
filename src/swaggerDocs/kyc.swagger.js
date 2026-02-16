/**
 * @swagger
 * tags:
 *   - name: KYC
 *     description: KYC submission and retrieval
 */

/**
 * @swagger
 * /api/kyc/me:
 *   get:
 *     summary: Get my KYC profile
 *     description: Returns the authenticated user's KYC profile (if any).
 *     tags: [KYC]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: KYC fetched
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
 *                   example: "KYC fetched"
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/kyc/rider/submit:
 *   post:
 *     summary: Submit Rider KYC (Motorcycle)
 *     description: >
 *       Riders only. Submits motorcycle rider KYC including NIN front/back, rider-on-motorcycle photo,
 *       motorcycle photos, and compliance declarations.
 *     tags: [KYC]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nin
 *               - motorcycleType
 *               - motorcycleColor
 *               - vin
 *               - has_valid_vehicle_papers
 *               - has_valid_insurance
 *               - vehicle_in_good_condition
 *               - ninFront
 *               - ninBack
 *               - riderOnMotorcyclePhoto
 *               - motorcyclePhotos
 *             properties:
 *               nin:
 *                 type: string
 *                 description: NIN must be exactly 11 digits.
 *                 example: "12345678901"
 *               motorcycleType:
 *                 type: string
 *                 description: Normalized to lowercase on the server.
 *                 example: "honda"
 *               motorcycleColor:
 *                 type: string
 *                 example: "Black"
 *               vin:
 *                 type: string
 *                 example: "1HGCM82633A004352"
 *               motorcyclePlate:
 *                 type: string
 *                 description: Optional plate number (used for Prembly verification if provided).
 *                 example: "LND-123XY"
 *               has_valid_vehicle_papers:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "true"
 *               has_valid_insurance:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "true"
 *               vehicle_in_good_condition:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "true"
 *               ninFront:
 *                 type: string
 *                 format: binary
 *               ninBack:
 *                 type: string
 *                 format: binary
 *               riderOnMotorcyclePhoto:
 *                 type: string
 *                 format: binary
 *               motorcyclePhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: KYC submitted successfully
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
 *                   example: "KYC submitted successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error / Missing fields / Missing uploads
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only riders can submit this KYC
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/kyc/vehicle/submit:
 *   post:
 *     summary: Submit Vehicle Driver KYC (Truck/Waste Driver)
 *     description: >
 *       Truck/Waste drivers only. Submits vehicle KYC including driver's license front/back,
 *       driver-in-vehicle photo, vehicle photos, vehicle details and compliance declarations.
 *     tags: [KYC]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleType
 *               - vehicleColor
 *               - vin
 *               - vehicleTrim
 *               - bodyType
 *               - loadCapacity
 *               - driversLicenseNumber
 *               - vehiclePlate
 *               - has_valid_vehicle_papers
 *               - has_valid_insurance
 *               - vehicle_in_good_condition
 *               - driversLicenseFront
 *               - driversLicenseBack
 *               - driverInVehiclePhoto
 *               - vehiclePhotos
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 description: Normalized to lowercase on the server.
 *                 enum: [pickup, van, light_truck]
 *                 example: "pickup"
 *               vehicleColor:
 *                 type: string
 *                 example: "White"
 *               vin:
 *                 type: string
 *                 example: "1HGCM82633A004352"
 *               vehicleTrim:
 *                 type: string
 *                 example: "Sport"
 *               bodyType:
 *                 type: string
 *                 example: "Flatbed"
 *               loadCapacity:
 *                 type: string
 *                 example: "2 Tons"
 *               driversLicenseNumber:
 *                 type: string
 *                 example: "DL-1234567890"
 *               driverLicenseDob:
 *                 type: string
 *                 description: Date of birth on driver's license (YYYY-MM-DD) for Prembly verification
 *                 example: "1990-05-15"
 *               vehiclePlate:
 *                 type: string
 *                 example: "LND-123XY"
 *               has_valid_vehicle_papers:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "true"
 *               has_valid_insurance:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "true"
 *               vehicle_in_good_condition:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 example: "true"
 *               driversLicenseFront:
 *                 type: string
 *                 format: binary
 *               driversLicenseBack:
 *                 type: string
 *                 format: binary
 *               driverInVehiclePhoto:
 *                 type: string
 *                 format: binary
 *               vehiclePhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: KYC submitted successfully
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
 *                   example: "KYC submitted successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error / Missing fields / Missing uploads
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only truck drivers and waste drivers can submit this KYC
 *       500:
 *         description: Internal server error
 */