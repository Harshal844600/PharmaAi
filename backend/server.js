/**
 * server.js
 *
 * PharmaGuard API — Production Server Entry Point
 *
 * Responsibilities:
 *   1. Load environment variables
 *   2. Connect to MongoDB
 *   3. Start the Express HTTP server
 *   4. Handle graceful shutdown (SIGTERM / SIGINT)
 */

require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pharma_guard';

/**
 * Connect to MongoDB with retry-friendly options.
 */
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000, // Fail fast if MongoDB is unreachable
    });
    console.log(`[MongoDB] Connected → ${MONGO_URI.replace(/\/\/.*@/, '//***@')}`);
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    console.warn('[MongoDB] Starting server without DB — results will NOT be persisted.');
    // We don't exit — the API will still function; DB saves are non-blocking
  }
}

/**
 * Graceful shutdown handler.
 * Closes the MongoDB connection before exiting.
 */
async function gracefulShutdown(signal) {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed.');
  } catch (err) {
    console.error('[MongoDB] Error during shutdown:', err.message);
  }
  process.exit(0);
}

// ─── Startup ──────────────────────────────────────────────────────────────────
(async () => {
  await connectToDatabase();

  const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     💊  PharmaGuard API  —  RIFT 2026            ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Server    : http://localhost:${PORT}                 ║`);
    console.log(`║  Health    : GET  /health                        ║`);
    console.log(`║  Analyze   : POST /api/analyze                   ║`);
    console.log(`║  MongoDB   : ${mongoose.connection.readyState === 1 ? '✓ Connected' : '✗ Disconnected'}                     ║`);
    console.log(`║  Groq AI   : ${process.env.GROQ_API_KEY ? '✓ Configured' : '✗ Not configured (fallback mode)'}           ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });

  // ─── Graceful shutdown signals ──────────────────────────────────────────────
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // ─── Unhandled errors ───────────────────────────────────────────────────────
  process.on('uncaughtException', (err) => {
    console.error('[Fatal] Uncaught exception:', err);
    // Don't exit — keep the server running for the hackathon demo
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[Warning] Unhandled promise rejection:', reason);
    // Don't exit — keep the server running even if Gemini/MongoDB has issues
  });
})();
