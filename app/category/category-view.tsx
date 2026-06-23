'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Trash2, ChevronDown, ChevronRight, ArrowUpDown, Clock, Type, Search, X } from 'lucide-react';

type Item = {
  id: string; title: string; link: string | null; category: string;
  createdAt: Date | null; userId: string; roomId: string | null; tags: string | null;
};
type Room = { id: string; name: string; code: string };
type SortMode = 'newest' | 'oldest' | 'name';

function ItemCard({ item, onDelete }: { item: Item; onDelete: (id: string) => void }) {
  const [hover, setHover] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    const r = await fetch(`/api/items?id=${item.id}`, { method: 'DELETE' });
    if (r.ok) onDelete(item.id);
    setDeleting(false);
  };
  const tagList = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  return (
    <div className="border-secondary border-t border-l border-r-6 border-b-6 p-5 relative group"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="text-foreground text-lg mb-1 pr-8">{item.title}</div>
      {item.link && (
        <a href={item.link} target="_blank" rel="noopener noreferrer"
          className="text-accent text-sm hover:underline break-all">{item.link}</a>
      )}
      {tagList.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {tagList.map(t => (
            <span key={t} className="text-foreground/30 text-xs border-secondary border px-1.5 py-0.5">
              {t.startsWith('#') ? t : '#' + t}
            </span>
          ))}
        </div>
      )}
      {hover && (
        <button onClick={handleDelete} disabled={deleting}
          className="absolute top-3 right-3 text-foreground/20 hover:text-destructive transition-colors p-1" title="Delete item">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function Section({ title, items: allItems, defaultOpen = true }: {
  title: string; items: Item[]; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [sort, setSort] = useState<SortMode>('newest');
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const visible = useMemo(() => {
    const f = allItems.filter(i => !deletedIds.has(i.id));
    switch (sort) {
      case 'newest': return [...f].reverse();
      case 'oldest': return f;
      case 'name': return [...f].sort((a, b) => a.title.localeCompare(b.title));
    }
  }, [allItems, sort, deletedIds]);
  const groupByCat = (list: Item[]) => {
    const cats: Record<string, Item[]> = {};
    for (const i of list) (cats[i.category] ||= []).push(i);
    return cats;
  };
  const grouped = groupByCat(visible);
  const sb = "text-foreground/30 hover:text-foreground transition-colors p-0.5";
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setOpen(!open)} className="text-foreground/40 hover:text-foreground transition-colors">
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        <h2 className="text-xl md:text-2xl text-foreground/60">{title}</h2>
        <span className="text-foreground/20 text-sm">{visible.length}</span>
        {open && visible.length > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setSort('newest')} className={sort === 'newest' ? `${sb} text-accent` : sb} title="Newest"><Clock className="w-3.5 h-3.5" /></button>
            <button onClick={() => setSort('oldest')} className={sort === 'oldest' ? `${sb} text-accent` : sb} title="Oldest"><ArrowUpDown className="w-3.5 h-3.5" /></button>
            <button onClick={() => setSort('name')} className={sort === 'name' ? `${sb} text-accent` : sb} title="A-Z"><Type className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
      {open && (
        <div className="space-y-20">
          {Object.entries(grouped).map(([cat, ci]) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-lg text-foreground/50">{cat}</h3>
                <span className="text-foreground/20 text-xs">{ci.length}</span>
              </div>
              <div className="space-y-3">
                {ci.map(item => <ItemCard key={item.id} item={item} onDelete={(id) => setDeletedIds(p => new Set(p).add(id))} />)}
              </div>
            </div>
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
  const totalItems = privateItems.length + Object.values(roomItemsMap).reduce((s, a) => s + a.length, 0);

  const allItems = useMemo(() => {
    const all: { item: Item; source: string }[] = [];
    for (const i of privateItems) all.push({ item: i, source: 'Private' });
    for (const room of userRooms)
      for (const i of roomItemsMap[room.id] || [])
        all.push({ item: i, source: room.name });
    return all;
  }, [privateItems, userRooms, roomItemsMap]);

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return allItems.filter(({ item }) =>
      item.title.toLowerCase().includes(q) ||
      (item.link || '').toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.tags || '').toLowerCase().includes(q)
    );
  }, [allItems, query]);

  const isSearching = query.trim().length > 0;

  return (
    <div className="min-h-screen pt-24 px-8 md:px-16 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-6xl text-foreground mb-4">Categories</h1>
          <p className="text-foreground/60 text-lg">
            {totalItems === 0 ? 'Nothing saved yet.' : `${totalItems} item${totalItems === 1 ? '' : 's'} saved`}
          </p>
        </div>

        <div className="mb-12 relative">
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
          {results && (
            <div className="absolute top-14 left-0 right-0 z-10 bg-background border-secondary border-t border-l border-r-6 border-b-6 max-h-96 overflow-y-auto shadow-lg">
              <div className="p-2 text-foreground/30 text-xs">{results.length} result{results.length !== 1 ? 's' : ''}</div>
              {results.length === 0 ? (
                <div className="p-4 text-foreground/40 text-sm">Nothing found</div>
              ) : results.map(({ item, source }) => (
                <div key={item.id} className="px-4 py-3 hover:bg-foreground/5 border-t border-secondary/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-foreground text-sm">{item.title}</div>
                      {item.link && <div className="text-accent text-xs truncate max-w-md">{item.link}</div>}
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-foreground/30 text-xs">{item.category}</span>
                        {item.tags?.split(',').filter(Boolean).map(t => (
                          <span key={t} className="text-foreground/20 text-xs">#{t.trim()}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-foreground/20 text-xs shrink-0">{source}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalItems === 0 ? (
          <div className="text-center py-24">
            <div className="text-foreground/40 text-xl mb-6">Your collection is empty</div>
            <Link href="/create" className="inline-block px-10 py-4 text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors">ADD SOMETHING</Link>
          </div>
        ) : isSearching ? (
          results && results.length > 0 ? null : <div className="text-center py-12 text-foreground/40">Type to search across all your items</div>
        ) : (
          <div className="space-y-16">
            {privateItems.length > 0 && <Section title="Private" items={privateItems} defaultOpen={true} />}
            {userRooms.map(room => {
              const ri = roomItemsMap[room.id] || [];
              if (ri.length === 0) return null;
              return <Section key={room.id} title={room.name} items={ri} defaultOpen={true} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
