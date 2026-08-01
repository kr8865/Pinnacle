const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess, buildMeta } = require('../utils/apiResponse');
const { getPagination } = require('../utils/queryHelpers');

const Notification = require('../models/Notification.model');

/** GET /notifications (auth) — paginated, unread count */
const listNotifications = catchAsync(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.user._id };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, { data: notifications, meta: { ...buildMeta(page, limit, total), unreadCount } });
});

/** PATCH /notifications/:id/read */
const markRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw ApiError.notFound('Notification not found');

  notification.isRead = true;
  await notification.save();

  return sendSuccess(res, { message: 'Notification marked as read', data: notification });
});

/** PATCH /notifications/read-all */
const markAllRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  return sendSuccess(res, { message: 'All notifications marked as read' });
});

module.exports = { listNotifications, markRead, markAllRead };
