'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Check, X } from 'lucide-react';

export function Toaster() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const notify = searchParams.get('notify');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!notify) return;
    setMessage(decodeURIComponent(notify));
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      // Remove param from URL without reload
      const params = new URLSearchParams(searchParams.toString());
      params.delete('notify');
      const qs = params.toString();
      router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false });
    }, 4000);
    return () => clearTimeout(timer);
  }, [notify]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.3s_ease-out]">
      <div className="flex items-center gap-3 px-5 py-3 border-accent/40 border-t border-l border-r-6 border-b-6 bg-background shadow-lg">
        <Check className="w-4 h-4 text-accent shrink-0" />
        <span className="text-foreground text-sm whitespace-nowrap">{message}</span>
        <button onClick={() => setVisible(false)} className="text-foreground/30 hover:text-foreground transition-colors ml-2">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
