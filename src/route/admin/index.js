import { Router } from "express";
import adminOverviewRoutes from "./overview.route.js";
import adminOrdersRoutes from "./orders.route.js";
import adminUsersRoutes from "./users.route.js";
// import adminServicesRoutes from "./services.route.js";
import adminKycRoutes from "./kyc.route.js";

const router = Router();

router.use("/overview", adminOverviewRoutes);
router.use("/orders", adminOrdersRoutes);
router.use("/users", adminUsersRoutes);
// router.use("/services", adminServicesRoutes);
router.use("/kyc", adminKycRoutes);

export default router;