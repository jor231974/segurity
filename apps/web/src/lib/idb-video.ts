'use client';

const DB_NAME = 'servicom-video';
const DB_VERSION = 1;
const STORE = 'pendingFragments';

export interface PendingFragment {
  id: string;
  streamId: string;
  seq: number;
  blob: Blob;
  attempts: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export async function queuePending(p: PendingFragment): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.put(p));
  } catch {
    // Fallo de IndexedDB: el fragmento se pierde, se avisará al usuario
  }
}

export async function listPending(): Promise<PendingFragment[]> {
  try {
    return await withStore('readonly', (s) => s.getAll());
  } catch {
    return [];
  }
}

export async function removePending(id: string): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.delete(id));
  } catch {
    // ignorar
  }
}