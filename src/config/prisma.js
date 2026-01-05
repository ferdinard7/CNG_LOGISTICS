import { PrismaClient } from "@prisma/client";
import logger  from "./logger.js";

const prisma = new PrismaClient();


export const connectPrisma = async() => {
  try {
    await prisma.$connect();
    logger.info('✅ Prisma connected to postgreSQL database successfully');
  } catch (err) {
    logger.error('❌ Prisma failed to connect to database:', err);
    process.exit(1);
  }
}
export default prisma;