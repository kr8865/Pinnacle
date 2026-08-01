const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User.model');
const { setIO } = require('../services/notification.service');

/**
 * Initializes Socket.IO on top of the raw http server created in server.js.
 * Authenticates connections via the JWT access token sent as
 * `socket.handshake.auth.token` (falls back to an Authorization header),
 * then joins the socket to:
 *   - `user:{userId}`  (always)
 *   - `role:{role}`    (always)
 *   - `course:{courseId}` (on demand, via the `course:join` client event)
 *
 * Registers itself with services/notification.service.js via setIO() so
 * controllers/services can emit through the same helpers
 * (notifyUser/notifyUsers/emitToRoom/emitToUser) without importing
 * socket.io directly.
 */
const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const bearer = socket.handshake.headers?.authorization;
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (bearer && bearer.startsWith('Bearer ') ? bearer.split(' ')[1] : undefined);

      if (!token) return next(new Error('Authentication token missing'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('_id role isActive');
      if (!user || !user.isActive) return next(new Error('Invalid or inactive user'));

      socket.user = { id: user._id.toString(), role: user.role };
      return next();
    } catch (err) {
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);

    socket.on('course:join', (courseId) => {
      if (courseId) socket.join(`course:${courseId}`);
    });

    socket.on('course:leave', (courseId) => {
      if (courseId) socket.leave(`course:${courseId}`);
    });

    // eslint-disable-next-line no-empty-function
    socket.on('disconnect', () => {});
  });

  setIO(io);
  return io;
};

module.exports = initSockets;
