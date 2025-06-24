/**
 * Application configuration
 * - Reads from process.env or uses default values
 * - Exports constants for use in other modules
 */

// Node environment (default: development)
const ENV = process.env.NODE_ENV || "development";

// Server port (default: 3000)
const PORT = process.env.PORT || 3000;

// Base URL of the source data (default: referensi.data.kemdikbud.go.id)
const BASE_URL = process.env.BASE_URL || "https://referensi.data.kemdikbud.go.id";

// Whether to enable caching (default: true only in production)
const CACHE_ENABLED =
  process.env.CACHE_ENABLED !== undefined ? process.env.CACHE_ENABLED === "true" : ENV === "production";

// Cache Time To Live (ms, default: 24 hours)
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 24 * 60 * 60 * 1000;

module.exports = {
  ENV,
  PORT,
  BASE_URL,
  CACHE_ENABLED,
  CACHE_TTL,
};
