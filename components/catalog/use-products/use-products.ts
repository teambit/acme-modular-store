import { useFetch } from '@acme-modular/platform.hooks.use-fetch';
import type { FetchState } from '@acme-modular/platform.hooks.use-fetch';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import type { HttpClient } from '@acme-modular/platform.utils.http-client';
import { Product, plainMockProducts } from '@acme-modular/platform.entities.product';
import type { PlainProduct, ProductCategory } from '@acme-modular/platform.entities.product';

// previews and the demo app run without a backend. the base URL only gives
// `Request` an absolute URL; the mock transport never leaves the process.
const mockClient = createHttpClient({
  baseUrl: 'http://mock.local',
  transport: createMockTransport({ 'GET /products': () => plainMockProducts }, { latencyMs: 300 }),
});

export type UseProductsOptions = {
  /** free-text search on name, description, category and tags. */
  query?: string;
  /** only products in this category. */
  category?: ProductCategory;
  /** the API client. defaults to an in-memory mock of the demo catalog. keep it stable across renders. */
  client?: HttpClient;
};

export type UseProductOptions = {
  /** the API client. defaults to an in-memory mock of the demo catalog. keep it stable across renders. */
  client?: HttpClient;
};

function productsPath(query?: string, category?: ProductCategory) {
  const params = new URLSearchParams();
  if (query?.trim()) params.set('q', query.trim());
  if (category) params.set('category', category);
  const search = params.toString();
  return search ? `/products?${search}` : '/products';
}

/**
 * Loads the catalog, optionally narrowed by a search query and a category.
 * The filters go to the API as `q` and `category`, and are applied again on
 * the client so a backend (or mock) that ignores them still yields the right list.
 *
 * @example
 * const { data: products, loading } = useProducts({ query: 'desk', category: 'desks' });
 */
export function useProducts({ query = '', category, client = mockClient }: UseProductsOptions = {}): FetchState<Product[]> {
  return useFetch(async () => {
    const plain = await client.get<PlainProduct[]>(productsPath(query, category));
    return plain
      .map((product) => Product.from(product))
      .filter((product) => (!category || product.category === category) && product.matches(query));
  }, [query, category, client]);
}

/**
 * Loads a single product by its URL slug, e.g. `desk-lamp`. `data` is
 * `undefined` once loading finishes if no product has that slug.
 *
 * @example
 * const { data: product } = useProduct('standing-desk');
 */
export function useProduct(slug: string, { client = mockClient }: UseProductOptions = {}): FetchState<Product | undefined> {
  return useFetch(async () => {
    const plain = await client.get<PlainProduct[]>('/products');
    return plain.map((product) => Product.from(product)).find((product) => product.slug === slug);
  }, [slug, client]);
}
