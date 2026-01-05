import { StatusCodes } from "http-status-codes";
import prisma from "../config/prisma.js";
import logger from "../config/logger.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from "../utils/token.js";
import { env } from "../config/env.js";

const DRIVER_ROLES = new Set(["RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"]);

const sanitizeUser = (user) => {
  const { passwordHash, ...rest } = user;
  return rest;
};

const setRefreshCookie = (res, refreshToken) => {
  const isProd = env.nodeEnv === "production";

  res.cookie(env.cookieRefreshName || "cnc_refresh", refreshToken, {
    httpOnly: true,
    secure: isProd, // true in production (https)
    sameSite: isProd ? "none" : "lax",
    maxAge: env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshCookie = (res) => {
  const isProd = env.nodeEnv === "production";

  res.clearCookie(env.cookieRefreshName || "cnc_refresh", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
};

export const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const { firstName, lastName, email, phone, role, password } = value;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
      select: { id: true },
    });

    if (existing) {
      logger.warn("Register: email/phone already exists", { email, phone });
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Email or phone already exists",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        role,
        kycStatus: DRIVER_ROLES.has(role) ? "NOT_SUBMITTED" : "NOT_SUBMITTED",
        kycProfile: DRIVER_ROLES.has(role) ? { create: { status: "NOT_SUBMITTED" } } : undefined,
      },
    });

    logger.info("User registered", { userId: user.id, role: user.role });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Account created successfully",
      data: sanitizeUser(user),
    });
  } catch (err) {
    logger.error("Register error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    // Best: allow "identifier" (email or phone) even if UI says email
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        data: error.details.map((d) => d.message),
      });
    }

    const { identifier, password } = value;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user || !user.isActive) {
      logger.warn("Login failed - user not found/inactive", { identifier });
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      logger.warn("Login failed - wrong password", { identifier });
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

    const expiresAt = new Date(Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(refreshToken),
          expiresAt,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    setRefreshCookie(res, refreshToken);

    logger.info("Login success", { userId: user.id, role: user.role });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    logger.error("Login error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { kycProfile: true },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile fetched",
      data: sanitizeUser(user),
    });
  } catch (err) {
    logger.error("Me error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const cookieName = env.cookieRefreshName || "cnc_refresh";
    const refreshToken = req.cookies?.[cookieName];

    if (!refreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const userId = payload.sub;
    const tokenHash = hashToken(refreshToken);

    const stored = await prisma.refreshToken.findFirst({
      where: { userId, tokenHash, revokedAt: null },
    });

    if (!stored) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Refresh token not recognized",
      });
    }

    if (stored.expiresAt < new Date()) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Account inactive",
      });
    }

    // Rotate refresh token (best practice)
    const newAccessToken = signAccessToken({ sub: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user.id, role: user.role });
    const newExpiresAt = new Date(Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(newRefreshToken),
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    setRefreshCookie(res, newRefreshToken);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Token refreshed",
      data: { token: newAccessToken },
    });
  } catch (err) {
    logger.error("Refresh error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const cookieName = env.cookieRefreshName || "cnc_refresh";
    const refreshToken = req.cookies?.[cookieName];

    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    clearRefreshCookie(res);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    logger.error("Logout error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};