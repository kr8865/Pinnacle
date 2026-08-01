/**
 * Shared helpers for the `?page=&limit=&sort=&search=` convention used by
 * every list endpoint per API_CONTRACT.md.
 */
const getPagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/** Parses a `sort` query param like `-createdAt` or `name,-createdAt` into a Mongoose sort object. */
const getSort = (sort, fallback = { createdAt: -1 }) => {
  if (!sort) return fallback;
  return sort
    .split(',')
    .reduce((acc, field) => {
      const trimmed = field.trim();
      if (!trimmed) return acc;
      if (trimmed.startsWith('-')) acc[trimmed.slice(1)] = -1;
      else acc[trimmed] = 1;
      return acc;
    }, {});
};

module.exports = { getPagination, getSort };
