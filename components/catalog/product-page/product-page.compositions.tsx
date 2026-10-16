import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { CartProvider, toCartLine } from '@acme-modular/store.cart.use-cart';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import { mockProducts, plainMockProducts } from '@acme-modular/platform.entities.product';
import { ProductPage } from './product-page.js';

// clients are created once at module level so the page does not refetch on every render.
const slowClient = createHttpClient({
  baseUrl: 'http://mock.local',
  transport: createMockTransport({ 'GET /products': () => plainMockProducts }, { latencyMs: 2000 }),
});

const brokenClient = createHttpClient({
  baseUrl: 'http://mock.local',
  transport: createMockTransport({}, { latencyMs: 300 }),
});

export const ShopPage = () => (
  <AcmeTheme>
    <CartProvider>
      <ProductPage />
    </CartProvider>
  </AcmeTheme>
);

export const ShopPageWithItemsInCart = () => {
  const [standingDesk, , taskChair] = mockProducts();
  return (
    <AcmeTheme>
      <CartProvider initialLines={[toCartLine(standingDesk, 1), toCartLine(taskChair, 2)]}>
        <ProductPage client={slowClient} />
      </CartProvider>
    </AcmeTheme>
  );
};

export const ShopPageWhenTheApiFails = () => (
  <AcmeTheme>
    <CartProvider>
      <ProductPage client={brokenClient} />
    </CartProvider>
  </AcmeTheme>
);
