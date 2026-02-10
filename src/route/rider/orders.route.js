import { Router } from "express";
import {
  riderSetOnlineStatus,
  riderAvailableOrders,
  riderAcceptOrder,
  riderActiveOrders,
  riderStartOrder,
  riderCompleteOrder,
  riderGetOrderDetails,
  riderWallet,
  driverCompletedOrders
} from "../../controller/rider/orders.controller.js";
import { requireKycApproved } from "../../middleware/requireKycApproved.js";

const router = Router();

// Online status requires KYC
router.patch("/status", requireKycApproved, riderSetOnlineStatus);
router.get("/active", requireKycApproved, riderActiveOrders);
// Viewing available orders should require KYC (so unverified riders don’t see jobs)
router.get("/available", requireKycApproved, riderAvailableOrders);
router.get("/:orderId", requireKycApproved, riderGetOrderDetails);
router.post("/:orderId/accept", requireKycApproved, riderAcceptOrder);


router.patch("/:orderId/start", requireKycApproved, riderStartOrder);
router.patch("/:orderId/complete", requireKycApproved, riderCompleteOrder);

router.get("/wallet",  requireKycApproved, riderWallet);

router.get("/completed", requireKycApproved, driverCompletedOrders);

export default router;