import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import logger from "../../config/logger.js";

const ALLOWED_ROLES = ["CONSUMER", "RIDER", "TRUCK_DRIVER", "WASTE_DRIVER", "ADMIN"];

export const adminUsersStats = async (req, res) => {
  try {
    // grouped totals per role & active/inactive
    const roles = ["CONSUMER", "RIDER", "TRUCK_DRIVER", "WASTE_DRIVER"];

    const [totals, actives, inactives] = await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        where: { role: { in: roles } },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ["role"],
        where: { role: { in: roles }, isActive: true },
        _count: { _all: true },
      }),
      prisma.user.groupBy({
        by: ["role"],
        where: { role: { in: roles }, isActive: false },
        _count: { _all: true },
      }),
    ]);

    const byRole = {};
    for (const r of roles) {
      byRole[r] = { total: 0, active: 0, inactive: 0 };
    }

    for (const row of totals) byRole[row.role].total = row._count._all;
    for (const row of actives) byRole[row.role].active = row._count._all;
    for (const row of inactives) byRole[row.role].inactive = row._count._all;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User stats fetched",
      data: byRole,
    });
  } catch (err) {
    logger.error("adminUsersStats error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminListUsers = async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const roleFilter = role && ALLOWED_ROLES.includes(role) ? role : undefined;

    let isActiveFilter;
    if (typeof isActive !== "undefined") {
      if (String(isActive).toLowerCase() === "true") isActiveFilter = true;
      if (String(isActive).toLowerCase() === "false") isActiveFilter = false;
    }

    const q = search ? String(search).trim() : "";
    const searchFilter =
      q.length > 0
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined;

    const where = {
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(typeof isActiveFilter === "boolean" ? { isActive: isActiveFilter } : {}),
      ...(searchFilter ? searchFilter : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          kycStatus: true,
          isActive: true,
          isOnline: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Users fetched",
      data: {
        items,
        total,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    logger.error("adminListUsers error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminActivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: { id: true, isActive: true },
    });

    logger.info("User activated", { userId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User activated",
      data: updated,
    });
  } catch (err) {
    logger.error("adminActivateUser error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminDeactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Optional: also force offline when deactivated
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, isOnline: false },
      select: { id: true, isActive: true, isOnline: true },
    });

    logger.info("User deactivated", { userId });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "User deactivated",
      data: updated,
    });
  } catch (err) {
    logger.error("adminDeactivateUser error", { err });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};