import { nextFloat } from './random.js';

export function weightedPick(items, rng) {
  const total = items.reduce((s, it) => s + (it.weight || 1), 0);
  let r = nextFloat(rng) * total;
  for (const item of items) { r -= (item.weight || 1); if (r <= 0) return item; }
  return items[items.length - 1];
}
