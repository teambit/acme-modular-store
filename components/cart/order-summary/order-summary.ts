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
};

/**
 * Totals a cart and renders every amount as a display string. Money stays
 * in integer cents until the last step; only the summary holds strings.
 */
export function summarizeOrder(lines: CartLine[], currency = 'USD'): OrderSummary {
  const priced = lines.map((line) => {
    const cents = line.unitPriceCents * line.quantity;
    return { name: line.name, cents };
  });
  const subtotalCents = priced.reduce((sum, line) => sum + line.cents, 0);
  return {
    lines: priced.map((line) => ({ name: line.name, total: formatPrice(line.cents, { currency }) })),
    subtotal: formatPrice(subtotalCents, { currency }),
    subtotalCents,
  };
}
