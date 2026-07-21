import app from './app';
import { env } from './config/env';
import { MigrationScheduleService } from './services/MigrationScheduleService';

const scheduleService = MigrationScheduleService.getInstance();

const server = app.listen(env.PORT, () => {
  console.info(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  // Start automated migration scheduler
  scheduleService.start();
});

// Handle graceful shutdowns
const gracefulShutdown = (signal: string) => {
  console.info(`Received ${signal}. Shutting down gracefully...`);
  scheduleService.stop();
  server.close(() => {
    console.info('HTTP Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
