import { Modal } from '@acme-modular/design.ui.modal';
import { Alert } from '@acme-modular/design.ui.alert';
import { Button } from '@acme-modular/design.ui.button';
import { CartLineItem } from '@acme-modular/store.cart.cart-line-item';
import { useCart, BULK_THRESHOLD, BULK_DISCOUNT_PERCENT } from '@acme-modular/store.cart.use-cart';
import styles from './cart-drawer.module.css';

export type CartDrawerProps = {
  /** whether the drawer is showing. */
  open: boolean;
  /** called on Escape, an overlay click or "Continue shopping". */
  onClose(): void;
  /** called when the buyer presses "Checkout". the button is hidden without it. */
  onCheckout?(): void;
};

/**
 * The cart, in a dialog: every line with a quantity stepper, the subtotal,
 * the bulk discount once the cart reaches 10 units, and a nudge toward the
 * discount until it does. Reads the cart from `useCart`, so render it inside
 * a `CartProvider`.
 */
export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { lines, itemCount, summary, setQuantity, remove } = useCart();
  const empty = lines.length === 0;
  const unitsToDiscount = BULK_THRESHOLD - itemCount;

  const footer = (
    <div className={styles.actions}>
      <Button variant="secondary" onClick={onClose}>
        Continue shopping
      </Button>
      {onCheckout && (
        <Button onClick={onCheckout} disabled={empty}>
          Checkout
        </Button>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Your cart" footer={footer}>
      {empty ? (
        <p className={styles.empty}>Your cart is empty.</p>
      ) : (
        <div className={styles.cartDrawer}>
          <ul className={styles.lines} aria-label="Cart items">
            {lines.map((line) => (
              <li key={line.productId}>
                <CartLineItem
                  line={line}
                  onQuantityChange={(quantity) => setQuantity(line.productId, quantity)}
                  onRemove={() => remove(line.productId)}
                />
              </li>
            ))}
          </ul>

          {!summary.discount && unitsToDiscount > 0 && (
            <Alert tone="info">
              {`Add ${unitsToDiscount} more ${unitsToDiscount === 1 ? 'item' : 'items'} for ${BULK_DISCOUNT_PERCENT}% off`}
            </Alert>
          )}

          <dl className={styles.totals}>
            <div className={styles.row}>
              <dt>{`Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}</dt>
              <dd>{summary.subtotal}</dd>
            </div>
            {summary.discount && (
              <div className={`${styles.row} ${styles.discount}`}>
                <dt>{`Bulk discount (${summary.discount.percent}%)`}</dt>
                <dd>{`−${summary.discount.amount}`}</dd>
              </div>
            )}
            <div className={`${styles.row} ${styles.total}`}>
              <dt>Total</dt>
              <dd>{summary.discount?.total ?? summary.subtotal}</dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  );
}
