import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { items, rooms, roomMembers } from '@/lib/db-schema';
import { eq, and, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { CategoryView } from './category-view';

export const dynamic = 'force-dynamic';

export default async function CategoryPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/login');

  const privateItems = await db.select().from(items)
    .where(and(eq(items.userId, session.user.id), isNull(items.roomId)))
    .orderBy(items.createdAt);

  const userRooms = await db.select({ id: rooms.id, name: rooms.name, code: rooms.code })
    .from(rooms).innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
    .where(eq(roomMembers.userId, session.user.id));

  const roomItemsMap: Record<string, typeof privateItems> = {};
  for (const room of userRooms) {
    roomItemsMap[room.id] = await db.select().from(items)
      .where(eq(items.roomId, room.id)).orderBy(items.createdAt);
  }

  return <CategoryView privateItems={privateItems} userRooms={userRooms} roomItemsMap={roomItemsMap} />;
}
