import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/authenticate.js";
import { adminOverviewSummary, adminRecentOrders } from "../../controller/admin/overview.controller.js";

const router = Router();

router.get("/summary", authenticate, requireAdmin, adminOverviewSummary);
router.get("/recent-orders", authenticate, requireAdmin, adminRecentOrders);

export default router;