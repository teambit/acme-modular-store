import { Card } from '@acme-modular/design.ui.card';
import { Badge } from '@acme-modular/design.ui.badge';
import { Button } from '@acme-modular/design.ui.button';
import { PriceTag } from '@acme-modular/design.ui.price-tag';
import type { Product } from '@acme-modular/platform.entities.product';
import styles from './product-card.module.css';

/** at or below this many units the card nudges the buyer with a "only N left" badge. */
const LOW_STOCK = 5;

export type ProductCardProps = {
  /** the product to show. */
  product: Product;
  /** called with the product when the buyer presses "Add to cart". */
  onAddToCart?: (product: Product) => void;
};

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge tone="negative">Out of stock</Badge>;
  if (stock <= LOW_STOCK) return <Badge tone="warning">{`Only ${stock} left`}</Badge>;
  return <Badge tone="positive">In stock</Badge>;
}

/**
 * A catalog tile: name, price, stock and rating, with an "Add to cart"
 * action that is disabled while the product is out of stock.
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const media = product.imageUrl ? <img className={styles.image} src={product.imageUrl} alt={product.name} /> : undefined;

  return (
    <Card
      className={styles.productCard}
      title={product.name}
      media={media}
      footer={
        <div className={styles.footer}>
          <PriceTag cents={product.price.amountCents} currency={product.price.currency} size="large" />
          <Button
            disabled={!product.inStock}
            onClick={() => onAddToCart?.(product)}
            // every card in a grid says "Add to cart"; the label tells screen readers which product.
            aria-label={`Add ${product.name} to cart`}
          >
            Add to cart
          </Button>
        </div>
      }
    >
      <p className={styles.description}>{product.description}</p>
      <div className={styles.meta}>
        <StockBadge stock={product.stock} />
        {product.rating !== undefined && (
          <span className={styles.rating} aria-label={`Rated ${product.rating.toFixed(1)} out of 5`}>
            <span aria-hidden="true">★ {product.rating.toFixed(1)}</span>
          </span>
        )}
      </div>
    </Card>
  );
}
