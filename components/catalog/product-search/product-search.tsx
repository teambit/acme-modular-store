import { useId } from 'react';
import type { FormEvent } from 'react';
import { TextInput } from '@acme-modular/design.ui.text-input';
import { Stack } from '@acme-modular/design.ui.stack';
import type { ProductCategory } from '@acme-modular/platform.entities.product';
import styles from './product-search.module.css';

// `ProductCategory` is a type only, so the options are listed here in display order.
const CATEGORIES: Array<{ value: ProductCategory; label: string }> = [
  { value: 'desks', label: 'Desks' },
  { value: 'chairs', label: 'Chairs' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'storage', label: 'Storage' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'accessories', label: 'Accessories' },
];

export type ProductSearchProps = {
  /** the current search text. */
  query: string;
  /** called with the new text on every keystroke. */
  onQueryChange(q: string): void;
  /** the selected category. `undefined` means all categories. */
  category?: ProductCategory;
  /** called with the new category, or `undefined` for "All categories". */
  onCategoryChange(c?: ProductCategory): void;
};

/**
 * The catalog search bar: a text query plus a category filter. It is fully
 * controlled, so the page owns the filters and can keep them in the URL.
 */
export function ProductSearch({ query, onQueryChange, category, onCategoryChange }: ProductSearchProps) {
  const categoryId = useId();
  // filtering is live; Enter must not reload the page.
  const preventSubmit = (event: FormEvent) => event.preventDefault();

  return (
    <form role="search" aria-label="Product search" className={styles.productSearch} onSubmit={preventSubmit}>
      <Stack direction="row" gap="medium" align="flex-end" wrap>
        <div className={styles.query}>
          <TextInput
            label="Search products"
            type="search"
            name="q"
            placeholder="Desk, lamp, ergonomic…"
            value={query}
            onChange={onQueryChange}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={categoryId}>
            Category
          </label>
          <select
            id={categoryId}
            name="category"
            className={styles.select}
            value={category ?? ''}
            onChange={(event) => onCategoryChange((event.target.value || undefined) as ProductCategory | undefined)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Stack>
    </form>
  );
}
