import { Router } from "express";
import { authenticate, requireAdmin  } from "../../middleware/authenticate.js";
import {
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminAssignDriver,
  adminListEligibleDrivers,
  adminAcceptWastePickup,
  adminPayDriverForOrder
} from "../../controller/admin/orders.controller.js";

const router = Router();

router.get("/", authenticate, requireAdmin, adminListOrders);
router.get("/eligible-drivers", authenticate, requireAdmin, adminListEligibleDrivers);
router.get("/waste-pickup/:orderId/accept", authenticate, requireAdmin, adminAcceptWastePickup);
router.get("/:orderId", authenticate, requireAdmin, adminGetOrder);
router.patch("/:orderId/status", authenticate, requireAdmin, adminUpdateOrderStatus);
router.patch("/:orderId/assign-driver", authenticate, requireAdmin, adminAssignDriver);
router.patch("/:orderId/pay", authenticate, requireAdmin, adminPayDriverForOrder);


export default router;