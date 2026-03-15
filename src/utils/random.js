export function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function randomRange(min, max) { return min + Math.random() * (max - min); }
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
