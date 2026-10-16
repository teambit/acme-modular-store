import { MemoryRouter } from 'react-router-dom';
import { Storefront } from './storefront.js';

export const ShopHome = () => (
  <MemoryRouter>
    <Storefront />
  </MemoryRouter>
);

export const TrackAnOrder = () => (
  <MemoryRouter initialEntries={['/track/o-1003']}>
    <Storefront />
  </MemoryRouter>
);

export const BillingHistory = () => (
  <MemoryRouter initialEntries={['/billing']}>
    <Storefront />
  </MemoryRouter>
);
