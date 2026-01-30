import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { adminListWithdrawals, adminReviewWithdrawal } from "../../controller/admin/withdrawals.controller.js";

const router = express.Router();

router.get("/withdrawals", authenticate, adminListWithdrawals);
router.post("/withdrawals/:withdrawalId/review", authenticate, adminReviewWithdrawal);

export default router;