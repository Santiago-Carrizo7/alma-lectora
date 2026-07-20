import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { Drawer } from '../../components/ui/Drawer';
import { CartItem } from './CartItem';
import { Button } from '../../components/ui/Button';
import { formatPrice } from '../../services/price';

export function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, totalAmount } = useCart();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <Drawer isOpen={isOpen} onClose={closeCart} title="Carrito de Compras">
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="w-16 h-16 text-stone-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h3 className="mt-4 text-base font-bold font-serif text-ink">Carrito Vacío</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-[240px]">
            Todavía no agregaste ningún producto a tu orden de compra.
          </p>
          <Button variant="ghost" size="sm" onClick={closeCart} className="mt-6 text-forest font-semibold underline">
            Volver al catálogo
          </Button>
        </div>
      ) : (
        <div className="h-full flex flex-col justify-between">
          {/* Lista de ítems */}
          <div className="flex-1 overflow-y-auto pr-1">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Checkout sticky */}
          <div className="border-t border-paper-dark pt-4 mt-6 bg-paper">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-ink-muted">
                Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
              </span>
              <span className="text-lg font-bold text-amber font-mono">{formatPrice(totalAmount)}</span>
            </div>
            
            <p className="text-[11px] text-stone-500 mb-4 italic leading-tight">
              Los costos de envío y detalles de pago se coordinan directamente en el chat de WhatsApp.
            </p>

            <Button
              onClick={handleCheckoutClick}
              className="w-full font-semibold py-3 text-sm flex items-center justify-center gap-2"
            >
              Completar Datos de Envío
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
