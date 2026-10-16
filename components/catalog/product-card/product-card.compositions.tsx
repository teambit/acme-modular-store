import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { mockProducts } from '@acme-modular/platform.entities.product';
import { ProductCard } from './product-card.js';

const products = mockProducts();
const byId = (id: string) => products.find((product) => product.id === id)!;

export const InStockProductCard = () => (
  <AcmeTheme>
    <div style={{ maxWidth: 280 }}>
      <ProductCard product={byId('p-100')} onAddToCart={(product) => alert(`Added ${product.name}`)} />
    </div>
  </AcmeTheme>
);

export const LowStockProductCard = () => (
  <AcmeTheme>
    <div style={{ maxWidth: 280 }}>
      <ProductCard product={byId('p-101')} />
    </div>
  </AcmeTheme>
);

export const OutOfStockProductCard = () => (
  <AcmeTheme>
    <div style={{ maxWidth: 280 }}>
      <ProductCard product={byId('p-201')} />
    </div>
  </AcmeTheme>
);
