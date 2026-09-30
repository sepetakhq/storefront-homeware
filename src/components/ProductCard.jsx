import { Link } from 'react-router-dom';

import { useCart } from '@sepetakhq/storefront-kit/cart/CartProvider';
import { buyLabel } from '@sepetakhq/storefront-kit/lib/availability';
import { isPriceRange, lineKey } from '@sepetakhq/storefront-kit/lib/variants';
import { useToast } from '@sepetakhq/storefront-kit/ui/ToastProvider';
import { fmt } from '@sepetakhq/storefront-kit/shared/format';

import { Img, SIZES } from '../ui/Img.jsx';
import Icon from '../ui/Icon.jsx';
import { Tile } from './Tile.jsx';
import { cardNote, cardVeil, discountPct, quickAddState } from '../lib/copy.js';

/**
 * The design's card: a square picture (or initials) with the discount or the
 * merchant's badge in its corner, then the category in small caps, the name,
 * the price, the note and the action. The picture and the name are links;
 * the action sits outside them so a tap on it never navigates.
 */
export default function ProductCard({ p }) {
  const off = discountPct(p);
  const note = cardNote(p);
  const veil = cardVeil(p);
  const href = `/produk/${p.slug}`;

  return (
    <article className="hw-card" data-testid="product-card">
      <Link to={href} className="hw-card-media" tabIndex={-1} aria-hidden="true">
        <Img
          src={p.image}
          srcSet={p.image_srcset}
          sizes={SIZES.card}
          alt=""
          ratio="1/1"
          radius={0}
          fallback={<Tile label={p.name} tintKey={p.category_key} size={26} />}
        />
        {/* One tag, as the design has it: the promotion's own badge, or the
            discount worked out when the promotion carries none. */}
        {(p.badge || off > 0) && (
          <span className="hw-card-tags">
            {p.badge ? <span className="hw-tag">{p.badge}</span> : <span className="hw-tag hw-tag-sale">-{off}%</span>}
          </span>
        )}
        {veil && (
          <span className="hw-card-veil">
            <span>{veil}</span>
          </span>
        )}
      </Link>
      <div className="hw-card-body">
        {p.category_label && <span className="hw-card-cat">{p.category_label}</span>}
        <Link to={href} className="hw-card-name">
          {p.name}
        </Link>
        <Price p={p} off={off} />
        {note && <span className="hw-card-note">{note}</span>}
        <div className="hw-card-foot">
          <QuickAdd p={p} />
        </div>
      </div>
    </article>
  );
}

// The design stacks the struck-through price over the one the buyer pays.
function Price({ p, off }) {
  return (
    <div className="hw-card-price">
      {off > 0 && <s className="hw-compare">{fmt(p.compare_at_price)}</s>}
      <span>
        {isPriceRange(p) && <span className="hw-price-from">mulai </span>}
        <span className={off > 0 ? 'hw-price is-sale' : 'hw-price'}>{fmt(p.price)}</span>
      </span>
    </div>
  );
}

/**
 * The action area, by quickAddState:
 *   add      → one tap adds one and confirms with a toast
 *   stepper  → −/+ around the qty already in the cart, + capped at `max`
 *   variants → a link to the page; a card cannot pick a variant
 *   disabled → the kit's reason (sold out / opens on / ended)
 */
export function QuickAdd({ p }) {
  const cart = useCart();
  // The kit's context value is the function itself, not an object holding it.
  const showToast = useToast();
  const key = lineKey({ productId: p.id, variantId: null });
  const line = cart.items.find((it) => lineKey(it) === key);
  const qty = line?.qty ?? 0;
  const state = quickAddState(p, qty);

  if (state.kind === 'variants') {
    return (
      <Link to={`/produk/${p.slug}`} className="hw-card-btn is-variant">
        Pilih varian
      </Link>
    );
  }
  if (state.kind === 'disabled') {
    return (
      <button type="button" className="hw-card-btn" disabled>
        {buyLabel(p) ?? 'Stok habis'}
      </button>
    );
  }
  if (state.kind === 'add') {
    const label = p.preorder ? 'Pre-order' : 'Tambah';
    return (
      <button
        type="button"
        className="hw-card-btn is-add"
        aria-label={`${label} ${p.name} ke keranjang`}
        onClick={() => {
          cart.add(p, 1, null);
          showToast(`${p.name} masuk keranjang`);
        }}
      >
        <Icon name="cart" size={16} strokeWidth={2} />
        {label}
      </button>
    );
  }
  return (
    <div className="hw-stepper" role="group" aria-label={`Jumlah ${p.name}`}>
      <button type="button" aria-label="Kurangi" onClick={() => (qty <= 1 ? cart.remove(key) : cart.setQty(key, qty - 1))}>
        −
      </button>
      <output aria-live="polite">{qty}</output>
      <button type="button" aria-label="Tambah" disabled={qty >= state.max} onClick={() => cart.setQty(key, qty + 1)}>
        +
      </button>
    </div>
  );
}
