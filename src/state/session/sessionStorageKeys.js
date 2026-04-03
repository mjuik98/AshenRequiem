export const SESSION_STORAGE_KEY = 'ashenRequiem_session';

export function buildSessionStorageKeys(storageKey = SESSION_STORAGE_KEY) {
  return {
    primary: storageKey,
    backup: `${storageKey}_backup`,
    corrupt: `${storageKey}_corrupt`,
  };
}
