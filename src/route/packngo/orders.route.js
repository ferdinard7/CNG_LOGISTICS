import { Router } from "express";
import {
  truckAvailableOrders,
  truckAcceptOrder,
  truckStartOrder,
  truckCompleteOrder
} from "../../controller/packngo/orders.controller.js";
import { requireKycApproved } from "../../middleware/requireKycApproved.js";

const router = Router();

router.get("/available", requireKycApproved, truckAvailableOrders);
router.post("/:orderId/accept", requireKycApproved, truckAcceptOrder);
router.patch("/:orderId/start", requireKycApproved, truckStartOrder);
router.patch("/:orderId/complete", requireKycApproved, truckCompleteOrder);

export default router;