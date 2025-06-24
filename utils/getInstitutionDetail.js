const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");
const cache = require("../cache/jsonCache");

/**
 * Convert string to camelCase
 * - Removes non-word characters
 * - Capitalizes each word except the first
 * @param {string} str
 * @returns {string}
 */
function toCamelCase_(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/)
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
}

/**
 * Clean value
 * - Convert empty string or "-" to null
 * @param {string} value
 * @returns {string|null}
 */
function cleanValue_(value) {
  const clean = value.trim();
  return clean === "" || clean === "-" ? null : clean;
}

/**
 * Scrape detail data of an institution by NPSN, including all tabs
 * - Handles tab: Identitas, Dokumen, Sarana, Kontak, Peta
 * - Special handling for "Akses Internet" and Lintang/Bujur
 *
 * @param {string} npsn - The NPSN (Nomor Pokok Sekolah Nasional) of the institution
 * @returns {Promise<{ data: Object, scrapedAt: string }>} Detail data and timestamp
 */
async function getInstitutionDetail(npsn) {
  const cacheKey = `npsn/*/${npsn}`;
  const cached = cache.getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${config.BASE_URL}/pendidikan/npsn/${npsn}`;
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const detail = {};

  // Get tab names from label (convert to camelCase)
  const tabNames = [];
  $(".tabby-tab label").each((_, el) => {
    const label = $(el).text().trim();
    const key = toCamelCase_(label);
    tabNames.push(key);
  });

  // Loop through each tab content
  $(".tabby-tab .tabby-content").each((i, tab) => {
    const tabName = tabNames[i] || `tab${i}`;
    const tabData = {};

    const rows = $(tab).find("table tr");
    let lastLabel = null;

    rows.each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length >= 4) {
        const label = $(tds[1]).text().trim().replace(":", "");
        let value = $(tds[3]).text().trim() || $(tds[3]).find("a").text().trim();

        value = cleanValue_(value);

        if (label) {
          lastLabel = toCamelCase_(label);

          // Special case for Akses Internet
          if (lastLabel === "aksesInternet" && value) {
            tabData.aksesInternet = [];
            if (value !== null) {
              tabData.aksesInternet.push(value.replace(/^\d+\.\s*/, "").trim());
            }
          } else {
            tabData[lastLabel] = value;
          }
        } else if (lastLabel === "aksesInternet" && value) {
          // Append to aksesInternet array
          if (!tabData.aksesInternet) tabData.aksesInternet = [];
          tabData.aksesInternet.push(value.replace(/^\d+\.\s*/, "").trim());
        }
      }
    });

    // Special handling for tab "Peta" (lintang/bujur)
    if (tabName.includes("peta")) {
      const rawText = $(tab).text();
      const lintangMatch = rawText.match(/Lintang:\s*(-?\d+\.\d+)/);
      const bujurMatch = rawText.match(/Bujur:\s*(-?\d+\.\d+)/);
      tabData.lintang = lintangMatch ? lintangMatch[1] : null;
      tabData.bujur = bujurMatch ? bujurMatch[1] : null;
    }

    detail[tabName] = tabData;
  });

  // Save to cache
  cache.setCache(cacheKey.replace("*", detail?.identitasSatuanPendidikan?.jenjangPendidikan || "unknown"), detail);

  return {
    data: detail,
    scrapedAt: new Date().toISOString(), // ISO timestamp for consistency
  };
}

module.exports = { getInstitutionDetail: getInstitutionDetail };
