export const mathRng = Object.freeze({
  nextFloat() {
    return Math.random();
  },
});

export function createRng(nextFloatFn = Math.random) {
  return {
    nextFloat() {
      return nextFloatFn();
    },
  };
}

export function ensureRng(rng) {
  return rng && typeof rng.nextFloat === 'function' ? rng : mathRng;
}

export function nextFloat(rng) {
  return ensureRng(rng).nextFloat();
}

export function chance(probability, rng) {
  return nextFloat(rng) < probability;
}

export function randomRange(min, max, rng) {
  return min + nextFloat(rng) * (max - min);
}

export function randomPick(arr, rng) {
  return arr[Math.floor(nextFloat(rng) * arr.length)];
}

/** Fisher-Yates 셔플 (원본 배열 복사 후 반환) */
export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(nextFloat(rng) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
