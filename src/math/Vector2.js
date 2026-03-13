/**
 * Vector2.js — 2D 벡터 유틸리티 (순수 함수)
 */

export function vec2(x = 0, y = 0) {
  return { x, y };
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

export function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v) {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function distance(a, b) {
  return length(sub(a, b));
}

export function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}
