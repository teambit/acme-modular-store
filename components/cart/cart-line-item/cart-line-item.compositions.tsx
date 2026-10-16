import { useState } from 'react';
import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { mockProducts } from '@acme-modular/platform.entities.product';
import { toCartLine } from '@acme-modular/store.cart.use-cart';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { CartLineItem } from './cart-line-item.js';

const [standingDesk, , , , deskLamp] = mockProducts();

export const SingleUnitLine = () => {
  const [line, setLine] = useState<CartLine>(toCartLine(standingDesk));
  return (
    <AcmeTheme>
      <CartLineItem
        line={line}
        onQuantityChange={(quantity) => setLine({ ...line, quantity })}
        onRemove={() => alert(`Removed ${line.name}`)}
      />
    </AcmeTheme>
  );
};

export const MultipleUnitsLine = () => {
  const [line, setLine] = useState<CartLine>(toCartLine(deskLamp, 4));
  return (
    <AcmeTheme>
      <CartLineItem line={line} onQuantityChange={(quantity) => setLine({ ...line, quantity })} onRemove={() => {}} />
    </AcmeTheme>
  );
};

export const CartLineList = () => {
  const [lines, setLines] = useState<CartLine[]>(mockProducts().slice(8, 11).map((product, index) => toCartLine(product, index + 1)));
  return (
    <AcmeTheme>
      {lines.map((line) => (
        <CartLineItem
          key={line.productId}
          line={line}
          onQuantityChange={(quantity) =>
            setLines(lines.map((current) => (current.productId === line.productId ? { ...current, quantity } : current)))
          }
          onRemove={() => setLines(lines.filter((current) => current.productId !== line.productId))}
        />
      ))}
    </AcmeTheme>
  );
};
