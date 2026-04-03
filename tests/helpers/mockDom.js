function toDatasetKey(attributeName) {
  return attributeName
    .replace(/^data-/, '')
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function inferTagName(selector) {
  if (!selector) return 'DIV';
  if (selector.includes('data-seed-text') || selector.includes('input')) return 'INPUT';
  if (selector === '.sl-panel') return 'SECTION';
  if (selector.includes('data-action')
    || selector.includes('data-weapon-id')
    || selector.includes('data-accessory-id')
    || selector.includes('data-archetype-id')
    || selector.includes('data-risk-relic-id')
    || selector.includes('data-stage-id')
    || selector.includes('data-seed-mode')
    || selector.includes('data-ascension-level')) {
    return 'BUTTON';
  }
  return 'DIV';
}

function parseHtmlAttributes(attributeSource = '') {
  const attributes = {};
  const attrPattern = /([A-Za-z_:][A-Za-z0-9_:-]*)(?:="([^"]*)")?/g;
  for (const [, name, value] of attributeSource.matchAll(attrPattern)) {
    attributes[name] = value ?? true;
  }
  return attributes;
}

function parseMarkupDescriptors(html = '') {
  const descriptors = [];
  const tagPattern = /<([A-Za-z][A-Za-z0-9-]*)([^>]*)>/g;
  for (const match of html.matchAll(tagPattern)) {
    const [, tagName, attributeSource = ''] = match;
    if (attributeSource.trim().startsWith('/')) continue;
    descriptors.push({
      tagName: String(tagName).toUpperCase(),
      attributes: parseHtmlAttributes(attributeSource),
      index: match.index ?? 0,
    });
  }
  return descriptors;
}

function getSelectorSteps(selector) {
  return String(selector ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(/\s+/).at(-1))
    .filter(Boolean);
}

function parseSelector(selector) {
  const negatives = [...selector.matchAll(/:not\(\[([A-Za-z0-9_-]+)(?:="([^"]*)")?\]\)/g)]
    .map(([, name, value]) => ({ name, value: value ?? true }));
  const cleaned = selector.replace(/:not\(\[[^\]]+\]\)/g, '');
  const tagMatch = cleaned.match(/^[A-Za-z][A-Za-z0-9-]*/);
  const idMatch = cleaned.match(/#([A-Za-z0-9_-]+)/);
  const classes = [...cleaned.matchAll(/\.([A-Za-z0-9_-]+)/g)].map(([, name]) => name);
  const attributes = [...cleaned.matchAll(/\[([A-Za-z0-9_-]+)(?:="([^"]*)")?\]/g)]
    .map(([, name, value]) => ({ name, value: value ?? true }));

  return {
    tagName: tagMatch ? tagMatch[0].toUpperCase() : null,
    id: idMatch?.[1] ?? null,
    classes,
    attributes,
    negatives,
  };
}

function descriptorMatchesSelector(descriptor, selector) {
  if (!descriptor || !selector) return false;
  if (selector === '*') return true;

  const rule = parseSelector(selector);
  const classNames = String(descriptor.attributes.class ?? '')
    .split(/\s+/)
    .filter(Boolean);

  if (rule.tagName && descriptor.tagName !== rule.tagName) {
    return false;
  }
  if (rule.id && descriptor.attributes.id !== rule.id) {
    return false;
  }
  if (!rule.classes.every((className) => classNames.includes(className))) {
    return false;
  }
  if (!rule.attributes.every(({ name, value }) => {
    if (!Object.hasOwn(descriptor.attributes, name)) return false;
    return value === true || String(descriptor.attributes[name]) === String(value);
  })) {
    return false;
  }
  if (!rule.negatives.every(({ name, value }) => {
    if (!Object.hasOwn(descriptor.attributes, name)) return true;
    if (value === true) return false;
    return String(descriptor.attributes[name]) !== String(value);
  })) {
    return false;
  }
  return true;
}

function createMockMarkupNode(documentRef, selector, descriptor = null, sourceElement = null) {
  const listeners = new Map();

  function dispatchToNode(type, overrides = {}) {
    const event = {
      type,
      target: node,
      currentTarget: node,
      bubbles: true,
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
      ...overrides,
    };

    for (const listener of listeners.get(type) ?? []) {
      listener(event);
    }

    if (!event.propagationStopped) {
      sourceElement?.dispatchEvent?.(event);
    }
    return event;
  }

  const node = {
    ownerDocument: documentRef,
    selector,
    tagName: descriptor?.tagName ?? inferTagName(selector),
    style: {},
    dataset: {},
    className: '',
    id: '',
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
      } else if (name === 'class') {
        this.className = String(value);
      } else if (name === 'id') {
        this.id = String(value);
      } else {
        this[name] = String(value);
      }
    },
    getAttribute(name) {
      if (name === 'class') return this.className || null;
      if (name === 'id') return this.id || null;
      if (name.startsWith('data-')) {
        return this.dataset[toDatasetKey(name)] ?? null;
      }
      return this[name] ?? null;
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] ?? null;
    },
    querySelectorAll(selector) {
      return sourceElement?.querySelectorAll?.(selector) ?? [];
    },
    contains(other) {
      return Boolean(other) && other._sourceElement === sourceElement;
    },
    focus() {
      documentRef.activeElement = this;
    },
    click() {
      dispatchToNode('click');
    },
    dispatchEvent(event) {
      return dispatchToNode(event?.type ?? 'event', event);
    },
    _sourceElement: sourceElement,
  };

  const descriptorAttributes = descriptor?.attributes ?? {};
  for (const [name, value] of Object.entries(descriptorAttributes)) {
    node.setAttribute(name, value === true ? '' : value);
  }
  return node;
}

function createMockElement(documentRef, tagName) {
  const listeners = new Map();
  let innerHTML = '';
  const selectorCache = new Map();
  const descriptorNodeCache = new Map();

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
    dispatchEvent(event = {}) {
      const dispatchEvent = {
        bubbles: true,
        defaultPrevented: false,
        propagationStopped: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
        stopPropagation() {
          this.propagationStopped = true;
        },
        currentTarget: this,
        ...event,
      };
      for (const listener of listeners.get(dispatchEvent.type) ?? []) {
        listener(dispatchEvent);
      }
      if (dispatchEvent.bubbles !== false && !dispatchEvent.propagationStopped) {
        this.parentNode?.dispatchEvent?.(dispatchEvent);
      }
      return dispatchEvent;
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] ?? null;
    },
    querySelectorAll(selector) {
      const descriptors = parseMarkupDescriptors(innerHTML)
        .filter((descriptor) => getSelectorSteps(selector).some((step) => descriptorMatchesSelector(descriptor, step)));
      if (descriptors.length <= 0) return [];
      const cached = selectorCache.get(selector);
      if (cached && cached.length === descriptors.length) return cached;
      const nodes = descriptors.map((descriptor) => {
        const cacheKey = `${descriptor.index}:${descriptor.tagName}`;
        const existing = descriptorNodeCache.get(cacheKey);
        if (existing) return existing;
        const node = createMockMarkupNode(documentRef, selector, descriptor, element);
        descriptorNodeCache.set(cacheKey, node);
        return node;
      });
      selectorCache.set(selector, nodes);
      return nodes;
    },
    contains(node) {
      return Boolean(node) && node._sourceElement === this;
    },
    focus() {
      documentRef.activeElement = this;
    },
  };

  Object.defineProperty(element, 'innerHTML', {
    get() {
      return innerHTML;
    },
    set(value) {
      innerHTML = String(value ?? '');
      selectorCache.clear();
      descriptorNodeCache.clear();
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
    activeElement: null,
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
