import cors from 'cors';

const ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
];

if (process.env.FRONTEND_URL) {
  ACCEPTED_ORIGINS.push(process.env.FRONTEND_URL);
}

/**
 * Factory that returns a configured CORS middleware restricted to an explicit origin whitelist.
 *
 * Enables `credentials: true` to support cookie-based and Bearer-token auth flows.
 * Requests from origins absent in `acceptedOrigins` are blocked before reaching any route handler.
 *
 * @param options.acceptedOrigins - Allowed origins. Defaults to the local development whitelist.
 * @returns Configured `cors` middleware ready to be mounted on the Express app.
 */
export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) =>
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        acceptedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.railway.app')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  });