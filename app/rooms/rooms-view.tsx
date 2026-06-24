'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Copy, Check, Trash2, Settings, Users, LogIn, Clock, RefreshCw, UserX } from 'lucide-react';
import type { RoomSettings } from '@/lib/db-schema';
import { defaultRoomSettings, parseRoomSettings } from '@/lib/db-schema';

type Room = {
  id: string; name: string; code: string; ownerId: string;
  settings: string | null; createdAt: Date | null;
};

type Member = {
  id: string; userId: string; roomId: string; name: string | null;
  joinedAt: Date | string | null;
};

export function RoomsView({ rooms: initialRooms, userId, userName }: { rooms: Room[]; userId: string; userName: string }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [msg, setMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedPopupCode, setCopiedPopupCode] = useState<string | null>(null);
  const [settingsRoom, setSettingsRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [membersRoom, setMembersRoom] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<'create' | 'join' | null>(null);
  const [popup, setPopup] = useState<{ title: string; code?: string; name?: string } | null>(null);
  const router = useRouter();

  const ic = "bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-10";
  const bc = "px-3 py-2 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 h-10 inline-flex items-center gap-1 shrink-0 hover:border-foreground/40 transition-colors disabled:opacity-30";

  const createRoom = async () => {
    if (!newRoomName.trim()) return; setMsg('');
    const res = await fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newRoomName.trim() }) });
    const d = await res.json();
    if (res.ok) { setRooms(p => [...p, d.room]); setNewRoomName(''); setActiveAction(null); setPopup({ title: 'Room Created!', code: d.room.code, name: d.room.name }); }
    else setMsg(d.error || 'Failed');
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return; setMsg('');
    const res = await fetch('/api/rooms/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode.trim() }) });
    const d = await res.json();
    if (res.ok) { setRooms(p => p.find(r => r.id === d.room.id) ? p : [...p, d.room]); setJoinCode(''); setActiveAction(null); setPopup({ title: 'Joined Room!', name: d.room.name }); router.refresh(); }
    else setMsg(d.error || 'Invalid code');
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); };

  const deleteRoom = async () => {
    if (!deleteTarget || deleteConfirmName !== deleteTarget.name) return;
    const res = await fetch(`/api/rooms?id=${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) { setRooms(p => p.filter(r => r.id !== deleteTarget.id)); setDeleteTarget(null); setDeleteConfirmName(''); setMsg('Deleted.'); }
    else { const d = await res.json(); setMsg(d.error || 'Failed'); }
  };

  const saveSettings = async (roomId: string, settings: RoomSettings, newName?: string) => {
    setMsg('');
    const body: Record<string, unknown> = { id: roomId, settings };
    if (newName) body.name = newName;
    const res = await fetch('/api/rooms', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    if (res.ok) {
      setRooms(p => p.map(r => r.id === roomId ? d.room : r));
      setMsg('Settings saved.');
    } else setMsg(d.error || 'Failed');
  };

  const regenerateCode = async (roomId: string) => {
    setRegeneratingCode(roomId);
    setMsg('');
    const res = await fetch('/api/rooms', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: roomId, action: 'regenerate-code' }) });
    const d = await res.json();
    if (res.ok) {
      setRooms(p => p.map(r => r.id === roomId ? d.room : r));
      setMsg('Code regenerated.');
    } else setMsg(d.error || 'Failed');
    setRegeneratingCode(null);
  };

  const toggleMembers = async (roomId: string) => {
    if (membersRoom === roomId) { setMembersRoom(null); setMembers([]); return; }
    setMembersRoom(roomId);
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/rooms/members?roomId=${roomId}`);
      const d = await res.json();
      if (d.members) setMembers(d.members);
    } catch { setMembers([]); }
    setLoadingMembers(false);
  };

  const kickMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Kick ${memberName} from the room?`)) return;
    const res = await fetch(`/api/rooms/members?id=${memberId}`, { method: 'DELETE' });
    const d = await res.json();
    if (res.ok) {
      setMembers(p => p.filter(m => m.id !== memberId));
      setMsg(`${memberName} kicked.`);
    } else setMsg(d.error || 'Failed');
  };

  const formatDate = (d: Date | string | null) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayName = (m: Member, room: Room) => {
    // Current user: use name from session (most accurate)
    if (m.userId === userId && userName) return userName;
    const n = (m.name || '').trim();
    if (n) {
      if (n.includes('@')) return n.split('@')[0];
      return n;
    }
    if (m.userId === room.ownerId) return 'Owner';
    return m.userId.slice(0, 8) + '...';
  };

  return (
    <div className="min-h-screen pt-24 px-8 md:px-16 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-6xl text-foreground mb-4">Rooms</h1>
          <p className="text-foreground/60 text-lg">Create or join shared spaces for collaborating on links.</p>
        </div>

        {/* Create & Join */}
        <div className="mb-10 space-y-4">
          <div className="flex gap-4 flex-col sm:flex-row">
            <button
              onClick={() => setActiveAction(activeAction === 'create' ? null : 'create')}
              className={`flex-1 p-6 border-secondary border-t border-l border-r-6 border-b-6 text-left hover:border-foreground/30 transition-colors ${activeAction === 'create' ? 'border-accent/60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-accent" />
                <span className="text-xl md:text-2xl text-foreground">Create Room</span>
              </div>
              <div className="text-foreground/40 text-sm mt-2">Start a new shared space for your links</div>
            </button>
            <button
              onClick={() => setActiveAction(activeAction === 'join' ? null : 'join')}
              className={`flex-1 p-6 border-secondary border-t border-l border-r-6 border-b-6 text-left hover:border-foreground/30 transition-colors ${activeAction === 'join' ? 'border-accent/60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <LogIn className="w-6 h-6 text-accent" />
                <span className="text-xl md:text-2xl text-foreground">Join Room</span>
              </div>
              <div className="text-foreground/40 text-sm mt-2">Enter an invite code to join an existing room</div>
            </button>
          </div>

          {activeAction === 'create' && (
            <div className="p-6 border-secondary border-t border-l border-r-6 border-b-6 space-y-4">
              <div className="text-foreground text-lg">Create a Room</div>
              <div className="flex gap-2 items-stretch">
                <input placeholder="Room name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createRoom()} className={`flex-1 ${ic}`} autoFocus />
                <button onClick={createRoom} className={bc}><Plus className="w-4 h-4" /> Create</button>
              </div>
            </div>
          )}

          {activeAction === 'join' && (
            <div className="p-6 border-secondary border-t border-l border-r-6 border-b-6 space-y-4">
              <div className="text-foreground text-lg">Join a Room</div>
              <div className="flex gap-2 items-stretch">
                <input placeholder="Invite code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && joinRoom()} maxLength={8} className={`flex-1 ${ic} uppercase`} autoFocus />
                <button onClick={joinRoom} className={bc}><LogIn className="w-4 h-4" /> Join</button>
              </div>
            </div>
          )}

          {msg && <div className="text-sm text-accent">{msg}</div>}
        </div>

        {/* Room List */}
        {rooms.length === 0 ? (
          <div className="text-center py-16 text-foreground/40">No rooms yet. Create one above.</div>
        ) : (
          <div className="space-y-6">
            {rooms.map(room => (
              <div key={room.id} className="border-secondary border-t border-l border-r-6 border-b-6">
                <div className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-foreground text-lg">{room.name}</div>
                    <div className="text-foreground/40 text-xs mt-1 flex items-center gap-2 flex-wrap">
                      <span>Code: <button onClick={() => copyCode(room.code)} className="hover:text-accent transition-colors inline-flex items-center gap-1">
                        {copiedCode === room.code ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}{room.code}
                      </button></span>
                      {room.ownerId === userId && (
                        <button
                          onClick={() => regenerateCode(room.id)}
                          disabled={regeneratingCode === room.id}
                          className="text-foreground/30 hover:text-accent transition-colors inline-flex items-center gap-0.5 disabled:opacity-30"
                          title="Regenerate invite code (old code stops working)"
                        >
                          <RefreshCw className={`w-3 h-3 ${regeneratingCode === room.id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      {room.ownerId === userId && <span className="text-accent/60">(owner)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.ownerId === userId && (
                      <button onClick={() => toggleMembers(room.id)} className={`${bc} text-xs`}>
                        <Users className="w-3.5 h-3.5" /> Members
                      </button>
                    )}
                    {room.ownerId === userId && (
                      <button onClick={() => setSettingsRoom(settingsRoom?.id === room.id ? null : room)} className={`${bc} text-xs`}>
                        <Settings className="w-3.5 h-3.5" /> Settings
                      </button>
                    )}
                    {room.ownerId === userId && (
                      <button onClick={() => { setDeleteTarget(room); setDeleteConfirmName(''); }} className="text-foreground/20 hover:text-destructive transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Members Panel */}
                {membersRoom === room.id && (
                  <div className="p-4 border-t border-secondary space-y-2">
                    <div className="text-foreground/60 text-sm mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      {loadingMembers ? 'Loading...' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
                    </div>
                    {loadingMembers ? (
                      <div className="text-foreground/30 text-sm">Loading members...</div>
                    ) : members.length === 0 ? (
                      <div className="text-foreground/40 text-sm">No members found.</div>
                    ) : (
                      <div className="space-y-1">
                        {members.map(m => (
                          <div key={m.id} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-foreground/[0.02]">
                            <div className="flex items-center gap-2 truncate min-w-0">
                              <span className="text-foreground/70 truncate">{displayName(m, room)}</span>
                              {m.userId === room.ownerId && (
                                <span className="text-accent/60 text-xs shrink-0">(owner)</span>
                              )}
                              {m.userId === userId && !(room.ownerId === userId && m.userId === room.ownerId) && (
                                <span className="text-foreground/30 text-xs shrink-0">(you)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-foreground/30 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDate(m.joinedAt)}
                              </span>
                              {room.ownerId === userId && m.userId !== userId && (
                                <button
                                  onClick={() => kickMember(m.id, displayName(m, room))}
                                  className="text-foreground/20 hover:text-destructive transition-colors"
                                  title={`Kick ${displayName(m, room)}`}
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Panel */}
                {settingsRoom?.id === room.id && (
                  <SettingsPanel room={room} onSave={saveSettings} onClose={() => setSettingsRoom(null)} />
                )}
                {/* Delete confirmation — inline inside this room */}
                {deleteTarget?.id === room.id && (
                  <div className="p-4 border-t border-destructive/30 space-y-2">
                    <div className="text-destructive text-sm">Delete <strong>{deleteTarget.name}</strong>? Type the name to confirm.</div>
                    <div className="flex gap-2 items-stretch">
                      <input value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} placeholder={deleteTarget.name} className={`flex-1 ${ic}`} autoFocus />
                      <button onClick={deleteRoom} disabled={deleteConfirmName !== deleteTarget.name} className={`${bc} text-destructive border-destructive/50`}>Delete</button>
                      <button onClick={() => { setDeleteTarget(null); setDeleteConfirmName(''); }} className={bc}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Success popup */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setPopup(null)}>
          <div className="fixed inset-0 bg-background/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md mx-4 p-8 border-accent/40 border-t border-l border-r-6 border-b-6 bg-background" onClick={(e) => e.stopPropagation()}>
            <div className="text-2xl md:text-3xl text-foreground mb-4">{popup.title}</div>
            {popup.name && <div className="text-foreground/60 text-lg mb-4">{popup.name}</div>}
            {popup.code && (
              <div className="mb-6">
                <div className="text-foreground/40 text-sm mb-2">Invite code — share this:</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-foreground/[0.05] border-secondary border-t border-l border-r-6 border-b-6 px-4 py-3 text-2xl text-accent tracking-widest">{popup.code}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(popup.code!); setCopiedPopupCode(popup.code!); setTimeout(() => setCopiedPopupCode(null), 2000); }}
                    className="px-4 py-3 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors shrink-0"
                  >
                    {copiedPopupCode === popup.code ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => setPopup(null)}
              className="w-full px-6 py-3 text-lg text-foreground border-foreground border-t border-l border-r-6 border-b-6 hover:opacity-75 transition-opacity"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel({ room, onSave, onClose }: { room: Room; onSave: (id: string, s: RoomSettings, name?: string) => void; onClose: () => void }) {
  const current = parseRoomSettings(room.settings);
  const [s, setS] = useState<RoomSettings>(current);
  const [roomName, setRoomName] = useState(room.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(room.id, s, roomName !== room.name ? roomName : undefined);
    setSaving(false);
  };

  const selectCls = "bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-10 w-full";
  const labelCls = "text-foreground/60 text-sm mb-1 block";

  return (
    <div className="p-4 border-t border-secondary space-y-4">
      <div className="text-foreground text-lg flex items-center gap-2"><Settings className="w-4 h-4 text-accent" /> Room Settings</div>

      <div>
        <label className={labelCls}>Room name</label>
        <input value={roomName} onChange={(e) => setRoomName(e.target.value)}
          placeholder="Room name"
          className="bg-transparent text-foreground border-secondary border-t border-l border-r-6 border-b-6 px-3 py-2 text-sm h-10 w-full" />
      </div>

      <div>
        <label className={labelCls}>Who can add items</label>
        <select value={s.whoCanAdd} onChange={(e) => setS({ ...s, whoCanAdd: e.target.value as RoomSettings['whoCanAdd'] })} className={selectCls}>
          <option className="bg-background" value="anyone">Anyone in the room</option>
          <option className="bg-background" value="owner">Only the owner</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>Who can delete items</label>
        <select value={s.whoCanDelete} onChange={(e) => setS({ ...s, whoCanDelete: e.target.value as RoomSettings['whoCanDelete'] })} className={selectCls}>
          <option className="bg-background" value="anyone">Anyone (can delete any item)</option>
          <option className="bg-background" value="own">Only their own items</option>
          <option className="bg-background" value="owner">Only the room owner</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>Who can edit items</label>
        <select value={s.whoCanEdit} onChange={(e) => setS({ ...s, whoCanEdit: e.target.value as RoomSettings['whoCanEdit'] })} className={selectCls}>
          <option className="bg-background" value="anyone">Anyone (can edit any item)</option>
          <option className="bg-background" value="own">Only their own items</option>
          <option className="bg-background" value="owner">Only the room owner</option>
        </select>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-foreground/60 hover:text-foreground transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
