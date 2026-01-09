import { Router } from "express";
import { riderOverview } from "../../controller/rider/dashboard.controller.js";

const router = Router();
router.get("/overview", riderOverview);

export default router;