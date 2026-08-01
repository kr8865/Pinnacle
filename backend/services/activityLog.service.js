const ActivityLog = require('../models/ActivityLog.model');

/**
 * Writes an ActivityLog entry for a security-relevant event. Never throws —
 * logging failures must not break the primary request flow.
 */
const logActivity = async ({ user, action, req, meta = {} }) => {
  try {
    await ActivityLog.create({
      user: user || undefined,
      action,
      ip: req ? req.ip || req.connection?.remoteAddress : undefined,
      userAgent: req ? req.headers['user-agent'] : undefined,
      meta,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[activityLog] Failed to log action "${action}": ${err.message}`);
  }
};

module.exports = { logActivity };
