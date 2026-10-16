import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockProducts } from '@acme-modular/platform.entities.product';
import { CartProvider, useCart } from './use-cart.js';

const products = mockProducts();
const deskLamp = products.find((product) => product.id === 'p-300')!; // $49.00
const deskMat = products.find((product) => product.id === 'p-601')!; // $29.00

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

it('merges repeat adds into one line and counts items', () => {
  const { result } = renderHook(() => useCart(), { wrapper });
  act(() => result.current.add(deskLamp));
  act(() => result.current.add(deskLamp, 2));
  act(() => result.current.add(deskMat));

  expect(result.current.lines).toEqual([
    { productId: 'p-300', name: 'Desk Lamp', unitPriceCents: 4900, quantity: 3 },
    { productId: 'p-601', name: 'Desk Mat', unitPriceCents: 2900, quantity: 1 },
  ]);
  expect(result.current.itemCount).toBe(4);
  expect(result.current.summary.subtotalCents).toBe(17600);
});

it('removes a line when its quantity is set to 0', () => {
  const { result } = renderHook(() => useCart(), { wrapper });
  act(() => result.current.add(deskLamp));
  act(() => result.current.add(deskMat));
  act(() => result.current.setQuantity('p-300', 0));

  expect(result.current.lines.map((line) => line.productId)).toEqual(['p-601']);
  act(() => result.current.clear());
  expect(result.current.itemCount).toBe(0);
});

it('takes 10% off once the cart reaches 10 units', () => {
  const { result } = renderHook(() => useCart(), { wrapper });
  act(() => result.current.add(deskLamp, 9));
  expect(result.current.summary.discount).toBeUndefined();

  act(() => result.current.add(deskMat));
  // 9 x $49.00 + $29.00 = $470.00, minus 10% = $423.00
  expect(result.current.itemCount).toBe(10);
  expect(result.current.summary.discount).toEqual({ percent: 10, amount: '$47.00', total: '$423.00' });
});

it('throws a clear error outside a CartProvider', () => {
  // React logs the thrown render error; keep the test output clean.
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => renderHook(() => useCart())).toThrow(/CartProvider/);
  consoleError.mockRestore();
});
