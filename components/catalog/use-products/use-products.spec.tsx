import { renderHook, waitFor } from '@testing-library/react';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import { plainMockProducts } from '@acme-modular/platform.entities.product';
import { useProducts, useProduct } from './use-products.js';

// zero latency keeps the tests fast; the route ignores filters, so the hook's own filtering is under test.
const client = createHttpClient({
  baseUrl: 'http://mock.local',
  transport: createMockTransport({ 'GET /products': () => plainMockProducts }, { latencyMs: 0 }),
});

it('loads the whole catalog as Product instances', async () => {
  const { result } = renderHook(() => useProducts({ client }));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toHaveLength(plainMockProducts.length);
  expect(result.current.data![0].price.amountCents).toBe(39900);
});

it('narrows by query and category', async () => {
  const { result, rerender } = renderHook((props: { query?: string; category?: 'lighting' }) => useProducts({ ...props, client }), {
    initialProps: { query: 'ergonomic' },
  });
  await waitFor(() => expect(result.current.data?.map((product) => product.id)).toEqual(['p-100', 'p-200', 'p-600']));

  rerender({ category: 'lighting' });
  await waitFor(() => expect(result.current.data?.map((product) => product.id)).toEqual(['p-300', 'p-301']));
});

it('finds a single product by slug', async () => {
  const { result } = renderHook(() => useProduct('desk-lamp', { client }));
  await waitFor(() => expect(result.current.data?.id).toBe('p-300'));
});

it('resolves undefined for an unknown slug', async () => {
  const { result } = renderHook(() => useProduct('hover-board', { client }));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toBeUndefined();
  expect(result.current.error).toBeUndefined();
});
