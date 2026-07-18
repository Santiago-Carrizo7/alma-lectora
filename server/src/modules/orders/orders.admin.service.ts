import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import type { GetOrdersQuery } from './orders.schemas.js';

export class OrdersAdminService {
  static async listOrders(query: GetOrdersQuery) {
    const { status, page = 1, limit = 24 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.orderLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.orderLead.count({ where }),
    ]);

    // OPTIMIZACIÓN ANT-N+1: Recolectar portadas
    const bookIds = new Set<string>();
    const accessoryIds = new Set<string>();
    const comboIds = new Set<string>();

    for (const order of data) {
      const items = order.items as any[];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.type === 'BOOK') bookIds.add(item.id);
          else if (item.type === 'ACCESSORY') accessoryIds.add(item.id);
          else if (item.type === 'COMBO') comboIds.add(item.id);
        }
      }
    }

    const [books, accessories, combos] = await Promise.all([
      bookIds.size > 0
        ? prisma.book.findMany({
            where: { id: { in: Array.from(bookIds) } },
            select: { id: true, coverUrl: true },
          })
        : Promise.resolve([]),
      accessoryIds.size > 0
        ? prisma.accessory.findMany({
            where: { id: { in: Array.from(accessoryIds) } },
            select: { id: true, coverUrl: true },
          })
        : Promise.resolve([]),
      comboIds.size > 0
        ? prisma.combo.findMany({
            where: { id: { in: Array.from(comboIds) } },
            select: { id: true, coverUrl: true },
          })
        : Promise.resolve([]),
    ]);

    const coverMap = new Map<string, string | null>();
    books.forEach((b) => coverMap.set(b.id, b.coverUrl));
    accessories.forEach((a) => coverMap.set(a.id, a.coverUrl));
    combos.forEach((c) => coverMap.set(c.id, c.coverUrl));

    const enrichedData = data.map((order) => {
      const items = order.items as any[];
      const enrichedItems = Array.isArray(items)
        ? items.map((item) => ({
            ...item,
            coverUrl: coverMap.get(item.id) || null,
          }))
        : [];
      return {
        ...order,
        items: enrichedItems,
      };
    });

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  static async updateOrderStatus(id: string, status: 'CONFIRMED' | 'CANCELLED') {
    return prisma.$transaction(async (tx) => {
      const order = await tx.orderLead.findUnique({
        where: { id },
      });

      if (!order) {
        throw new AppError('Pedido no encontrado', 404);
      }

      if (order.status !== 'PENDING_WHATSAPP') {
        throw new AppError('El pedido ya no se encuentra en estado pendiente', 400);
      }

      if (status === 'CONFIRMED') {
        const items = order.items as any[];
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item.type === 'BOOK') {
              const book = await tx.book.findUnique({
                where: { id: item.id },
              });
              if (!book) {
                throw new AppError(`El libro "${item.title}" no existe`, 404);
              }
              if (book.stock < item.quantity) {
                throw new AppError(`Stock insuficiente para el libro: "${book.title}". Stock disponible: ${book.stock}, requerido: ${item.quantity}`, 400);
              }
              await tx.book.update({
                where: { id: item.id },
                data: { stock: { decrement: item.quantity } },
              });
            } else if (item.type === 'ACCESSORY') {
              const accessory = await tx.accessory.findUnique({
                where: { id: item.id },
              });
              if (!accessory) {
                throw new AppError(`El accesorio "${item.title}" no existe`, 404);
              }
              if (accessory.stock < item.quantity) {
                throw new AppError(`Stock insuficiente para el accesorio: "${accessory.title}". Stock disponible: ${accessory.stock}, requerido: ${item.quantity}`, 400);
              }
              await tx.accessory.update({
                where: { id: item.id },
                data: { stock: { decrement: item.quantity } },
              });
            } else if (item.type === 'COMBO') {
              // Buscar la composición del combo
              const combo = await tx.combo.findUnique({
                where: { id: item.id },
                include: {
                  books: true,
                  accessories: true,
                },
              });
              if (!combo) {
                throw new AppError(`El combo "${item.title}" no existe`, 404);
              }

              // Restar libros del combo
              for (const comboBook of combo.books) {
                const requiredQty = comboBook.quantity * item.quantity;
                const book = await tx.book.findUnique({
                  where: { id: comboBook.bookId },
                });
                if (!book) {
                  throw new AppError(`El libro de combo con ID ${comboBook.bookId} no existe`, 404);
                }
                if (book.stock < requiredQty) {
                  throw new AppError(`Stock insuficiente para el libro "${book.title}" dentro del combo "${combo.title}". Stock disponible: ${book.stock}, requerido: ${requiredQty}`, 400);
                }
                await tx.book.update({
                  where: { id: comboBook.bookId },
                  data: { stock: { decrement: requiredQty } },
                });
              }

              // Restar accesorios del combo
              for (const comboAcc of combo.accessories) {
                const requiredQty = comboAcc.quantity * item.quantity;
                const accessory = await tx.accessory.findUnique({
                  where: { id: comboAcc.accessoryId },
                });
                if (!accessory) {
                  throw new AppError(`El accesorio de combo con ID ${comboAcc.accessoryId} no existe`, 404);
                }
                if (accessory.stock < requiredQty) {
                  throw new AppError(`Stock insuficiente para el accesorio "${accessory.title}" dentro del combo "${combo.title}". Stock disponible: ${accessory.stock}, requerido: ${requiredQty}`, 400);
                }
                await tx.accessory.update({
                  where: { id: comboAcc.accessoryId },
                  data: { stock: { decrement: requiredQty } },
                });
              }
            }
          }
        }
      }

      // Actualizar estado del lead
      return tx.orderLead.update({
        where: { id },
        data: { status },
      });
    });
  }
}
