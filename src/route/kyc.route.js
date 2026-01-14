import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getMyKyc, submitRiderKyc, submitVehicleDriverKyc } from "../controller/kyc.controller.js";
import { upload } from "../middleware/upload.js";


const router = Router();

router.get("/me", authenticate, getMyKyc);
router.post(
  "/kyc/rider/submit",
  authenticate,
  upload.fields([
    { name: "ninFront", maxCount: 1 },
    { name: "ninBack", maxCount: 1 },
    { name: "motorcyclePhotos", maxCount: 6 },
    { name: "riderOnMotorcyclePhoto", maxCount: 1 },
  ]),
  submitRiderKyc
);

router.post(
  "/kyc/vehicle/submit",
  authenticate,
  upload.fields([
    { name: "driversLicenseFront", maxCount: 1 },
    { name: "driversLicenseBack", maxCount: 1 },
    { name: "vehiclePhotos", maxCount: 8 },
    { name: "driverInVehiclePhoto", maxCount: 1 },
  ]),
  submitVehicleDriverKyc
);

export default router;