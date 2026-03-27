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

function hashSeed(seed) {
  const text = String(seed ?? '');
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seed = '') {
  let state = hashSeed(seed);
  if (state === 0) state = 0x9e3779b9;

  return {
    nextFloat() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return ((state >>> 0) & 0xffffffff) / 0x100000000;
    },
  };
}

export function ensureRng(rng) {
  if (typeof rng === 'function') {
    return {
      nextFloat() {
        return rng();
      },
    };
  }
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

export function weightedPick(entries = [], rng) {
  let totalWeight = 0;
  for (let i = 0; i < entries.length; i++) {
    totalWeight += Math.max(0, Number(entries[i]?.weight) || 0);
  }
  if (totalWeight <= 0) return null;

  const roll = nextFloat(rng) * totalWeight;
  let cursor = 0;
  for (let i = 0; i < entries.length; i++) {
    const entryWeight = Math.max(0, Number(entries[i]?.weight) || 0);
    if (entryWeight <= 0) continue;
    cursor += entryWeight;
    if (roll < cursor) {
      return entries[i];
    }
  }

  return entries[entries.length - 1] ?? null;
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
