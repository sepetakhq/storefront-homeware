import { Link } from 'react-router-dom';

import { Img, SIZES } from '../ui/Img.jsx';
import Icon from '../ui/Icon.jsx';
import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';
import { paragraphs } from '@sepetakhq/storefront-kit/shared/format';

import { askLink, mapsLink, sectionText } from '../lib/copy.js';

/**
 * The shop's story and how to reach it -- the design's about and contact
 * pages in one, since the platform has one page for both: the portrait and
 * the story, the shop's numbers, then address, contact and hours cards and a
 * WhatsApp card. Everything is a brand field; each block is drawn only when
 * the merchant filled it in.
 */
export default function About() {
  const { brand } = useConfig();
  // Already resolved by the API: a merchant who has not chosen a portrait gets
  // the hero this page has always borrowed.
  const portrait = brand.aboutImage;
  const name = [brand.wordmark_primary, brand.wordmark_accent].filter(Boolean).join(' ');
  // An unset title renders the wordmark rather than an empty heading.
  const title = brand.aboutTitle || name;
  const story = paragraphs(brand.aboutBody);
  // The page's name is what the shop calls it in its nav.
  const pageName = brand.nav?.find((n) => n.path === '/tentang')?.label || sectionText(brand.sections, 'story_cta');
  const stats = (brand.heroStats ?? []).filter((s) => s?.value);

  // A link out to the map, never an embedded one: no third-party frame loads
  // on the shop's own page.
  const maps = mapsLink(brand);
  const address = [
    ...[brand.address_line1, brand.address_line2].filter(Boolean).map((t) => ({ t })),
    ...(maps ? [{ t: 'Buka di Maps', href: maps, external: true }] : []),
  ];
  const contact = [
    brand.phone && { t: brand.phone, href: `tel:${String(brand.phone).replace(/[^\d+]/g, '')}` },
    brand.email && { t: brand.email, href: `mailto:${brand.email}` },
  ].filter(Boolean);
  const cards = [
    address.length && { icon: 'pin', title: sectionText(brand.sections, 'about_address_heading'), lines: address },
    contact.length && { icon: 'phone', title: sectionText(brand.sections, 'about_contact_heading'), lines: contact },
    brand.opening_hours && { icon: 'clock', title: sectionText(brand.sections, 'about_hours_heading'), lines: [{ t: brand.opening_hours }] },
  ].filter(Boolean);
  const chat = askLink(brand.whatsapp_url, '');

  return (
    <main aria-label={pageName}>
      <section className="hw-pagehead">
        <div className="hw-inner" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <nav aria-label="Breadcrumb" className="hw-crumbs">
            <Link to="/">Beranda</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{pageName}</span>
          </nav>
          <h1 style={{ textWrap: 'balance' }}>{pageName}</h1>
          {brand.tagline && <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--hw-body)', maxWidth: 620 }}>{brand.tagline}</p>}
        </div>
      </section>

      <div className="hw-wrap" style={{ paddingTop: 'clamp(32px, 5vw, 64px)', display: 'flex', flexDirection: 'column', gap: 'clamp(32px, 5vw, 56px)', width: '100%' }}>
        <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(28px, 4vw, 56px)' }}>
          <div className="hw-story-media" style={{ flex: '1 1 340px' }}>
            <Img
              src={portrait?.url}
              srcSet={portrait?.srcset}
              alt={portrait?.alt || name}
              ratio="auto"
              radius={0}
              sizes={SIZES.hero}
              style={{ position: 'absolute', inset: 0, background: 'var(--hw-img)' }}
              fallback={
                <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--hw-primary)' }}>
                  <Icon name="lamp" size={96} strokeWidth={0.9} />
                </div>
              }
            />
          </div>
          <div style={{ flex: '1.1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span className="hw-eyebrow">{sectionText(brand.sections, 'story_eyebrow')}</span>
            <h2 className="hw-h2" style={{ fontSize: 'clamp(26px, 3.4vw, 40px)' }}>
              {title}
            </h2>
            {/* Text nodes, never dangerouslySetInnerHTML: the body is copy a
                merchant typed into the backoffice. */}
            {story.map((para, i) => (
              <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: 1.75, color: 'var(--hw-body)', textWrap: 'pretty' }}>
                {para}
              </p>
            ))}
          </div>
        </section>

        {stats.length > 0 && (
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 18, background: 'var(--hw-soft)', border: '1px solid var(--hw-panel-line)', display: 'flex', flexDirection: 'column-reverse', gap: 6 }}>
                <dt style={{ fontSize: 14, color: 'var(--hw-body)' }}>{s.label}</dt>
                <dd style={{ margin: 0, fontFamily: 'var(--hw-display)', fontSize: 'clamp(30px, 4vw, 40px)', lineHeight: 1, color: 'var(--hw-ink)' }}>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {(cards.length > 0 || chat) && (
          <section style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'stretch' }}>
            {cards.length > 0 && (
              <div style={{ flex: '1.4 1 420px', minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: 16 }}>
                {cards.map((c) => (
                  <div key={c.icon} className="hw-fact">
                    <span className="hw-fact-icon">
                      <Icon name={c.icon} size={20} />
                    </span>
                    <b>{c.title}</b>
                    {c.lines.map((l, j) =>
                      l.href ? (
                        <a
                          key={j}
                          href={l.href}
                          className={l.external ? 'hw-fact-link' : undefined}
                          target={l.external ? '_blank' : undefined}
                          rel={l.external ? 'noopener noreferrer' : undefined}
                        >
                          {l.t}
                        </a>
                      ) : (
                        <span key={j} className="hw-fact-line">
                          {l.t}
                        </span>
                      ),
                    )}
                  </div>
                ))}
              </div>
            )}
            {chat && (
              <div className="hw-campaign" style={{ flex: '1 1 300px', minWidth: 0, gap: 16, flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center' }}>
                {brand.tagline_short && (
                  <span style={{ fontFamily: 'var(--hw-display)', fontSize: 'clamp(22px, 2.6vw, 28px)', lineHeight: 1.2 }}>{brand.tagline_short}</span>
                )}
                <a href={chat} target="_blank" rel="noopener noreferrer" className="hw-btn hw-btn-primary" style={{ alignSelf: 'flex-start' }}>
                  <Icon name="whatsapp" size={18} />
                  {String(brand.whatsapp_text ?? '').trim() || sectionText(brand.sections, 'about_contact_heading')}
                </a>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
