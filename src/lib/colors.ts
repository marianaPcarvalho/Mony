// Generate visually distinct, stable colors per category.
// Tuned for AA-friendly contrast against light/dark surfaces and to be
// distinguishable for common color-vision deficiencies (avoids adjacent
// red/green pairs by spreading hues evenly + alternating lightness/saturation).

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Build a palette of N visually distinct HSL colors.
 * - Hue spread evenly around the wheel
 * - Alternating lightness so neighboring slices contrast against each other
 * - Saturation kept high enough to be vibrant but not neon-on-neon
 */
export function buildCategoryPalette(n: number): string[] {
  if (n <= 0) return [];
  const out: string[] = [];
  // Start offset avoids landing exactly on pure red, which clashes with destructive.
  const startHue = 12;
  for (let i = 0; i < n; i++) {
    const hue = Math.round((startHue + (i * 360) / n) % 360);
    const sat = 70 + (i % 3) * 5;       // 70 / 75 / 80
    const light = i % 2 === 0 ? 46 : 56; // alternate to separate adjacent slices
    out.push(`hsl(${hue}, ${sat}%, ${light}%)`);
  }
  return out;
}

/** Stable color for a given category id when palette index isn't enough. */
export function colorForId(id: string): string {
  const h = hashId(id) % 360;
  return `hsl(${h}, 72%, 48%)`;
}
