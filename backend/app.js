/**
 * app.js
 *
 * Express application factory.
 * Configures middleware, mounts routes, and attaches error handler.
 * Kept separate from server.js so it can be imported in tests.
 */

const express = require('express');
const cors = require('cors');
const analyzeRouter = require('./routes/analyze');
const chatRouter = require('./routes/chat');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors());

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'PharmaGuard API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', analyzeRouter);
app.use('/api', chatRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: true,
    code: 'NOT_FOUND',
    message: 'Endpoint not found. Use POST /api/analyze.',
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER routes
app.use(errorHandler);

module.exports = app;
