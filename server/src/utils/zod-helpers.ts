import { z } from 'zod';

export const commaSeparated = <T extends z.ZodTypeAny>(schema: T) =>
  z.string()
    .optional()
    .transform((val) => {
      if (!val || val.trim().length === 0) return undefined;
      const items = val.split(',').map((s) => s.trim()).filter(Boolean);
      return items.map((item) => schema.parse(item));
    });
