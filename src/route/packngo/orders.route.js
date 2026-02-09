import { Router } from "express";
import {
  truckAvailableOrders,
  truckAcceptOrder,
  truckStartOrder,
  truckCompleteOrder,
  driverWallet,
  driverActiveOrders,
} from "../../controller/packngo/orders.controller.js";
import { requireKycApproved } from "../../middleware/requireKycApproved.js";
import { authenticate } from "../../middleware/authenticate.js";

const router = Router();

// Online status requires KYC
// router.patch("/status", requireKycApproved, driverWallet);
router.get("/active", requireKycApproved, driverActiveOrders);
router.get("/available", requireKycApproved, truckAvailableOrders);
router.get("/wallet", authenticate, driverWallet);
router.post("/:orderId/accept", requireKycApproved, truckAcceptOrder);
router.patch("/:orderId/start", requireKycApproved, truckStartOrder);
router.patch("/:orderId/complete", requireKycApproved, truckCompleteOrder);

export default router;
