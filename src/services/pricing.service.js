import logger from "../config/logger.js";

/**
 * Placeholder distance estimator.
 * If lat/lng exists: do rough haversine.
 * If missing: return null; (later integrate Google/Mapbox distance matrix)
 */
const toRad = (v) => (v * Math.PI) / 180;

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const estimateDispatchDistanceAndEta = ({
  pickupLat,
  pickupLng,
  deliveryLat,
  deliveryLng,
}) => {
  if (
    typeof pickupLat !== "number" ||
    typeof pickupLng !== "number" ||
    typeof deliveryLat !== "number" ||
    typeof deliveryLng !== "number"
  ) {
    return { distanceKm: null, etaMinutes: null };
  }

  const distanceKm = haversineKm(pickupLat, pickupLng, deliveryLat, deliveryLng);

  // naive: 25km/h average in-city
  const etaMinutes = Math.max(5, Math.round((distanceKm / 25) * 60));

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    etaMinutes,
  };
};

export const estimateDispatchPrice = ({ distanceKm, packageSize, urgency }) => {
  // simple, tunable placeholder pricing
  const base = 800; // NGN
  const perKm = 250; // NGN per km

  const sizeMultiplier = {
    SMALL: 1.0,
    MEDIUM: 1.25,
    LARGE: 1.6,
  }[packageSize];

  const urgencyMultiplier = {
    STANDARD: 1.0,
    EXPRESS: 1.3,
    SAME_DAY: 1.6,
  }[urgency];

  const km = typeof distanceKm === "number" ? distanceKm : 3; // fallback

  const amount = (base + km * perKm) * sizeMultiplier * urgencyMultiplier;

  logger.info("Dispatch price estimate", {
    km,
    packageSize,
    urgency,
    amount: Number(amount.toFixed(2)),
  });

  return Number(amount.toFixed(2));
};