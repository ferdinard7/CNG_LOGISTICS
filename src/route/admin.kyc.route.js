import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import {
  adminListKycRequests,
  adminGetKycRequest,
  adminApproveKyc,
  adminRejectKyc,
} from "../controller/admin.kyc.controller.js";

const router = Router();

router.get("/", authenticate, requireAdmin, adminListKycRequests);
router.get("/:kycId", authenticate, requireAdmin, adminGetKycRequest);
router.patch("/:kycId/approve", authenticate, requireAdmin, adminApproveKyc);
router.patch("/:kycId/reject", authenticate, requireAdmin, adminRejectKyc);

export default router;