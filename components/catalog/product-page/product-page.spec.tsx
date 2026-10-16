import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider } from '@acme-modular/store.cart.use-cart';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import { plainMockProducts } from '@acme-modular/platform.entities.product';
import { ProductPage } from './product-page.js';

const client = createHttpClient({
  baseUrl: 'http://mock.local',
  transport: createMockTransport({ 'GET /products': () => plainMockProducts }, { latencyMs: 0 }),
});

function renderPage(pageClient = client) {
  return render(
    <CartProvider>
      <ProductPage client={pageClient} />
    </CartProvider>
  );
}

it('loads the catalog and narrows it as the buyer types', async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText('Standing Desk')).toBeTruthy());

  fireEvent.change(screen.getByLabelText('Search products'), { target: { value: 'lamp' } });
  await waitFor(() => expect(screen.queryByText('Standing Desk')).toBeNull());
  expect(screen.getByText('Desk Lamp')).toBeTruthy();
  expect(screen.getByText('Floor Lamp')).toBeTruthy();
});

it('adds a product to the shared cart', async () => {
  renderPage();
  expect(screen.getByText('0 items in cart')).toBeTruthy();
  fireEvent.click(await screen.findByRole('button', { name: 'Add Desk Lamp to cart' }));
  expect(screen.getByText('1 item in cart')).toBeTruthy();
  expect(screen.getByText('Desk Lamp added to your cart.')).toBeTruthy();
});

it('shows an error when the catalog cannot load', async () => {
  const broken = createHttpClient({ baseUrl: 'http://mock.local', transport: createMockTransport({}) });
  renderPage(broken);
  expect(await screen.findByText("Couldn't load products")).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
});
