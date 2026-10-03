import { logoChips } from '../lib/copy.js';

/**
 * The shop's payment methods or couriers as the platform's badges, one per
 * badge, read aloud by the first name behind it; a name the server sent no
 * badge for sits beside them as a text chip of the same height. A list with
 * no badge at all stays the plain line the design draws.
 */
export default function Marks({ items, sep }) {
  const list = logoChips(items);
  if (!list.some((m) => m.logo_url)) return list.map((m) => m.name).join(sep);
  return (
    <span className="hw-marks">
      {list.map((m, i) =>
        m.logo_url ? (
          <span key={i} className="hw-logo-chip" title={m.name}>
            <img src={m.logo_url} alt={m.name} loading="lazy" />
          </span>
        ) : (
          <span key={i} className="hw-mark-text">
            {m.name}
          </span>
        ),
      )}
    </span>
  );
}
