const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const signRefreshToken = (payload, remember = false) => {
  const days = remember
    ? Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30)
    : Number(process.env.JWT_REFRESH_EXPIRES_DAYS_SHORT || 1);
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${days}d`,
  });
};

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const refreshExpiryDate = (remember = false) => {
  const days = remember
    ? Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30)
    : Number(process.env.JWT_REFRESH_EXPIRES_DAYS_SHORT || 1);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

/** Signed, time-limited token for password reset links (not JWT — plain HMAC digest stored, raw token emailed). */
const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshExpiryDate,
  generateResetToken,
  hashToken,
};
