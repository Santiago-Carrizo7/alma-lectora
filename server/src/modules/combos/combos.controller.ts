import type { Request, Response } from 'express';
import { CombosService } from './combos.service.js';
import type { GetCombosQuery, CreateComboInput, UpdateComboInput, ComboIdParam } from './combos.schemas.js';

export class CombosController {
  static async getCombos(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as GetCombosQuery;
    const result = await CombosService.getCombos(query);
    res.status(200).json(result);
  }

  static async getCombo(req: Request, res: Response): Promise<void> {
    const { id } = req.params as ComboIdParam;
    const result = await CombosService.getComboById(id);
    res.status(200).json(result);
  }

  static async createCombo(req: Request, res: Response): Promise<void> {
    const data = req.body as CreateComboInput;
    const result = await CombosService.createCombo(data);
    res.status(201).json(result);
  }

  static async updateCombo(req: Request, res: Response): Promise<void> {
    const { id } = req.params as ComboIdParam;
    const data = req.body as UpdateComboInput;
    const result = await CombosService.updateCombo(id, data);
    res.status(200).json(result);
  }

  static async deleteCombo(req: Request, res: Response): Promise<void> {
    const { id } = req.params as ComboIdParam;
    await CombosService.deleteCombo(id);
    res.status(204).send();
  }
}
