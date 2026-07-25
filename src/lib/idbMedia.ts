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

/** Все медиа как {key: dataURL} — для резервной копии. */
export async function exportAllMedia(): Promise<Record<string, string>> {
  const store = await tx('readonly');
  const keys = await new Promise<IDBValidKey[]>((res, rej) => { const r = store.getAllKeys(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const blobs = await new Promise<Blob[]>((res, rej) => { const r = store.getAll(); r.onsuccess = () => res(r.result as Blob[]); r.onerror = () => rej(r.error); });
  const out: Record<string, string> = {};
  for (let i = 0; i < keys.length; i++) {
    out[String(keys[i])] = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result as string); fr.onerror = rej; fr.readAsDataURL(blobs[i]); });
  }
  return out;
}

/** Восстановить медиа из резервной копии {key: dataURL}. */
export async function importAllMedia(map: Record<string, string>): Promise<void> {
  const store = await tx('readwrite');
  for (const [key, dataUrl] of Object.entries(map)) {
    const blob = await (await fetch(dataUrl)).blob();
    store.put(blob, key);
  }
}
