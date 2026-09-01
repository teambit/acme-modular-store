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
