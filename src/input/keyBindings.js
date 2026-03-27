const DEFAULT_KEY_BINDINGS_SHAPE = Object.freeze({
  moveUp: ['w', 'arrowup'],
  moveDown: ['s', 'arrowdown'],
  moveLeft: ['a', 'arrowleft'],
  moveRight: ['d', 'arrowright'],
  pause: ['escape'],
  confirm: ['enter', 'space'],
  debug: ['backquote'],
});

export const DEFAULT_KEY_BINDINGS = Object.freeze(
  Object.fromEntries(
    Object.entries(DEFAULT_KEY_BINDINGS_SHAPE).map(([action, values]) => [action, Object.freeze([...values])]),
  ),
);

const KEY_ALIAS_MAP = Object.freeze({
  ' ': 'space',
  spacebar: 'space',
  esc: 'escape',
  return: 'enter',
  '`': 'backquote',
});

function cloneBindings(bindings = DEFAULT_KEY_BINDINGS) {
  return Object.fromEntries(
    Object.entries(bindings).map(([action, values]) => [action, Array.isArray(values) ? [...values] : []]),
  );
}

export function normalizeKeyToken(value = '') {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  return KEY_ALIAS_MAP[normalized] ?? normalized;
}

function normalizeBindingList(values, fallback) {
  const source = Array.isArray(values) ? values : fallback;
  const normalized = [];
  for (const value of source) {
    const token = normalizeKeyToken(value);
    if (!token || normalized.includes(token)) continue;
    normalized.push(token);
  }
  return normalized.length > 0 ? normalized : [...fallback];
}

export function normalizeKeyBindings(keyBindings = {}) {
  const normalized = cloneBindings(DEFAULT_KEY_BINDINGS);
  for (const [action, fallback] of Object.entries(DEFAULT_KEY_BINDINGS)) {
    normalized[action] = normalizeBindingList(keyBindings?.[action], fallback);
  }
  return normalized;
}

function extractEventTokens(eventOrKey = '') {
  if (typeof eventOrKey === 'string') {
    return [normalizeKeyToken(eventOrKey)];
  }

  return [
    normalizeKeyToken(eventOrKey?.key ?? ''),
    normalizeKeyToken(eventOrKey?.code ?? ''),
  ].filter(Boolean);
}

export function matchesKeyBinding(bindingTokens = [], eventOrKey = '') {
  const eventTokens = extractEventTokens(eventOrKey);
  return bindingTokens.some((token) => eventTokens.includes(token));
}

export function matchesActionBinding(action, eventOrKey = '', keyBindings = DEFAULT_KEY_BINDINGS) {
  const normalized = normalizeKeyBindings(keyBindings);
  return matchesKeyBinding(normalized[action] ?? [], eventOrKey);
}

export function formatKeyBindingLabel(token = '') {
  const normalized = normalizeKeyToken(token);
  const labelMap = {
    arrowup: 'Arrow Up',
    arrowdown: 'Arrow Down',
    arrowleft: 'Arrow Left',
    arrowright: 'Arrow Right',
    escape: 'ESC',
    enter: 'Enter',
    space: 'Space',
    backquote: '`',
  };
  if (labelMap[normalized]) return labelMap[normalized];
  return normalized.length === 1 ? normalized.toUpperCase() : normalized;
}
