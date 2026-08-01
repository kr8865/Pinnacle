const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { emitToUser } = require('../services/notification.service');

const Message = require('../models/Message.model');
const User = require('../models/User.model');

/** GET /messages/:withUserId (auth) — conversation thread */
const getThread = catchAsync(async (req, res) => {
  const { withUserId } = req.params;

  const otherUser = await User.findById(withUserId).select('name email role');
  if (!otherUser) throw ApiError.notFound('User not found');

  const messages = await Message.find({
    $or: [
      { from: req.user._id, to: withUserId },
      { from: withUserId, to: req.user._id },
    ],
  }).sort({ createdAt: 1 });

  await Message.updateMany({ from: withUserId, to: req.user._id, isRead: false }, { $set: { isRead: true } });

  return sendSuccess(res, { data: { withUser: otherUser, messages } });
});

/** POST /messages — { to, body } (emits socket message:new) */
const sendMessage = catchAsync(async (req, res) => {
  const { to, body } = req.body;

  const recipient = await User.findById(to);
  if (!recipient) throw ApiError.badRequest('Recipient does not exist');

  const message = await Message.create({ from: req.user._id, to, body });

  emitToUser(to, 'message:new', message);
  emitToUser(req.user._id, 'message:new', message);

  return sendSuccess(res, { statusCode: 201, message: 'Message sent', data: message });
});

module.exports = { getThread, sendMessage };
