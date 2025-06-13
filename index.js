/**
 * Main entry point for Express server
 * - Sets up middlewares, routing, and error handling
 * - Uses dynamicRoutes for scraping endpoints
 * - Includes clear cache endpoint
 */

const express = require("express");
const app = express();

const config = require("./config");
const apiBaseMiddleware = require("./middleware/apiBase");
const dynamicRoutes = require("./routes/dynamic.routes");
const cache = require("./cache/jsonCache");

app.set("trust proxy", true); // Trust reverse proxy (if behind proxy like nginx)

/**
 * Middleware: JSON body parser & custom apiBase
 */
app.use(express.json());
app.use(apiBaseMiddleware);

/**
 * All dynamic scraping routes
 */
app.use("/", dynamicRoutes);

/**
 * POST /clear-cache
 * Clear cache manually (by key or all)
 */
app.post("/clear-cache", (req, res) => {
  const { key: key } = req.body;
  cache.clearCache(key);
  res.json({
    message: key ? `Cache for "${key}" cleared` : "All cache cleared",
    timestamp: new Date().toISOString(),
  });
});

/**
 * 404 Fallback
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
app.use((req, res) => {
  console.warn("[404]", `${req.apiBase}${req.originalUrl}`);
  res.status(404).json({
    code: 404,
    error: "Endpoint not found",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Global error handler
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
app.use((err, req, res) => {
  console.error("[ERROR]", err.stack);
  res.status(500).json({
    code: 500,
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Start the Express server
 */
app.listen(config.PORT, () => {
  console.info("Server is running...");
  console.info("App URL:", `http://localhost:${config.PORT}`);
  console.info("Environment:", process.env.NODE_ENV || "development");
});
