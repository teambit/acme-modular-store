import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { mockProducts } from '@acme-modular/platform.entities.product';
import { ProductGrid } from './product-grid.js';

export const FullCatalogGrid = () => (
  <AcmeTheme>
    <ProductGrid products={mockProducts()} onAddToCart={(product) => alert(`Added ${product.name}`)} />
  </AcmeTheme>
);

export const SeatingGrid = () => (
  <AcmeTheme>
    <ProductGrid products={mockProducts().filter((product) => product.category === 'chairs')} />
  </AcmeTheme>
);

export const EmptyGrid = () => (
  <AcmeTheme>
    <ProductGrid products={[]} emptyMessage="Nothing matches “hover board”. Try another search." />
  </AcmeTheme>
);
