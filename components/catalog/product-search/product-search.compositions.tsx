import { useState } from 'react';
import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { mockProducts } from '@acme-modular/platform.entities.product';
import type { ProductCategory } from '@acme-modular/platform.entities.product';
import { ProductSearch } from './product-search.js';

export const EmptySearch = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory>();
  return (
    <AcmeTheme>
      <ProductSearch query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} />
    </AcmeTheme>
  );
};

export const SearchWithFilters = () => {
  const [query, setQuery] = useState('ergonomic');
  const [category, setCategory] = useState<ProductCategory | undefined>('chairs');
  return (
    <AcmeTheme>
      <ProductSearch query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} />
    </AcmeTheme>
  );
};

export const SearchWithLiveResults = () => {
  const [query, setQuery] = useState('lamp');
  const [category, setCategory] = useState<ProductCategory>();
  const results = mockProducts().filter((product) => (!category || product.category === category) && product.matches(query));
  return (
    <AcmeTheme>
      <ProductSearch query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} />
      <ul>
        {results.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </AcmeTheme>
  );
};
