import { useState, useEffect } from 'react';
import type { CartItem as CartItemType } from '../../types/api.js';
import { useCart } from '../../hooks/useCart.js';
import { formatPrice } from '../../lib/price.js';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { incrementItem, decrementItem, removeItem } = useCart();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (showWarning) {
      const timer = setTimeout(() => setShowWarning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showWarning]);

  const itemTotal = formatPrice(parseFloat(item.price) * item.quantity);

  const getPlaceholderLabel = () => {
    switch (item.type) {
      case 'BOOK':
        return 'Libro';
      case 'ACCESSORY':
        return 'Accesorio';
      case 'COMBO':
        return 'Combo';
      default:
        return 'Producto';
    }
  };

  const handleIncrement = () => {
    if (item.stock !== undefined && item.quantity >= item.stock) {
      setShowWarning(true);
    } else {
      incrementItem(item.id);
    }
  };

  return (
    <div className="flex py-4 border-b border-paper-dark gap-4">
      {/* Product Cover Thumbnail */}
      <div className="w-16 h-20 rounded-md overflow-hidden bg-paper-dark border border-paper-dark flex-shrink-0">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400 font-serif italic text-center p-1">
            {getPlaceholderLabel()}
          </div>
        )}
      </div>

      {/* Product Details & Adjusters */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-bold text-ink leading-tight line-clamp-2 pr-2">{item.title}</h4>
            <button
              onClick={() => removeItem(item.id)}
              className="text-stone-400 hover:text-red-700 transition-colors"
              title="Eliminar item"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {item.author && <p className="text-xs text-ink-muted mt-0.5">{item.author}</p>}
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity selector */}
          <div className="flex items-center border border-stone-300 rounded bg-paper relative">
            <button
              onClick={() => decrementItem(item.id)}
              className="px-2 py-0.5 text-stone-500 hover:bg-paper-dark transition-colors cursor-pointer"
              aria-label="Disminuir cantidad"
            >
              -
            </button>
            <span className="px-2.5 py-0.5 text-xs font-mono text-ink font-semibold">{item.quantity}</span>
            <button
              onClick={handleIncrement}
              className="px-2 py-0.5 text-stone-500 hover:bg-paper-dark transition-colors cursor-pointer"
              aria-label="Aumentar cantidad"
            >
              +
            </button>

            {showWarning && (
              <span className="absolute left-0 top-full mt-1.5 text-[9px] text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-30 animate-fade-in leading-none uppercase tracking-wider">
                Solo {item.stock} disponibles
              </span>
            )}
          </div>

          <span className="text-sm font-bold text-amber font-mono">{itemTotal}</span>
        </div>
      </div>
    </div>
  );
}
