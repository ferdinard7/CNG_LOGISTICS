import logger from "../config/logger.js";

const mode = process.env.PREMBLY_MODE || "test"; // test | live

export const verifyRiderWithPrembly = async ({ nin, motorcyclePlate }) => {
  if (mode === "test") {
    logger.info("Prembly(test): verify rider", { nin, motorcyclePlate });
    return {
      status: "VERIFIED",
      reference: `TEST-${Date.now()}`,
      data: { ninMatch: true, plateMatch: true },
      raw: { message: "Test verification success" },
    };
  }

  // LIVE MODE (later):
  // call actual Prembly endpoint with API key
  // return normalized response as above
  throw new Error("Prembly live mode not implemented yet");
};

export const verifyTruckDriverWithPrembly = async ({ driversLicenseNumber, vehiclePlate }) => {
  if (mode === "test") {
    logger.info("Prembly(test): verify truck driver", { driversLicenseNumber, vehiclePlate });
    return {
      status: "VERIFIED",
      reference: `TEST-${Date.now()}`,
      data: { licenseMatch: true, plateMatch: true },
      raw: { message: "Test verification success" },
    };
  }

  // LIVE MODE (later)
  throw new Error("Prembly live mode not implemented yet");
};