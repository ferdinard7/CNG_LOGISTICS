// src/routes/chat.route.js
import { Router } from "express";
import { chatReply } from "../controller/chat.controller.js";

const router = Router();
router.post("/", chatReply);

export default router;