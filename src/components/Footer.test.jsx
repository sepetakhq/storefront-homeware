import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const config = {};
vi.mock('@sepetakhq/storefront-kit/config/ConfigProvider', () => ({ useConfig: () => config }));
let categories = [];
vi.mock('@sepetakhq/storefront-kit/hooks/queries', () => ({ useCategories: () => ({ data: categories }) }));

const Footer = (await import('./Footer.jsx')).default;

afterEach(cleanup);

function setup(brand = {}, { cats = [{ key: 'dapur', label: 'Dapur' }], payments, couriers } = {}) {
  categories = cats;
  Object.assign(config, {
    paymentMethods: payments ?? [{ code: 'QRIS', name: 'QRIS', enabled: true }, { code: 'OFF', name: 'Mati', enabled: false }],
    couriers: couriers ?? [{ code: 'jne', name: 'JNE REG', enabled: true }, { code: 'x', name: 'Kurir mati', enabled: false }],
    tenant: { name: 'Toko Contoh' },
    brand: {
      nav: [{ route: 'home', path: '/', label: 'Beranda' }],
      wordmark_primary: 'Toko',
      address_line1: 'Jl. Contoh 1',
      phone: '0812-0000',
      social_links: [{ kind: 'tiktok', url: 'https://tiktok.com/@a' }],
      copyright: '© Toko',
      sections: {},
      ...brand,
    },
  });
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe('Footer', () => {
  it('uses its own column titles when the shop set none, and only enabled payments and couriers', () => {
    setup();
    for (const t of ['Belanja', 'Kategori', 'Kontak']) expect(screen.getByRole('heading', { name: t })).toBeTruthy();
    expect(screen.getByText('Pembayaran')).toBeTruthy();
    expect(screen.getByText(/QRIS/)).toBeTruthy();
    expect(screen.queryByText(/Mati/)).toBeNull();
    expect(screen.getByText(/JNE REG/)).toBeTruthy();
    expect(screen.queryByText(/Kurir mati/)).toBeNull();
    // A social link is its kind, as a word.
    expect(screen.getByRole('link', { name: 'TikTok' }).getAttribute('href')).toBe('https://tiktok.com/@a');
  });

  it("uses the shop's column titles", () => {
    setup({ sections: { footer_shop_heading: 'Jelajah', footer_contact_heading: 'Hubungi', footer_payment_heading: 'Bayar', footer_shipping_heading: 'Kirim', footer_categories_heading: 'Ruangan' } });
    for (const t of ['Jelajah', 'Hubungi', 'Ruangan']) expect(screen.getByRole('heading', { name: t })).toBeTruthy();
    expect(screen.getByText('Bayar')).toBeTruthy();
    expect(screen.getByText('Kirim')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Belanja' })).toBeNull();
  });

  it('links only the merchant nav and order tracking', () => {
    setup();
    const menu = screen.getByRole('navigation', { name: 'Belanja' });
    expect([...menu.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/', '/lacak']);
    expect(screen.getByRole('link', { name: 'Dapur' }).getAttribute('href')).toBe('/katalog?cat=dapur');
    expect(screen.getByRole('link', { name: /0812-0000/ }).getAttribute('href')).toBe('tel:08120000');
  });

  it('draws no column for what the shop has not got', () => {
    setup({ nav: [], address_line1: '', phone: '', email: '', social_links: [], copyright: '' }, { cats: [], payments: [], couriers: [] });
    for (const t of ['Kategori', 'Kontak']) expect(screen.queryByRole('heading', { name: t })).toBeNull();
    expect(screen.queryByText('Pembayaran')).toBeNull();
    expect(screen.queryByText('Pengiriman')).toBeNull();
    // Tracking is never dropped: a buyer looking for a parcel scrolls here.
    expect(screen.getByRole('link', { name: 'Lacak Pesanan' })).toBeTruthy();
  });

  it("shows the copyright and where the shop ships from, in the shop's words", () => {
    setup({ origin_city: 'Kota Contoh', sections: { origin_note: 'Dikemas kayu' } });
    expect(screen.getByText('© Toko')).toBeTruthy();
    expect(screen.getByText('Dikirim dari Kota Contoh · Dikemas kayu')).toBeTruthy();
    expect(screen.getByText('Jl. Contoh 1')).toBeTruthy();
  });

  it('links the shop WhatsApp under its own button words', () => {
    setup({ whatsapp_url: 'https://wa.me/620000', whatsapp_text: 'Chat kami' });
    expect(screen.getByRole('link', { name: 'Chat kami' }).getAttribute('href')).toBe('https://wa.me/620000');
  });
});
