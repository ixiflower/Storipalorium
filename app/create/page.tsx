'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

function looksLikeUrl(text: string): boolean {
  return /^https?:\/\//.test(text.trim());
}

export default function CreatePage() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('notes');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const openMenu = useCallback(() => setOpen(true), []);

  const openWithPaste = useCallback((pastedText: string) => {
    const text = pastedText.trim();
    if (looksLikeUrl(text)) {
      setLink(text);
      setCategory('links');
    }
    setOpen(true);
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), link: link.trim(), category }),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      setOpen(false);
      setTitle('');
      setLink('');
      setCategory('notes');
      router.refresh();
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      onPaste={(e) => {
        const text = e.clipboardData.getData('text');
        if (text) openWithPaste(text);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const text = e.dataTransfer.getData('text');
        if (text && looksLikeUrl(text)) {
          setLink(text.trim());
          setCategory('links');
        }
        setOpen(true);
      }}
    >
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="text-center w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-4 md:mx-auto p-12 md:p-24 border-secondary border-t border-l border-r-6 border-b-6">
          <div className="md:hidden space-y-10">
            <Button
              variant="outline"
              size="lg"
              onClick={openMenu}
              className="w-full h-28 px-16 text-2xl text-foreground border-foreground border-t border-l border-r-6 border-b-6"
            >
              UPLOAD
            </Button>
            <div className="text-foreground/60">OR</div>
            <Button
              variant="outline"
              size="lg"
              onClick={openMenu}
              className="w-full h-28 px-16 text-2xl text-foreground border-secondary border-t border-l border-r-6 border-b-6"
            >
              PASTE
            </Button>
          </div>
          <div className="hidden md:block">
            <h1 className="text-3xl md:text-5xl font-light">PRESS CTRL + V</h1>
            <div className="my-4">
              <h2 className="text-3xl md:text-5xl font-light">OR</h2>
            </div>
            <h3 className="text-3xl md:text-5xl font-light">DRAG SOMETHING</h3>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-5xl p-8 border-secondary border-t border-l border-r-6 border-b-6">
          <DialogTitle className="sr-only">Add Item</DialogTitle>
          <div className="grid gap-14 md:grid-cols-[240px_1fr] items-start">
            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14"
              autoFocus
            />

            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">
              Link
            </label>
            <textarea
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl min-h-48"
            />

            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14"
            >
              <option className="bg-background text-foreground" value="notes">
                Notes
              </option>
              <option className="bg-background text-foreground" value="links">
                Links
              </option>
              <option className="bg-background text-foreground" value="media">
                Media
              </option>
            </select>
          </div>

          {error && (
            <div className="mt-4 text-destructive text-sm">{error}</div>
          )}

          <div className="mt-10 flex justify-end gap-6">
            <Button
              variant="outline"
              className="px-8 py-3 text-xl text-foreground border-foreground border-t border-l border-r-6 border-b-6"
              onClick={() => {
                setOpen(false);
                setError('');
              }}
            >
              CANCEL
            </Button>
            <Button
              variant="outline"
              className="px-8 py-3 text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 disabled:opacity-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'SAVING...' : 'SAVE'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
