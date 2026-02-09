import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { getMyWallet, requestWithdrawal, myWithdrawals } from "../../controller/rider/wallet.controller.js";

const router = express.Router();

router.get("/wallet", authenticate, getMyWallet);
router.post("/withdrawals", authenticate, requestWithdrawal);
router.get("/withdrawals", authenticate, myWithdrawals);

export default router;