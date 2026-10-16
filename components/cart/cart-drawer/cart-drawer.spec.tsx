import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider } from '@acme-modular/store.cart.use-cart';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { CartDrawer } from './cart-drawer.js';

const lamps: CartLine = { productId: 'p-300', name: 'Desk Lamp', unitPriceCents: 4900, quantity: 8 };
const mat: CartLine = { productId: 'p-601', name: 'Desk Mat', unitPriceCents: 2900, quantity: 1 };

function renderDrawer(initialLines: CartLine[], onCheckout?: () => void) {
  return render(
    <CartProvider initialLines={initialLines}>
      <CartDrawer open onClose={() => {}} onCheckout={onCheckout} />
    </CartProvider>
  );
}

it('lists the lines with a subtotal and a hint toward the bulk discount', () => {
  renderDrawer([lamps, mat]);
  expect(screen.getByRole('dialog', { name: 'Your cart' })).toBeTruthy();
  expect(screen.getByText('Desk Lamp')).toBeTruthy();
  expect(screen.getByText('Subtotal (9 items)')).toBeTruthy();
  // 8 x $49.00 + $29.00
  expect(screen.getAllByText('$421.00').length).toBeGreaterThan(0);
  expect(screen.getByText('Add 1 more item for 10% off')).toBeTruthy();
});

it('applies the bulk discount once the cart reaches 10 items', () => {
  renderDrawer([lamps, mat]);
  fireEvent.click(screen.getByRole('button', { name: 'Increase quantity of Desk Mat' }));

  // 8 x $49.00 + 2 x $29.00 = $450.00, minus 10% = $405.00
  expect(screen.getByText('Bulk discount (10%)')).toBeTruthy();
  expect(screen.getByText('−$45.00')).toBeTruthy();
  expect(screen.getByText('$405.00')).toBeTruthy();
  expect(screen.queryByText(/more items? for 10% off/)).toBeNull();
});

it('shows an empty state and disables checkout without lines', () => {
  const onCheckout = vi.fn();
  renderDrawer([], onCheckout);
  expect(screen.getByText('Your cart is empty.')).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Checkout' }) as HTMLButtonElement).disabled).toBe(true);
});

it('renders nothing when closed', () => {
  render(
    <CartProvider initialLines={[lamps]}>
      <CartDrawer open={false} onClose={() => {}} />
    </CartProvider>
  );
  expect(screen.queryByRole('dialog')).toBeNull();
});
