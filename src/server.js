import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./config/logger.js";
import { connectPrisma } from "./config/prisma.js";
// import { swaggerDocs } from './utils/swagger.js';

// Connect to the database
await connectPrisma();

app.listen(env.port, () => {
  logger.info(`✅ Server running on port ${env.port}`);
});