import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";
import {
  adminReviewWithdrawalSchema,
  withdrawalIdParamSchema,
} from "../../validations/wallet.validation.js";

export const adminListWithdrawals = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Admins only" });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = { ...(status ? { status } : {}) };

    const [items, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true, role: true } },
        },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Withdrawals fetched",
      data: {
        items: items.map((w) => ({
          ...w,
          amount: Number(w.amount),
        })),
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("adminListWithdrawals error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminReviewWithdrawal = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Admins only" });
    }

    const { error: pErr, value: pVal } = withdrawalIdParamSchema.validate(req.params, { abortEarly: false });
    if (pErr) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: pErr.details.map((d) => d.message),
      });
    }

    const { error, value } = adminReviewWithdrawalSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const { withdrawalId } = pVal;
    const { action, rejectionReason, paymentRef } = value;

    const result = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
      if (!w) return { notFound: true };

      // Approve
      if (action === "APPROVE") {
        if (w.status !== "PENDING") return { badState: true, status: w.status };

        const updated = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: "APPROVED",
            reviewedById: req.user.id,
            reviewedAt: new Date(),
            rejectionReason: null,
          },
        });

        return { updated };
      }

      // Reject
      if (action === "REJECT") {
        if (w.status !== "PENDING") return { badState: true, status: w.status };

        const updated = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: "REJECTED",
            reviewedById: req.user.id,
            reviewedAt: new Date(),
            rejectionReason,
          },
        });

        return { updated };
      }

      // Mark paid (this is where we actually debit wallet + ledger)
      if (action === "MARK_PAID") {
        if (!["APPROVED", "PENDING"].includes(w.status)) {
          return { badState: true, status: w.status };
        }

        // prevent double debit (unique withdrawalId on WalletTransaction)
        const existingTx = await tx.walletTransaction.findUnique({
          where: { withdrawalId },
          select: { id: true },
        });
        if (existingTx) return { alreadyPaid: true };

        const user = await tx.user.findUnique({
          where: { id: w.userId },
          select: { walletBalance: true },
        });

        const before = user?.walletBalance != null ? Number(user.walletBalance) : 0;
        const amt = Number(w.amount);

        if (before < amt) return { insufficient: true, balance: before };

        const after = Number((before - amt).toFixed(2));

        await tx.user.update({
          where: { id: w.userId },
          data: { walletBalance: after },
        });

        await tx.walletTransaction.create({
          data: {
            userId: w.userId,
            type: "DEBIT",
            amount: amt,
            balanceBefore: before,
            balanceAfter: after,
            withdrawalId,
            note: `Withdrawal payout - ref: ${paymentRef}`,
          },
        });

        const updated = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: "PAID",
            reviewedById: req.user.id,
            reviewedAt: new Date(),
            paidAt: new Date(),
            paymentRef,
          },
        });

        return { updated, after };
      }

      return { invalidAction: true };
    });

    if (result.notFound) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Withdrawal not found" });
    }
    if (result.badState) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: `Withdrawal cannot be processed in status: ${result.status}`,
      });
    }
    if (result.insufficient) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User wallet balance is insufficient for payout",
        data: { balance: result.balance },
      });
    }
    if (result.alreadyPaid) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Withdrawal already paid",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Withdrawal updated",
      data: result.updated,
    });
  } catch (err) {
    logger.error("adminReviewWithdrawal error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};