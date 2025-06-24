const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");
const cache = require("../cache/jsonCache");

/**
 * Scrape the main menu for "DATA PENDIDIKAN > SATUAN PENDIDIKAN"
 * - Collects link, title, and builds absolute _ref and API _link
 * - Adds scrapedAt timestamp
 *
 * @param {string} [apiBase=""] - Your real app domain (like: https://api.example.com)
 * @returns {Promise<{ data: Array<{ title: string, _ref: string, _link: string }>, scrapedAt: string }>}
 */
async function getMenu(apiBase = "") {
  const cacheKey = "menu";
  const cached = cache.getCache(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await axios.get(config.BASE_URL);
  const $ = cheerio.load(response.data);
  const menus = [];

  // Scrape all sub-menu links in "Satuan Pendidikan" dropdown
  $("ul.nav.navbar-nav > li:nth-child(2) > ul.dropdown-menu > li:first-child > ul > li").each((_, el) => {
    const atag = $(el).find("a");
    const title = atag.text().trim();
    const href = atag.attr("href") || "";
    let ref = null;
    let link = null;

    if (atag.hasClass("redlink")) {
      return; // Skip redlinks (inactive links)
    }

    if (href && !href.startsWith("#") && !href.startsWith("javascript")) {
      ref = href.startsWith("http") ? href : `${config.BASE_URL}${href}`;
      link = href.startsWith("http") ? href.replace(config.BASE_URL, `${apiBase}`) : `${apiBase}${href}`;
    }

    menus.push({
      title,
      _ref: ref,
      _link: link,
    });
  });

  cache.setCache(cacheKey, menus);

  return {
    data: menus,
    scrapedAt: new Date().toISOString(), // ISO timestamp for consistency
  };
}

module.exports = { getMenu: getMenu };
