import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma.js";
import logger from "../config/logger.js";
import { riderKycSchema, vehicleKycSchema } from "../validations/kyc.validation.js";
import { verifyRiderWithPrembly, verifyTruckDriverWithPrembly } from "../services/prembly.service.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";


const getFile = (files, key) => (files?.[key]?.[0] ? files[key][0] : null);
const getFiles = (files, key) => (files?.[key] ? files[key] : []);

const toBool = (v) => String(v).toLowerCase() === "true";

export const getMyKyc = async (req, res) => {
  try {
    const userId = req.user.id;

    const kyc = await prisma.kycProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, role: true, kycStatus: true } },
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "KYC fetched",
      data: kyc,
    });
  } catch (err) {
    logger.error("getMyKyc error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const submitRiderKyc = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "RIDER") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only riders can submit this KYC",
      });
    }

    // --- Normalize + basic validation (fast-fail) ---
    const nin = String(req.body.nin || "").trim();
    const motorcycleType = String(req.body.motorcycleType || "").trim().toLowerCase(); // ✅ normalized
    const motorcycleColor = String(req.body.motorcycleColor || "").trim();
    const vin = String(req.body.vin || "").trim();
    const motorcyclePlate = String(req.body.motorcyclePlate || "").trim();

    const hasValidVehiclePapers = toBool(req.body.has_valid_vehicle_papers);
    const hasValidInsurance = toBool(req.body.has_valid_insurance);
    const vehicleInGoodCondition = toBool(req.body.vehicle_in_good_condition);

    if (!nin || !motorcycleType || !motorcycleColor || !vin) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Missing required fields (nin, motorcycleType, motorcycleColor, vin)",
      });
    }

    // nin format: 11 digits
    if (!/^\d{11}$/.test(nin)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid NIN format. NIN must be exactly 11 digits.",
      });
    }

    // vin basic sanity check
    if (vin.length < 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid VIN. VIN is too short.",
      });
    }

    // Files
    const files = req.files || {};
    const ninFront = getFile(files, "ninFront");
    const ninBack = getFile(files, "ninBack");
    const riderOnMotorcyclePhoto = getFile(files, "riderOnMotorcyclePhoto");
    const motorcyclePhotos = getFiles(files, "motorcyclePhotos");

    if (!ninFront || !ninBack || !riderOnMotorcyclePhoto || motorcyclePhotos.length < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Missing required uploads (NIN front/back, motorcycle photos, rider photo)",
      });
    }

    // Upload to Cloudinary
    const [ninFrontUp, ninBackUp, riderPhotoUp] = await Promise.all([
      uploadBufferToCloudinary({ buffer: ninFront.buffer, filename: `nin_front_${userId}` }),
      uploadBufferToCloudinary({ buffer: ninBack.buffer, filename: `nin_back_${userId}` }),
      uploadBufferToCloudinary({ buffer: riderOnMotorcyclePhoto.buffer, filename: `rider_on_bike_${userId}` }),
    ]);

    const motorcycleUploads = await Promise.all(
      motorcyclePhotos.map((f, idx) =>
        uploadBufferToCloudinary({
          buffer: f.buffer,
          filename: `motorcycle_${userId}_${idx + 1}`,
        })
      )
    );

    // Prembly (test for now)
    const verification = await verifyRiderWithPrembly({
      nin,
      motorcyclePlate: motorcyclePlate || undefined,
    });

    // Build client-shaped JSON
    const riderKycJson = {
      motorcycle_kyc: {
        motorcycle_info: {
          motorcycle_type: motorcycleType,
          motorcycle_color: motorcycleColor,
          vin,
        },
        rider_documents: {
          nin_document: {
            front: ninFrontUp.secure_url,
            back: ninBackUp.secure_url,
          },
          motorcycle_photos: motorcycleUploads.map((u) => u.secure_url),
          rider_on_motorcycle_photo: riderPhotoUp.secure_url,
        },
        compliance_declarations: {
          has_valid_vehicle_papers: hasValidVehiclePapers,
          has_valid_insurance: hasValidInsurance,
          vehicle_in_good_condition: vehicleInGoodCondition,
        },
      },
    };

    // ✅ Final payload validation (enforces type enum + checkboxes must be true)
    const { error: payloadErr } = riderKycSchema.validate(riderKycJson, { abortEarly: false });
    if (payloadErr) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: payloadErr.details.map((d) => d.message),
      });
    }

    // Save
    const kyc = await prisma.$transaction(async (tx) => {
      const updated = await tx.kycProfile.upsert({
        where: { userId },
        create: {
          userId,
          status: "PENDING",

          // old fields still populated for compatibility
          nin,
          motorcycleType, // normalized value saved
          motorcyclePlate: motorcyclePlate || null,
          motorcycleColor,
          vin,

          ninFrontUrl: ninFrontUp.secure_url,
          ninBackUrl: ninBackUp.secure_url,
          motorcyclePhotos: motorcycleUploads.map((u) => u.secure_url),
          riderOnMotorcyclePhotoUrl: riderPhotoUp.secure_url,

          hasValidVehiclePapers,
          hasValidInsurance,
          vehicleInGoodCondition,

          riderKycJson: riderKycJson.motorcycle_kyc,

          premblyStatus: verification.status === "VERIFIED" ? "VERIFIED" : verification.status === "NOT_STARTED" ? "NOT_STARTED" : "FAILED",
          premblyReference: verification.reference,
          premblyPayload: { nin, motorcyclePlate },
          premblyResponse: verification.raw,
          rejectionReason: null,
          reviewedAt: null,
          reviewedById: null,
        },
        update: {
          status: "PENDING",

          nin,
          motorcycleType,
          motorcyclePlate: motorcyclePlate || null,
          motorcycleColor,
          vin,

          ninFrontUrl: ninFrontUp.secure_url,
          ninBackUrl: ninBackUp.secure_url,
          motorcyclePhotos: motorcycleUploads.map((u) => u.secure_url),
          riderOnMotorcyclePhotoUrl: riderPhotoUp.secure_url,

          hasValidVehiclePapers,
          hasValidInsurance,
          vehicleInGoodCondition,

          riderKycJson: riderKycJson.motorcycle_kyc,

          premblyStatus: verification.status === "VERIFIED" ? "VERIFIED" : verification.status === "NOT_STARTED" ? "NOT_STARTED" : "FAILED",
          premblyReference: verification.reference,
          premblyPayload: { nin, motorcyclePlate },
          premblyResponse: verification.raw,
          rejectionReason: null,
          reviewedAt: null,
          reviewedById: null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { kycStatus: "PENDING" },
      });

      return updated;
    });

    logger.info("Rider KYC submitted", { userId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "KYC submitted successfully",
      data: kyc,
    });
  } catch (err) {
    logger.error("submitRiderKyc error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const VEHICLE_DRIVER_ROLES = new Set(["TRUCK_DRIVER", "WASTE_DRIVER"]);

export const submitVehicleDriverKyc = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!VEHICLE_DRIVER_ROLES.has(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only truck drivers and waste drivers can submit this KYC",
      });
    }

    // ✅ Normalize vehicleType
    const vehicleType = String(req.body.vehicleType || "").trim().toLowerCase(); // pickup|van|light_truck
    const vehicleColor = String(req.body.vehicleColor || "").trim();
    const vin = String(req.body.vin || "").trim();
    const vehicleTrim = String(req.body.vehicleTrim || "").trim();
    const bodyType = String(req.body.bodyType || "").trim();
    const loadCapacity = String(req.body.loadCapacity || "").trim();

    const driversLicenseNumber = String(req.body.driversLicenseNumber || "").trim();
    const driverLicenseDob = String(req.body.driverLicenseDob || "").trim(); // YYYY-MM-DD for Prembly
    const vehiclePlate = String(req.body.vehiclePlate || "").trim();

    const hasValidVehiclePapers = toBool(req.body.has_valid_vehicle_papers);
    const hasValidInsurance = toBool(req.body.has_valid_insurance);
    const vehicleInGoodCondition = toBool(req.body.vehicle_in_good_condition);

    if (
      !vehicleType ||
      !vehicleColor ||
      !vin ||
      !vehicleTrim ||
      !bodyType ||
      !loadCapacity ||
      !driversLicenseNumber ||
      !driverLicenseDob ||
      !vehiclePlate
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "Missing required fields (vehicleType, vehicleColor, vin, vehicleTrim, bodyType, loadCapacity, driversLicenseNumber, driverLicenseDob, vehiclePlate)",
      });
    }

    // driverLicenseDob format: YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(driverLicenseDob)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "driverLicenseDob must be in YYYY-MM-DD format (e.g. 1990-05-15)",
      });
    }

    if (vin.length < 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid VIN. VIN is too short.",
      });
    }

    // Files
    const files = req.files || {};
    const dlFront = getFile(files, "driversLicenseFront");
    const dlBack = getFile(files, "driversLicenseBack");
    const driverInVehiclePhoto = getFile(files, "driverInVehiclePhoto");
    const vehiclePhotos = getFiles(files, "vehiclePhotos");

    if (!dlFront || !dlBack || !driverInVehiclePhoto || vehiclePhotos.length < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "Missing required uploads (driver's license front/back, vehicle photos, driver-in-vehicle photo)",
      });
    }

    // Upload
    const [dlFrontUp, dlBackUp, driverInVehicleUp] = await Promise.all([
      uploadBufferToCloudinary({ buffer: dlFront.buffer, filename: `dl_front_${userId}` }),
      uploadBufferToCloudinary({ buffer: dlBack.buffer, filename: `dl_back_${userId}` }),
      uploadBufferToCloudinary({ buffer: driverInVehiclePhoto.buffer, filename: `driver_in_vehicle_${userId}` }),
    ]);

    const vehicleUploads = await Promise.all(
      vehiclePhotos.map((f, idx) =>
        uploadBufferToCloudinary({
          buffer: f.buffer,
          filename: `vehicle_${userId}_${idx + 1}`,
        })
      )
    );

    // Prembly driver's license verification (Nigeria FRSC)
    const verification = await verifyTruckDriverWithPrembly({
      driversLicenseNumber,
      driverLicenseDob,
      driversLicenseFrontBuffer: dlFront.buffer,
    });

    const vehicleKycJson = {
      vehicle_kyc: {
        vehicle_info: {
          vehicle_type: vehicleType,
          vehicle_color: vehicleColor,
          vin,
          vehicle_trim: vehicleTrim,
          body_type: bodyType,
          load_capacity: loadCapacity,
        },
        vehicle_documents: {
          drivers_license: {
            front: dlFrontUp.secure_url,
            back: dlBackUp.secure_url,
          },
          vehicle_photos: vehicleUploads.map((u) => u.secure_url),
          driver_in_vehicle_photo: driverInVehicleUp.secure_url,
        },
        compliance_declarations: {
          has_valid_vehicle_papers: hasValidVehiclePapers,
          has_valid_insurance: hasValidInsurance,
          vehicle_in_good_condition: vehicleInGoodCondition,
        },
      },
    };

    // ✅ Final payload validation (enforces type enum + checkboxes must be true)
    const { error: payloadErr } = vehicleKycSchema.validate(vehicleKycJson, { abortEarly: false });
    if (payloadErr) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: payloadErr.details.map((d) => d.message),
      });
    }

    const kyc = await prisma.$transaction(async (tx) => {
      const updated = await tx.kycProfile.upsert({
        where: { userId },
        create: {
          userId,
          status: "PENDING",

          driversLicenseNumber,
          driverLicenseDob: driverLicenseDob || null,
          vehiclePlate,
          vehicleColor,
          vin,
          vehicleTrim,
          bodyType,
          loadCapacity,

          driversLicenseFrontUrl: dlFrontUp.secure_url,
          driversLicenseBackUrl: dlBackUp.secure_url,
          vehiclePhotos: vehicleUploads.map((u) => u.secure_url),
          driverInVehiclePhotoUrl: driverInVehicleUp.secure_url,

          hasValidVehiclePapers,
          hasValidInsurance,
          vehicleInGoodCondition,

          vehicleKycJson: vehicleKycJson.vehicle_kyc,

          premblyStatus: verification.status === "VERIFIED" ? "VERIFIED" : verification.status === "NOT_STARTED" ? "NOT_STARTED" : "FAILED",
          premblyReference: verification.reference,
          premblyPayload: { driversLicenseNumber, driverLicenseDob, vehiclePlate },
          premblyResponse: verification.raw,
          rejectionReason: null,
          reviewedAt: null,
          reviewedById: null,
        },
        update: {
          status: "PENDING",

          driversLicenseNumber,
          driverLicenseDob: driverLicenseDob || null,
          vehiclePlate,
          vehicleColor,
          vin,
          vehicleTrim,
          bodyType,
          loadCapacity,

          driversLicenseFrontUrl: dlFrontUp.secure_url,
          driversLicenseBackUrl: dlBackUp.secure_url,
          vehiclePhotos: vehicleUploads.map((u) => u.secure_url),
          driverInVehiclePhotoUrl: driverInVehicleUp.secure_url,

          hasValidVehiclePapers,
          hasValidInsurance,
          vehicleInGoodCondition,

          vehicleKycJson: vehicleKycJson.vehicle_kyc,

          premblyStatus: verification.status === "VERIFIED" ? "VERIFIED" : verification.status === "NOT_STARTED" ? "NOT_STARTED" : "FAILED",
          premblyReference: verification.reference,
          premblyPayload: { driversLicenseNumber, driverLicenseDob, vehiclePlate },
          premblyResponse: verification.raw,
          rejectionReason: null,
          reviewedAt: null,
          reviewedById: null,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { kycStatus: "PENDING" },
      });

      return updated;
    });

    logger.info("Vehicle-driver KYC submitted", { userId, role: req.user.role });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "KYC submitted successfully",
      data: kyc,
    });
  } catch (err) {
    logger.error("submitVehicleDriverKyc error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};