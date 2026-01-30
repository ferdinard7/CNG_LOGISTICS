import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";
import { withdrawalRequestSchema } from "../../validations/wallet.validation.js";

const DRIVER_ROLES = new Set(["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"]);

export const getMyWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!DRIVER_ROLES.has(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only drivers can access wallet",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletBalance: true },
    });

    const txs = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Wallet fetched",
      data: {
        balance: user?.walletBalance != null ? Number(user.walletBalance) : 0,
        transactions: txs.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          balanceBefore: Number(t.balanceBefore),
          balanceAfter: Number(t.balanceAfter),
          orderId: t.orderId,
          withdrawalId: t.withdrawalId,
          note: t.note,
          createdAt: t.createdAt,
        })),
      },
    });
  } catch (err) {
    logger.error("getMyWallet error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!DRIVER_ROLES.has(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only drivers can request withdrawals",
      });
    }

    const { error, value } = withdrawalRequestSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const { amount, bankName, accountName, accountNumber } = value;

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      const balance = user?.walletBalance != null ? Number(user.walletBalance) : 0;

      // Only allow withdrawal request if sufficient funds
      if (balance < amount) {
        return { insufficient: true, balance };
      }

      // V1: we do NOT debit immediately; debit happens when admin marks paid
      // This keeps things simple for finance flow.
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId,
          amount,
          bankName,
          accountName,
          accountNumber,
          status: "PENDING",
        },
      });

      return { withdrawal };
    });

    if (created.insufficient) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Insufficient wallet balance",
        data: { balance: created.balance },
      });
    }

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Withdrawal requested",
      data: created.withdrawal,
    });
  } catch (err) {
    logger.error("requestWithdrawal error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const myWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    if (!DRIVER_ROLES.has(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only drivers can view withdrawals",
      });
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
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
    logger.error("myWithdrawals error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};