import { summarizeOrder } from './order-summary.js';

it('totals lines and formats every amount', () => {
  const summary = summarizeOrder([
    { name: 'Desk Lamp', unitPriceCents: 4900, quantity: 2 },
    { name: 'Standing Desk', unitPriceCents: 39900, quantity: 1 },
  ]);
  expect(summary.lines).toEqual([
    { name: 'Desk Lamp', total: '$98.00' },
    { name: 'Standing Desk', total: '$399.00' },
  ]);
  expect(summary.subtotal).toBe('$497.00');
  expect(summary.subtotalCents).toBe(49700);
});

it('handles an empty cart', () => {
  const summary = summarizeOrder([]);
  expect(summary.subtotal).toBe('$0.00');
  expect(summary.lines).toEqual([]);
});

it('applies the bulk discount at the threshold, rounding down', () => {
  const summary = summarizeOrder([{ name: 'Desk Lamp', unitPriceCents: 333, quantity: 10 }], {
    bulkDiscountPercent: 5,
  });
  expect(summary.discount).toEqual({ percent: 5, amount: '$1.66', total: '$31.64' });
});

it('applies no discount below the threshold', () => {
  const summary = summarizeOrder([{ name: 'Desk Lamp', unitPriceCents: 4900, quantity: 9 }], {
    bulkDiscountPercent: 5,
  });
  expect(summary.discount).toBeUndefined();
});
