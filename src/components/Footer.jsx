import { Link } from 'react-router-dom';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';
import { useCategories } from '@sepetakhq/storefront-kit/hooks/queries';

import { BrandMark } from './BrandMark.jsx';
import Marks from './Marks.jsx';
import Icon from '../ui/Icon.jsx';
import { askLink, footerLinks, originLine, sectionText, socialLabel } from '../lib/copy.js';

/**
 * The design's sand footer, from config alone: the mark, tagline, where the
 * shop ships from and its socials; the merchant's own links; the categories;
 * contact; and along the bottom the copyright beside the payment methods and
 * couriers the shop has switched on. A column with nothing to list is not
 * drawn, so a bare new shop gets a short footer rather than headings over
 * nothing.
 */
export default function Footer() {
  const { brand, paymentMethods, couriers, tenant } = useConfig();
  // The platform's mark, on the plans that carry it. Absent on an older API
  // version, which strips the field, so nothing is drawn.
  const badge = tenant?.sepetak_badge === true;
  const { data: categories } = useCategories();
  const payments = (paymentMethods ?? []).filter((m) => m.enabled && m.name);
  const ships = (couriers ?? []).filter((c) => c.enabled && c.name);
  const socials = (brand.social_links ?? []).filter((s) => s.url);
  const links = footerLinks(brand.nav);
  const cats = categories ?? [];
  const address = [brand.address_line1, brand.address_line2].filter(Boolean);
  const phoneHref = brand.phone ? `tel:${String(brand.phone).replace(/[^\d+]/g, '')}` : '';
  const chat = askLink(brand.whatsapp_url, '');
  const hasContact = Boolean(brand.phone || brand.email || address.length || brand.opening_hours || chat);
  const origin = originLine(brand);
  const s = (key) => sectionText(brand.sections, key);

  return (
    <footer className="hw-footer">
      <div className="hw-footer-grid">
        <div className="hw-footer-col" style={{ gap: 14 }}>
          <Link to="/" aria-label="Beranda" style={{ alignSelf: 'flex-start' }}>
            <BrandMark height={40} maxWidth={200} />
          </Link>
          {brand.tagline && <p style={{ margin: 0, lineHeight: 1.6, maxWidth: 280, textWrap: 'pretty' }}>{brand.tagline}</p>}
          {origin && <span className="hw-footer-origin">{origin}</span>}
          {socials.length > 0 && (
            <div className="hw-footer-socials">
              {socials.map((so, i) => (
                <a key={`${so.kind}-${i}`} href={so.url} target="_blank" rel="noopener noreferrer" className="hw-social">
                  {socialLabel(so.kind)}
                </a>
              ))}
            </div>
          )}
        </div>

        {links.length > 0 && (
          <nav className="hw-footer-col" aria-label={s('footer_shop_heading')}>
            <h4>{s('footer_shop_heading')}</h4>
            {links.map((n) => (
              <Link key={n.path} to={n.path}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}

        {cats.length > 0 && (
          <nav className="hw-footer-col" aria-label={s('footer_categories_heading')}>
            <h4>{s('footer_categories_heading')}</h4>
            {cats.map((c) => (
              <Link key={c.key} to={`/katalog?cat=${encodeURIComponent(c.key)}`}>
                {c.label}
              </Link>
            ))}
          </nav>
        )}

        {hasContact && (
          <div className="hw-footer-col" style={{ gap: 10 }}>
            <h4>{s('footer_contact_heading')}</h4>
            {address.length > 0 && (
              <span className="hw-footer-row" style={{ alignItems: 'flex-start' }}>
                <Icon name="pin" size={16} style={{ marginTop: 3 }} />
                <span>
                  {address.map((l, i) => (
                    <span key={i} style={{ display: 'block' }}>
                      {l}
                    </span>
                  ))}
                </span>
              </span>
            )}
            {brand.phone && (
              <a href={phoneHref} className="hw-footer-row">
                <Icon name="phone" size={16} />
                {brand.phone}
              </a>
            )}
            {brand.email && (
              <a href={`mailto:${brand.email}`} className="hw-footer-row">
                <Icon name="mail" size={16} />
                {brand.email}
              </a>
            )}
            {brand.opening_hours && (
              <span className="hw-footer-row">
                <Icon name="clock" size={16} />
                {brand.opening_hours}
              </span>
            )}
            {chat && (
              <a href={chat} target="_blank" rel="noopener noreferrer" className="hw-footer-wa">
                {String(brand.whatsapp_text ?? '').trim() || 'WhatsApp'}
              </a>
            )}
          </div>
        )}
      </div>

      {(brand.copyright || payments.length > 0 || ships.length > 0 || badge) && (
        <div className="hw-footer-bottom">
          <div>
            <span className="hw-footer-sign">
              {brand.copyright && <span>{brand.copyright}</span>}
              {badge && (
                <a href="https://sepetak.com/?ref=toko" target="_blank" rel="noopener" className="hw-footer-badge">
                  Dibuat dengan Sepetak
                </a>
              )}
            </span>
            <div className="hw-footer-list">
              {payments.length > 0 && (
                <span>
                  <strong>{s('footer_payment_heading')}</strong> · <Marks items={payments} sep=", " />
                </span>
              )}
              {ships.length > 0 && (
                <span>
                  <strong>{s('footer_shipping_heading')}</strong> · <Marks items={ships} sep=", " />
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
