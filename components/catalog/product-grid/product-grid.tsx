import { ProductCard } from '@acme-modular/store.catalog.product-card';
import type { Product } from '@acme-modular/platform.entities.product';
import styles from './product-grid.module.css';

export type ProductGridProps = {
  /** the products to show, in display order. */
  products: Product[];
  /** called with the product when the buyer presses "Add to cart" on a card. */
  onAddToCart?: (product: Product) => void;
  /** shown instead of the grid when there are no products. */
  emptyMessage?: string;
};

/**
 * A responsive grid of product cards. Columns fill the available width, so
 * the same grid works in a full page and in a narrow sidebar.
 */
export function ProductGrid({ products, onAddToCart, emptyMessage = 'No products match your search.' }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className={styles.empty} role="status">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={styles.productGrid} aria-label="Products">
      {products.map((product) => (
        <li key={product.id} className={styles.item}>
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </li>
      ))}
    </ul>
  );
}
