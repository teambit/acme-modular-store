import { Button } from '@acme-modular/design.ui.button';
import { PriceTag } from '@acme-modular/design.ui.price-tag';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import styles from './cart-line-item.module.css';

export type CartLineItemProps = {
  /** the cart line to show. */
  line: CartLine;
  /** called with the new quantity when the buyer steps it up or down. never below 1. */
  onQuantityChange(q: number): void;
  /** called when the buyer removes the line. */
  onRemove(): void;
};

/**
 * One row of the cart: name, unit price, a quantity stepper, the line total
 * and a remove action. Stepping down stops at 1; removing is a separate,
 * explicit action so a mis-click never empties a line.
 */
export function CartLineItem({ line, onQuantityChange, onRemove }: CartLineItemProps) {
  const lineTotalCents = line.unitPriceCents * line.quantity;

  return (
    <div className={styles.cartLineItem}>
      <div className={styles.details}>
        <span className={styles.name}>{line.name}</span>
        <span className={styles.unitPrice}>
          <PriceTag cents={line.unitPriceCents} size="small" /> each
        </span>
      </div>

      <div className={styles.quantity} role="group" aria-label={`Quantity of ${line.name}`}>
        <button
          type="button"
          className={styles.step}
          aria-label={`Decrease quantity of ${line.name}`}
          disabled={line.quantity <= 1}
          onClick={() => onQuantityChange(line.quantity - 1)}
        >
          −
        </button>
        <output className={styles.count} aria-live="polite">
          {line.quantity}
        </output>
        <button
          type="button"
          className={styles.step}
          aria-label={`Increase quantity of ${line.name}`}
          onClick={() => onQuantityChange(line.quantity + 1)}
        >
          +
        </button>
      </div>

      <PriceTag className={styles.total} cents={lineTotalCents} />

      <Button variant="ghost" onClick={onRemove} aria-label={`Remove ${line.name}`}>
        Remove
      </Button>
    </div>
  );
}
