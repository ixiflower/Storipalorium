'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Plus, Users, Trash2, Copy, Check, Upload, FileText } from 'lucide-react';

function looksLikeUrl(text: string): boolean { return /^https?:\/\//.test(text.trim()); }
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}
function setCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${days * 86400};SameSite=Lax`;
}

type Room = { id: string; name: string; code: string; ownerId: string };
type BookmarkEntry = { title: string; url: string; tags: string; description: string; selected: boolean; duplicate: boolean; action: 'skip' | 'replace' };
const defaultCategories = ['notes', 'links', 'media'];

function parseBookmarks(html: string): BookmarkEntry[] {
  const entries: BookmarkEntry[] = [];
  const linkRegex = /<A\s+HREF="([^"]*)"[^>]*?(?:TAGS="([^"]*)")?[^>]*>([^<]*)<\/A>/gi;
  const descRegex = /<DD>([^<]*)<\/DD>/gi;

  // Collect all links and descriptions
  const links: { href: string; tags: string; title: string; pos: number }[] = [];
  const descs: { desc: string; pos: number }[] = [];
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    links.push({ href: m[1], tags: m[2] || '', title: m[3], pos: m.index });
  }
  descRegex.lastIndex = 0;
  while ((m = descRegex.exec(html)) !== null) {
    descs.push({ desc: m[1], pos: m.index });
  }

  for (const link of links) {
    // Find closest description AFTER this link
    let desc = '';
    for (const d of descs) {
      if (d.pos > link.pos) { desc = d.desc; break; }
    }
    entries.push({
      title: link.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)),
      url: link.href,
      tags: link.tags,
      description: desc.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'"),
      selected: true,
      duplicate: false,
      action: 'skip',
    });
  }

  return entries;
}

export default function CreatePage() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('notes');
  const [customCat, setCustomCat] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('private');
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomMsg, setRoomMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const router = useRouter();

  // Bookmark import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [importRoom, setImportRoom] = useState('private');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    fetch('/api/rooms').then(r => r.json()).then(d => { if (d.rooms) setRooms(d.rooms); }).catch(() => {});
    const saved = getCookie('stori_save_target');
    if (saved) setSelectedRoomId(saved);
  }, []);
  useEffect(() => { setCookie('stori_save_target', selectedRoomId); }, [selectedRoomId]);

  const openWithPaste = useCallback((pastedText: string) => {
    const t = pastedText.trim();
    if (looksLikeUrl(t)) { setLink(t); setCategory('links'); }
    setOpen(true);
  }, []);

  const handleLinkChange = (value: string) => {
    setLink(value);
    if (!looksLikeUrl(value) || title.trim()) return;
    // Debounce: fetch title after 800ms of no typing
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(value.trim())}`);
        const d = await res.json();
        if (d.title && !title) setTitle(d.title);
      } catch {}
    }, 800);
  };
  const handleSave = async () => {
    const finalCategory = customCat.trim() || category;
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const body: Record<string, string> = { title: title.trim(), link: link.trim(), category: finalCategory, tags };
      if (selectedRoomId !== 'private') body.roomId = selectedRoomId;
      const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to save'); return; }
      setOpen(false); setTitle(''); setLink(''); setCategory('notes'); setCustomCat(''); setIsCustomCategory(false); setTags('');
      router.refresh();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return; setRoomMsg('');
    const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newRoomName.trim() }) });
    const d = await res.json();
    if (res.ok) { setRooms(p => [...p, d.room]); setSelectedRoomId(d.room.id); setNewRoomName(''); setRoomMsg(`Room created! Code: ${d.room.code}`); }
    else setRoomMsg(d.error || 'Failed');
  };
  const joinRoom = async () => {
    if (!joinCode.trim()) return; setRoomMsg('');
    const res = await fetch('/api/rooms/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode.trim() }) });
    const d = await res.json();
    if (res.ok) { setRooms(p => p.find(r => r.id === d.room.id) ? p : [...p, d.room]); setSelectedRoomId(d.room.id); setJoinCode(''); setRoomMsg(`Joined: ${d.room.name}`); }
    else setRoomMsg(d.error || 'Invalid code');
  };
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); };
  const deleteRoom = async () => {
    if (!deleteTarget || deleteConfirmName !== deleteTarget.name) return;
    const res = await fetch(`/api/rooms?id=${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) { setRooms(p => p.filter(r => r.id !== deleteTarget.id)); if (selectedRoomId === deleteTarget.id) setSelectedRoomId('private'); setDeleteTarget(null); setDeleteConfirmName(''); setRoomMsg('Deleted.'); }
    else { const d = await res.json(); setRoomMsg(d.error || 'Failed'); }
  };

  // Bookmark import handlers
  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const html = reader.result as string;
      const entries = parseBookmarks(html);
      setBookmarks(entries);
      setImportRoom(selectedRoomId);
      setImportMsg('');
      setImportProgress(null);

      // Check for duplicates against existing items
      try {
        const res = await fetch('/api/items');
        const data = await res.json();
        const existingUrls = new Set((data.items || []).map((i: { link: string }) => i.link).filter(Boolean));
        const updated = entries.map(b => {
          if (b.url && existingUrls.has(b.url)) {
            return { ...b, duplicate: true, selected: false, action: 'skip' as const };
          }
          return b;
        });
        const dupes = updated.filter(b => b.duplicate).length;
        if (dupes > 0) setImportMsg(`${dupes} duplicate${dupes > 1 ? 's' : ''} found — skipped by default. Change action per item below.`);
        setBookmarks(updated);
      } catch {}
    };
    reader.readAsText(file);
    // Reset so same file can be re-picked
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleBookmark = (idx: number) => {
    setBookmarks(p => p.map((b, i) => i === idx ? { ...b, selected: !b.selected } : b));
  };

  const toggleAll = () => {
    const allSelected = bookmarks.every(b => b.selected);
    setBookmarks(p => p.map(b => ({ ...b, selected: !allSelected })));
  };

  const importBookmarks = async () => {
    const toImport = bookmarks.filter(b => b.selected || (b.duplicate && b.action === 'replace'));
    if (!toImport.length) { setImportMsg('No bookmarks selected.'); return; }
    setImporting(true); setImportMsg(''); setImportProgress({ current: 0, total: toImport.length });
    let ok = 0; let fail = 0; let skipped = 0;
    for (let i = 0; i < toImport.length; i++) {
      const b = toImport[i];
      setImportProgress({ current: i + 1, total: toImport.length });
      try {
        if (b.duplicate && b.action === 'replace') {
          // Find and update existing item with same URL
          const listRes = await fetch('/api/items');
          const listData = await listRes.json();
          const existing = (listData.items || []).find((x: { link: string }) => x.link === b.url);
          if (existing) {
            const updRes = await fetch('/api/items', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: existing.id, title: b.title, tags: b.tags }),
            });
            if (updRes.ok) ok++; else fail++;
            continue;
          }
        }
        const body: Record<string, string> = { title: b.title, link: b.url, category: 'links', tags: b.tags };
        if (importRoom !== 'private') body.roomId = importRoom;
        const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }
    setImportMsg(`Done: ${ok} imported, ${fail} failed, ${bookmarks.filter(b => b.duplicate && b.action === 'skip').length} duplicates skipped.`);
    setImportProgress(null);
    setImporting(false);
    if (ok > 0) { setBookmarks([]); router.refresh(); }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const ic = "bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-10";
  const bc = "px-3 py-2 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 h-10 inline-flex items-center gap-1 shrink-0 hover:border-foreground/40 transition-colors disabled:opacity-30";

  return (
    <div className="fixed inset-0 overflow-hidden"
      onPaste={(e) => { const t = e.clipboardData.getData('text'); if (t) openWithPaste(t); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const t = e.dataTransfer.getData('text'); if (t && looksLikeUrl(t)) { setLink(t.trim()); setCategory('links'); } setOpen(true); }}>
      <div className="flex items-center justify-center h-screen w-screen">
        {/* Clickable box */}
        <button onClick={() => setOpen(true)}
          className="text-center w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-4 md:mx-auto p-12 md:p-24 border-secondary border-t border-l border-r-6 border-b-6 cursor-pointer hover:border-foreground/20 transition-colors bg-transparent">
          <div className="md:hidden space-y-10">
            <span className="block w-full h-28 px-16 text-2xl text-foreground border-foreground border-t border-l border-r-6 border-b-6 content-center">UPLOAD</span>
            <div className="text-foreground/60">OR</div>
            <span className="block w-full h-28 px-16 text-2xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 content-center">PASTE</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-3xl md:text-5xl font-light">PRESS CTRL + V</h1>
            <div className="my-4"><h2 className="text-3xl md:text-5xl font-light">OR</h2></div>
            <h3 className="text-3xl md:text-5xl font-light">DRAG SOMETHING</h3>
            <div className="mt-8 text-foreground/20 text-sm">or click anywhere to start</div>
          </div>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-5xl p-8 border-secondary border-t border-l border-r-6 border-b-6 max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogTitle className="sr-only">Add Item</DialogTitle>

          {/* Save target + Import button */}
          <div className="mb-8 flex items-center gap-4 flex-wrap">
            <span className="text-foreground text-lg">Save to:</span>
            <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)}
              className="bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-11">
              <option className="bg-background" value="private">Private</option>
              {rooms.map(r => <option key={r.id} className="bg-background" value={r.id}>{r.name}</option>)}
            </select>
            <button type="button" onClick={() => setShowRoomPanel(!showRoomPanel)} className="flex items-center gap-1 text-accent text-sm hover:underline">
              <Users className="w-4 h-4" />{showRoomPanel ? 'Hide rooms' : 'Manage rooms'}</button>
            {selectedRoom && <span className="text-foreground/40 text-sm">→ {selectedRoom.name}</span>}
            <Link href="/rooms" className="text-foreground/40 text-xs hover:text-accent ml-auto">All rooms →</Link>
            {/* Import Bookmarks button */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".html,.htm" className="hidden" />
            <button type="button" onClick={handleFilePick} className={bc}>
              <Upload className="w-4 h-4" /> Import Bookmarks
            </button>
          </div>

          {/* Bookmark import preview */}
          {bookmarks.length > 0 && (
            <div className="mb-8 p-4 border-secondary border-t border-l border-r-6 border-b-6 space-y-4 w-full overflow-hidden">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-foreground text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  {bookmarks.length} bookmarks found
                </div>
                <button onClick={() => setBookmarks([])} className="text-foreground/40 text-sm hover:text-foreground transition-colors">Clear</button>
              </div>

              {/* Import target */}
              <div className="flex items-center gap-3">
                <span className="text-foreground/60 text-sm">Import to:</span>
                <select value={importRoom} onChange={(e) => setImportRoom(e.target.value)}
                  className="bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-10">
                  <option className="bg-background" value="private">Private</option>
                  {rooms.map(r => <option key={r.id} className="bg-background" value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {/* Select all */}
              <label className="flex items-center gap-2 text-foreground/60 text-sm cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={bookmarks.every(b => b.selected)} onChange={toggleAll}
                  className="accent-accent" />
                {bookmarks.every(b => b.selected) ? 'Deselect all' : 'Select all'}
              </label>

              {/* Bookmark list */}
              <div className="max-h-64 overflow-y-auto overflow-x-hidden max-w-full space-y-1 border-t border-l border-secondary pl-2 pt-2">
                {bookmarks.map((b, idx) => (
                  <label key={idx} className={`flex items-start gap-2 py-1 hover:bg-foreground/[0.02] cursor-pointer text-sm min-w-0 ${b.duplicate ? 'opacity-70' : ''}`}>
                    <input type="checkbox" checked={b.selected} onChange={() => toggleBookmark(idx)}
                      className="accent-accent mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground/70 truncate">{b.title}</span>
                        {b.duplicate && <span className="text-yellow-400/60 text-xs shrink-0 font-bold">DUPLICATE</span>}
                      </div>
                      <div className="text-foreground/30 text-xs break-all mt-0.5">{b.url}</div>
                      {b.tags && <div className="text-accent/40 text-xs mt-0.5">{b.tags}</div>}
                      {b.duplicate && (
                        <select
                          value={b.action}
                          onChange={(e) => setBookmarks(p => p.map((x, i) => i === idx ? { ...x, action: e.target.value as 'skip' | 'replace', selected: e.target.value === 'replace' } : x))}
                          className="mt-1 bg-transparent text-foreground/60 text-xs border-secondary border-t border-l border-r-6 border-b-6 px-1 py-0.5"
                        >
                          <option className="bg-background" value="skip">Skip</option>
                          <option className="bg-background" value="replace">Replace</option>
                        </select>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {/* Import progress & messages */}
              {/* Import progress bar */}
              {importProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-foreground/40">
                    <span>Importing...</span>
                    <span>{importProgress.current}/{importProgress.total}</span>
                  </div>
                  <div className="h-2 border-secondary border-t border-l border-r-6 border-b-6 overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300 ease-out"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {importMsg && <div className="text-sm text-accent">{importMsg}</div>}

              <div className="flex gap-2 justify-end">
                <button onClick={importBookmarks} disabled={importing || !bookmarks.some(b => b.selected)}
                  className="px-4 py-2 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors disabled:opacity-30">
                  {importing ? 'Importing...' : `Import ${bookmarks.filter(b => b.selected).length} bookmarks`}
                </button>
              </div>
            </div>
          )}

          {/* Room management panel */}
          {showRoomPanel && (
            <div className="mb-8 p-4 border-secondary border-t border-l border-r-6 border-b-6 space-y-4">
              <div className="text-foreground text-lg mb-2">Rooms</div>
              <div className="flex gap-2 items-stretch">
                <input placeholder="Room name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createRoom()} className={`flex-1 ${ic}`} />
                <button type="button" onClick={createRoom} className={bc}><Plus className="w-4 h-4" /> Create</button>
              </div>
              <div className="flex gap-2 items-stretch">
                <input placeholder="Invite code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && joinRoom()} maxLength={8} className={`flex-1 ${ic} uppercase`} />
                <button type="button" onClick={joinRoom} className={bc}>Join</button>
              </div>
              {roomMsg && <div className="text-sm text-accent">{roomMsg}</div>}
              {rooms.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-foreground/40 text-xs mb-1">Your rooms:</div>
                  {rooms.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm gap-2">
                      <span className="text-foreground truncate">{r.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => copyCode(r.code)} className="text-foreground/40 text-xs hover:text-accent transition-colors flex items-center gap-1 cursor-pointer">
                          {copiedCode === r.code ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}{r.code}</button>
                        {r.ownerId && <button type="button" onClick={() => { setDeleteTarget(r); setDeleteConfirmName(''); }} className="text-foreground/20 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {deleteTarget && (
                <div className="p-3 border-destructive/30 border-t border-l border-r-6 border-b-6 space-y-2">
                  <div className="text-destructive text-sm">Delete <strong>{deleteTarget.name}</strong>? Type the name to confirm.</div>
                  <div className="flex gap-2 items-stretch">
                    <input value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} placeholder={deleteTarget.name} className={`flex-1 ${ic}`} />
                    <button type="button" onClick={deleteRoom} disabled={deleteConfirmName !== deleteTarget.name} className={`${bc} text-destructive border-destructive/50 disabled:opacity-30`}>Delete</button>
                    <button type="button" onClick={() => { setDeleteTarget(null); setDeleteConfirmName(''); }} className={bc}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          {bookmarks.length === 0 && (
          <div className="grid gap-14 md:grid-cols-[240px_1fr] items-start">
            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14" autoFocus />
            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Tags</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              placeholder="#ui/ux #video #tutorial (comma separated)"
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14" />

            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Link</label>
            <textarea value={link} onChange={(e) => handleLinkChange(e.target.value)}
              className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl min-h-48" />
            <label className="text-foreground text-2xl text-left md:self-start md:pr-6">Category</label>
            <div className="space-y-2">
              <select value={isCustomCategory ? '__custom__' : category} onChange={(e) => { const v = e.target.value; if (v === '__custom__') { setIsCustomCategory(true); setCategory(''); } else { setIsCustomCategory(false); setCategory(v); setCustomCat(''); } }}
                className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14">
                {defaultCategories.map(c => <option key={c} className="bg-background text-foreground" value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                <option className="bg-background text-accent" value="__custom__">+ Create new...</option>
              </select>
              {(isCustomCategory || !defaultCategories.includes(category)) && (
                <input value={customCat || category} onChange={(e) => { setCustomCat(e.target.value); setCategory(e.target.value); }}
                  placeholder="Custom category name" autoFocus
                  className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-xl h-14" />
              )}
            </div>
          </div>
          )}

          {error && <div className="mt-4 text-destructive text-sm">{error}</div>}

          <div className="mt-10 flex justify-end gap-6">
            <Button variant="outline" className="px-8 py-3 text-xl text-foreground border-foreground border-t border-l border-r-6 border-b-6" onClick={() => { setOpen(false); setError(''); setBookmarks([]); }}>CANCEL</Button>
            {bookmarks.length === 0 && (
            <Button variant="outline" className="px-8 py-3 text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 disabled:opacity-50" onClick={handleSave} disabled={saving}>{saving ? 'SAVING...' : 'SAVE'}</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
