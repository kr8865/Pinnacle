const { validationResult } = require('express-validator');

/**
 * Runs after express-validator check chains. Returns the standard error
 * envelope from API_CONTRACT.md if any validation failed.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path || e.param, message: e.msg }));
  return res.status(400).json({ success: false, message: 'Validation failed', errors });
};

module.exports = validate;
