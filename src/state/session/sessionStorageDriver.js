export function getBrowserSessionStorage(host = globalThis) {
  return typeof host?.localStorage !== 'undefined'
    ? host.localStorage
    : null;
}

export function resolveSessionStorage({
  storage = undefined,
  host = globalThis,
} = {}) {
  return storage !== undefined
    ? storage
    : getBrowserSessionStorage(host);
}
