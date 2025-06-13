/**
 * Async error wrapper for Express route handlers
 * - Wraps an async function and forwards errors to Express error handler
 * @param {function} fn - Express route handler (async)
 * @returns {function} - Wrapped Express route handler
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
