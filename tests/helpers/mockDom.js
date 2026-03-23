function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toDatasetKey(attributeName) {
  return attributeName
    .replace(/^data-/, '')
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function createMockMarkupNode(selector) {
  const listeners = new Map();

  return {
    selector,
    style: {},
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      listeners.set(type, entries.filter((entry) => entry !== listener));
    },
    setAttribute(name, value) {
      if (name.startsWith('data-')) {
        this.dataset[toDatasetKey(name)] = String(value);
      } else {
        this[name] = String(value);
      }
    },
    getAttribute(name) {
      if (name.startsWith('data-')) {
        return this.dataset[toDatasetKey(name)] ?? null;
      }
      return this[name] ?? null;
    },
    focus() {},
    click() {
      for (const listener of listeners.get('click') ?? []) {
        listener({
          currentTarget: this,
          target: this,
          preventDefault() {},
          stopPropagation() {},
        });
      }
    },
  };
}

function getSelectorToken(selector) {
  if (!selector) return null;

  const idMatch = selector.match(/#([A-Za-z0-9_-]+)/);
  if (idMatch) return { type: 'id', token: idMatch[1] };

  const classMatch = selector.match(/\.([A-Za-z0-9_-]+)/);
  if (classMatch) return { type: 'class', token: classMatch[1] };

  const attrValueMatch = selector.match(/\[([A-Za-z0-9_-]+)="([^"]+)"\]/);
  if (attrValueMatch) {
    return {
      type: 'attribute-value',
      token: `${attrValueMatch[1]}="${attrValueMatch[2]}"`,
    };
  }

  const attrMatch = selector.match(/\[([A-Za-z0-9_-]+)\]/);
  if (attrMatch) return { type: 'attribute', token: attrMatch[1] };

  return null;
}

function countSelectorMatches(html, selector) {
  const info = getSelectorToken(selector);
  if (!info || !html) return 0;

  if (info.type === 'id') {
    return html.includes(`id="${info.token}"`) ? 1 : 0;
  }

  if (info.type === 'class') {
    const pattern = new RegExp(`class="[^"]*\\b${escapeRegex(info.token)}\\b[^"]*"`, 'g');
    return html.match(pattern)?.length ?? 0;
  }

  if (info.type === 'attribute-value') {
    const pattern = new RegExp(escapeRegex(info.token), 'g');
    return html.match(pattern)?.length ?? 0;
  }

  const pattern = new RegExp(`${escapeRegex(info.token)}(?:=|\\s|>)`, 'g');
  return html.match(pattern)?.length ?? 0;
}

function createMockElement(documentRef, tagName) {
  const listeners = new Map();
  let innerHTML = '';
  const selectorCache = new Map();

  const element = {
    ownerDocument: documentRef,
    tagName: String(tagName ?? 'div').toUpperCase(),
    className: '',
    style: {},
    dataset: {},
    children: [],
    parentNode: null,
    id: '',
    appendChild(child) {
      if (!child) return child;
      child.parentNode = this;
      this.children.push(child);
      if (child.id) {
        documentRef._elementsById.set(child.id, child);
      }
      return child;
    },
    remove() {
      if (!this.parentNode) return;
      this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
      this.parentNode = null;
    },
    setAttribute(name, value) {
      const nextValue = String(value);
      if (name === 'id') {
        this.id = nextValue;
        documentRef._elementsById.set(nextValue, this);
        return;
      }
      if (name === 'class') {
        this.className = nextValue;
        return;
      }
      if (name.startsWith('data-')) {
        this.dataset[toDatasetKey(name)] = nextValue;
        return;
      }
      this[name] = nextValue;
    },
    getAttribute(name) {
      if (name === 'id') return this.id || null;
      if (name === 'class') return this.className || null;
      if (name.startsWith('data-')) {
        return this.dataset[toDatasetKey(name)] ?? null;
      }
      return this[name] ?? null;
    },
    addEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      entries.push(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      const entries = listeners.get(type) ?? [];
      listeners.set(type, entries.filter((entry) => entry !== listener));
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] ?? null;
    },
    querySelectorAll(selector) {
      const count = countSelectorMatches(innerHTML, selector);
      if (count <= 0) return [];
      const cached = selectorCache.get(selector);
      if (cached && cached.length === count) return cached;
      const nodes = Array.from({ length: count }, () => createMockMarkupNode(selector));
      selectorCache.set(selector, nodes);
      return nodes;
    },
  };

  Object.defineProperty(element, 'innerHTML', {
    get() {
      return innerHTML;
    },
    set(value) {
      innerHTML = String(value ?? '');
      selectorCache.clear();
    },
  });

  return element;
}

export function installMockDom() {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  const windowListeners = new Map();

  const documentRef = {
    _elementsById: new Map(),
    createElement(tagName) {
      return createMockElement(documentRef, tagName);
    },
    getElementById(id) {
      return this._elementsById.get(id) ?? null;
    },
    head: null,
    body: null,
  };

  documentRef.head = createMockElement(documentRef, 'head');
  documentRef.body = createMockElement(documentRef, 'body');

  const windowRef = {
    addEventListener(type, listener) {
      const entries = windowListeners.get(type) ?? [];
      entries.push(listener);
      windowListeners.set(type, entries);
    },
    removeEventListener(type, listener) {
      const entries = windowListeners.get(type) ?? [];
      windowListeners.set(type, entries.filter((entry) => entry !== listener));
    },
    dispatch(type, event = {}) {
      for (const listener of windowListeners.get(type) ?? []) {
        listener(event);
      }
    },
  };

  globalThis.document = documentRef;
  globalThis.window = windowRef;

  return {
    document: documentRef,
    window: windowRef,
    restore() {
      globalThis.document = previousDocument;
      globalThis.window = previousWindow;
    },
  };
}
