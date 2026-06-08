'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// Minimal product shape stored in the cart (no Cart/CartItem models in DB).
export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  totalPrice: number;
}

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'vitamin_cart';
const EMPTY_CART: Cart = { items: [], totalPrice: 0 };

function calcTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
}

function loadCart(): Cart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const items = JSON.parse(raw) as CartItem[];
    return { items, totalPrice: calcTotal(items) };
  } catch {
    return EMPTY_CART;
  }
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage quota exceeded — silently fail
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount (client only).
  useEffect(() => {
    setCart(loadCart());
    setIsLoading(false);
  }, []);

  const addToCart = useCallback((product: CartProduct) => {
    setCart((prev) => {
      const existing = prev.items.find((i) => i.product.id === product.id);
      let newItems: CartItem[];

      if (existing) {
        newItems = prev.items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      } else {
        newItems = [...prev.items, { product, quantity: 1 }];
      }

      saveCart(newItems);
      return { items: newItems, totalPrice: calcTotal(newItems) };
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const newItems = prev.items.reduce<CartItem[]>((acc, i) => {
        if (i.product.id !== productId) return [...acc, i];
        if (i.quantity > 1) return [...acc, { ...i, quantity: i.quantity - 1 }];
        return acc;
      }, []);
      saveCart(newItems);
      return { items: newItems, totalPrice: calcTotal(newItems) };
    });
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
    setCart(EMPTY_CART);
  }, []);

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
      <CartContext.Provider value={{ cart, itemCount, addToCart, removeFromCart, clearCart, isLoading }}>
        {children}
      </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}