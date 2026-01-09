import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma.js";
import logger from "../config/logger.js";

export const adminListKycRequests = async (req, res) => {
  try {
    const { status = "PENDING", role, page = 1, limit = 20 } = req.query;

    const where = {
    status,
     ...(role ? { user: { is: { role } } } : {}),
      };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      prisma.kycProfile.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      }),
      prisma.kycProfile.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "KYC requests fetched",
      data: {
        items: items.map((k) => ({
          id: k.id,
          userId: k.user.id,
          name: `${k.user.firstName} ${k.user.lastName}`,
          type: k.user.role, // RIDER / TRUCK_DRIVER / WASTE_DRIVER
          submittedAt: k.updatedAt,
          status: k.status,
        })),
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    logger.error("adminListKycRequests error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminGetKycRequest = async (req, res) => {
  try {
    const { kycId } = req.params;

    const kyc = await prisma.kycProfile.findUnique({
      where: { id: kycId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true, kycStatus: true } },
      },
    });

    if (!kyc) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "KYC request not found",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "KYC request fetched",
      data: kyc,
    });
  } catch (err) {
    logger.error("adminGetKycRequest error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminApproveKyc = async (req, res) => {
  try {
    const { kycId } = req.params;
    const adminId = req.user.id;

    const kyc = await prisma.kycProfile.findUnique({ where: { id: kycId } });
    if (!kyc) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "KYC request not found" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const kycUpdated = await tx.kycProfile.update({
        where: { id: kycId },
        data: {
          status: "APPROVED",
          reviewedById: adminId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      await tx.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: "APPROVED" },
      });

      return kycUpdated;
    });

    logger.info("KYC approved", { kycId, adminId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "KYC approved successfully",
      data: updated,
    });
  } catch (err) {
    logger.error("adminApproveKyc error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};

export const adminRejectKyc = async (req, res) => {
  try {
    const { kycId } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body || {};

    if (!reason || String(reason).trim().length < 3) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const kyc = await prisma.kycProfile.findUnique({ where: { id: kycId } });
    if (!kyc) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "KYC request not found" });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const kycUpdated = await tx.kycProfile.update({
        where: { id: kycId },
        data: {
          status: "REJECTED",
          reviewedById: adminId,
          reviewedAt: new Date(),
          rejectionReason: reason.trim(),
        },
      });

      await tx.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: "REJECTED" },
      });

      return kycUpdated;
    });

    logger.info("KYC rejected", { kycId, adminId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "KYC rejected successfully",
      data: updated,
    });
  } catch (err) {
    logger.error("adminRejectKyc error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
};


