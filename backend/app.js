const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const { globalLimiter } = require('./middlewares/rateLimiter.middleware');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const routes = require('./routes');

/**
 * Express app factory. Kept separate from server.js so it can be
 * required (e.g. in tests / smoke checks) without opening a port or
 * connecting to Mongo/Socket.IO.
 *
 * Middleware order follows API_CONTRACT.md:
 * helmet -> cors -> rateLimiter -> express-mongo-sanitize -> hpp -> xss-clean
 * -> morgan -> cookie-parser -> body parsers -> routes -> 404 -> error handler.
 *
 * NOTE: express-mongo-sanitize / xss-clean only sanitize `req.body` if the
 * body has already been parsed into an object — they no-op on an
 * unparsed/undefined body. To satisfy the contract's stated ordering while
 * still actually sanitizing POST/PATCH bodies (this app handles student PII
 * and payment data), the body parsers are registered immediately before the
 * sanitizers rather than dead last. Cookie-parser/morgan positions match the
 * contract exactly since they have no such dependency.
 */
const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());

  // CLIENT_URL may be a single origin or a comma-separated list (e.g. local
  // dev + a deployed frontend), so requests from any of them are allowed.
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Vercel generates a distinct URL per branch/deployment/project alias
  // (e.g. pinnacle-git-main-<team>.vercel.app, pinnacle-<hash>-<team>.vercel.app,
  // or an entirely renamed project) — allow any *.vercel.app origin so this
  // never needs updating again as deployments change.
  const vercelPreviewPattern = /^https:\/\/[\w-]+\.vercel\.app$/;

  app.use(
    cors({
      origin: (origin, callback) => {
        // No Origin header (curl, server-to-server, health checks) — allow.
        if (!origin || allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS: origin "${origin}" is not allowed`));
      },
      credentials: true,
    })
  );
  app.use(globalLimiter);

  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(mongoSanitize());
  app.use(hpp());
  app.use(xss());

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'OK', data: { uptime: process.uptime() } });
  });

  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
