import type { Request, Response } from 'express';
import { AdminService } from './admin.service.js';
import { AppError } from '../../utils/AppError.js';

export class AdminController {
  static async uploadImage(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new AppError('No se ha proporcionado ningún archivo para subir.', 400);
    }

    const imageUrl = await AdminService.uploadImage(req.file.buffer);

    res.status(200).json({
      success: true,
      imageUrl,
    });
  }
}
