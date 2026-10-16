import { useId, useState } from 'react';
import { Stack } from '@acme-modular/design.ui.stack';
import { Spinner } from '@acme-modular/design.ui.spinner';
import { Alert } from '@acme-modular/design.ui.alert';
import { Button } from '@acme-modular/design.ui.button';
import { ProductSearch } from '@acme-modular/store.catalog.product-search';
import { ProductGrid } from '@acme-modular/store.catalog.product-grid';
import { useProducts } from '@acme-modular/store.catalog.use-products';
import { useCart } from '@acme-modular/store.cart.use-cart';
import type { HttpClient } from '@acme-modular/platform.utils.http-client';
import type { Product, ProductCategory } from '@acme-modular/platform.entities.product';
import styles from './product-page.module.css';

export type ProductPageProps = {
  /** the API client. defaults to the in-memory demo catalog. */
  client?: HttpClient;
};

/**
 * The catalog page: search and category filters over a product grid, with
 * "Add to cart" wired to the shared cart. Render it inside a `CartProvider`.
 */
export function ProductPage({ client }: ProductPageProps) {
  const headingId = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory>();
  const [lastAdded, setLastAdded] = useState<string>();
  const { data: products, error, loading, reload } = useProducts({ query, category, client });
  const { add, itemCount } = useCart();

  const addToCart = (product: Product) => {
    add(product);
    setLastAdded(product.name);
  };

  return (
    <section className={styles.productPage} aria-labelledby={headingId}>
      <Stack gap="large">
        <Stack direction="row" justify="space-between" align="baseline" wrap>
          <h1 id={headingId} className={styles.heading}>
            Shop
          </h1>
          <span className={styles.cartCount}>{`${itemCount} ${itemCount === 1 ? 'item' : 'items'} in cart`}</span>
        </Stack>

        <ProductSearch query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} />

        {lastAdded && <Alert tone="positive">{`${lastAdded} added to your cart.`}</Alert>}

        {error ? (
          <Alert tone="negative" title="Couldn't load products">
            <p className={styles.errorMessage}>{error.message}</p>
            <Button variant="secondary" onClick={reload}>
              Try again
            </Button>
          </Alert>
        ) : !products ? (
          // keep the previous results on screen while a new search loads; only the first load shows a spinner.
          <div className={styles.loading}>{loading && <Spinner label="Loading products" />}</div>
        ) : (
          <ProductGrid products={products} onAddToCart={addToCart} />
        )}
      </Stack>
    </section>
  );
}
