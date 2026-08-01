/**
 * Wraps an async Express handler so rejected promises are forwarded to
 * the central error handler instead of crashing the process / hanging
 * the request.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
