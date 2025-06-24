/**
 * CSV Export Helper
 * @param {import('express').Response} res - Express response object
 * @param {{ data: Array, scrapedAt: string }} data - Data object containing rows and timestamp
 * @param {string} filename - Filename (without extension or date suffix)
 */
function csvExport(res, data, filename) {
  const csv = jsonToCsv(data.data);
  res.header("Content-Type", "text/csv");
  res.attachment(`referensi-data-kemdikbud-${filename}-${formatDate_(data.scrapedAt)}.csv`);
  return res.send(csv);
}

/**
 * Convert JSON array to CSV string
 * - Always quote all fields for Excel / Google Sheets compatibility
 * - Escape internal double-quotes (" -> "")
 * - Null / undefined -> empty string ""
 * - Skip keys: _ref, _link
 *
 * @param {Array<Object>} dataArray - Array of objects to convert
 * @returns {string} CSV string
 */
function jsonToCsv(dataArray) {
  // Validate input: must be non-empty array
  if (!Array.isArray(dataArray) || dataArray.length === 0) return "";

  // Define keys to skip
  const skipKeys = new Set(["_ref", "_link"]);

  // Use keys from first row as header, but skip keys in skipKeys
  const keys = Object.keys(dataArray[0]).filter((key) => !skipKeys.has(key));
  const header = keys.map((key) => `"${key}"`).join(",");

  // Generate CSV rows
  const rows = dataArray.map((row) =>
    keys
      .map((key) => {
        let val = row[key];
        // Convert null/undefined to empty string, objects to JSON string, or to string
        if (val === null || val === undefined) val = "";
        else if (typeof val === "object") val = JSON.stringify(val);
        else val = String(val);

        // Escape internal double quotes
        val = val.replace(/"/g, '""');

        return `"${val}"`;
      })
      .join(","),
  );

  // Combine header and rows
  return [header, ...rows].join("\n");
}

/**
 * Format date to YYMMDDhhmm for file naming
 * @param {Date|string|number} [date] - Date object, timestamp, or ISO string (defaults to now)
 * @returns {string} Formatted date string (e.g., "2406051430")
 */
function formatDate_(date = new Date()) {
  // If not a Date object, attempt to convert
  if (!(date instanceof Date)) {
    // If it's a string or number, convert
    if (typeof date === "string" || typeof date === "number") {
      date = new Date(date);
    } else {
      // Fallback for other types (boolean, object, etc.)
      date = new Date();
    }
  }

  // Check for invalid date and fallback to now
  if (isNaN(date.getTime())) {
    date = new Date();
  }

  function pad(n) {
    return n < 10 ? "0" + n : n;
  }

  return (
    String(date.getFullYear()).slice(-2) +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes())
  );
}

module.exports = { csvExport: csvExport, jsonToCsv: jsonToCsv };
