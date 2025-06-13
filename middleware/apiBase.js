/**
 * Middleware to dynamically set the API base URL
 * - Adds `req.apiBase` (e.g., http://localhost:3000)
 * - Useful for generating full _link URLs in scraped data
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Next middleware function
 */
module.exports = (req, res, next) => {
  req.apiBase = `${req.protocol}://${req.get("host")}`;
  next();
};
