import { slugify } from '@acme-modular/platform.utils.slugify';

export type Product = {
  name: string;
  /** price in minor units (cents) */
  priceCents: number;
  tags?: string[];
};

export type ListedProduct = Product & {
  /** URL-safe identifier derived from the name */
  slug: string;
};

/**
 * Prepares products for the catalog page: every product gets a slug, and
 * the list is ordered by name. Duplicate slugs get a numeric suffix so two
 * "Desk Lamp" entries never collide in a URL.
 */
export function listProducts(products: Product[]): ListedProduct[] {
  const seen = new Map<string, number>();
  return [...products]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((product) => {
      const base = slugify(product.name);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      return { ...product, slug: count === 0 ? base : `${base}-${count + 1}` };
    });
}
