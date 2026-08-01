/**
 * Sends a success envelope consistent with API_CONTRACT.md.
 * For list endpoints pass `meta` ({ page, limit, total, pages }).
 */
const sendSuccess = (res, { statusCode = 200, message, data, meta } = {}) => {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data !== undefined ? data : null;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const buildMeta = (page, limit, total) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});

module.exports = { sendSuccess, buildMeta };
