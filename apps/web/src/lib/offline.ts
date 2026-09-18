export interface QueuedOp {
  id: string;
  path: string;
  method: string;
  body: any;
  queuedAt: string;
  tries: number;
}

const KEY = 'servicom_offline_queue';

export function getQueue(): QueuedOp[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(q: QueuedOp[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
}

function uid() {
  return 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function enqueue(path: string, method: string, body: any) {
  const queue = getQueue();
  queue.push({ id: uid(), path, method, body, queuedAt: new Date().toISOString(), tries: 0 });
  saveQueue(queue);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('servicom_offline_changed'));
  }
}

export function clearQueued(id: string) {
  saveQueue(getQueue().filter((o) => o.id !== id));
}

export function markTried(id: string) {
  const queue = getQueue().map((o) => (o.id === id ? { ...o, tries: o.tries + 1 } : o));
  saveQueue(queue);
}

export async function syncQueue(fetchFn: (path: string, method: string, body: any) => Promise<any>): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;
  let syncCount = 0;
  for (const op of getQueue()) {
    if (op.tries >= 3) continue;
    try {
      await fetchFn(op.path, op.method, op.body);
      clearQueued(op.id);
      syncCount++;
    } catch {
      markTried(op.id);
    }
  }
  return syncCount;
}

export function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine;
}

export function onNetworkChange(cb: () => void): () => void {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}