import { useLocation } from 'react-router-dom';

import { useConfig } from '@sepetakhq/storefront-kit/config/ConfigProvider';

import Icon from '../ui/Icon.jsx';
import { trustItems } from '../lib/copy.js';

/** The pages the design closes with the strip: where a buyer is still deciding. */
export function showsTrust(pathname) {
  return pathname === '/' || pathname === '/katalog' || pathname.startsWith('/produk/');
}

/**
 * The design's reassurance strip above the footer: free shipping, couriers,
 * payment and opening hours, each only when the shop really offers it. The
 * words are the merchant's labels; what sits under them is the shop's own
 * configuration.
 */
export default function TrustStrip() {
  const config = useConfig();
  const { pathname } = useLocation();
  if (!showsTrust(pathname)) return null;
  const items = trustItems(config);
  if (items.length === 0) return null;

  return (
    <div className="hw-wrap">
      <ul className="hw-trust">
        {items.map((c) => (
          <li key={c.icon} className="hw-chip">
            <span className="hw-chip-icon">
              <Icon name={c.icon} size={26} strokeWidth={1.4} />
            </span>
            <span style={{ minWidth: 0 }}>
              <b>{c.title}</b>
              {c.sub && <span className="hw-chip-sub">{c.sub}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
