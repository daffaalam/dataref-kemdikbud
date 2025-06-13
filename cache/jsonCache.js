const fs = require("fs");
const path = require("path");
const config = require("../config");

// Determine absolute path for the cache directory
const rawDir = process.env.CACHE_DIR || "../.cache";
const CACHE_DIR = path.isAbsolute(rawDir)
  ? rawDir
  : path.join(__dirname, rawDir);

// Create cache directory if needed
if (config.CACHE_ENABLED && !fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Ensure the directory for the given file path exists.
 * If it doesn't exist, create it recursively.
 *
 * @param {string} filePath - The full file path for which the parent directory should be ensured
 */
function ensureDirExists_(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generate a safe cache file path from a key.
 * The first part of the key becomes a top-level folder.
 * The rest can be foldered or flattened depending on useSubfolders.
 *
 * @param {string} key - Cache key, e.g. "table/dikdas/001-002"
 * @param {boolean} [useSubfolders=true] - Whether to use subfolder structure or flatten after top-level
 * @returns {string} - Full path to cache file
 */
function getFilePath_(key, useSubfolders = true) {
  const parts = key.split("/").map((part) =>
    part
      .toLowerCase()
      .replace(/[^a-z0-9-]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, ""),
  );

  const [topLevel, ...rest] = parts;

  // Fallback: if no subpath, use "index" as filename
  const filename =
    rest.length === 0
      ? "index"
      : useSubfolders
        ? path.join(...rest)
        : rest.join("-");

  return path.join(CACHE_DIR, topLevel, filename + ".json");
}

/**
 * Attempt to read and validate a cache file.
 * Will return null if the file does not exist, is expired, or is invalid JSON.
 *
 * @param {string} filePath - Absolute path to the cache file.
 * @returns {{ data: any, scrapedAt: string } | null} - Parsed data and timestamp, or null if invalid.
 */
function tryReadCacheFile_(filePath) {
  if (!fs.existsSync(filePath)) return null;

  try {
    const { data: data, timestamp: timestamp } = JSON.parse(
      fs.readFileSync(filePath, "utf-8"),
    );

    if (Date.now() - timestamp > config.CACHE_TTL) {
      fs.unlinkSync(filePath); // Delete expired cache
      return null;
    }

    return {
      data,
      scrapedAt: new Date(timestamp).toISOString(),
    };
  } catch (err) {
    console.error("[CACHE] Failed to read or parse cache file:", err);
    fs.unlinkSync(filePath); // Delete corrupted file
    return null;
  }
}

/**
 * Read data from cache if valid and not expired
 * @param {string} key
 * @returns { { data: any, scrapedAt: string } | null }
 */
function getCache(key) {
  if (!config.CACHE_ENABLED) return null;

  // Handle wildcard key: e.g., "npsn/*/123456"
  if (key.includes("*")) {
    const parts = key.split("/");
    const wildcardIndex = parts.indexOf("*");
    const baseDir = path.join(CACHE_DIR, ...parts.slice(0, wildcardIndex));

    if (!fs.existsSync(baseDir)) return null;

    for (const entry of fs.readdirSync(baseDir)) {
      const candidateParts = [...parts];
      candidateParts[wildcardIndex] = entry;
      const filePath = getFilePath_(candidateParts.join("/"));
      const result = tryReadCacheFile_(filePath);
      if (result) return result;
    }

    return null;
  }

  // Regular key without wildcard
  const filePath = getFilePath_(key);
  return tryReadCacheFile_(filePath);
}

/**
 * Write data to cache (file-based JSON)
 * @param {string} key
 * @param {any} data
 */
function setCache(key, data) {
  if (!config.CACHE_ENABLED) return;

  const filePath = getFilePath_(key);
  const payload = {
    data: data,
    timestamp: Date.now(),
  };

  try {
    ensureDirExists_(filePath);
    fs.writeFileSync(filePath, JSON.stringify(payload), "utf-8");
  } catch (err) {
    console.error("[CACHE] Error writing cache:", err);
  }
}

/**
 * Clear cache manually (by key or all)
 * @param {string} [key=""] - If empty, clears all cache files
 */
function clearCache(key = "") {
  if (!config.CACHE_ENABLED) return;
  if (!fs.existsSync(CACHE_DIR)) return; // Nothing to clear
  if (key) {
    const filePath = getFilePath_(key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } else {
    fs.readdirSync(CACHE_DIR).forEach((file) => {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    });
  }
}

/**
 * Generate a structured cache key from a full URL.
 * Strips base URL and optional fixed prefix like "pendidikan",
 * then transforms path parts into a consistent cache key format.
 *
 * Special handling:
 * - If path structure is like "group/id/page" (e.g., "dikti/026000/2"),
 *   it transforms to "group/page/id" for better folder structure.
 *
 * Fallback:
 * - If path doesn't match expected structure, return as-is (cleaned).
 *
 * @param {string} url - Full URL to convert into a cache key
 * @returns {string} cacheKey - Structured cache key for caching logic
 */
function getKeyFromUrl(url) {
  // Remove base URL and fixed prefix
  const relativeUrl = url
    .replace(config.BASE_URL, "")
    .replace(/^\/?pendidikan\/?/, "")
    .replace(/^\/+|\/+$/g, "");

  const parts = relativeUrl.split("/");

  if (parts.length >= 3) {
    const [group, id, page] = parts;
    return `${group}/${page}/${id}`;
  }

  // If structure doesn't match, return cleaned relative path
  return relativeUrl;
}

module.exports = {
  getCache: getCache,
  setCache: setCache,
  clearCache: clearCache,
  getKeyFromUrl: getKeyFromUrl,
};
