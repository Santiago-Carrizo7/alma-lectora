import { app } from './app.js';
import { disconnectDB } from './config/db.js';
import { startCronJobs } from './jobs/index.js';

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

if (process.env.NODE_ENV !== 'production') {
  startCronJobs();
  const server = app.listen(Number(PORT), HOST, () => {
    console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection', err);
    server.close(async () => {
      await disconnectDB();
      process.exit(1);
    });
  });

  process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    await disconnectDB();
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });
}
