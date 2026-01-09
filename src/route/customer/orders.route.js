import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  createDispatchOrder,
  createParkNgoOrder,
  createWastePickupOrder,
} from "../../controller/customer/orders.controller.js";

const router = Router();

router.post("/dispatch", authenticate, createDispatchOrder);
router.post("/park-n-go", authenticate, createParkNgoOrder);
router.post("/waste-pickup", authenticate, createWastePickupOrder);

export default router;