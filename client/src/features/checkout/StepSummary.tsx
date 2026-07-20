
import type { ShippingFormData, CustomerFormData } from '../../types/api';
import { useCart } from '../../hooks/useCart';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../services/price';

interface StepSummaryProps {
  shipping: ShippingFormData;
  customer: CustomerFormData;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function StepSummary({
  shipping,
  customer,
  onBack,
  onConfirm,
  isSubmitting,
}: StepSummaryProps) {
  const { items, totalItems, totalAmount } = useCart();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold font-serif text-ink mb-1">Resumen del Pedido</h3>
        <p className="text-xs text-stone-500">
          Revisá la información de tu compra antes de continuar a WhatsApp.
        </p>
      </div>

      <div className="space-y-4">
        {/* Products List Review */}
        <div className="bg-paper-dark/20 border border-paper-dark rounded-lg p-4">
          <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Productos Seleccionados</h4>
          <div className="divide-y divide-paper-dark max-h-48 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 text-sm">
                <span className="text-ink font-medium">
                  {item.title} <span className="text-ink-muted text-xs">x{item.quantity}</span>
                </span>
                <span className="font-mono text-amber font-semibold">
                  {formatPrice(parseFloat(item.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-paper-dark pt-3 mt-2 flex justify-between font-bold text-ink">
            <span>Total ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})</span>
            <span className="font-mono text-amber text-lg">{formatPrice(totalAmount)}</span>
          </div>
        </div>

        {/* Shipping and Customer Info Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer info */}
          <div className="border border-paper-dark rounded-lg p-4 bg-paper-dark/10">
            <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Cliente</h4>
            <div className="space-y-1 text-xs text-ink">
              <p><span className="font-medium">Nombre:</span> {customer.customerName}</p>
              <p><span className="font-medium">DNI/CUIT:</span> {customer.customerDni}</p>
              <p><span className="font-medium">Teléfono:</span> {customer.customerPhone}</p>
              <p><span className="font-medium">Email:</span> {customer.customerEmail}</p>
            </div>
          </div>

          {/* Shipping info */}
          <div className="border border-paper-dark rounded-lg p-4 bg-paper-dark/10">
            <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Envío</h4>
            <div className="space-y-1 text-xs text-ink">
              <p><span className="font-medium">Código Postal:</span> {shipping.postalCode}</p>
              <p><span className="font-medium">Dirección:</span> {shipping.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-paper-dark flex flex-col sm:flex-row justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-sm font-semibold order-2 sm:order-1"
        >
          Atrás
        </Button>
        <Button
          type="button"
          variant="whatsapp"
          onClick={onConfirm}
          isLoading={isSubmitting}
          className="text-sm py-3 px-6 order-1 sm:order-2 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.114-2.905-6.99C16.48 1.864 14.005.83 11.37.83c-5.442 0-9.866 4.42-9.87 9.865 0 1.636.494 3.232 1.428 4.816l-.993 3.626 3.712-.973zm11.026-6.19c-.3-.15-1.772-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.487-.89-.794-1.49-1.77-1.665-2.07-.175-.3-.02-.462.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-1.01-2.435-.298-.717-.604-.622-.826-.63l-.678-.01c-.24 0-.63.09-1.01.5-.38.41-1.45 1.42-1.45 3.46 0 2.04 1.485 4.015 1.69 4.29.2.275 2.92 4.46 7.075 6.25 2.455 1.06 3.44.85 4.675.67 1.25-.19 2.766-.99 3.125-2.075.36-1.085.36-2.015.25-2.215-.1-.2-.3-.3-.6-.45z" />
          </svg>
          Confirmar y Enviar WhatsApp
        </Button>
      </div>
    </div>
  );
}
