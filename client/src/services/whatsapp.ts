import type { CartItem, CheckoutFormData } from '../types/api';
import { formatPrice } from './price';

export function buildWhatsAppUrl(
  form: CheckoutFormData,
  items: CartItem[],
  totalAmount: string,
  whatsappPhone: string
): string {
  const lines: string[] = [
    `🛍️ *Nueva orden de compra — Alma Lectora*`,
    ``,
    `👤 *Datos del Cliente*`,
    `Nombre: ${form.customerName}`,
    `DNI/CUIT: ${form.customerDni}`,
    `Teléfono: ${form.customerPhone}`,
    `Email: ${form.customerEmail}`,
    ``,
    `📦 *Entrega/Envío*`,
    `Código Postal: ${form.postalCode}`,
    `Dirección: ${form.address}`,
    ``,
    `🛍️ *Detalle del Pedido*`,
    ...items.map(
      (item) =>
        `• ${item.title}${item.author ? ` (${item.author})` : ''} x${item.quantity} — ${formatPrice(parseFloat(item.price) * item.quantity)}`
    ),
    ``,
    `💰 *Total de la Compra: ${formatPrice(totalAmount)}*`,
    ``,
    `*Por favor, confirmame los datos para coordinar el pago y el envío.*`,
  ];

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${whatsappPhone}?text=${text}`;
}

