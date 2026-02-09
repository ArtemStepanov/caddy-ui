export interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

type Listener = () => void;

let current: ToastMessage | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

export function getToast(): ToastMessage | null {
  return current;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifySyncResult(type: ToastMessage['type'], message: string) {
  if (timer) clearTimeout(timer);
  current = { type, message };
  listeners.forEach((fn) => fn());
  timer = setTimeout(() => {
    current = null;
    listeners.forEach((fn) => fn());
    timer = null;
  }, 3000);
}
