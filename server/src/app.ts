import express from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import serverless from 'serverless-http';
import { connectDB } from './config/db.js';
import { corsMiddleware } from './middlewares/cors.js';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

import { authRouter } from './modules/auth/auth.routes.js';
import { booksRouter } from './modules/books/books.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { accessoriesRouter } from './modules/accessories/accessories.routes.js';
import { combosRouter } from './modules/combos/combos.routes.js';
import { configRouter } from './modules/config/config.routes.js';

// Conexión no bloqueante a la base de datos
connectDB().catch((err) => {
  console.error('Failed to connect to DB during app startup:', err);
});

const app: Express = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(corsMiddleware());
app.use(globalRateLimiter);
app.use(express.json());
app.use(cookieParser());

// Rutas API v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/books', booksRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/accessories', accessoriesRouter);
app.use('/api/v1/combos', combosRouter);
app.use('/api/v1/config', configRouter);

app.use(errorHandler);

// Handler compatible con Vercel Serverless
export default app;
export { app };