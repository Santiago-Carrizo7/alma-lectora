import { prisma } from '../../config/db.js';
import type { UpdateConfigPayload } from './config.schemas.js';

export class ConfigService {
  static async getConfig() {
    const config = await prisma.storeConfig.findFirst();
    if (!config) {
      return prisma.storeConfig.create({
        data: {},
      });
    }
    return config;
  }

  static async updateConfig(data: UpdateConfigPayload) {
    return prisma.$transaction(async (tx) => {
      let existing = await tx.storeConfig.findFirst();
      if (!existing) {
        existing = await tx.storeConfig.create({
          data: {},
        });
      }
      return tx.storeConfig.update({
        where: { id: existing.id },
        data,
      });
    });
  }
}
