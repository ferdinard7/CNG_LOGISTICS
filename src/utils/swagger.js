import path from "path";
import { fileURLToPath } from "url";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { version } from "../config/version.js";
import logger from "../config/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CNG Logistics Backend API",
      version,
      description: "API documentation for CNG Logistics Backend. Includes customer orders, payment (Interswitch/Paystack), KYC, rides, and admin endpoints.",
    },
    servers: [
      { url: "https://cng-logistics.onrender.com", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Authorization header using the Bearer scheme. Example: 'Bearer <token>'",
        },
      },
    },
  },
  apis: [
    path.join(projectRoot, "src/route/*.js"),
    path.join(projectRoot, "src/route/**/*.js"),
    path.join(projectRoot, "src/swaggerDocs/*.js"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app, port) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  logger.info(`Swagger docs available at http://localhost:${port}/api/docs (or https://cng-logistics.onrender.com/api/docs in production)`);
}

export { swaggerDocs };