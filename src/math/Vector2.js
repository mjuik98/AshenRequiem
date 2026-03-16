/** Vector2 유틸리티 */
export function distanceSq(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function sub(a, b)   { return { x: a.x - b.x, y: a.y - b.y }; }
export function add(a, b)   { return { x: a.x + b.x, y: a.y + b.y }; }
export function scale(v, s) { return { x: v.x * s,   y: v.y * s   }; }

export function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}
