import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { qtyLimits } from '@sepetakhq/storefront-kit/shared/qty';

// The cart and its priced lines are mocked so the row's stepper is what is
// asserted; the kit tests the provider and the pricing.
const cart = { isEmpty: false, setQty: vi.fn(), remove: vi.fn() };
let lines = [];
vi.mock('@sepetakhq/storefront-kit/cart/CartProvider', () => ({ useCart: () => cart }));
vi.mock('@sepetakhq/storefront-kit/cart/useCartLines', () => ({
  useCartLines: () => ({ lines, statuses: [], subtotal: 0, isLoading: false, hasBlockers: false, preorderLeadDays: 0 }),
}));
vi.mock('@sepetakhq/storefront-kit/config/ConfigProvider', () => ({
  useConfig: () => ({ freeShipping: false, freeShippingMin: 0 }),
}));

const { CartBody } = await import('./CartRoute.jsx');

afterEach(cleanup);
beforeEach(() => {
  cart.setQty.mockClear();
  cart.remove.mockClear();
});

function line(product, qty) {
  return {
    key: product.id,
    item: { productId: product.id, variantId: null, qty },
    product: { slug: product.id, name: 'Kain Linen', price: 40000, availability: 'available', ...product },
    status: 'ok',
    available: 99000,
    limits: qtyLimits(product),
    lineTotal: 0,
  };
}

function body() {
  return render(
    <MemoryRouter>
      <CartBody />
    </MemoryRouter>,
  );
}

describe('CartBody line stepper', () => {
  it('prints a weighed line in kg and steps it by its qty_step', () => {
    lines = [line({ id: 'k1', unit: 'kg', qty_step: 250, qty_min: 500 }, 1250)];
    body();
    expect(screen.getByText('1,25 kg')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah jumlah' }));
    expect(cart.setQty).toHaveBeenLastCalledWith('k1', 1500);
    fireEvent.click(screen.getByRole('button', { name: 'Kurangi jumlah' }));
    expect(cart.setQty).toHaveBeenLastCalledWith('k1', 1000);
  });

  it('removes a weighed line when minus goes below its minimum', () => {
    lines = [line({ id: 'k1', unit: 'kg', qty_step: 250, qty_min: 500 }, 500)];
    body();
    fireEvent.click(screen.getByRole('button', { name: 'Kurangi jumlah' }));
    expect(cart.remove).toHaveBeenCalledWith('k1');
    expect(cart.setQty).not.toHaveBeenCalled();
  });

  it('keeps a pcs line a bare count stepping by one', () => {
    lines = [line({ id: 'p1' }, 2)];
    body();
    expect(screen.getByText('2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah jumlah' }));
    expect(cart.setQty).toHaveBeenLastCalledWith('p1', 3);
  });
});
