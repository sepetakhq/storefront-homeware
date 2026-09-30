import { describe, expect, it } from 'vitest';

import { DEFAULT_LABELS, categorySpec, featureImage, featuredOption, headlineParts, mapsLink, trustItems } from './copy.js';

// The helpers this template added on top of the fork: each one draws only
// what the shop sent, and nothing at all for what it did not.

describe('headlineParts', () => {
  it('splits the headline at the percentage it states', () => {
    expect(headlineParts({ headline: 'Diskon hingga 20%', discount_type: 'percentage', discount_value: 20 })).toEqual({ pre: 'Diskon hingga ', accent: '20%' });
  });

  it('keeps a headline whole when it does not carry the figure, or the discount is not a percentage', () => {
    expect(headlineParts({ headline: 'Hemat besar', discount_type: 'percentage', discount_value: 20 })).toEqual({ pre: 'Hemat besar', accent: '' });
    expect(headlineParts({ headline: 'Diskon 20%', discount_type: 'fixed', discount_value: 20 })).toEqual({ pre: 'Diskon 20%', accent: '' });
    expect(headlineParts({ headline: 'Diskon 20%', discount_type: 'percentage', discount_value: 0 })).toEqual({ pre: 'Diskon 20%', accent: '' });
  });

  it('phrases a campaign with no headline from its discount, and splits that', () => {
    expect(headlineParts({ discount_type: 'percentage', discount_value: 30 })).toEqual({ pre: 'Diskon hingga ', accent: '30%' });
  });

  it('survives an empty campaign', () => {
    expect(headlineParts(undefined)).toEqual({ pre: '', accent: '' });
  });
});

describe('featuredOption', () => {
  it('takes the first option that has values, five at most, as typed', () => {
    const p = { options: [{ name: 'Kosong', values: [] }, { name: 'Warna', values: ['Krem', 'Walnut', 'a', 'b', 'c', 'd'] }] };
    expect(featuredOption(p)).toEqual({ name: 'Warna', values: ['Krem', 'Walnut', 'a', 'b', 'c'] });
  });

  it('is nothing for a product without options, or before the product loads', () => {
    expect(featuredOption({ options: [] })).toBeNull();
    expect(featuredOption(undefined)).toBeNull();
  });
});

describe('featureImage', () => {
  const pics = [{ url: 'a' }, { url: '' }, { url: 'b' }, { url: 'c' }];
  it("starts after the hero's picture and wraps round, skipping empty ones", () => {
    expect([0, 1, 2].map((i) => featureImage(pics, i)?.url)).toEqual(['b', 'c', 'a']);
  });
  it('is nothing when the shop uploaded no picture', () => {
    expect(featureImage([], 0)).toBeNull();
    expect(featureImage(undefined, 3)).toBeNull();
  });
});

describe('mapsLink', () => {
  it('searches the whole address, encoded', () => {
    expect(mapsLink({ address_line1: 'Jl. Contoh No. 1', address_line2: ' Kota 12345 ' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=Jl.%20Contoh%20No.%201%2C%20Kota%2012345',
    );
  });
  it('is empty without an address', () => {
    expect(mapsLink({ address_line1: '  ', address_line2: '' })).toBe('');
    expect(mapsLink()).toBe('');
  });
});

describe('categorySpec', () => {
  it("joins the merchant's label and text, and drops a lone label", () => {
    expect(categorySpec({ spec_label: 'Bahan', material_spec: 'Jati' })).toBe('Bahan · Jati');
    expect(categorySpec({ material_spec: 'Jati' })).toBe('Jati');
    expect(categorySpec({ spec_label: 'Bahan', material_spec: '' })).toBe('');
  });
});

describe('trustItems', () => {
  const base = { brand: { sections: {} }, copy: (s) => s.replaceAll('{free_shipping_min}', 'Rp 500.000'), paymentMethods: [], couriers: [] };

  it('adds the opening hours under the shop’s hours heading', () => {
    const items = trustItems({ ...base, brand: { opening_hours: 'Senin–Sabtu', sections: { about_hours_heading: 'Kami buka' } } });
    expect(items).toEqual([{ icon: 'clock', title: 'Kami buka', sub: 'Senin–Sabtu' }]);
  });

  it('claims only what the shop offers', () => {
    expect(trustItems(base)).toEqual([]);
    const items = trustItems({
      ...base,
      freeShipping: true,
      paymentMethods: [{ name: 'QRIS', enabled: true }, { name: 'Mati', enabled: false }],
      couriers: [{ name: 'JNE', enabled: true }],
    });
    expect(items.map((i) => i.title)).toEqual([DEFAULT_LABELS.hero_chip_shipping, DEFAULT_LABELS.hero_chip_couriers, DEFAULT_LABELS.hero_chip_payment]);
    expect(items[0].sub).toBe('min. Rp 500.000');
    expect(items[2].sub).toBe('QRIS');
  });
});
