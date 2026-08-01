const Notification = require('../models/Notification.model');

let ioInstance = null;
const setIO = (io) => {
  ioInstance = io;
};
const getIO = () => ioInstance;

/**
 * Creates a Notification document for a single user and, if Socket.IO is
 * initialized, emits `notification:new` to that user's room.
 */
const notifyUser = async ({ user, type, title, body, link, meta }) => {
  const notification = await Notification.create({ user, type, title, body, link, meta });
  if (ioInstance) {
    ioInstance.to(`user:${user}`).emit('notification:new', notification);
  }
  return notification;
};

/** Creates notifications for many users at once (e.g. all students of a course). */
const notifyUsers = async (userIds, payload) => Promise.all(userIds.map((user) => notifyUser({ ...payload, user })));

/** Emits an arbitrary event to a room without necessarily persisting a Notification. */
const emitToRoom = (room, event, payload) => {
  if (ioInstance) ioInstance.to(room).emit(event, payload);
};

/** Emits an arbitrary event directly to a single user's room (no Notification persisted). */
const emitToUser = (userId, event, payload) => emitToRoom(`user:${userId}`, event, payload);

module.exports = { setIO, getIO, notifyUser, notifyUsers, emitToRoom, emitToUser };
