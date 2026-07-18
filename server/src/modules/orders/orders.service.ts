import { prisma } from '../../config/db.js';
import type { CreateOrderLeadInput } from './orders.schemas.js';
import { AppError } from '../../utils/AppError.js';

export class OrdersService {
  static async createOrderLead(input: CreateOrderLeadInput) {
    const { items, totalAmount, ...customerData } = input;

    // Agrupar los IDs por tipo de ítem
    const bookItems = items.filter((i) => i.type === 'BOOK');
    const accessoryItems = items.filter((i) => i.type === 'ACCESSORY');
    const comboItems = items.filter((i) => i.type === 'COMBO');

    // Validar la existencia y estado activo en paralelo
    const [existingBooks, existingAccessories, existingCombos] = await Promise.all([
      bookItems.length > 0
        ? prisma.book.findMany({
            where: { id: { in: bookItems.map((i) => i.id) }, isActive: true },
            select: { id: true },
          })
        : Promise.resolve([]),
      accessoryItems.length > 0
        ? prisma.accessory.findMany({
            where: { id: { in: accessoryItems.map((i) => i.id) }, isActive: true },
            select: { id: true },
          })
        : Promise.resolve([]),
      comboItems.length > 0
        ? prisma.combo.findMany({
            where: { id: { in: comboItems.map((i) => i.id) }, isActive: true },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    const existingBookIds = new Set(existingBooks.map((b) => b.id));
    const existingAccessoryIds = new Set(existingAccessories.map((a) => a.id));
    const existingComboIds = new Set(existingCombos.map((c) => c.id));

    const missingIds: string[] = [];

    for (const item of items) {
      if (item.type === 'BOOK' && !existingBookIds.has(item.id)) {
        missingIds.push(item.id);
      } else if (item.type === 'ACCESSORY' && !existingAccessoryIds.has(item.id)) {
        missingIds.push(item.id);
      } else if (item.type === 'COMBO' && !existingComboIds.has(item.id)) {
        missingIds.push(item.id);
      }
    }

    if (missingIds.length > 0) {
      throw new AppError(
        `Uno o más ítems no están disponibles para compra: ${missingIds.join(', ')}`,
        400
      );
    }

    // Guardar el lead en la base de datos
    const orderLead = await prisma.orderLead.create({
      data: {
        customerName: customerData.customerName,
        customerPhone: customerData.customerPhone,
        customerEmail: customerData.customerEmail,
        customerDni: customerData.customerDni,
        postalCode: customerData.postalCode || null,
        address: customerData.address || null,
        items: items as any,
        totalAmount,
        status: 'PENDING_WHATSAPP',
      },
    });

    return {
      id: orderLead.id,
      status: orderLead.status,
      createdAt: orderLead.createdAt.toISOString(),
    };
  }
}
