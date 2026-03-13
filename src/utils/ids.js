/**
 * ids.js — 고유 ID 생성
 */
let _nextId = 1;

export function generateId() {
  return _nextId++;
}
