import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const config = {};
vi.mock('@sepetakhq/storefront-kit/config/ConfigProvider', () => ({ useConfig: () => config }));

const { default: TrustStrip, showsTrust } = await import('./TrustStrip.jsx');

afterEach(cleanup);

function at(path, rest = {}) {
  Object.assign(config, {
    brand: { opening_hours: 'Senin–Sabtu', sections: {} },
    copy: (s) => s,
    freeShipping: false,
    paymentMethods: [{ name: 'QRIS', enabled: true }],
    couriers: [],
    ...rest,
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TrustStrip />
    </MemoryRouter>,
  );
}

describe('TrustStrip', () => {
  it('closes the pages where a buyer is still deciding', () => {
    expect(['/', '/katalog', '/produk/kursi'].map(showsTrust)).toEqual([true, true, true]);
    expect(['/checkout', '/keranjang', '/tentang', '/lacak', '/pesanan/x'].map(showsTrust)).toEqual([false, false, false, false, false]);
  });

  it("lists what the shop offers, under the shop's labels", () => {
    at('/', { brand: { opening_hours: 'Senin–Sabtu', sections: { hero_chip_payment: 'Bayar aman' } } });
    expect(screen.getByText('Bayar aman')).toBeTruthy();
    expect(screen.getByText('QRIS')).toBeTruthy();
    expect(screen.getByText('Senin–Sabtu')).toBeTruthy();
  });

  it('draws nothing off those pages, or for a shop with nothing to promise', () => {
    const { container } = at('/checkout');
    expect(container.querySelector('.hw-trust')).toBeNull();
    cleanup();
    const bare = at('/', { brand: { sections: {} }, paymentMethods: [] });
    expect(bare.container.querySelector('.hw-trust')).toBeNull();
  });
});
