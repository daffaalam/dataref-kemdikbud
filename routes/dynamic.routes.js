const express = require("express");
const router = express.Router();
const config = require("../config");
const asyncHandler = require("../utils/wrapper");
const { getMenu } = require("../utils/getMenu");
const { getTableData } = require("../utils/getTableData");
const { getInstitutionDetail } = require("../utils/getInstitutionDetail");
const { csvExport } = require("../utils/csvExport");

/**
 * Route: Detail Institution (NPSN detail data)
 */
router.get(
  "/pendidikan/npsn/:npsn",
  asyncHandler(async (req, res) => {
    const data = await getInstitutionDetail(req.params.npsn);
    res.json(data);
  }),
);

/**
 * Route: Table data for deeper area (prov, kota/kab, kecamatan/lembaga)
 * Supports optional ?export=csv query param for CSV download
 */
router.get(
  "/pendidikan/:menu/:areaId/:levelId",
  asyncHandler(async (req, res) => {
    const targetUrl = `${config.BASE_URL}/pendidikan/${req.params.menu}/${req.params.areaId}/${req.params.levelId}`;
    const data = await getTableData(targetUrl, "#table1", req.apiBase);
    if (req.query.export === "csv") {
      return csvExport(
        res,
        data,
        `tabel-${req.params.menu}-${req.params.areaId}-${req.params.levelId}`,
      );
    }
    res.json(data);
  }),
);

/**
 * Route: Table data for menu (provinsi level)
 * Supports optional ?export=csv query param for CSV download
 */
router.get(
  "/pendidikan/:menu",
  asyncHandler(async (req, res) => {
    const targetUrl = `${config.BASE_URL}/pendidikan/${req.params.menu}`;
    const data = await getTableData(targetUrl, "#table1", req.apiBase);
    if (req.query.export === "csv") {
      return csvExport(res, data, `tabel-${req.params.menu}`);
    }
    return res.json(data);
  }),
);

/**
 * Route: Main menu
 * Supports optional ?export=csv query param for CSV download
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await getMenu(req.apiBase);
    if (req.query.export === "csv") {
      return csvExport(res, data, "menu");
    }
    return res.json(data);
  }),
);

module.exports = router;
