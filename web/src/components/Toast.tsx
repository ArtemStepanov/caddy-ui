import { useState, useEffect } from 'preact/hooks';
import { getToast, subscribe, ToastMessage } from '../lib/syncNotify';

export function Toast() {
  const [toast, setToast] = useState<ToastMessage | null>(getToast);

  useEffect(() => {
    return subscribe(() => setToast(getToast()));
  }, []);

  if (!toast) return null;

  const bg = toast.type === 'success'
    ? 'bg-green-800 border-green-600 text-green-200'
    : 'bg-red-800 border-red-600 text-red-200';

  return (
    <div class={`fixed bottom-4 right-4 z-50 border rounded-lg px-4 py-3 text-sm shadow-lg ${bg}`}>
      {toast.message}
    </div>
  );
}
