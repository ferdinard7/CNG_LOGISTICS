import { Router } from "express";
import { requireKycApproved } from "../../middleware/requireKycApproved.js";
import { riderEarningsSummary } from "../../controller/rider/earnings.controller.js";

const router = Router();
router.get("/summary", requireKycApproved, riderEarningsSummary);

export default router;