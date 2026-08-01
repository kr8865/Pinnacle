const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 5000;

/**
 * Connects to MongoDB with retry/backoff. Never throws synchronously —
 * safe to call from server bootstrap even when the DB is unreachable
 * (useful for smoke-testing module loading without a live database).
 */
const connectDB = async (attempt = 1) => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pinnacle_tuition';
  try {
    await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    // eslint-disable-next-line no-console
    console.log(`[db] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[db] MongoDB connection failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
    if (attempt >= MAX_RETRIES) {
      // eslint-disable-next-line no-console
      console.error('[db] Max retries reached. Continuing without DB connection.');
      return null;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectDB(attempt + 1);
  }
};

mongoose.connection.on('disconnected', () => {
  // eslint-disable-next-line no-console
  console.warn('[db] MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error(`[db] MongoDB error: ${err.message}`);
});

module.exports = connectDB;
