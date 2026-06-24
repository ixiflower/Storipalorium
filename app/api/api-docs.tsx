'use client';

import { useState } from 'react';
import { Copy, Check, Trash2, Key, Plus, ChevronRight, ChevronDown } from 'lucide-react';

type Token = { id: string; name: string; token: string; lastUsedAt: Date | null; createdAt: Date | null };

type DocSection = {
  id: string; label: string;
  subs?: { id: string; method: string; path: string; label: string }[];
};

const docSections: DocSection[] = [
  {
    id: 'getting-started', label: 'Getting Started',
    subs: [
      { id: 'overview', method: '', path: '', label: 'Overview' },
      { id: 'auth', method: '', path: '', label: 'Authentication' },
    ],
  },
  {
    id: 'items', label: 'Items',
    subs: [
      { id: 'items-list', method: 'GET', path: '/api/v1/items', label: 'List items' },
      { id: 'items-create', method: 'POST', path: '/api/v1/items', label: 'Create item' },
      { id: 'items-update', method: 'PATCH', path: '/api/v1/items', label: 'Update item' },
      { id: 'items-delete', method: 'DELETE', path: '/api/v1/items?id=...', label: 'Delete item' },
    ],
  },
  {
    id: 'rooms', label: 'Rooms',
    subs: [
      { id: 'rooms-list', method: 'GET', path: '/api/v1/rooms', label: 'List rooms' },
      { id: 'rooms-create', method: 'POST', path: '/api/v1/rooms', label: 'Create room' },
      { id: 'rooms-join', method: 'POST', path: '/api/v1/rooms', label: 'Join room' },
      { id: 'rooms-settings', method: 'PATCH', path: '/api/v1/rooms', label: 'Update settings' },
      { id: 'rooms-code', method: 'PATCH', path: '/api/v1/rooms', label: 'Regenerate code' },
      { id: 'rooms-members', method: 'GET', path: '/api/v1/rooms/members', label: 'List members' },
      { id: 'rooms-kick', method: 'DELETE', path: '/api/v1/rooms/members', label: 'Kick member' },
      { id: 'rooms-delete', method: 'DELETE', path: '/api/v1/rooms?id=...', label: 'Delete room' },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: 'text-green-400', POST: 'text-yellow-400', PATCH: 'text-blue-400', DELETE: 'text-red-400',
};

export function APIDocs({ userId, tokens: initialTokens }: { userId: string | null; tokens: Token[] }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [activeSection, setActiveSection] = useState('overview');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['getting-started', 'items', 'rooms']));
  const [tokenName, setTokenName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tokenMsg, setTokenMsg] = useState('');
  const [showTokenCreator, setShowTokenCreator] = useState(tokens.length === 0);

  const ic = "bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-10";

  const toggleSection = (id: string) => {
    setOpenSections(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const createToken = async () => {
    if (!tokenName.trim()) return;
    const res = await fetch('/api/tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tokenName.trim() }) });
    const d = await res.json();
    if (d.token) {
      setTokens(p => [...p, d.token]);
      setNewToken(d.token.token);
      setTokenName('');
      setTokenMsg('');
      setShowTokenCreator(false);
    } else setTokenMsg(d.error || 'Failed');
  };

  const revokeToken = async (id: string) => {
    await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' });
    setTokens(p => p.filter(t => t.id !== id));
  };

  const copyToken = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (d: Date | string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never';

  return (
    <div className="min-h-screen pt-20 px-4 md:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-foreground/50 text-lg">Programmatic access to your Storipalorium data.</p>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-56 shrink-0">
            <div className="sticky top-24 space-y-1 border-secondary border-t border-l border-r-6 border-b-6 p-4">
              {docSections.map(section => (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center gap-1 w-full text-left py-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {openSections.has(section.id)
                      ? <ChevronDown className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-foreground/30 shrink-0" />}
                    {section.label}
                  </button>
                  {openSections.has(section.id) && section.subs && (
                    <div className="ml-4 space-y-0.5 mt-0.5">
                      {section.subs.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveSection(sub.id)}
                          className={`block w-full text-left text-xs py-1 px-2 transition-colors ${
                            activeSection === sub.id
                              ? 'text-accent border-l-2 border-accent'
                              : 'text-foreground/40 hover:text-foreground/70 border-l-2 border-transparent'
                          }`}
                        >
                          {sub.method && <span className={`${methodColors[sub.method] || ''} mr-1 font-bold`}>{sub.method}</span>}
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <DocContent active={activeSection} />

            {/* Token Management */}
            <div className="mt-12 border-t border-secondary pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl text-foreground flex items-center gap-2"><Key className="w-5 h-5 text-accent" /> Your API Tokens</h2>
                {userId && !showTokenCreator && (
                  <button onClick={() => setShowTokenCreator(true)} className="px-3 py-1.5 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> New Token
                  </button>
                )}
              </div>

              {!userId ? (
                <div className="p-6 border-secondary border-t border-l border-r-6 border-b-6 text-center space-y-3">
                  <p className="text-foreground/50 text-sm">You must be logged in to create and manage API tokens.</p>
                  <a href="/login" className="inline-block px-6 py-2 text-sm text-foreground border-accent border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors">
                    Login to continue
                  </a>
                </div>
              ) : (
              <>

              {showTokenCreator && (
                <div className="mb-6 p-4 border-secondary border-t border-l border-r-6 border-b-6 space-y-3">
                  <div className="text-foreground/60 text-sm">Create a new API token</div>
                  <div className="flex gap-2 items-stretch">
                    <input placeholder="Token name (e.g. 'My CLI')" value={tokenName} onChange={(e) => setTokenName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createToken()} className={`flex-1 ${ic}`} autoFocus />
                    <button onClick={createToken} className="px-3 py-2 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors">Create</button>
                    <button onClick={() => setShowTokenCreator(false)} className="px-3 py-2 text-sm text-foreground/60 hover:text-foreground transition-colors">Cancel</button>
                  </div>
                  {tokenMsg && <div className="text-destructive text-xs">{tokenMsg}</div>}
                  {newToken && (
                    <div className="p-3 border-accent/40 border-t border-l border-r-6 border-b-6 space-y-2">
                      <div className="text-accent text-sm">Token created — copy it now, it won't be shown again:</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-foreground/[0.05] px-3 py-2 text-xs text-foreground break-all border-secondary border-t border-l border-r-6 border-b-6">{newToken}</code>
                        <button onClick={() => { navigator.clipboard.writeText(newToken); setCopiedId('new'); setTimeout(() => setCopiedId(null), 2000); }}
                          className="px-3 py-2 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40">
                          {copiedId === 'new' ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <button onClick={() => setNewToken(null)} className="text-foreground/60 text-xs hover:text-foreground transition-colors">Done</button>
                    </div>
                  )}
                </div>
              )}

              {tokens.length === 0 ? (
                <div className="text-foreground/40 text-sm">No tokens yet. Create one to access the API.</div>
              ) : (
                <div className="space-y-2">
                  {tokens.map(t => (
                    <div key={t.id} className="flex items-center justify-between py-2 px-3 border-secondary border-t border-l border-r-6 border-b-6 text-sm gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground truncate">{t.name}</div>
                        <div className="text-foreground/30 text-xs flex items-center gap-3 mt-0.5">
                          <span className="truncate font-mono">{t.token.slice(0, 12)}...</span>
                          <span>Created {formatDate(t.createdAt)}</span>
                          {t.lastUsedAt && <span>Used {formatDate(t.lastUsedAt)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => copyToken(t.token, t.id)} className="text-foreground/30 hover:text-accent transition-colors p-1">
                          {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => revokeToken(t.id)} className="text-foreground/30 hover:text-destructive transition-colors p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocContent({ active }: { active: string }) {
  const code = (c: string) => (
    <pre className="bg-foreground/[0.04] border-secondary border-t border-l border-r-6 border-b-6 p-4 text-xs text-foreground/80 overflow-x-auto font-mono whitespace-pre-wrap break-all">{c}</pre>
  );

  const m = (method: string, path: string) => (
    <div className="flex items-center gap-3 mb-4">
      <span className={`text-sm font-bold ${methodColors[method] || 'text-foreground/60'}`}>{method}</span>
      <code className="text-sm text-foreground/70 font-mono">{path}</code>
    </div>
  );

  switch (active) {
    case 'overview':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Overview</h2>
          <p className="text-foreground/60">Storipalorium provides a REST API for managing your bookmarks, links, notes, and collaborative rooms programmatically.</p>
          <div className="space-y-3">
            <div className="text-foreground text-lg">Base URL</div>
            {code('https://storipalorium.vercel.app/api/v1')}
          </div>
          <div className="space-y-3">
            <div className="text-foreground text-lg">Authentication</div>
            <p className="text-foreground/60 text-sm">All API requests require a Bearer token in the Authorization header. Create a token below in <button onClick={() => {}} className="text-accent hover:underline">Your API Tokens</button>.</p>
            {code('Authorization: Bearer stori_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')}
          </div>
          <div className="space-y-3">
            <div className="text-foreground text-lg">Response Format</div>
            <p className="text-foreground/60 text-sm">All responses are JSON. Errors return <code className="text-xs bg-foreground/[0.05] px-1">{'{ error: "message" }'}</code> with appropriate HTTP status codes.</p>
          </div>
        </div>
      );

    case 'auth':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Authentication</h2>
          <p className="text-foreground/60 text-sm">Manage your API tokens from this page. Tokens are scoped to your account — anyone with your token can access all your data.</p>
          <div className="space-y-4">
            <h3 className="text-foreground">Create a token</h3>
            <p className="text-foreground/50 text-sm">Use the "New Token" button in the <strong className="text-foreground/70">Your API Tokens</strong> section below. Give it a descriptive name like "Raycast extension" or "iOS Shortcut".</p>
            <h3 className="text-foreground">Using the token</h3>
            <p className="text-foreground/50 text-sm">Include it in every request:</p>
            {code('curl -H "Authorization: Bearer YOUR_TOKEN" \\\n  https://storipalorium.vercel.app/api/v1/items')}
            <h3 className="text-foreground">Revoke a token</h3>
            <p className="text-foreground/50 text-sm">Click the trash icon next to any token. It stops working immediately.</p>
          </div>
        </div>
      );

    case 'items-list':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">List Items</h2>
          {m('GET', '/api/v1/items')}
          <p className="text-foreground/60 text-sm">Returns all your private items. Add <code className="text-xs bg-foreground/[0.05] px-1">?roomId=UUID</code> to list items in a specific room.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -H "Authorization: Bearer YOUR_TOKEN" \\\n  https://storipalorium.vercel.app/api/v1/items\n\n# With room filter:\ncurl -H "Authorization: Bearer YOUR_TOKEN" \\\n  "https://storipalorium.vercel.app/api/v1/items?roomId=xxx"`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Response</div>
          {code(`{\n  "items": [\n    {\n      "id": "uuid",\n      "userId": "uuid",\n      "roomId": "uuid | null",\n      "title": "My Bookmark",\n      "link": "https://...",\n      "category": "links",\n      "tags": "ui,design",\n      "createdAt": "2026-06-24T..."\n    }\n  ]\n}`)}
        </div>
      );

    case 'items-create':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Create Item</h2>
          {m('POST', '/api/v1/items')}
          <p className="text-foreground/60 text-sm">Create a new bookmark, note, or link.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Body (JSON)</div>
          {code(`{\n  "title": "My Link",          // required\n  "link": "https://...",       // optional\n  "category": "links",         // optional, default "links"\n  "tags": "ui,design",        // optional\n  "roomId": "uuid"             // optional, for room items\n}`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X POST \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title":"Example","link":"https://example.com","category":"links"}' \\\n  https://storipalorium.vercel.app/api/v1/items`)}
        </div>
      );

    case 'items-update':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Update Item</h2>
          {m('PATCH', '/api/v1/items')}
          <p className="text-foreground/60 text-sm">Update an existing item. Only include the fields you want to change.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Body (JSON)</div>
          {code(`{\n  "id": "item-uuid",          // required\n  "title": "New Title",       // optional\n  "link": "https://...",      // optional\n  "category": "notes",        // optional\n  "tags": "updated,tags"     // optional\n}`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X PATCH \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"id":"xxx","title":"Updated Title"}' \\\n  https://storipalorium.vercel.app/api/v1/items`)}
        </div>
      );

    case 'items-delete':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Delete Item</h2>
          {m('DELETE', '/api/v1/items?id=ITEM_ID')}
          <p className="text-foreground/60 text-sm">Permanently delete an item. You can only delete your own items.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X DELETE \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  "https://storipalorium.vercel.app/api/v1/items?id=xxx"`)}
        </div>
      );

    case 'rooms-list':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">List Rooms</h2>
          {m('GET', '/api/v1/rooms')}
          <p className="text-foreground/60 text-sm">Returns all rooms you're a member of.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -H "Authorization: Bearer YOUR_TOKEN" \\\n  https://storipalorium.vercel.app/api/v1/rooms`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Response</div>
          {code(`{\n  "rooms": [\n    {\n      "id": "uuid",\n      "name": "My Room",\n      "code": "ABCD1234",\n      "ownerId": "uuid",\n      "createdAt": "2026-..."\n    }\n  ]\n}`)}
        </div>
      );

    case 'rooms-create':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Create Room</h2>
          {m('POST', '/api/v1/rooms')}
          <p className="text-foreground/60 text-sm">Create a new shared room. You become the owner.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Body (JSON)</div>
          {code(`{ "name": "My Room" }`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X POST \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Team Links"}' \\\n  https://storipalorium.vercel.app/api/v1/rooms`)}
        </div>
      );

    case 'rooms-join':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Join Room</h2>
          {m('POST', '/api/v1/rooms')}
          <p className="text-foreground/60 text-sm">Join an existing room using its invite code.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Body (JSON)</div>
          {code(`{ "code": "ABCD1234" }`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X POST \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"code":"ABCD1234"}' \\\n  https://storipalorium.vercel.app/api/v1/rooms`)}
        </div>
      );

    case 'rooms-delete':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Delete Room</h2>
          {m('DELETE', '/api/v1/rooms?id=ROOM_ID')}
          <p className="text-foreground/60 text-sm">Delete a room. Only the room owner can do this.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X DELETE \\\n  -H "Authorization: Bearer *** \\\n  "https://storipalorium.vercel.app/api/v1/rooms?id=xxx"`)}
        </div>
      );

    case 'rooms-settings':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Update Room Settings</h2>
          {m('PATCH', '/api/v1/rooms')}
          <p className="text-foreground/60 text-sm">Update room permissions. Only the room owner can change settings.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Body (JSON)</div>
          {code(`{\n  "id": "room-uuid",\n  "settings": {\n    "whoCanAdd": "anyone" | "owner",\n    "whoCanDelete": "anyone" | "own" | "owner",\n    "whoCanEdit": "anyone" | "own" | "owner"\n  }\n}`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X PATCH \\\n  -H "Authorization: Bearer *** \\\n  -H "Content-Type: application/json" \\\n  -d '{"id":"xxx","settings":{"whoCanAdd":"owner"}}' \\\n  https://storipalorium.vercel.app/api/v1/rooms`)}
        </div>
      );

    case 'rooms-code':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Regenerate Invite Code</h2>
          {m('PATCH', '/api/v1/rooms')}
          <p className="text-foreground/60 text-sm">Generate a new invite code. The old code stops working immediately. Owner only.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Body (JSON)</div>
          {code(`{\n  "id": "room-uuid",\n  "action": "regenerate-code"\n}`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X PATCH \\\n  -H "Authorization: Bearer *** \\\n  -H "Content-Type: application/json" \\\n  -d '{"id":"xxx","action":"regenerate-code"}' \\\n  https://storipalorium.vercel.app/api/v1/rooms`)}
        </div>
      );

    case 'rooms-members':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">List Room Members</h2>
          {m('GET', '/api/v1/rooms/members?roomId=ROOM_ID')}
          <p className="text-foreground/60 text-sm">List all members in a room. Only the room owner can view members.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -H "Authorization: Bearer *** \\\n  "https://storipalorium.vercel.app/api/v1/rooms/members?roomId=xxx"`)}
          <div className="text-foreground/60 text-sm font-medium mt-4">Response</div>
          {code(`{\n  "members": [\n    {\n      "id": "uuid",\n      "userId": "uuid",\n      "roomId": "uuid",\n      "name": "username",\n      "joinedAt": "2026-06-24T..."\n    }\n  ]\n}`)}
        </div>
      );

    case 'rooms-kick':
      return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          <h2 className="text-2xl text-foreground">Kick Member</h2>
          {m('DELETE', '/api/v1/rooms/members?id=MEMBER_ID')}
          <p className="text-foreground/60 text-sm">Remove a member from the room. Owner only. Cannot kick yourself.</p>
          <div className="text-foreground/60 text-sm font-medium mt-4">Example</div>
          {code(`curl -X DELETE \\\n  -H "Authorization: Bearer *** \\\n  "https://storipalorium.vercel.app/api/v1/rooms/members?id=xxx"`)}
        </div>
      );

    default:
      return <div className="text-foreground/40">Select a topic from the sidebar.</div>;
  }
}
