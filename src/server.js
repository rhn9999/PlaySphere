import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';

let server;

const startServer = async () => {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // Ensure geospatial 2dsphere and text indexes are created on startup
    try {
      const { Venue, Player, OpenMatch } = await import('./models/index.js');
      await Promise.allSettled([
        Venue.syncIndexes(),
        Player.syncIndexes(),
        OpenMatch.syncIndexes()
      ]);
      console.log('📍 Geospatial 2dsphere and text indexes synced on startup');
    } catch (indexErr) {
      console.warn('⚠️ Index sync notice:', indexErr.message);
    }

    // 2. Start Express HTTP Server
    server = app.listen(env.PORT, () => {
      console.log(`🚀 PlaySphere Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`📡 Health Check available at http://localhost:${env.PORT}/health and /api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`🔥 Port ${env.PORT} is already occupied. Another instance is likely running.`);
      } else {
        console.error('🔥 Server listen error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown Handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      console.log('Database connection terminated.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught Exception:', error);
  process.exit(1);
});

startServer();
