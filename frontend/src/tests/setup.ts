// Ensures tests have a working Storage implementation.
// Some Node versions expose a non-standard global `localStorage` that can break tests.

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
};

function createMemoryStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    }
  };
}

function hasWorkingStorage(obj: any): obj is StorageLike {
  return (
    !!obj &&
    typeof obj.setItem === 'function' &&
    typeof obj.getItem === 'function' &&
    typeof obj.removeItem === 'function'
  );
}

const jsdomLocalStorage = typeof window !== 'undefined' ? (window as any).localStorage : undefined;
const jsdomSessionStorage = typeof window !== 'undefined' ? (window as any).sessionStorage : undefined;

if (!hasWorkingStorage((globalThis as any).localStorage)) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: hasWorkingStorage(jsdomLocalStorage) ? jsdomLocalStorage : createMemoryStorage(),
    configurable: true,
    writable: true
  });
}

if (!hasWorkingStorage((globalThis as any).sessionStorage)) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: hasWorkingStorage(jsdomSessionStorage) ? jsdomSessionStorage : createMemoryStorage(),
    configurable: true,
    writable: true
  });
}
