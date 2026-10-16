import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductSearch } from './product-search.js';

it('reports the typed query', () => {
  const onQueryChange = vi.fn();
  render(<ProductSearch query="" onQueryChange={onQueryChange} onCategoryChange={() => {}} />);
  fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'lamp' } });
  expect(onQueryChange).toHaveBeenCalledWith('lamp');
});

it('reports the picked category, and undefined for all categories', () => {
  const onCategoryChange = vi.fn();
  render(<ProductSearch query="" onQueryChange={() => {}} category="desks" onCategoryChange={onCategoryChange} />);
  const select = screen.getByLabelText('Category') as HTMLSelectElement;
  expect(select.value).toBe('desks');

  fireEvent.change(select, { target: { value: 'lighting' } });
  expect(onCategoryChange).toHaveBeenLastCalledWith('lighting');
  fireEvent.change(select, { target: { value: '' } });
  expect(onCategoryChange).toHaveBeenLastCalledWith(undefined);
});

it('lists every product category', () => {
  render(<ProductSearch query="" onQueryChange={() => {}} onCategoryChange={() => {}} />);
  const options = Array.from((screen.getByLabelText('Category') as HTMLSelectElement).options).map((option) => option.value);
  expect(options).toEqual(['', 'desks', 'chairs', 'lighting', 'storage', 'electronics', 'accessories']);
});
