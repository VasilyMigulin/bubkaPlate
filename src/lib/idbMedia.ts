// Хранилище тяжёлых медиа (видео) в IndexedDB — сотни МБ против ~5 МБ у localStorage.
// В записи дневника лежит только ссылка вида "idb:<key>"; сам blob — здесь.

const DB = 'bubka-media';
const STORE = 'media';

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return open().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

export function isIdbRef(ref: string): boolean {
  return ref.startsWith('idb:');
}

/** Сохранить blob, вернуть ссылку "idb:<key>". */
export async function putMedia(blob: Blob): Promise<string> {
  const key = 'm_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const store = await tx('readwrite');
  await new Promise<void>((res, rej) => {
    const r = store.put(blob, key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
  return 'idb:' + key;
}

const urlCache = new Map<string, string>();

/** Ссылку любого вида превратить в пригодный для <img>/<video> src (object URL для idb, как есть для data:). */
export async function resolveMedia(ref: string): Promise<string> {
  if (!isIdbRef(ref)) return ref;
  if (urlCache.has(ref)) return urlCache.get(ref)!;
  const key = ref.slice(4);
  const store = await tx('readonly');
  const blob = await new Promise<Blob | undefined>((res, rej) => {
    const r = store.get(key);
    r.onsuccess = () => res(r.result as Blob | undefined);
    r.onerror = () => rej(r.error);
  });
  if (!blob) return '';
  const url = URL.createObjectURL(blob);
  urlCache.set(ref, url);
  return url;
}

/** Видео ли это (по ссылке или по mime сохранённого blob). */
export function looksVideo(ref: string): boolean {
  return ref.startsWith('data:video') || isIdbRef(ref);
}

export async function delMedia(ref: string): Promise<void> {
  if (!isIdbRef(ref)) return;
  const store = await tx('readwrite');
  store.delete(ref.slice(4));
}
