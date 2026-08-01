require('dotenv').config();

const http = require('http');
const createApp = require('./app');
const connectDB = require('./config/db');
const initSockets = require('./sockets');

const PORT = process.env.PORT || 5003;

const app = createApp();
const server = http.createServer(app);

// Socket.IO is initialized against the raw http server so it can share
// the same port. This also calls notification.service#setIO internally.
initSockets(server);

// connectDB() never throws synchronously and retries internally, so a
// missing/unreachable Mongo instance never crashes the process.
connectDB().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Unexpected error while connecting to MongoDB:', err.message);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] Pinnacle Tuition Classes backend listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  // eslint-disable-next-line no-console
  console.error('[server] Uncaught Exception:', err);
});

module.exports = server;
