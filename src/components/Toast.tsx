'use client';

import { useEffect, useState } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'ok' | 'err' | 'info';
}

let toastId = 0;
let addToast: ((msg: string, type?: ToastMessage['type']) => void) | null = null;

export function toast(msg: string, type: ToastMessage['type'] = 'info') {
  addToast?.(msg, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToast = (text, type = 'info') => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    return () => { addToast = null; };
  }, []);

  const colors = {
    ok: 'bg-accent/10 border-accent/30 text-accent',
    err: 'bg-primary/10 border-primary/30 text-primary',
    info: 'bg-secondary/10 border-secondary/30 text-secondary',
  };

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-elevated backdrop-blur-sm animate-[slideUp_0.3s_ease] ${colors[t.type]}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
