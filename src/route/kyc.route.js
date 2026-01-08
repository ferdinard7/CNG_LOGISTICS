import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getMyKyc, submitRiderKyc, submitVehicleDriverKyc } from "../controller/kyc.controller.js";

const router = Router();

router.get("/me", authenticate, getMyKyc);
router.post("/rider/submit", authenticate, submitRiderKyc);
router.post("/vehicle-driver/submit", authenticate,  submitVehicleDriverKyc);

export default router;