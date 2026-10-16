import { useState } from 'react';
import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { Button } from '@acme-modular/design.ui.button';
import { mockProducts } from '@acme-modular/platform.entities.product';
import { CartProvider, toCartLine } from '@acme-modular/store.cart.use-cart';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { CartDrawer } from './cart-drawer.js';

const [standingDesk, , taskChair, , deskLamp, , , , , , monitorArm, deskMat] = mockProducts();

function DrawerPreview({ initialLines }: { initialLines: CartLine[] }) {
  const [open, setOpen] = useState(true);
  return (
    <AcmeTheme>
      <CartProvider initialLines={initialLines}>
        <Button onClick={() => setOpen(true)}>Open cart</Button>
        <CartDrawer open={open} onClose={() => setOpen(false)} onCheckout={() => alert('Checkout')} />
      </CartProvider>
    </AcmeTheme>
  );
}

/** 3 units: the drawer nudges toward the bulk discount. */
export const CartBelowBulkDiscount = () => (
  <DrawerPreview initialLines={[toCartLine(standingDesk), toCartLine(taskChair, 2)]} />
);

/** 12 units: 10% off the subtotal. */
export const CartWithBulkDiscount = () => (
  <DrawerPreview initialLines={[toCartLine(deskLamp, 6), toCartLine(monitorArm, 4), toCartLine(deskMat, 2)]} />
);

export const EmptyCart = () => <DrawerPreview initialLines={[]} />;
