import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { version } from "../config/version.js";
import  logger  from "../config/logger.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CNG Logistics Backend API",
      version,
      description: "API documentation for CNG Logistics Backend",
    },
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
    // 👇 REMOVE THIS to apply only to selected endpoints
    // security: [{ bearerAuth: [] }],
  },
  apis: ["./src/route/*.js", "./src/swaggerDocs/*.js"], 
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app, port) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  logger.info(`Swagger docs available at http://localhost:${port}/api/docs`);
}

export { swaggerDocs };