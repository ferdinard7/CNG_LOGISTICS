import { Router } from "express";
import { authenticate, requireAdmin  } from "../../middleware/authenticate.js";
import {
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminAssignDriver,
} from "../../controller/admin/orders.controller.js";

const router = Router();

router.get("/", authenticate, requireAdmin, adminListOrders);
router.get("/:orderId", authenticate, requireAdmin, adminGetOrder);
router.patch("/:orderId/status", authenticate, requireAdmin, adminUpdateOrderStatus);
router.patch("/:orderId/assign-driver", authenticate, requireAdmin, adminAssignDriver);

export default router;