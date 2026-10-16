import { useState } from 'react';
import { Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { Button } from '@acme-modular/design.ui.button';
import { Spinner } from '@acme-modular/design.ui.spinner';
import { Alert } from '@acme-modular/design.ui.alert';
import { CartProvider, useCart } from '@acme-modular/store.cart.use-cart';
import { CartDrawer } from '@acme-modular/store.cart.cart-drawer';
import { ProductPage } from '@acme-modular/store.catalog.product-page';
import { CheckoutPage } from '@acme-modular/checkout.checkout.checkout-page';
import { BillingHistoryPage } from '@acme-modular/billing.billing.billing-history-page';
import { useShipment } from '@acme-modular/shipping.shipping.use-shipment';
import { TrackingTimeline } from '@acme-modular/shipping.shipping.tracking-timeline';
import { SessionProvider } from '@acme-modular/accounts.accounts.use-session';
import { ProfilePage } from '@acme-modular/accounts.accounts.profile-page';
import styles from './storefront.module.css';

/**
 * The ACME storefront. One app composed from eight scopes: every page here
 * is a component owned, versioned and released by its own team and repository.
 */
export function Storefront() {
  return (
    <AcmeTheme>
      <SessionProvider>
        <CartProvider>
          <Shell />
        </CartProvider>
      </SessionProvider>
    </AcmeTheme>
  );
}

function Shell() {
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand}>
          ACME
        </NavLink>
        <nav className={styles.nav}>
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/track/o-1003">Track order</NavLink>
          <NavLink to="/billing">Billing</NavLink>
          <NavLink to="/account">Account</NavLink>
        </nav>
        <Button variant="secondary" onClick={() => setCartOpen(true)} aria-label={`Cart, ${itemCount} items`}>
          Cart ({itemCount})
        </Button>
      </header>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage onDone={() => navigate('/track/o-1003')} />} />
          <Route path="/track/:orderId" element={<TrackOrder />} />
          <Route path="/billing" element={<BillingHistoryPage />} />
          <Route path="/account" element={<ProfilePage />} />
        </Routes>
      </main>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          navigate('/checkout');
        }}
      />
    </div>
  );
}

function TrackOrder() {
  const { orderId = '' } = useParams();
  const { data: shipment, loading, error } = useShipment(orderId);
  if (loading) return <Spinner label="Loading shipment" />;
  if (error) return <Alert tone="negative">{error.message}</Alert>;
  if (!shipment) return <Alert tone="info">No shipment for order {orderId} yet.</Alert>;
  return (
    <section>
      <h1>Order {orderId}</h1>
      <TrackingTimeline shipment={shipment} />
    </section>
  );
}
