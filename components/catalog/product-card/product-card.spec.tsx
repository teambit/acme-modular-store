import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockProducts } from '@acme-modular/platform.entities.product';
import { ProductCard } from './product-card.js';

const products = mockProducts();
const byId = (id: string) => products.find((product) => product.id === id)!;

it('shows the name, price, stock and rating', () => {
  render(<ProductCard product={byId('p-100')} />);
  expect(screen.getByText('Standing Desk')).toBeTruthy();
  expect(screen.getByText('$399.00')).toBeTruthy();
  expect(screen.getByText('In stock')).toBeTruthy();
  expect(screen.getByLabelText('Rated 4.7 out of 5')).toBeTruthy();
});

it('passes the product to onAddToCart', () => {
  const onAddToCart = vi.fn();
  const lamp = byId('p-300');
  render(<ProductCard product={lamp} onAddToCart={onAddToCart} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Desk Lamp to cart' }));
  expect(onAddToCart).toHaveBeenCalledWith(lamp);
});

it('disables adding when out of stock', () => {
  const onAddToCart = vi.fn();
  render(<ProductCard product={byId('p-201')} onAddToCart={onAddToCart} />);
  expect(screen.getByText('Out of stock')).toBeTruthy();
  const button = screen.getByRole('button', { name: 'Add Lounge Chair to cart' }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(onAddToCart).not.toHaveBeenCalled();
});

it('warns when stock is low', () => {
  render(<ProductCard product={byId('p-101')} />);
  expect(screen.getByText('Only 3 left')).toBeTruthy();
});
