import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/authenticate.js";
import {
  adminUsersStats,
  adminListUsers,
  adminActivateUser,
  adminDeactivateUser,
} from "../../controller/admin/users.controller.js";

const router = Router();

router.get("/stats", authenticate, requireAdmin, adminUsersStats);
router.get("/", authenticate, requireAdmin, adminListUsers);
router.patch("/:userId/activate", authenticate, requireAdmin, adminActivateUser);
router.patch("/:userId/deactivate", authenticate, requireAdmin, adminDeactivateUser);

export default router;