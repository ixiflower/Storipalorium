import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { items, rooms, roomMembers } from '@/lib/db-schema';
import { eq, and, isNull } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CategoryPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/login');

  // Fetch private items
  const privateItems = await db
    .select()
    .from(items)
    .where(and(eq(items.userId, session.user.id), isNull(items.roomId)))
    .orderBy(items.createdAt);

  // Fetch user's rooms
  const userRooms = await db
    .select({ id: rooms.id, name: rooms.name, code: rooms.code })
    .from(rooms)
    .innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
    .where(eq(roomMembers.userId, session.user.id));

  // Fetch items per room
  const roomItemsMap: Record<string, typeof privateItems> = {};
  for (const room of userRooms) {
    roomItemsMap[room.id] = await db
      .select()
      .from(items)
      .where(and(eq(items.userId, session.user.id), eq(items.roomId, room.id)))
      .orderBy(items.createdAt);
  }

  const labels: Record<string, string> = { links: 'Links', notes: 'Notes', media: 'Media' };

  function groupByCategory(list: typeof privateItems) {
    return {
      links: list.filter(i => i.category === 'links'),
      notes: list.filter(i => i.category === 'notes'),
      media: list.filter(i => i.category === 'media'),
    };
  }

  function renderSection(catItems: typeof privateItems, cat: string) {
    if (catItems.length === 0) return null;
    return (
      <section key={cat}>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl text-foreground">{labels[cat]}</h2>
          <span className="text-foreground/30 text-lg">{catItems.length}</span>
        </div>
        <div className="space-y-3">
          {catItems.map(item => (
            <div key={item.id} className="border-secondary border-t border-l border-r-6 border-b-6 p-5">
              <div className="text-foreground text-lg mb-1">{item.title}</div>
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  className="text-accent text-sm hover:underline break-all">{item.link}</a>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  const totalItems = privateItems.length + Object.values(roomItemsMap).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="min-h-screen pt-24 px-8 md:px-16 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl text-foreground mb-4">Categories</h1>
          <p className="text-foreground/60 text-lg">
            {totalItems === 0 ? 'Nothing saved yet.' : `${totalItems} item${totalItems === 1 ? '' : 's'} saved`}
          </p>
        </div>

        {totalItems === 0 ? (
          <div className="text-center py-24">
            <div className="text-foreground/40 text-xl mb-6">Your collection is empty</div>
            <Link href="/create"
              className="inline-block px-10 py-4 text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors">
              ADD SOMETHING
            </Link>
          </div>
        ) : (
          <div className="space-y-24">
            {/* Private items */}
            {privateItems.length > 0 && (
              <div>
                <h2 className="text-xl text-foreground/40 mb-10">Private</h2>
                <div className="space-y-20">
                  {(['links', 'notes', 'media'] as const).map(cat =>
                    renderSection(groupByCategory(privateItems)[cat], cat)
                  )}
                </div>
              </div>
            )}

            {/* Room items */}
            {userRooms.map(room => {
              const roomItems = roomItemsMap[room.id] || [];
              if (roomItems.length === 0) return null;
              const grouped = groupByCategory(roomItems);
              return (
                <div key={room.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl text-foreground/40">{room.name}</h2>
                    <span className="text-foreground/20 text-xs">code: {room.code}</span>
                  </div>
                  <div className="space-y-20 mt-10">
                    {(['links', 'notes', 'media'] as const).map(cat =>
                      renderSection(grouped[cat], cat)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
