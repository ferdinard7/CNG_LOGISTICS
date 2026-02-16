/**
 * Prembly identity verification service.
 * - Rider: NIN Basic (Nigerian National Identification Number, 11-digit)
 * - Truck Driver: Driver's License FRSC (Nigeria) - drivers_license/face
 * Docs: https://docs.prembly.com/docs/authentication
 */

import { env } from "../config/env.js";
import logger from "../config/logger.js";

const PREMBLY_BASE = env.PREMBLY_BASE_URL || "https://api.prembly.com";

function getHeaders() {
  const apiKey = env.PREMBLY_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Prembly: PREMBLY_SECRET_KEY must be set in .env");
  }
  return {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

function bufferToBase64(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return "";
  return buffer.toString("base64");
}

/**
 * Verify Nigerian NIN (11-digit) via Prembly NIN Basic.
 * @param {string} ninNumber - 11-digit NIN
 * @returns {{ status: string, verified: boolean, reference?: string, data?: object, raw?: object, message?: string }}
 */
export async function verifyNinBasic(ninNumber) {
  if (!ninNumber || !/^\d{11}$/.test(String(ninNumber).trim())) {
    return { status: "invalid_input", verified: false, message: "NIN must be 11 digits" };
  }
  const url = `${PREMBLY_BASE}/verification/vnin-basic`;
  const body = { number: String(ninNumber).trim() };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const ok = res.ok && (data.status === true || data.response_code === "00" || data.verification?.status === "VERIFIED");
    return {
      status: ok ? "VERIFIED" : "FAILED",
      verified: !!ok,
      reference: data.reference || data.request_id || `nin-${Date.now()}`,
      data: data.nin_data || data.verification,
      raw: data,
      message: data.detail || data.message || (ok ? "NIN verified" : "NIN verification failed"),
    };
  } catch (err) {
    logger.error("Prembly NIN verification error:", err.message);
    return {
      status: "FAILED",
      verified: false,
      reference: null,
      message: err.message || "Prembly request failed",
      raw: { error: err.message },
    };
  }
}

/**
 * Verify Nigerian Driver's License via Prembly drivers_license/face.
 * @param {{ number: string, dob: string, imageBase64?: string, imageBuffer?: Buffer }} params
 * @returns {{ status: string, verified: boolean, reference?: string, data?: object, raw?: object, message?: string }}
 */
export async function verifyDriversLicense(params) {
  const { number, dob, imageBase64, imageBuffer } = params || {};
  if (!number || !dob) {
    return {
      status: "invalid_input",
      verified: false,
      message: "Driver's license number and date of birth (YYYY-MM-DD) are required",
    };
  }
  const base64 = imageBase64 || (imageBuffer ? bufferToBase64(imageBuffer) : "");
  if (!base64) {
    return {
      status: "invalid_input",
      verified: false,
      message: "Driver's license front image is required for verification",
    };
  }
  const url = `${PREMBLY_BASE}/verification/drivers_license/face`;
  const body = {
    number: String(number).trim(),
    dob: String(dob).trim(),
    image: base64,
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const ok = res.ok && (data.status === true || data.response_code === "00" || data.verification?.status === "VERIFIED");
    return {
      status: ok ? "VERIFIED" : "FAILED",
      verified: !!ok,
      reference: data.reference || data.request_id || `dl-${Date.now()}`,
      data: data.frsc_data || data.verification,
      raw: data,
      message: data.detail || data.message || (ok ? "Driver's license verified" : "Driver's license verification failed"),
    };
  } catch (err) {
    logger.error("Prembly driver's license verification error:", err.message);
    return {
      status: "FAILED",
      verified: false,
      reference: null,
      message: err.message || "Prembly request failed",
      raw: { error: err.message },
    };
  }
}

/**
 * Verify rider with Prembly (NIN only - Nigerian).
 * @param {{ nin: string, motorcyclePlate?: string }} params
 */
export async function verifyRiderWithPrembly({ nin, motorcyclePlate }) {
  if (!env.PREMBLY_SECRET_KEY) {
    logger.warn("Prembly: PREMBLY_SECRET_KEY not set, skipping verification");
    return {
      status: "NOT_STARTED",
      reference: null,
      data: null,
      raw: { message: "Prembly not configured" },
    };
  }
  const result = await verifyNinBasic(nin);
  return {
    status: result.status,
    reference: result.reference,
    data: result.data,
    raw: result.raw,
  };
}

/**
 * Verify truck driver with Prembly (Driver's License - Nigerian FRSC).
 * @param {{ driversLicenseNumber: string, driverLicenseDob: string, driversLicenseFrontBuffer?: Buffer }} params
 */
export async function verifyTruckDriverWithPrembly({ driversLicenseNumber, driverLicenseDob, driversLicenseFrontBuffer }) {
  if (!env.PREMBLY_SECRET_KEY) {
    logger.warn("Prembly: PREMBLY_SECRET_KEY not set, skipping verification");
    return {
      status: "NOT_STARTED",
      reference: null,
      data: null,
      raw: { message: "Prembly not configured" },
    };
  }
  const result = await verifyDriversLicense({
    number: driversLicenseNumber,
    dob: driverLicenseDob,
    imageBuffer: driversLicenseFrontBuffer,
  });
  return {
    status: result.status,
    reference: result.reference,
    data: result.data,
    raw: result.raw,
  };
}
