import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { customerOverview } from "../../controller/customer/dashboard.controller.js";

const router = Router();

router.get("/overview", authenticate, customerOverview);

export default router;
