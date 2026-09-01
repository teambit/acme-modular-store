import { formatPrice } from '@acme-modular/platform.utils.format-price';

export type CartLine = {
  name: string;
  /** unit price in minor units (cents) */
  unitPriceCents: number;
  quantity: number;
};

export type OrderSummary = {
  lines: Array<{ name: string; total: string }>;
  subtotal: string;
  subtotalCents: number;
  /** present when a bulk discount applied */
  discount?: { percent: number; amount: string; total: string };
};

export type SummarizeOptions = {
  currency?: string;
  /** items across the whole cart needed to unlock the bulk discount */
  bulkThreshold?: number;
  /** percent taken off the subtotal once the threshold is met */
  bulkDiscountPercent?: number;
};

/**
 * Totals a cart and renders every amount as a display string. Money stays
 * in integer cents until the last step; only the summary holds strings.
 * Carts that reach the bulk threshold get a percentage off the subtotal,
 * rounded down to the cent in the buyer's favor.
 */
export function summarizeOrder(lines: CartLine[], options: SummarizeOptions = {}): OrderSummary {
  const { currency = 'USD', bulkThreshold = 10, bulkDiscountPercent = 0 } = options;
  const priced = lines.map((line) => {
    const cents = line.unitPriceCents * line.quantity;
    return { name: line.name, cents };
  });
  const subtotalCents = priced.reduce((sum, line) => sum + line.cents, 0);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const summary: OrderSummary = {
    lines: priced.map((line) => ({ name: line.name, total: formatPrice(line.cents, { currency }) })),
    subtotal: formatPrice(subtotalCents, { currency }),
    subtotalCents,
  };
  if (bulkDiscountPercent > 0 && itemCount >= bulkThreshold) {
    const amountCents = Math.floor((subtotalCents * bulkDiscountPercent) / 100);
    summary.discount = {
      percent: bulkDiscountPercent,
      amount: formatPrice(amountCents, { currency }),
      total: formatPrice(subtotalCents - amountCents, { currency }),
    };
  }
  return summary;
}
