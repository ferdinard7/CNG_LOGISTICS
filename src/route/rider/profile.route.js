import { Router } from "express";
import { requireKycApproved } from "../../middleware/requireKycApproved.js";
import {
  riderGetProfile,
  riderUpdateProfile,
  riderUpdateLocation,
} from "../../controller/rider/profile.controller.js";

const router = Router();

router.get("/", riderGetProfile);
router.patch("/", riderUpdateProfile);

// location update should require KYC
router.patch("/location", requireKycApproved, riderUpdateLocation);

export default router;