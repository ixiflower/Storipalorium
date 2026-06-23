'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Plus, Users } from 'lucide-react';

function looksLikeUrl(text: string): boolean {
  return /^https?:\/\//.test(text.trim());
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${days * 86400};SameSite=Lax`;
}

type Room = { id: string; name: string; code: string; ownerId: string };

export default function CreatePage() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('notes');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('private');
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomMsg, setRoomMsg] = useState('');
  const router = useRouter();

  // Load rooms and saved preference
  useEffect(() => {
    fetch('/api/rooms')
      .then(r => r.json())
      .then(d => {
        if (d.rooms) setRooms(d.rooms);
      })
      .catch(() => {});
    const saved = getCookie('stori_save_target');
    if (saved) setSelectedRoomId(saved);
  }, []);

  // Persist preference
  useEffect(() => {
    setCookie('stori_save_target', selectedRoomId);
  }, [selectedRoomId]);

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
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const body: Record<string, string> = {
        title: title.trim(),
        link: link.trim(),
        category,
      };
      if (selectedRoomId !== 'private') body.roomId = selectedRoomId;
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to save'); return; }
      setOpen(false); setTitle(''); setLink(''); setCategory('notes');
      router.refresh();
    } catch { setError('Network error. Try again.'); }
    finally { setSaving(false); }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    setRoomMsg('');
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRoomName.trim() }),
    });
    const d = await res.json();
    if (res.ok) {
      setRooms(prev => [...prev, d.room]);
      setSelectedRoomId(d.room.id);
      setNewRoomName('');
      setRoomMsg(`Room created! Code: ${d.room.code}`);
    } else {
      setRoomMsg(d.error || 'Failed to create room');
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    setRoomMsg('');
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode.trim() }),
    });
    const d = await res.json();
    if (res.ok) {
      setRooms(prev => {
        if (prev.find(r => r.id === d.room.id)) return prev;
        return [...prev, d.room];
      });
      setSelectedRoomId(d.room.id);
      setJoinCode('');
      setRoomMsg(`Joined: ${d.room.name}`);
    } else {
      setRoomMsg(d.error || 'Invalid code');
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      onPaste={(e) => {
        const text = e.clipboardData.getData('text');
        if (text) openWithPaste(text);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const text = e.dataTransfer.getData('text');
        if (text && looksLikeUrl(text)) { setLink(text.trim()); setCategory('links'); }
        setOpen(true);
      }}
    >
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="text-center w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-4 md:mx-auto p-12 md:p-24 border-secondary border-t border-l border-r-6 border-b-6">
          <div className="md:hidden space-y-10">
            <Button variant="outline" size="lg" onClick={openMenu}
              className="w-full h-28 px-16 text-2xl text-foreground border-foreground border-t border-l border-r-6 border-b-6">UPLOAD</Button>
            <div className="text-foreground/60">OR</div>
            <Button variant="outline" size="lg" onClick={openMenu}
              className="w-full h-28 px-16 text-2xl text-foreground border-secondary border-t border-l border-r-6 border-b-6">PASTE</Button>
          </div>
          <div className="hidden md:block">
            <h1 className="text-3xl md:text-5xl font-light">PRESS CTRL + V</h1>
            <div className="my-4"><h2 className="text-3xl md:text-5xl font-light">OR</h2></div>
            <h3 className="text-3xl md:text-5xl font-light">DRAG SOMETHING</h3>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-5xl p-8 border-secondary border-t border-l border-r-6 border-b-6 max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Add Item</DialogTitle>

          {/* Save target selector */}
          <div className="mb-8 flex items-center gap-4 flex-wrap">
            <span className="text-foreground text-lg">Save to:</span>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm"
            >
              <option className="bg-background" value="private">Private</option>
              {rooms.map(r => (
                <option key={r.id} className="bg-background" value={r.id}>{r.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowRoomPanel(!showRoomPanel)}
              className="flex items-center gap-1 text-accent text-sm hover:underline"
            >
              <Users className="w-4 h-4" />
              {showRoomPanel ? 'Hide rooms' : 'Manage rooms'}
            </button>
            {selectedRoom && (
              <span className="text-foreground/40 text-sm">
                → {selectedRoom.name}
              </span>
            )}
          </div>

          {/* Room management panel */}
          {showRoomPanel && (
            <div className="mb-8 p-4 border-secondary border-t border-l border-r-6 border-b-6 space-y-4">
              <div className="text-foreground text-lg mb-2">Rooms</div>

              {/* Create room */}
              <div className="flex gap-2">
                <input
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createRoom()}
                  className="flex-1 bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-10"
                />
                <button type="button" onClick={createRoom}
                  className="px-3 py-2 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Create
                </button>
              </div>

              {/* Join room */}
              <div className="flex gap-2">
                <input
                  placeholder="Invite code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  maxLength={8}
                  className="flex-1 bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-10 uppercase"
                />
                <button type="button" onClick={joinRoom}
                  className="px-3 py-2 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6">Join</button>
              </div>

              {roomMsg && <div className="text-sm text-accent">{roomMsg}</div>}

              {/* List rooms */}
              {rooms.length > 0 && (
                <div className="space-y-1 pt-2">
                  <div className="text-foreground/40 text-xs mb-1">Your rooms:</div>
                  {rooms.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{r.name}</span>
                      <span className="text-foreground/30 text-xs">Code: {r.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-14 md:grid-cols-[240px_1fr] items-start">
            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14" autoFocus />

            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Link</label>
            <textarea value={link} onChange={(e) => setLink(e.target.value)}
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl min-h-48" />

            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14">
              <option className="bg-background text-foreground" value="notes">Notes</option>
              <option className="bg-background text-foreground" value="links">Links</option>
              <option className="bg-background text-foreground" value="media">Media</option>
            </select>
          </div>

          {error && <div className="mt-4 text-destructive text-sm">{error}</div>}

          <div className="mt-10 flex justify-end gap-6">
            <Button variant="outline"
              className="px-8 py-3 text-xl text-foreground border-foreground border-t border-l border-r-6 border-b-6"
              onClick={() => { setOpen(false); setError(''); }}>CANCEL</Button>
            <Button variant="outline"
              className="px-8 py-3 text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 disabled:opacity-50"
              onClick={handleSave} disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
