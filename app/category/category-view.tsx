'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Trash2, ChevronDown, ChevronRight, ArrowUpDown, Clock, Type, Search, X, Folder, FolderOpen, Pencil, Share2, Hash } from 'lucide-react';

type Item = {
  id: string; title: string; link: string | null; category: string;
  createdAt: Date | null; userId: string; roomId: string | null; tags: string | null;
};
type Room = { id: string; name: string; code: string };
type SortMode = 'newest' | 'oldest' | 'name';

function ItemLeaf({ item, depth, editingId, onEditingChange, onShare }: {
  item: Item; depth: number;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onShare: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isEditing = editingId === item.id;
  const [eTitle, setETitle] = useState(item.title);
  const [eLink, setELink] = useState(item.link || '');
  const [eCategory, setECategory] = useState(item.category);
  const [eTags, setETags] = useState(item.tags || '');
  const [eSaving, setESaving] = useState(false);
  const tagList = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  const handleDelete = async () => {
    setDeleting(true);
    const r = await fetch(`/api/items?id=${item.id}`, { method: 'DELETE' });
    if (r.ok) window.location.href = '/category?notify=Deleted';
    else setDeleting(false);
  };

  const handleEdit = () => {
    setETitle(item.title); setELink(item.link || ''); setECategory(item.category); setETags(item.tags || '');
    onEditingChange(item.id);
  };

  const handleSave = async () => {
    if (!eTitle.trim()) return;
    setESaving(true);
    const r = await fetch('/api/items', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, title: eTitle.trim(), link: eLink.trim(), category: eCategory, tags: eTags }),
    });
    if (r.ok) window.location.href = '/category?notify=Updated';
    else setESaving(false);
  };

  if (isEditing) {
    return (
      <div style={{ paddingLeft: `${depth * 1.5 + 1}rem` }} className="py-2 px-2">
        <div className="border-secondary border-t border-l border-r-6 border-b-6 p-4 space-y-3 bg-background">
          <input value={eTitle} onChange={(e) => setETitle(e.target.value)} placeholder="Title"
            className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-9" autoFocus />
          <input value={eLink} onChange={(e) => setELink(e.target.value)} placeholder="Link"
            className="w-full bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-9" />
          <div className="flex gap-2">
            <input value={eCategory} onChange={(e) => setECategory(e.target.value)} placeholder="Category"
              className="flex-1 bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-9" />
            <input value={eTags} onChange={(e) => setETags(e.target.value)} placeholder="Tags"
              className="flex-1 bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-9" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => onEditingChange(null)} className="px-3 py-1.5 text-xs text-foreground/60 hover:text-foreground">Cancel</button>
            <button onClick={handleSave} disabled={eSaving}
              className="px-3 py-1.5 text-xs text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40">{eSaving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 py-2 px-2 hover:bg-foreground/[0.03] transition-colors" style={{ paddingLeft: `${depth * 1.5 + 1}rem` }}>
      <span className="text-foreground/15 shrink-0 mt-0.5">└</span>
      <div className="flex-1 min-w-0">
        <div className="text-foreground/70 text-sm truncate md:whitespace-normal md:line-clamp-2">{item.title}</div>
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-accent/60 text-xs hover:underline truncate block max-w-full">{item.link}</a>
        )}
        {tagList.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {tagList.map(t => <span key={t} className="text-foreground/20 text-xs">{t.startsWith('#') ? t : '#' + t}</span>)}
          </div>
        )}
      </div>
      <button onClick={handleEdit} className="text-foreground/20 hover:text-accent transition-all shrink-0 mt-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => onShare(item.id)} className="text-foreground/20 hover:text-accent transition-all shrink-0 mt-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
        <Share2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={handleDelete} disabled={deleting}
        className="text-foreground/20 hover:text-destructive transition-all shrink-0 mt-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CategoryNode({ name, items, depth, editingId, onEditingChange, onShare }: {
  name: string; items: Item[]; depth: number;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onShare: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const indent = depth * 1.5;

  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-1.5 hover:text-foreground transition-colors w-full text-left"
        style={{ paddingLeft: `${indent}rem` }}>
        {open ? <ChevronDown className="w-4 h-4 text-foreground/30 shrink-0" /> : <ChevronRight className="w-4 h-4 text-foreground/30 shrink-0" />}
        {open ? <FolderOpen className="w-4 h-4 text-foreground/30 shrink-0" /> : <Folder className="w-4 h-4 text-foreground/30 shrink-0" />}
        <span className="text-foreground/50 text-sm">{name}</span>
        <span className="text-foreground/20 text-xs">({items.length})</span>
      </button>
      {open && (
        <div>
          {items.map(item => (
            <ItemLeaf key={item.id} item={item} depth={depth + 1} editingId={editingId} onEditingChange={onEditingChange} onShare={onShare} />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionNode({ title, items, depth, defaultOpen, editingId, onEditingChange, onShare }: {
  title: string; items: Item[]; depth: number; defaultOpen: boolean;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onShare: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [sort, setSort] = useState<SortMode>('newest');

  const sorted = useMemo(() => {
    const list = [...items];
    switch (sort) {
      case 'newest': return list.reverse();
      case 'oldest': return list;
      case 'name': return list.sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [items, sort]);

  const grouped: Record<string, Item[]> = {};
  for (const i of sorted) (grouped[i.category] ||= []).push(i);

  const indent = depth * 1.5;
  const sb = "text-foreground/30 hover:text-foreground transition-colors p-0.5";

  return (
    <div>
      <div className="flex items-center gap-2 py-2" style={{ paddingLeft: `${indent}rem` }}>
        <button onClick={() => setOpen(!open)} className="text-foreground/40 hover:text-foreground transition-colors shrink-0">
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {open ? <FolderOpen className="w-4 h-4 text-foreground/30 shrink-0" /> : <Folder className="w-4 h-4 text-foreground/30 shrink-0" />}
        <span className="text-lg text-foreground/60">{title}</span>
        <span className="text-foreground/20 text-xs">({items.length})</span>
        {open && items.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setSort('newest')} className={sort === 'newest' ? `${sb} text-accent` : sb} title="Newest"><Clock className="w-3 h-3" /></button>
            <button onClick={() => setSort('oldest')} className={sort === 'oldest' ? `${sb} text-accent` : sb} title="Oldest"><ArrowUpDown className="w-3 h-3" /></button>
            <button onClick={() => setSort('name')} className={sort === 'name' ? `${sb} text-accent` : sb} title="A-Z"><Type className="w-3 h-3" /></button>
          </div>
        )}
      </div>
      {open && (
        <div>
          {Object.entries(grouped).map(([cat, catItems]) => (
            <CategoryNode key={cat} name={cat} items={catItems} depth={depth + 1} editingId={editingId} onEditingChange={onEditingChange} onShare={onShare} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryView({
  privateItems, userRooms, roomItemsMap,
}: {
  privateItems: Item[];
  userRooms: Room[];
  roomItemsMap: Record<string, Item[]>;
}) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sharingItemId, setSharingItemId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const totalItems = privateItems.length + Object.values(roomItemsMap).reduce((s, a) => s + a.length, 0);

  const allItemsWithSource = useMemo(() => {
    const all: { item: Item; source: string }[] = [];
    for (const i of privateItems) all.push({ item: i, source: 'Private' });
    for (const room of userRooms)
      for (const i of roomItemsMap[room.id] || [])
        all.push({ item: i, source: room.name });
    return all;
  }, [privateItems, userRooms, roomItemsMap]);

  // Extract all unique tags across all items
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const { item } of allItemsWithSource) {
      if (item.tags) {
        for (const t of item.tags.split(',').map(s => s.trim()).filter(Boolean)) {
          tagSet.add(t.startsWith('#') ? t : '#' + t);
        }
      }
    }
    return [...tagSet].sort((a, b) => a.localeCompare(b));
  }, [allItemsWithSource]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const sharingItem = sharingItemId ? allItemsWithSource.find(a => a.item.id === sharingItemId)?.item : null;

  const handleShare = async (targetRoomId: string | null) => {
    if (!sharingItemId) return;
    setSharing(true);
    const body: Record<string, unknown> = { shareFromId: sharingItemId };
    if (targetRoomId) body.roomId = targetRoomId;
    const r = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSharing(false);
    if (r.ok) {
      const label = targetRoomId
        ? (userRooms.find(rr => rr.id === targetRoomId)?.name || 'room')
        : 'Private';
      window.location.href = '/category?notify=' + encodeURIComponent('Shared to ' + label);
    }
  };

  const results = useMemo(() => {
    if (!query.trim() && selectedTags.size === 0 && !selectedRoom) return null;
    const q = query.toLowerCase().trim();
    return allItemsWithSource.filter(({ item }) => {
      // Search filter
      if (q && !(
        item.title.toLowerCase().includes(q) ||
        (item.link || '').toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.tags || '').toLowerCase().includes(q)
      )) return false;
      // Tag filter (AND — item must have ALL selected tags)
      if (selectedTags.size > 0) {
        const itemTags = new Set(
          (item.tags || '').split(',').map(s => s.trim()).filter(Boolean).map(t => t.startsWith('#') ? t : '#' + t)
        );
        for (const t of selectedTags) {
          if (!itemTags.has(t)) return false;
        }
      }
      // Room filter
      if (selectedRoom === 'private' && item.roomId !== null) return false;
      if (selectedRoom && selectedRoom !== 'private' && item.roomId !== selectedRoom) return false;
      return true;
    });
  }, [allItemsWithSource, query, selectedTags, selectedRoom]);

  const isFiltering = query.trim().length > 0 || selectedTags.size > 0 || selectedRoom !== null;

  return (
    <div className="min-h-screen pt-24 px-8 md:px-16 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-6xl text-foreground mb-4">Categories</h1>
          <p className="text-foreground/60 text-lg">
            {totalItems === 0 ? 'Nothing saved yet.' : `${totalItems} item${totalItems === 1 ? '' : 's'} saved`}
          </p>
        </div>

        <div className="mb-12">
          <div className="flex items-center border-secondary border-t border-l border-r-6 border-b-6 px-4 h-12">
            <Search className="w-4 h-4 text-foreground/30 mr-3 shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything — tags, links, categories, titles..."
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-foreground/20" />
            {query && (
              <button onClick={() => setQuery('')} className="text-foreground/30 hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Tag filter chips + room filter */}
          {(allTags.length > 0 || userRooms.length > 0) && (
            <div className="flex items-start justify-between mt-3 gap-4">
              {/* Tag chips */}
              {allTags.length > 0 ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 flex-1 min-w-0">
                  {allTags.map(tag => {
                    const active = selectedTags.has(tag);
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        className={`text-xs transition-colors cursor-pointer ${
                          active
                            ? 'text-accent'
                            : 'text-foreground/30 hover:text-foreground/60'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                  {selectedTags.size > 0 && (
                    <button onClick={() => setSelectedTags(new Set())}
                      className="text-xs text-foreground/20 hover:text-destructive transition-colors">
                      clear
                    </button>
                  )}
                </div>
              ) : <div className="flex-1" />}
              {/* Room filter — right side */}
              {userRooms.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Hash className="w-3.5 h-3.5 text-foreground/30" />
                  <select
                    value={selectedRoom || ''}
                    onChange={(e) => setSelectedRoom(e.target.value || null)}
                    className="bg-transparent text-foreground/50 text-xs border-secondary border-t border-l border-r-4 border-b-4 px-2 py-1 outline-none cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-background text-foreground">All rooms</option>
                    <option value="private" className="bg-background text-foreground">Private</option>
                    {userRooms.map(r => (
                      <option key={r.id} value={r.id} className="bg-background text-foreground">{r.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          {results && (
            <div className="mt-4">
              <div className="text-foreground/30 text-xs mb-4">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.length === 0 ? (
                <div className="text-foreground/40 text-sm">Nothing found</div>
              ) : (
                <div className="border-l border-foreground/10 pl-2 space-y-6">
                  {(() => {
                    const grouped: Record<string, { item: Item; source: string }[]> = {};
                    for (const r of results) (grouped[r.source] ||= []).push(r);
                    return Object.entries(grouped).map(([src, items]) => (
                      <SectionNode key={src} title={src} items={items.map(x => x.item)} depth={0} defaultOpen={true} editingId={editingId} onEditingChange={setEditingId} onShare={setSharingItemId} />
                    ));
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {totalItems === 0 ? (
          <div className="text-center py-24">
            <div className="text-foreground/40 text-xl mb-6">Your collection is empty</div>
            <Link href="/create" className="inline-block px-10 py-4 text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors">ADD SOMETHING</Link>
          </div>
        ) : isFiltering ? (
          results && results.length > 0 ? null : <div className="text-center py-12 text-foreground/40">No items match your filters</div>
        ) : (
          <div className="space-y-6 border-l border-foreground/10 pl-2">
            {privateItems.length > 0 && (
              <SectionNode title="Private" items={privateItems} depth={0} defaultOpen={true} editingId={editingId} onEditingChange={setEditingId} onShare={setSharingItemId} />
            )}
            {userRooms.map(room => {
              const ri = roomItemsMap[room.id] || [];
              if (ri.length === 0) return null;
              return <SectionNode key={room.id} title={room.name} items={ri} depth={0} defaultOpen={ri.length > 0} editingId={editingId} onEditingChange={setEditingId} onShare={setSharingItemId} />;
            })}
          </div>
        )}
      </div>

      {/* Share modal */}
      {sharingItemId && sharingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSharingItemId(null)}>
          <div className="fixed inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md mx-4 p-6 border-accent/40 border-t border-l border-r-6 border-b-6 bg-background" onClick={e => e.stopPropagation()}>
            <div className="text-xl text-foreground mb-2">Share to room</div>
            <div className="text-foreground/40 text-sm mb-1 truncate">{sharingItem.title}</div>
            <div className="text-foreground/20 text-xs mb-6">Choose a destination</div>
            <div className="space-y-2 mb-4">
              {/* Private option — only show if item is in a room */}
              {sharingItem.roomId && (
                <button onClick={() => handleShare(null)} disabled={sharing}
                  className="w-full text-left px-4 py-3 border-secondary border-t border-l border-r-6 border-b-6 hover:border-accent/40 transition-colors">
                  <div className="text-foreground text-sm">Private</div>
                  <div className="text-foreground/30 text-xs">Save to your personal collection</div>
                </button>
              )}
              {userRooms.filter(r => r.id !== sharingItem.roomId).length === 0 ? (
                <div className="text-foreground/40 text-sm py-4 text-center">No other rooms available</div>
              ) : (
                userRooms.filter(r => r.id !== sharingItem.roomId).map(room => (
                  <button key={room.id} onClick={() => handleShare(room.id)} disabled={sharing}
                    className="w-full text-left px-4 py-3 border-secondary border-t border-l border-r-6 border-b-6 hover:border-accent/40 transition-colors">
                    <div className="text-foreground text-sm">{room.name}</div>
                    <div className="text-foreground/30 text-xs">Code: {room.code}</div>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setSharingItemId(null)}
              className="w-full px-4 py-2 text-sm text-foreground/60 hover:text-foreground border-secondary border-t border-l border-r-6 border-b-6">
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
