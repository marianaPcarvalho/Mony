// Generate visually distinct, stable colors per category.
// Uses an even hue distribution + per-id offset so reorder doesn't collide.

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Build a palette of N distinct HSL colors, evenly spread around the hue wheel.
 * Saturation/lightness are nudged slightly per index to add separation.
 */
export function buildCategoryPalette(n: number): string[] {
  if (n <= 0) return [];
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const hue = Math.round((i * 360) / n);
    const sat = 65 + (i % 3) * 6; // 65, 71, 77
    const light = 50 + (i % 2) * 6; // 50, 56
    out.push(`hsl(${hue}, ${sat}%, ${light}%)`);
  }
  return out;
}

/** Stable color for a given category id when palette index isn't enough. */
export function colorForId(id: string): string {
  const h = hashId(id) % 360;
  return `hsl(${h}, 70%, 52%)`;
}
