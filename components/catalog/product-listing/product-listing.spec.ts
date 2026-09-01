import { listProducts } from './product-listing.js';

it('sorts by name and slugifies', () => {
  const listed = listProducts([
    { name: 'Standing Desk', priceCents: 39900 },
    { name: 'Desk Lamp', priceCents: 4900 },
  ]);
  expect(listed.map((p) => p.slug)).toEqual(['desk-lamp', 'standing-desk']);
});

it('suffixes duplicate slugs', () => {
  const listed = listProducts([
    { name: 'Desk Lamp', priceCents: 4900 },
    { name: 'Desk Lamp', priceCents: 5900 },
  ]);
  expect(listed.map((p) => p.slug)).toEqual(['desk-lamp', 'desk-lamp-2']);
});
