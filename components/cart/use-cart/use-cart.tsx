import { createContext, useContext, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { summarizeOrder } from '@acme-modular/store.cart.order-summary';
import type { OrderSummary } from '@acme-modular/store.cart.order-summary';
import type { Product } from '@acme-modular/platform.entities.product';

/** units across the whole cart that unlock the bulk discount (counted over every line, not per product). */
export const BULK_THRESHOLD = 10;
/** percent off the subtotal once the cart reaches `BULK_THRESHOLD` units (rounded down to the cent). */
export const BULK_DISCOUNT_PERCENT = 10;

/** one product in the cart. The price is captured when the product is added. */
export type CartLine = {
  productId: string;
  name: string;
  /** unit price in minor units (cents). */
  unitPriceCents: number;
  quantity: number;
};

export type CartContextValue = {
  lines: CartLine[];
  /** adds a product, or adds to the quantity of its existing line. */
  add(product: Product, quantity?: number): void;
  remove(productId: string): void;
  /** sets a line's quantity. `0` (or less) removes the line. */
  setQuantity(productId: string, quantity: number): void;
  clear(): void;
  /** total units across all lines. */
  itemCount: number;
  /** display totals, including the bulk discount once it applies. */
  summary: OrderSummary;
};

export type CartProviderProps = {
  children?: ReactNode;
  /** lines to start with, e.g. a cart restored from storage. */
  initialLines?: CartLine[];
};

type CartAction =
  | { type: 'add'; line: CartLine }
  | { type: 'remove'; productId: string }
  | { type: 'setQuantity'; productId: string; quantity: number }
  | { type: 'clear' };

function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const existing = lines.find((line) => line.productId === action.line.productId);
      if (!existing) return [...lines, action.line];
      return lines.map((line) =>
        line.productId === action.line.productId ? { ...line, quantity: line.quantity + action.line.quantity } : line
      );
    }
    case 'remove':
      return lines.filter((line) => line.productId !== action.productId);
    case 'setQuantity':
      if (action.quantity <= 0) return lines.filter((line) => line.productId !== action.productId);
      return lines.map((line) => (line.productId === action.productId ? { ...line, quantity: action.quantity } : line));
    case 'clear':
      return [];
    default:
      return lines;
  }
}

/**
 * Turns a product into a cart line. The price is copied in, so a later price
 * change in the catalog never silently reprices a cart.
 */
export function toCartLine(product: Product, quantity = 1): CartLine {
  return { productId: product.id, name: product.name, unitPriceCents: product.price.amountCents, quantity };
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Holds the shopping cart for everything below it. Render it once near the
 * root of the store so the product page and the cart drawer share one cart.
 */
export function CartProvider({ children, initialLines = [] }: CartProviderProps) {
  const [lines, dispatch] = useReducer(cartReducer, initialLines);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    return {
      lines,
      itemCount,
      summary: summarizeOrder(lines, { bulkThreshold: BULK_THRESHOLD, bulkDiscountPercent: BULK_DISCOUNT_PERCENT }),
      add: (product, quantity = 1) => {
        // fractional or non-positive quantities would corrupt the cents math downstream.
        const units = Math.floor(quantity);
        if (units > 0) dispatch({ type: 'add', line: toCartLine(product, units) });
      },
      remove: (productId) => dispatch({ type: 'remove', productId }),
      setQuantity: (productId, quantity) => dispatch({ type: 'setQuantity', productId, quantity: Math.floor(quantity) }),
      clear: () => dispatch({ type: 'clear' }),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Reads and updates the cart. Must be called below a `CartProvider`.
 * Carts of 10 or more units get 10% off, reported in `summary.discount`.
 *
 * @example
 * const { add, itemCount, summary } = useCart();
 * add(product);
 */
export function useCart(): CartContextValue {
  const cart = useContext(CartContext);
  if (!cart) throw new Error('useCart must be used inside a <CartProvider>. Wrap your store (or preview) in CartProvider.');
  return cart;
}
