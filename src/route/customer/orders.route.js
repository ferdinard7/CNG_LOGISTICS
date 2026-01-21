import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  createDispatchOrder,
  createParkNgoOrder,
  createWastePickupOrder,
  getOrderDetails,
  estimateDispatchOrder,
  getMyOrders,
  cancelOrder
} from "../../controller/customer/orders.controller.js";

const router = Router();

router.post("/dispatch", authenticate, createDispatchOrder);
router.post("/park-n-go", authenticate, createParkNgoOrder);
router.post("/waste-pickup", authenticate, createWastePickupOrder);
// GET /api/orders/:orderId
router.get("/:orderId", authenticate, getOrderDetails);

router.post("/dispatch/estimate", estimateDispatchOrder);
router.get("/", authenticate, getMyOrders);
router.post("/:orderId/cancel", authenticate, cancelOrder);

export default router;