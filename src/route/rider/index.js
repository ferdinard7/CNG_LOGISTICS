import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireDriverRole } from "../../middleware/requireDriverRole.js";

import riderDashboardRoutes from "./dashboard.route.js";
import riderOrdersRoutes from "./orders.route.js";
import riderEarningsRoutes from "./earnings.route.js";
import riderProfileRoutes from "./profile.route.js";

const router = Router();

router.use(authenticate, requireDriverRole);

router.use("/dashboard", riderDashboardRoutes);
router.use("/orders", riderOrdersRoutes);
router.use("/earnings", riderEarningsRoutes);
router.use("/profile", riderProfileRoutes);

export default router;