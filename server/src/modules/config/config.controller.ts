import type { Request, Response } from 'express';
import { ConfigService } from './config.service.js';
import type { UpdateConfigPayload } from './config.schemas.js';

export class ConfigController {
  static async getConfig(req: Request, res: Response): Promise<void> {
    const config = await ConfigService.getConfig();
    res.status(200).json(config);
  }

  static async updateConfig(req: Request, res: Response): Promise<void> {
    const data = req.body as UpdateConfigPayload;
    const config = await ConfigService.updateConfig(data);
    res.status(200).json(config);
  }
}
