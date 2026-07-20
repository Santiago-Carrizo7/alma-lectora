import { useMemo } from 'react';
import { useCartStore } from '../context/cart.store';

export function useCart() {
  const items = useCartStore((state) => state.items);
  const isOpen = useCartStore((state) => state.isOpen);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const openCart = useCartStore((state) => state.openCart);
  const closeCart = useCartStore((state) => state.closeCart);

  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () =>
      items
        .reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0)
        .toFixed(2),
    [items]
  );

  return {
    items,
    isOpen,
    totalItems,
    totalAmount,
    addItem,
    removeItem,
    incrementItem,
    decrementItem,
    clearCart,
    openCart,
    closeCart,
  };
}
