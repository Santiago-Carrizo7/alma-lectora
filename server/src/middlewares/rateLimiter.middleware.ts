import { rateLimit } from 'express-rate-limit';

const DEFAULT_RATE_LIMIT_STATUS = 429;
const LOGIN_RATE_LIMIT_MESSAGE =
  'Demasiados intentos de inicio de sesión. Intente de nuevo más tarde.';
const GLOBAL_RATE_LIMIT_MESSAGE =
  'Límite de peticiones excedido. Por favor, intente nuevamente más tarde.';

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(DEFAULT_RATE_LIMIT_STATUS).json({ error: LOGIN_RATE_LIMIT_MESSAGE });
  },
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 150,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(DEFAULT_RATE_LIMIT_STATUS).json({ error: GLOBAL_RATE_LIMIT_MESSAGE });
  },
});
