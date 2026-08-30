'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MenuItem } from '@/lib/supabase/services';

// --- Interfaces ---

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations?: Record<string, string>;
  // Backwards compatibility fields for legacy components
  name?: string;
  price?: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: MenuItem; customizations?: Record<string, string> } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'SET_CART_ITEMS'; payload: CartItem[] };

// --- Helper Functions ---

function buildCartId(itemId: string, customizations?: Record<string, string>): string {
  if (!customizations || Object.keys(customizations).length === 0) {
    return `cart-${itemId}`;
  }
  const suffix = Object.entries(customizations)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|');
  return `cart-${itemId}-${suffix}`;
}

// --- Reducer ---

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, customizations } = action.payload;
      const cartId = buildCartId(item.id, customizations);
      const existing = state.items.find(ci => ci.id === cartId);

      if (existing) {
        return {
          ...state,
          items: state.items.map(ci =>
            ci.id === cartId ? { ...ci, quantity: ci.quantity + 1 } : ci
          ),
        };
      }

      const newItem: CartItem = {
        id: cartId,
        menuItem: item,
        quantity: 1,
        customizations,
        // Safe property extraction with type casting to prevent TS errors
        name: item.name,
        price: item.price,
        image: (item as any).image_url || (item as any).image || '',
      };

      return {
        ...state,
        items: [...state.items, newItem],
      };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.id !== action.payload) };

    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter(item => item.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'SET_CART_ITEMS':
      return { ...state, items: action.payload };

    default:
      return state;
  }
}

// --- Context Definition ---

interface CartContextValue {
  // New State & Methods
  state: CartState;
  addItem: (item: MenuItem, customizations?: Record<string, string>) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalAmount: number;

  // Legacy Backwards Compatibility Aliases
  cart: CartItem[];
  addToCart: (item: MenuItem, customizations?: Record<string, string>) => boolean;
  removeFromCart: (id: string) => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// --- Provider Component ---

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
  const auth = useAuth?.() || { user: null };
  const user = auth.user;

  // Load saved cart on initial mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('feast_fete_cart');
      if (savedCart) {
        const parsedItems = JSON.parse(savedCart);
        if (Array.isArray(parsedItems)) {
          dispatch({ type: 'SET_CART_ITEMS', payload: parsedItems });
        }
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
    }
  }, []);

  // Sync cart to localStorage when items update
  useEffect(() => {
    try {
      localStorage.setItem('feast_fete_cart', JSON.stringify(state.items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [state.items]);

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = state.items.reduce(
    (sum, item) => sum + (item.menuItem?.price || item.price || 0) * item.quantity,
    0
  );

  const addItem = (item: MenuItem, customizations?: Record<string, string>): boolean => {
    let hasAccess = false;
    try {
      const guestProfileId = localStorage.getItem('guestProfileId');
      hasAccess = !!user || !!guestProfileId;
    } catch {
      hasAccess = !!user;
    }

    if (!hasAccess) return false;

    dispatch({ type: 'ADD_ITEM', payload: { item, customizations } });
    return true;
  };

  const removeItem = (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const updateQuantity = (id: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const openCart = () => dispatch({ type: 'OPEN_CART' });
  const closeCart = () => dispatch({ type: 'CLOSE_CART' });

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        totalItems,
        totalAmount,

        // Backwards compatibility mappings
        cart: state.items,
        addToCart: addItem,
        removeFromCart: removeItem,
        totalPrice: totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// --- Hook ---

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return ctx;
}