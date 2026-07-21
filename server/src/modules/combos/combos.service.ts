import { prisma } from '../../config/db.js';
import type { GetCombosQuery, CreateComboInput, UpdateComboInput } from './combos.schemas.js';
import { AdminService } from '../admin/admin.service.js';

export class CombosService {
  static async getCombos(query: GetCombosQuery) {
    const { search, page = 1, limit = 24 } = query;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.combo.findMany({
        where,
        skip,
        take: limit,
        include: {
          books: {
            include: {
              book: true,
            },
          },
          accessories: {
            include: {
              accessory: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.combo.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  static async getComboById(id: string) {
    return prisma.combo.findUnique({
      where: { id },
      include: {
        books: {
          include: {
            book: true,
          },
        },
        accessories: {
          include: {
            accessory: true,
          },
        },
      },
    });
  }

  static async createCombo(data: CreateComboInput) {
    const { books, accessories, ...comboData } = data;

    return prisma.$transaction(async (tx) => {
      const combo = await tx.combo.create({
        data: {
          ...comboData,
          price: comboData.price.toString() as any,
        },
      });

      if (books && books.length > 0) {
        await tx.comboBook.createMany({
          data: books.map((b) => ({
            comboId: combo.id,
            bookId: b.bookId,
            quantity: b.quantity,
          })),
        });
      }

      if (accessories && accessories.length > 0) {
        await tx.comboAccessory.createMany({
          data: accessories.map((a) => ({
            comboId: combo.id,
            accessoryId: a.accessoryId,
            quantity: a.quantity,
          })),
        });
      }

      return tx.combo.findUnique({
        where: { id: combo.id },
        include: {
          books: true,
          accessories: true,
        },
      });
    });
  }

  static async updateCombo(id: string, data: UpdateComboInput) {
    const { books, accessories, ...comboData } = data;

    const existing = await prisma.combo.findUnique({
      where: { id },
    });
    const oldCoverUrl = existing?.coverUrl;

    const result = await prisma.$transaction(async (tx) => {
      await tx.combo.update({
        where: { id },
        data: {
          ...comboData,
          price: comboData.price !== undefined ? (comboData.price.toString() as any) : undefined,
        },
      });

      if (books !== undefined) {
        await tx.comboBook.deleteMany({
          where: { comboId: id },
        });

        if (books.length > 0) {
          await tx.comboBook.createMany({
            data: books.map((b) => ({
              comboId: id,
              bookId: b.bookId,
              quantity: b.quantity,
            })),
          });
        }
      }

      if (accessories !== undefined) {
        await tx.comboAccessory.deleteMany({
          where: { comboId: id },
        });

        if (accessories.length > 0) {
          await tx.comboAccessory.createMany({
            data: accessories.map((a) => ({
              comboId: id,
              accessoryId: a.accessoryId,
              quantity: a.quantity,
            })),
          });
        }
      }

      return tx.combo.findUnique({
        where: { id },
        include: {
          books: true,
          accessories: true,
        },
      });
    });

    if (data.coverUrl !== undefined && data.coverUrl !== oldCoverUrl && oldCoverUrl) {
      AdminService.deleteImage(oldCoverUrl).catch((err) => {
        console.error('[CombosService:updateCombo:deleteImage:Error]', err);
      });
    }

    return result;
  }

  static async updateComboStock(id: string, stock: number) {
    return prisma.combo.update({
      where: { id },
      data: { stock },
      include: {
        books: true,
        accessories: true,
      },
    });
  }

  static async deleteCombo(id: string, permanent = false) {
    if (permanent) {
      const existing = await prisma.combo.findUnique({
        where: { id },
      });
      if (existing?.coverUrl) {
        AdminService.deleteImage(existing.coverUrl).catch((err) => {
          console.error('[CombosService:deleteCombo:deleteImage:Error]', err);
        });
      }
      return prisma.combo.delete({
        where: { id },
      });
    }

    return prisma.combo.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
