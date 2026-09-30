import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

const config = { brand: { nav: [], heroImages: [], heroStats: [], sections: {} } };
vi.mock('@sepetakhq/storefront-kit/config/ConfigProvider', () => ({ useConfig: () => config }));

const home = { data: { sections: [] }, isPending: false, isError: false };
// The product page's query, which the hero's featured card reads options from.
let details = {};
let categories = [];
const productsCalls = [];
let catProducts = [];
vi.mock('@sepetakhq/storefront-kit/hooks/queries', () => ({
  useHome: () => home,
  useProduct: (slug) => ({ data: details[slug] }),
  useCategories: () => ({ data: categories }),
  useProducts: (params) => {
    productsCalls.push(params);
    return { isPending: false, isError: false, data: { pages: [{ products: catProducts }] } };
  },
}));

const cart = { items: [], add: vi.fn(), setQty: vi.fn(), remove: vi.fn() };
vi.mock('@sepetakhq/storefront-kit/cart/CartProvider', () => ({ useCart: () => cart }));
vi.mock('@sepetakhq/storefront-kit/ui/ToastProvider', () => ({ useToast: () => vi.fn() }));

const { default: HomeRoute, RAIL_ARROWS_AFTER } = await import('./HomeRoute.jsx');

afterEach(() => {
  cleanup();
  details = {};
  categories = [];
  catProducts = [];
  productsCalls.length = 0;
});

function setup(sections, brand = {}, rest = {}) {
  Object.assign(config, { freeShipping: false, freeShippingMinLabel: '', paymentMethods: [], couriers: [], ...rest });
  config.copy = (s) => (config.freeShipping ? String(s).replaceAll('{free_shipping_min}', config.freeShippingMinLabel) : '');
  config.brand = { nav: [], heroImages: [], heroStats: [], sections: {}, ...brand };
  home.data = { sections };
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <HomeRoute />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const HERO = { id: 'h', type: 'hero', hero: { title: 'Rumah rapi.', em: 'Setiap hari.', sub: 'Sub.', cta: 'Belanja koleksi' } };
const CATS = { id: 'c', type: 'cats', cats: [{ key: 'dapur', label: 'Dapur & Makan', subtitle: 'Keramik', spec_label: 'Bahan', material_spec: 'Stoneware' }] };
const product = (i) => ({ id: `p${i}`, slug: `p${i}`, name: `Produk ${i}`, price: 20000, stock: 20, availability: 'available' });
const PRODUCTS = [{ ...product(1), compare_at_price: 30000, on_sale: true }];
const grid = (products, title = 'Temuan terlaris', type = 'grid') => ({ id: `g-${title}`, type, grid: { title, products } });

describe('HomeRoute', () => {
  it('invites the buyer to the catalogue when nothing is published', () => {
    setup([]);
    expect(screen.getByText('Toko sedang disiapkan')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Lihat katalog' })).toBeTruthy();
    // Still the page's main landmark, so "skip to content" lands on it.
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('treats a page of empty or unknown sections as empty', () => {
    setup([{ id: 'x', type: 'video-hero' }, { id: 'f', type: 'features', features: { title: 'T', items: [] } }]);
    expect(screen.getByText('Toko sedang disiapkan')).toBeTruthy();
  });

  it('draws the hero title with its emphasis after it, the eyebrow and every number', () => {
    setup([HERO], { hero_eyebrow: 'Temuan terlaris', heroStats: [{ value: '10+', label: 'Tahun' }, { value: '50rb+', label: 'Rumah' }] });
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toBe('Rumah rapi. Setiap hari.');
    expect(h1.querySelector('em').textContent).toBe('Setiap hari.');
    expect(screen.getByText('Temuan terlaris')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Belanja koleksi' }).getAttribute('href')).toBe('/katalog');
    expect(screen.getByText('10+').closest('dd')).toBeTruthy();
    expect(screen.getByText('Rumah').closest('dt')).toBeTruthy();
  });

  it('draws no numbers row and no eyebrow for a shop without them', () => {
    const { container } = setup([HERO]);
    expect(container.querySelector('.hw-hero-stats')).toBeNull();
    expect(container.querySelector('.hw-hero-eyebrow')).toBeNull();
  });

  it("sends the second hero button to the about page, in the shop's words", () => {
    setup([HERO], { sections: { hero_secondary_cta: 'Kenali kami' } });
    expect(screen.getByRole('link', { name: 'Kenali kami' }).getAttribute('href')).toBe('/tentang');
    cleanup();
    setup([HERO]);
    expect(screen.getByRole('link', { name: 'Cerita kami' }).getAttribute('href')).toBe('/tentang');
  });

  describe('featured card', () => {
    it("features the page's first product, with its first option as words", () => {
      details = { p1: { options: [{ name: 'Warna', values: ['Krem', 'Pasir', 'Walnut', 'Hitam', 'Putih', 'Abu'] }] } };
      const { container } = setup([HERO, grid(PRODUCTS)]);
      const card = container.querySelector('a.hw-featured');
      expect(card.getAttribute('href')).toBe('/produk/p1');
      expect(card.textContent).toContain('Warna');
      // Five values at most, drawn as typed: no value becomes a colour.
      expect(card.textContent).toContain('Putih');
      expect(card.textContent).not.toContain('Abu');
      expect(card.querySelector('.hw-featured-vals').children).toHaveLength(5);
      expect(card.querySelector('s')).toBeTruthy();
    });

    it('draws no option row for a product without options, and no card without products', () => {
      details = { p1: { options: [] } };
      const { container } = setup([HERO, grid(PRODUCTS)]);
      expect(container.querySelector('.hw-featured-opts')).toBeNull();
      cleanup();
      const bare = setup([HERO]);
      expect(bare.container.querySelector('.hw-featured')).toBeNull();
    });

    it('takes the product from a carousel when the page has no grid', () => {
      const { container } = setup([HERO, grid([product(7)], 'Baru', 'carousel')]);
      expect(container.querySelector('a.hw-featured').getAttribute('href')).toBe('/produk/p7');
    });
  });

  it('builds nothing about shipping on the home page itself: the trust strip is the layout’s', () => {
    const { container } = setup([HERO], {}, { freeShipping: true, freeShippingMinLabel: 'Rp 150.000' });
    expect(container.querySelector('.hw-trust')).toBeNull();
  });

  describe('features', () => {
    it('draws each mark as typed, and a heart for none', () => {
      const { container } = setup([
        { id: 'f', type: 'features', features: { title: 'Kenapa kami', items: [{ mark: '🌿', title: 'Alami', body: 'Kayu solid.' }, { mark: '24j', title: 'Cepat' }, { mark: '', title: 'Tanpa' }] } },
      ]);
      expect(screen.getByRole('region', { name: 'Kenapa kami' })).toBeTruthy();
      expect(screen.getByRole('heading', { name: 'Kenapa kami' })).toBeTruthy();
      expect(screen.getByText('🌿')).toBeTruthy();
      expect(screen.getByText('Kayu solid.')).toBeTruthy();
      expect(screen.getByText('24j')).toBeTruthy();
      expect(container.querySelectorAll('.hw-feature-mark svg')).toHaveLength(1);
    });

    it("pairs each card with one of the shop's hero pictures, after the hero's own", () => {
      const pics = [{ url: 'https://cdn.test/a.webp' }, { url: 'https://cdn.test/b.webp' }];
      const { container } = setup([{ id: 'f', type: 'features', features: { title: 'T', items: [{ title: 'Satu' }, { title: 'Dua' }] } }], { heroImages: pics });
      const imgs = [...container.querySelectorAll('.hw-feature-media img')].map((i) => i.getAttribute('src'));
      expect(imgs).toEqual(['https://cdn.test/b.webp', 'https://cdn.test/a.webp']);
    });

    it('lays a card out without a picture when the shop has none', () => {
      const { container } = setup([{ id: 'f', type: 'features', features: { title: 'T', items: [{ title: 'Satu' }] } }]);
      expect(container.querySelector('.hw-feature.has-media')).toBeNull();
      expect(container.querySelector('.hw-feature-media')).toBeNull();
    });
  });

  it('links categories into the catalogue filter, with initials and the material line', () => {
    setup([CATS]);
    expect(screen.getByRole('link', { name: /Dapur & Makan/ }).getAttribute('href')).toBe('/katalog?cat=dapur');
    expect(screen.getByText('DM')).toBeTruthy();
    expect(screen.getByText('Bahan · Stoneware')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Belanja per ruangan' })).toBeTruthy();
  });

  describe('grid', () => {
    it('draws every product at once, with the see-all link', () => {
      const many = Array.from({ length: RAIL_ARROWS_AFTER + 3 }, (_, i) => product(i));
      const { container } = setup([grid(many)]);
      expect(container.querySelector('.hw-grid')).toBeTruthy();
      expect(screen.getAllByTestId('product-card')).toHaveLength(many.length);
      expect(screen.queryByRole('button', { name: 'Berikutnya' })).toBeNull();
      expect(screen.getByRole('link', { name: /Lihat semua produk/ }).getAttribute('href')).toBe('/katalog');
      // The published list costs no request.
      expect(productsCalls).toHaveLength(0);
    });

    it('gives only the first grid the chips and the short tagline', () => {
      categories = [{ key: 'dapur', label: 'Dapur' }];
      setup([grid(PRODUCTS, 'Pertama'), grid([product(2)], 'Kedua')], { tagline_short: 'Pilihan terbaik' });
      expect(screen.getAllByRole('group', { name: 'Kategori' })).toHaveLength(1);
      expect(screen.getAllByText('Pilihan terbaik')).toHaveLength(1);
    });

    it("swaps in a category's products from the API, and sends see-all after it", () => {
      categories = [{ key: 'dapur', label: 'Dapur' }];
      catProducts = [product(5), product(6)];
      setup([grid(PRODUCTS)]);
      fireEvent.click(screen.getByRole('button', { name: 'Dapur' }));
      expect(productsCalls.at(-1)).toEqual({ cat: 'dapur' });
      expect(screen.getByRole('button', { name: 'Dapur' }).getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByText('Produk 5')).toBeTruthy();
      expect(screen.queryByText('Produk 1')).toBeNull();
      expect(screen.getByRole('link', { name: /Lihat semua produk/ }).getAttribute('href')).toBe('/katalog?cat=dapur');
      fireEvent.click(screen.getByRole('button', { name: 'Semua' }));
      expect(screen.getByText('Produk 1')).toBeTruthy();
    });

    it('says so when a category has no products', () => {
      categories = [{ key: 'kamar', label: 'Kamar' }];
      catProducts = [];
      setup([grid(PRODUCTS)]);
      fireEvent.click(screen.getByRole('button', { name: 'Kamar' }));
      expect(screen.getByText('Belum ada produk di kategori ini.')).toBeTruthy();
    });

    it('draws no chips for a shop without categories', () => {
      setup([grid(PRODUCTS)]);
      expect(screen.queryByRole('group', { name: 'Kategori' })).toBeNull();
    });
  });

  it('gives the carousel arrows only once it holds more than fits', () => {
    const few = Array.from({ length: RAIL_ARROWS_AFTER }, (_, i) => product(i));
    setup([grid(few, 'Pilihan', 'carousel')]);
    expect(screen.queryByRole('button', { name: 'Berikutnya' })).toBeNull();
    cleanup();
    setup([grid([...few, product(9)], 'Pilihan', 'carousel')]);
    expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeTruthy();
    expect(screen.getAllByTestId('product-card')).toHaveLength(RAIL_ARROWS_AFTER + 1);
  });

  it('skips an empty grid and renders a filled one', () => {
    setup([grid([], 'Kosong'), grid(PRODUCTS, 'Paling laris', 'carousel')]);
    expect(screen.queryByText('Kosong')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Paling laris' })).toBeTruthy();
  });

  describe('campaign', () => {
    const soon = () => new Date(Date.now() + 54 * 3600 * 1000).toISOString();

    it('leads with the headline, its percentage in the accent, the name under it and a countdown inside a week', () => {
      setup([{ id: 'c', type: 'campaign', campaign: { badge: 'Promo terbatas', title: 'untuk koleksi terlaris', headline: 'Diskon hingga 20%', discount_type: 'percentage', discount_value: 20, ends_at: soon(), products: PRODUCTS } }]);
      expect(screen.getByText('Promo terbatas')).toBeTruthy();
      const h2 = screen.getByRole('heading', { name: 'Diskon hingga 20%' });
      expect(h2.querySelector('em').textContent).toBe('20%');
      expect(screen.getByText('untuk koleksi terlaris')).toBeTruthy();
      expect(screen.getByRole('timer')).toBeTruthy();
      expect(screen.getByText('Berakhir dalam')).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Lihat semua promo' }).getAttribute('href')).toBe('/katalog?sale=1');
      expect(screen.getByRole('link', { name: /Produk 1/ }).getAttribute('href')).toBe('/produk/p1');
    });

    it('does not split a headline without the percentage, and draws no countdown far off', () => {
      const far = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
      setup([{ id: 'c', type: 'campaign', campaign: { title: 'Akhir bulan', headline: 'Hemat besar', discount_type: 'percentage', discount_value: 20, ends_at: far, products: PRODUCTS } }]);
      expect(screen.getByRole('heading', { name: 'Hemat besar' }).querySelector('em')).toBeNull();
      expect(screen.queryByRole('timer')).toBeNull();
    });

    // A promotion with no end date must not draw 00:00:00:00.
    it('phrases a campaign with no headline, and draws no countdown and no button without an end or products', () => {
      setup([{ id: 'c', type: 'campaign', campaign: { title: '', discount_type: 'percentage', discount_value: 30, ends_at: null, products: [] } }]);
      expect(screen.queryByRole('timer')).toBeNull();
      expect(screen.queryByText(/Berakhir dalam/)).toBeNull();
      expect(screen.getByRole('heading', { name: 'Diskon hingga 30%' })).toBeTruthy();
      expect(screen.queryByRole('link', { name: 'Lihat semua promo' })).toBeNull();
    });

    it("uses the shop's labels", () => {
      setup([{ id: 'c', type: 'campaign', campaign: { headline: 'Diskon', ends_at: new Date(Date.now() + 5 * 3600 * 1000).toISOString(), products: PRODUCTS } }], {
        sections: { campaign_cta: 'Ambil promonya', countdown_label: 'Sisa waktu' },
      });
      expect(screen.getByRole('link', { name: 'Ambil promonya' })).toBeTruthy();
      expect(screen.getByText('Sisa waktu')).toBeTruthy();
      expect(screen.queryByText('Berakhir dalam')).toBeNull();
    });
  });

  it('sends the story to the about page, with the portrait only when the shop has one', () => {
    const { container } = setup([{ id: 's', type: 'story', story: { title: 'Sejak 2019', text: 'Kami mulai kecil.' } }], {
      sections: { story_eyebrow: 'Cerita kami', story_cta: 'Kenali kami' },
    });
    expect(screen.getByText('Cerita kami')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Kenali kami' }).getAttribute('href')).toBe('/tentang');
    expect(container.querySelector('.hw-story-media')).toBeNull();
    cleanup();
    const withPortrait = setup([{ id: 's', type: 'story', story: { title: 'Sejak 2019' } }], { aboutImage: { url: 'https://cdn.test/p.webp', alt: 'Toko' } });
    expect(withPortrait.container.querySelector('.hw-story-media img').getAttribute('src')).toBe('https://cdn.test/p.webp');
  });

  it('maps the banner tone names to its two bands, and links the catalogue', () => {
    const { container } = setup([{ id: 'b', type: 'banner', banner: { text: 'Cari hadiah?', cta: 'Belanja', bg: 'pink' } }]);
    expect(container.querySelector('.hw-banner.is-pink')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Belanja' }).getAttribute('href')).toBe('/katalog');
    cleanup();
    const quiet = setup([{ id: 'b', type: 'banner', banner: { text: 'Halo', bg: 'butter' } }]);
    expect(quiet.container.querySelector('.hw-banner.is-butter')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
