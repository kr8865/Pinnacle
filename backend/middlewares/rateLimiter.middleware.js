const rateLimit = require('express-rate-limit');

const windowMinutes = Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15;
const max = Number(process.env.RATE_LIMIT_MAX) || 200;
const isProduction = process.env.NODE_ENV === 'production';

// Rate limiting is only enforced in production. Local/dev testing involves far
// more auth/API calls in a short window than a real user ever would, so these
// limiters would otherwise block normal development work.
const globalLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
  message: { success: false, message: 'Too many requests, please try again later.', errors: [] },
});

// Tighter limiter for auth endpoints to slow down brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
  message: { success: false, message: 'Too many auth attempts, please try again later.', errors: [] },
});

module.exports = { globalLimiter, authLimiter };
