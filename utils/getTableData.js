const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");
const cache = require("../cache/jsonCache");

/**
 * Convert string to lowerCamelCase
 * - Removes text in brackets
 * - Removes non-word characters
 * - Capitalizes each word except the first
 * @param {string} str
 * @returns {string}
 */
function toCamelCase_(str) {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/)
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
}

/**
 * Generic table data scraper with dynamic header mapping
 * - Normalizes header keys (lowerCamelCase)
 * - Converts numeric values
 * - Adds `_ref` (absolute href) and `_link` (API link)
 *
 * @param {string} url - Target URL to scrape
 * @param {string} [tableSelector='#table1'] - CSS selector for the table
 * @param {string} [apiBase=''] - Your real app domain (like: https://api.example.com)
 * @returns {Promise<{ data: Array<Object>, scrapedAt: string }>} Object containing data array and timestamp
 */
async function getTableData(url, tableSelector = "#table1", apiBase = "") {
  const cacheKey = `table/${cache.getKeyFromUrl(url)}`;
  const cached = cache.getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  // Extract table headers
  const headers = [];
  $(`${tableSelector} thead tr th`).each((_, el) => {
    const rawHeader = $(el).text().trim();
    const camelKey = toCamelCase_(rawHeader);
    headers.push(camelKey);
  });

  // Extract table rows
  const dataRows = [];
  $(`${tableSelector} tbody tr`).each((_, row) => {
    const rowData = {};
    let ref = null;
    let link = null;

    $(row)
      .find("td")
      .each((i, td) => {
        const key = headers[i] || `col${i}`;
        const rawText = $(td).text().trim();

        // Convert to number if possible
        const num = parseInt(rawText, 10);
        rowData[key] =
          isNaN(num) ||
            (rawText.startsWith("0") && rawText.length > 1) ||
            key === "npsn"
            ? rawText === ""
              ? null
              : rawText
            : num;

        // Only for first column with link
        if (i === 1) {
          const href = $(td).find("a").attr("href") || "";
          if (href && !href.startsWith("#") && !href.startsWith("javascript")) {
            ref = href.startsWith("http") ? href : `${config.BASE_URL}${href}`;
            link = href.startsWith("http")
              ? href.replace(config.BASE_URL, `${apiBase}`)
              : `${apiBase}${href}`;
          }
        }
      });

    rowData._ref = ref;
    rowData._link = link;
    dataRows.push(rowData);
  });

  // Cache result
  cache.setCache(cacheKey, dataRows);

  return {
    data: dataRows,
    scrapedAt: new Date().toISOString(), // ISO string for standard timestamp
  };
}

module.exports = { getTableData: getTableData };
