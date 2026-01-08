/*
  Warnings:

  - You are about to drop the column `idDocUrl` on the `KycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `idNumber` on the `KycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `idType` on the `KycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `licenseDocUrl` on the `KycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `licenseNumber` on the `KycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleDocUrl` on the `KycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `vehiclePlateNo` on the `KycProfile` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `KycProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PremblyStatus" AS ENUM ('NOT_STARTED', 'VERIFIED', 'FAILED');

-- AlterTable
ALTER TABLE "KycProfile" DROP COLUMN "idDocUrl",
DROP COLUMN "idNumber",
DROP COLUMN "idType",
DROP COLUMN "licenseDocUrl",
DROP COLUMN "licenseNumber",
DROP COLUMN "vehicleDocUrl",
DROP COLUMN "vehiclePlateNo",
DROP COLUMN "vehicleType",
ADD COLUMN     "driversLicenseDocUrl" TEXT,
ADD COLUMN     "driversLicenseNumber" TEXT,
ADD COLUMN     "motorcycleMake" TEXT,
ADD COLUMN     "motorcycleModel" TEXT,
ADD COLUMN     "motorcyclePlate" TEXT,
ADD COLUMN     "motorcycleRegDocUrl" TEXT,
ADD COLUMN     "motorcycleType" TEXT,
ADD COLUMN     "motorcycleYear" INTEGER,
ADD COLUMN     "nin" TEXT,
ADD COLUMN     "ninDocUrl" TEXT,
ADD COLUMN     "premblyPayload" JSONB,
ADD COLUMN     "premblyReference" TEXT,
ADD COLUMN     "premblyResponse" JSONB,
ADD COLUMN     "premblyStatus" "PremblyStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "vehicleMake" TEXT,
ADD COLUMN     "vehicleModel" TEXT,
ADD COLUMN     "vehiclePlate" TEXT,
ADD COLUMN     "vehicleRegDocUrl" TEXT,
ADD COLUMN     "vehicleYear" INTEGER;
