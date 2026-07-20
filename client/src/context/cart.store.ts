import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types/api';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (incoming) =>
        set((state) => {
          const exists = state.items.find((i) => i.id === incoming.id);
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.id === incoming.id
                  ? {
                      ...i,
                      quantity:
                        i.stock !== undefined && i.quantity >= i.stock
                          ? i.stock
                          : i.quantity + 1,
                    }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...incoming, quantity: 1 }],
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      incrementItem: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  quantity:
                    i.stock !== undefined && i.quantity >= i.stock
                      ? i.stock
                      : i.quantity + 1,
                }
              : i
          ),
        })),

      decrementItem: (id) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'alma-lectora-cart',
    }
  )
);
