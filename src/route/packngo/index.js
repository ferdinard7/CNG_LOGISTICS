import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireDriverRole } from "../../middleware/requireDriverRole.js";

// import driverDashboardRoutes from "./dashboard.route.js";
import driverOrdersRoutes from "./orders.route.js";

const router = Router();

router.use(authenticate, requireDriverRole);

// router.use("/dashboard", riderDashboardRoutes);
router.use("/orders", driverOrdersRoutes);

export default router;