import { prisma } from '../../config/db.js';
import type { GetAccessoriesQuery, CreateAccessoryInput, UpdateAccessoryInput } from './accessories.schemas.js';
import { AdminService } from '../admin/admin.service.js';

export class AccessoriesService {
  static async getAccessories(query: GetAccessoriesQuery) {
    const { search, category, page = 1, limit = 24, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = { isActive: isActive === 'false' ? false : true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.accessory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.accessory.count({ where }),
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

  static async getAccessoryById(id: string) {
    return prisma.accessory.findUnique({
      where: { id },
    });
  }

  static async createAccessory(data: CreateAccessoryInput) {
    return prisma.accessory.create({
      data: {
        ...data,
        price: data.price.toString() as any,
      },
    });
  }

  static async updateAccessory(id: string, data: UpdateAccessoryInput) {
    const existing = await prisma.accessory.findUnique({
      where: { id },
    });
    const oldCoverUrl = existing?.coverUrl;

    const result = await prisma.accessory.update({
      where: { id },
      data: {
        ...data,
        price: data.price !== undefined ? (data.price.toString() as any) : undefined,
      },
    });

    if (data.coverUrl !== undefined && data.coverUrl !== oldCoverUrl && oldCoverUrl) {
      AdminService.deleteImage(oldCoverUrl).catch((err) => {
        console.error('[AccessoriesService:updateAccessory:deleteImage:Error]', err);
      });
    }

    return result;
  }

  static async updateAccessoryStock(id: string, stock: number) {
    return prisma.accessory.update({
      where: { id },
      data: { stock },
    });
  }

  static async deleteAccessory(id: string, permanent = false) {
    if (permanent) {
      const existing = await prisma.accessory.findUnique({
        where: { id },
      });
      if (existing?.coverUrl) {
        AdminService.deleteImage(existing.coverUrl).catch((err) => {
          console.error('[AccessoriesService:deleteAccessory:deleteImage:Error]', err);
        });
      }
      return prisma.accessory.delete({
        where: { id },
      });
    }

    return prisma.accessory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
