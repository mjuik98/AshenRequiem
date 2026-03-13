/**
 * clamp.js — 값 범위 제한
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
