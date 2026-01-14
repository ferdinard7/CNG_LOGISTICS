-- CreateEnum
CREATE TYPE "DispatchPackageSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "DispatchUrgency" AS ENUM ('STANDARD', 'EXPRESS', 'SAME_DAY');

-- AlterTable
ALTER TABLE "KycProfile" ADD COLUMN     "bodyType" TEXT,
ADD COLUMN     "driverInVehiclePhotoUrl" TEXT,
ADD COLUMN     "driversLicenseBackUrl" TEXT,
ADD COLUMN     "driversLicenseFrontUrl" TEXT,
ADD COLUMN     "hasValidInsurance" BOOLEAN,
ADD COLUMN     "hasValidVehiclePapers" BOOLEAN,
ADD COLUMN     "loadCapacity" TEXT,
ADD COLUMN     "motorcycleColor" TEXT,
ADD COLUMN     "motorcyclePhotos" JSONB,
ADD COLUMN     "ninBackUrl" TEXT,
ADD COLUMN     "ninFrontUrl" TEXT,
ADD COLUMN     "riderKycJson" JSONB,
ADD COLUMN     "riderOnMotorcyclePhotoUrl" TEXT,
ADD COLUMN     "vehicleColor" TEXT,
ADD COLUMN     "vehicleInGoodCondition" BOOLEAN,
ADD COLUMN     "vehicleKycJson" JSONB,
ADD COLUMN     "vehiclePhotos" JSONB,
ADD COLUMN     "vehicleTrim" TEXT,
ADD COLUMN     "vin" TEXT;
