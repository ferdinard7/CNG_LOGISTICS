import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import logger from "./config/logger.js";

import authRoutes from "./route/auth.route.js";
import kycRoutes from "./route/kyc.route.js";
import adminKycRoutes from "./route/admin.kyc.route.js";
import { swaggerDocs } from "./utils/swagger.js";

const app = express();

// CORS (cookies support)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// HTTP logs
app.use(
  morgan("dev", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// Health check
app.get("/", (req, res) =>
  res.json({ success: true, message: "CNC Logistics API running" })
);

// 🚀 Swagger MUST be before routes & 404
swaggerDocs(app, env.port);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin/kyc", adminKycRoutes);

// ❌ 404 LAST — always
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;