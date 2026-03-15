export function distanceSq(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  return dx * dx + dy * dy;
}
export function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
export function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}
