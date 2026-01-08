import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma.js";
import logger from "../config/logger.js";
import { submitRiderKycSchema, submitTruckKycSchema } from "../validations/kyc.validation.js";
import { verifyRiderWithPrembly, verifyTruckDriverWithPrembly } from "../services/prembly.service.js";

export const getMyKyc = async (req, res) => {
  try {
    const userId = req.user.id;

    const kyc = await prisma.kycProfile.findUnique({ where: { userId } });

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

    const { error, value } = submitRiderKycSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const verification = await verifyRiderWithPrembly({
      nin: value.nin,
      motorcyclePlate: value.motorcyclePlate,
    });

    const kyc = await prisma.$transaction(async (tx) => {
      const updated = await tx.kycProfile.upsert({
        where: { userId },
        create: {
          userId,
          status: "PENDING",
          premblyStatus: verification.status === "VERIFIED" ? "VERIFIED" : "FAILED",
          premblyReference: verification.reference,
          premblyPayload: value,
          premblyResponse: verification.raw,
          ...value,
        },
        update: {
          status: "PENDING",
          premblyStatus: verification.status === "VERIFIED" ? "VERIFIED" : "FAILED",
          premblyReference: verification.reference,
          premblyPayload: value,
          premblyResponse: verification.raw,
          ...value,
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

    const { error, value } = submitTruckKycSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const verification = await verifyTruckDriverWithPrembly({
      driversLicenseNumber: value.driversLicenseNumber,
      vehiclePlate: value.vehiclePlate,
    });

    const kyc = await prisma.$transaction(async (tx) => {
      const updated = await tx.kycProfile.upsert({
        where: { userId },
        create: {
          userId,
          status: "PENDING",
          premblyStatus: verification.status === "VERIFIED" ? "VERIFIED" : "FAILED",
          premblyReference: verification.reference,
          premblyPayload: value,
          premblyResponse: verification.raw,
          ...value,
        },
        update: {
          status: "PENDING",
          premblyStatus: verification.status === "VERIFIED" ? "VERIFIED" : "FAILED",
          premblyReference: verification.reference,
          premblyPayload: value,
          premblyResponse: verification.raw,
          ...value,
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