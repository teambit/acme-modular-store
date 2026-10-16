import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { CartLineItem } from './cart-line-item.js';

const lamps: CartLine = { productId: 'p-300', name: 'Desk Lamp', unitPriceCents: 4900, quantity: 3 };

it('shows the unit price, quantity and line total', () => {
  render(<CartLineItem line={lamps} onQuantityChange={() => {}} onRemove={() => {}} />);
  expect(screen.getByText('Desk Lamp')).toBeTruthy();
  expect(screen.getByText('$49.00')).toBeTruthy();
  expect(screen.getByText('$147.00')).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Quantity of Desk Lamp' }).textContent).toContain('3');
});

it('steps the quantity up and down', () => {
  const onQuantityChange = vi.fn();
  render(<CartLineItem line={lamps} onQuantityChange={onQuantityChange} onRemove={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Increase quantity of Desk Lamp' }));
  expect(onQuantityChange).toHaveBeenLastCalledWith(4);
  fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Desk Lamp' }));
  expect(onQuantityChange).toHaveBeenLastCalledWith(2);
});

it('does not step below one unit and removes explicitly', () => {
  const onQuantityChange = vi.fn();
  const onRemove = vi.fn();
  render(<CartLineItem line={{ ...lamps, quantity: 1 }} onQuantityChange={onQuantityChange} onRemove={onRemove} />);
  const decrease = screen.getByRole('button', { name: 'Decrease quantity of Desk Lamp' }) as HTMLButtonElement;
  expect(decrease.disabled).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Remove Desk Lamp' }));
  expect(onRemove).toHaveBeenCalledTimes(1);
  expect(onQuantityChange).not.toHaveBeenCalled();
});
