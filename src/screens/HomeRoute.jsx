import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';
import { useCategories, useHome, useProduct, useProducts } from '@sepetakhq/storefront-kit/hooks/queries';
import { qk } from '@sepetakhq/storefront-kit/api/queryKeys';
import { serverNow } from '@sepetakhq/storefront-kit/api/client';
import { fmt } from '@sepetakhq/storefront-kit/shared/format';

import ProductCard from '../components/ProductCard.jsx';
import { Tile } from '../components/Tile.jsx';
import { Img, SIZES } from '../ui/Img.jsx';
import Icon from '../ui/Icon.jsx';
import { CountdownCells } from '../ui/Countdown.jsx';
import { EmptyState, ErrorState, ProductGridSkeleton, Skeleton } from '../ui/states.jsx';
import { bannerTheme, categorySpec, discountPct, featureImage, featureMark, featuredOption, headlineParts, sectionText, showCountdown } from '../lib/copy.js';

/** Products beyond which the carousel earns its arrows. */
export const RAIL_ARROWS_AFTER = 4;

/** The home page is the section list the merchant published, in order. */
export default function HomeRoute() {
  const { data, isPending, isError, error, refetch } = useHome();

  if (isPending) return <HomeSkeleton />;
  if (isError) {
    return (
      <main className="hw-wrap" style={{ paddingTop: 60 }}>
        <ErrorState error={error} onRetry={refetch} />
      </main>
    );
  }
  const sections = (data?.sections ?? []).filter(renders);
  if (sections.length === 0) return <EmptyHome />;
  // The hero's featured card is the first product the page lists; the first
  // grid is the one that carries the category chips.
  const firstGrid = sections.find((s) => s.type === 'grid' || s.type === 'carousel');
  const primaryGrid = sections.find((s) => s.type === 'grid');

  return (
    <main>
      {sections.map((sec, i) => (
        <Section key={sec.id ?? i} sec={sec} featured={firstGrid?.grid?.products?.[0]} primary={sec === primaryGrid} />
      ))}
    </main>
  );
}

/** Whether a section has anything to draw; an empty one is skipped. */
export function renders(sec) {
  switch (sec?.type) {
    case 'hero':
      return Boolean(sec.hero?.title);
    case 'features':
      return Boolean(sec.features?.items?.length);
    case 'cats':
      return Boolean(sec.cats?.length);
    case 'campaign':
      return Boolean(sec.campaign);
    case 'grid':
    case 'carousel':
      return Boolean(sec.grid?.products?.length);
    case 'story':
      return Boolean(sec.story?.title);
    case 'banner':
      return Boolean(sec.banner?.text);
    default:
      // A type this bundle predates: skipped, the way the resolver skips one
      // it does not know.
      return false;
  }
}

function Section({ sec, featured, primary }) {
  switch (sec.type) {
    case 'hero':
      return <Hero hero={sec.hero} featured={featured} />;
    case 'features':
      return <Features features={sec.features} />;
    case 'cats':
      return <Categories cats={sec.cats} />;
    case 'campaign':
      return <Campaign campaign={sec.campaign} />;
    case 'grid':
      return <Grid grid={sec.grid} primary={primary} />;
    case 'carousel':
      return <Rail grid={sec.grid} />;
    case 'story':
      return <Story story={sec.story} />;
    case 'banner':
      return <Banner banner={sec.banner} />;
    default:
      return null;
  }
}

/** The design's centred heading between hairlines and sparkles. */
function OrnamentHead({ title, sub }) {
  return (
    <div className="hw-ornament">
      <div className="hw-ornament-row">
        <span className="hw-spark" aria-hidden="true">✦</span>
        <h2>{title}</h2>
        <span className="hw-spark" aria-hidden="true">✦</span>
      </div>
      {sub && <p>{sub}</p>}
    </div>
  );
}

function SeeAll({ to = '/katalog', children }) {
  return (
    <div className="hw-see-row">
      <Link to={to} className="hw-see-all">
        {children}
        <Icon name="arrow" size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}

/** What an image slot shows before the merchant uploads one. */
function EmptyPicture({ size = 96 }) {
  return (
    <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--hw-rule)' }}>
      <Icon name="lamp" size={size} strokeWidth={0.9} />
    </div>
  );
}

/* --- hero ---------------------------------------------------------------- */

function Hero({ hero, featured }) {
  const { brand } = useConfig();
  const picture = brand.heroImages?.[0];
  const stats = (brand.heroStats ?? []).filter((s) => s?.value);

  return (
    <section className="hw-hero">
      <div className="hw-hero-row">
        <div className="hw-hero-copy">
          {brand.hero_eyebrow && (
            <div className="hw-hero-eyebrow">
              {brand.hero_eyebrow}
              <span className="hw-spark" aria-hidden="true">✦</span>
            </div>
          )}
          <h1>
            {hero.title}
            {hero.em ? (
              <>
                {' '}
                <em>{hero.em}</em>
              </>
            ) : null}
          </h1>
          {hero.sub && <p className="hw-hero-sub">{hero.sub}</p>}
          <div className="hw-hero-actions">
            <Link to="/katalog" className="hw-btn hw-btn-primary hw-btn-shadow">
              {hero.cta || 'Belanja sekarang'}
            </Link>
            <Link to="/tentang" className="hw-hero-secondary">
              <span aria-hidden="true">
                <Icon name="arrow" size={18} strokeWidth={1.8} />
              </span>
              {sectionText(brand.sections, 'hero_secondary_cta')}
            </Link>
          </div>
          {stats.length > 0 && (
            <dl className="hw-hero-stats">
              {stats.map((s, i) => (
                <div key={i}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="hw-hero-art">
          <div className="hw-hero-media">
            <span className="hw-spark a" aria-hidden="true">✦</span>
            <span className="hw-spark b" aria-hidden="true">✦</span>
            <span className="hw-spark c" aria-hidden="true">✦</span>
            <div className="hw-hero-frame">
              <div className="hw-hero-gold">
                <div className="hw-hero-photo">
                  <Img
                    src={picture?.url}
                    srcSet={picture?.srcset}
                    sizes={SIZES.hero}
                    alt={picture?.alt ?? ''}
                    ratio="1/1"
                    priority
                    radius={0}
                    style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', background: 'var(--hw-img)' }}
                    fallback={<EmptyPicture />}
                  />
                </div>
              </div>
            </div>
          </div>
          {featured && <FeaturedCard product={featured} />}
        </div>
      </div>
    </section>
  );
}

/**
 * The card leaning on the hero picture: the page's first product, its price,
 * and the values of its first option as words. The list card carries no
 * options, so they come from the product's own page (one request, the same
 * cache entry the product page would use).
 */
export function FeaturedCard({ product }) {
  const { data: detail } = useProduct(product.slug);
  const option = featuredOption(detail);
  const off = discountPct(product);
  return (
    <Link to={`/produk/${product.slug}`} className="hw-featured">
      <span className="hw-featured-name">{product.name}</span>
      <span className="hw-featured-price">
        <b>{fmt(product.price)}</b>
        {off > 0 && <s className="hw-compare">{fmt(product.compare_at_price)}</s>}
      </span>
      {option && (
        <span className="hw-featured-opts">
          <span>{option.name}</span>
          <span className="hw-featured-vals">
            {option.values.map((v) => (
              <span key={v}>{v}</span>
            ))}
          </span>
        </span>
      )}
    </Link>
  );
}

/* --- features ----------------------------------------------------------- */

function Features({ features }) {
  const { brand } = useConfig();
  return (
    <section className="hw-section" aria-label={features.title || undefined}>
      {features.title && (
        <h2 className="hw-h2" style={{ textAlign: 'center', marginBottom: 22 }}>
          {features.title}
        </h2>
      )}
      <ul className="hw-features">
        {features.items.map((it, i) => {
          const mark = featureMark(it.mark);
          const picture = featureImage(brand.heroImages, i);
          return (
            <li key={i} className={picture ? 'hw-feature has-media' : 'hw-feature'}>
              <div className="hw-feature-copy">
                <div className="hw-feature-top">
                  <span className="hw-feature-mark" aria-hidden="true">
                    {mark.icon ? <Icon name={mark.icon} size={20} /> : mark.text}
                  </span>
                  <h3>{it.title}</h3>
                </div>
                {it.body && <p>{it.body}</p>}
              </div>
              {picture && (
                <div className="hw-feature-media">
                  <Img
                    src={picture.url}
                    srcSet={picture.srcset}
                    sizes={SIZES.categoryTile}
                    alt=""
                    ratio="auto"
                    radius={0}
                    style={{ position: 'absolute', inset: 0, background: 'transparent' }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* --- categories --------------------------------------------------------- */

function Categories({ cats }) {
  const { brand } = useConfig();
  return (
    <section id="kategori" className="hw-section" style={{ scrollMarginTop: 90 }}>
      <div className="hw-head">
        <h2 className="hw-h2">{sectionText(brand.sections, 'cats_heading')}</h2>
      </div>
      <div className="hw-cats">
        {cats.map((c) => (
          <Link key={c.key} to={`/katalog?cat=${encodeURIComponent(c.key)}`} className="hw-cat">
            <span className="hw-cat-media">
              <Img
                src={c.image}
                srcSet={c.image_srcset}
                sizes={SIZES.categoryTile}
                alt=""
                ratio="auto"
                radius={0}
                style={{ position: 'absolute', inset: 0, background: 'transparent' }}
                fallback={<Tile label={c.label} tintKey={c.key} size={30} />}
              />
            </span>
            <span className="hw-cat-body">
              {categorySpec(c) && <span className="hw-cat-meta">{categorySpec(c)}</span>}
              <b>{c.label}</b>
              {c.subtitle && <span className="hw-cat-sub">{c.subtitle}</span>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* --- product grid and carousel ------------------------------------------ */

/**
 * The design's product grid. The first one on the page carries the shop's
 * short tagline and a chip per category; a chip swaps the grid for that
 * category's products (from the API, never filtered here), and "see all"
 * follows the chip into the catalogue.
 */
function Grid({ grid, primary }) {
  const { brand } = useConfig();
  const [cat, setCat] = useState('');
  const categories = useCategories();
  const chips = primary ? categories.data ?? [] : [];

  return (
    <section className="hw-section">
      <OrnamentHead title={grid.title || 'Produk pilihan'} sub={primary ? brand.tagline_short : ''} />
      {chips.length > 0 && (
        <div className="hw-chiprow" role="group" aria-label="Kategori">
          {[{ key: '', label: 'Semua' }, ...chips].map((c) => (
            <button key={c.key || 'all'} type="button" className="hw-pill" aria-pressed={cat === c.key} onClick={() => setCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      {/* Mounted only once a chip is picked: the published list costs no
          request, a category costs one. */}
      {cat ? <CategoryProducts cat={cat} max={Math.max(grid.products.length, 4)} /> : <Cards products={grid.products} />}
      <SeeAll to={cat ? `/katalog?cat=${encodeURIComponent(cat)}` : '/katalog'}>{sectionText(brand.sections, 'grid_see_all')}</SeeAll>
    </section>
  );
}

function CategoryProducts({ cat, max }) {
  const q = useProducts({ cat });
  if (q.isPending) return <ProductGridSkeleton count={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} />;
  return <Cards products={(q.data?.pages?.[0]?.products ?? []).slice(0, max)} />;
}

function Cards({ products }) {
  if (products.length === 0) return <p className="hw-grid-note">Belum ada produk di kategori ini.</p>;
  return (
    <div className="hw-grid">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

function Rail({ grid }) {
  const { brand } = useConfig();
  const track = useRef(null);
  const scroll = (dir) => {
    const el = track.current;
    if (!el) return;
    const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: smooth ? 'smooth' : 'auto' });
  };
  const arrows = grid.products.length > RAIL_ARROWS_AFTER;

  return (
    <section className="hw-section" style={{ paddingBottom: 8 }}>
      <OrnamentHead title={grid.title || 'Produk pilihan'} />
      <div className="hw-rail">
        {arrows && (
          <>
            <button type="button" className="hw-rail-arrow prev" aria-label="Sebelumnya" onClick={() => scroll(-1)}>
              <Icon name="prev" size={18} strokeWidth={2} />
            </button>
            <button type="button" className="hw-rail-arrow next" aria-label="Berikutnya" onClick={() => scroll(1)}>
              <Icon name="next" size={18} strokeWidth={2} />
            </button>
          </>
        )}
        <ul ref={track} className="hw-rail-track">
          {grid.products.map((p) => (
            <li key={p.id} className="hw-rail-item">
              <ProductCard p={p} />
            </li>
          ))}
        </ul>
      </div>
      <SeeAll>{sectionText(brand.sections, 'grid_see_all')}</SeeAll>
    </section>
  );
}

/* --- story -------------------------------------------------------------- */

function Story({ story }) {
  const { brand } = useConfig();
  const portrait = brand.aboutImage;

  return (
    <section className="hw-section">
      <div className="hw-story">
        {portrait?.url && (
          <div className="hw-story-media">
            <Img
              src={portrait.url}
              srcSet={portrait.srcset}
              sizes={SIZES.hero}
              alt={portrait.alt ?? ''}
              ratio="auto"
              radius={0}
              style={{ position: 'absolute', inset: 0, background: 'var(--hw-img)' }}
              fallback={<EmptyPicture />}
            />
          </div>
        )}
        <div className="hw-story-copy">
          <span className="hw-eyebrow">{sectionText(brand.sections, 'story_eyebrow')}</span>
          <h2>{story.title}</h2>
          {story.text && <p>{story.text}</p>}
          <Link to="/tentang" className="hw-btn hw-btn-outline">
            {sectionText(brand.sections, 'story_cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* --- campaign ----------------------------------------------------------- */

/**
 * The design's sale panel: the promotion's badge, the big line with its
 * percentage in the accent colour, the promotion's name under it, the
 * countdown, and three of its products.
 */
function Campaign({ campaign }) {
  const qc = useQueryClient();
  const { brand } = useConfig();
  const products = (campaign.products ?? []).slice(0, 3);
  // A countdown only for a real, near deadline: none for a promotion with no
  // end date, one already past, or one weeks away.
  const ticking = showCountdown(campaign.ends_at, serverNow());
  const { pre, accent } = headlineParts(campaign);
  const title = String(campaign.title ?? '').trim();

  return (
    <section className="hw-section">
      <div className="hw-campaign">
        <div className="hw-campaign-copy">
          {campaign.badge && <span className="hw-campaign-badge">{campaign.badge}</span>}
          <h2>
            {pre}
            {accent && <em>{accent}</em>}
          </h2>
          {title && title !== pre + accent && <p className="hw-campaign-sub">{title}</p>}
          {ticking && (
            <CountdownCells
              until={campaign.ends_at}
              label={sectionText(brand.sections, 'countdown_label')}
              onExpire={() => qc.invalidateQueries({ queryKey: qk.home })}
            />
          )}
          {products.length > 0 && (
            <Link to="/katalog?sale=1" className="hw-btn hw-btn-primary">
              {sectionText(brand.sections, 'campaign_cta')}
            </Link>
          )}
        </div>
        {products.length > 0 && (
          <div className="hw-campaign-items">
            {products.map((p) => (
              <MiniCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MiniCard({ p }) {
  const off = discountPct(p);
  return (
    <Link to={`/produk/${p.slug}`} className="hw-mini">
      <span className="hw-mini-media">
        <Img
          src={p.image}
          srcSet={p.image_srcset}
          sizes={SIZES.card}
          alt=""
          ratio="auto"
          radius={0}
          style={{ position: 'absolute', inset: 0 }}
          fallback={<Tile label={p.name} tintKey={p.category_key} size={24} />}
        />
      </span>
      <span className="hw-mini-body">
        <span>{p.name}</span>
        <span className="hw-mini-price">
          <b>{fmt(p.price)}</b>
          {off > 0 && <s className="hw-compare">{fmt(p.compare_at_price)}</s>}
        </span>
      </span>
    </Link>
  );
}

/* --- banner ------------------------------------------------------------- */

function Banner({ banner }) {
  const theme = bannerTheme(banner.bg);
  return (
    <section className="hw-section">
      <div className={theme.className}>
        <p>{banner.text}</p>
        {banner.cta && (
          <Link to="/katalog" className={theme.button} style={{ flexShrink: 0 }}>
            {banner.cta}
          </Link>
        )}
      </div>
    </section>
  );
}

/* --- states ------------------------------------------------------------- */

function EmptyHome() {
  return (
    <main className="hw-wrap" style={{ paddingTop: 60 }}>
      <EmptyState
        title="Toko sedang disiapkan"
        body="Halaman depan belum diisi. Katalognya sudah bisa dilihat."
        action={
          <Link to="/katalog" className="hw-btn hw-btn-primary">
            Lihat katalog
          </Link>
        }
      />
    </main>
  );
}

function HomeSkeleton() {
  return (
    <main aria-busy="true">
      <div className="hw-wrap" style={{ paddingTop: 48, display: 'flex', flexWrap: 'wrap', gap: 40 }}>
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 40 }}>
          <Skeleton height={14} width={140} />
          <Skeleton height={64} />
          <Skeleton height={64} width="70%" />
          <Skeleton height={48} width={190} />
        </div>
        <div style={{ flex: '1 1 380px', maxWidth: 480, aspectRatio: '1/1', borderRadius: '50%', background: 'var(--hw-blob)' }} />
      </div>
      <div className="hw-wrap" style={{ paddingTop: 48 }}>
        <ProductGridSkeleton count={5} />
      </div>
    </main>
  );
}
