import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockProducts } from '@acme-modular/platform.entities.product';
import { ProductGrid } from './product-grid.js';

it('renders one list item per product', () => {
  const products = mockProducts();
  render(<ProductGrid products={products} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(products.length);
});

it('forwards add-to-cart from a card', () => {
  const onAddToCart = vi.fn();
  render(<ProductGrid products={mockProducts()} onAddToCart={onAddToCart} />);
  fireEvent.click(screen.getByRole('button', { name: 'Add USB-C Dock to cart' }));
  expect(onAddToCart).toHaveBeenCalledTimes(1);
  expect(onAddToCart.mock.calls[0][0].id).toBe('p-500');
});

it('shows the empty message when there are no products', () => {
  render(<ProductGrid products={[]} emptyMessage="Nothing here yet." />);
  expect(screen.getByText('Nothing here yet.')).toBeTruthy();
  expect(screen.queryByRole('list')).toBeNull();
});
