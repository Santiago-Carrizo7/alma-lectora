import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import type { LoginPayload } from './auth.schemas.js';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const payload = req.body as LoginPayload;
    const result = await AuthService.login(payload);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24hs
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({ success: true });
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    const refreshTokenStr = req.cookies?.refresh_token;
    const result = await AuthService.refresh(refreshTokenStr);

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24hs
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({ success: true });
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('access_token', {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      path: '/api/v1/auth',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ success: true });
  }

  static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const result = await AuthService.getProfile(req.user.id);
    res.status(200).json(result);
  }
}
