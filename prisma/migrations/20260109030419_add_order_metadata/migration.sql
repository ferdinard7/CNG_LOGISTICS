-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'ASSIGNED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "etaMinutes" INTEGER,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "pickupLat" DOUBLE PRECISION,
ADD COLUMN     "pickupLng" DOUBLE PRECISION,
ADD COLUMN     "tipAmount" DECIMAL(65,30) DEFAULT 0.0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLat" DOUBLE PRECISION,
ADD COLUMN     "lastLng" DOUBLE PRECISION,
ADD COLUMN     "lastLocationUpdatedAt" TIMESTAMP(3);
