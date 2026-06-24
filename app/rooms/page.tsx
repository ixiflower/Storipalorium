import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { rooms, roomMembers } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { RoomsView } from './rooms-view';

export const dynamic = 'force-dynamic';

export default async function RoomsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/login');

  const userRooms = await db
    .select({
      id: rooms.id,
      name: rooms.name,
      code: rooms.code,
      ownerId: rooms.ownerId,
      settings: rooms.settings,
      createdAt: rooms.createdAt,
    })
    .from(rooms)
    .innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
    .where(eq(roomMembers.userId, session.user.id))
    .orderBy(rooms.createdAt);

  return <RoomsView rooms={userRooms} userId={session.user.id} userName={session.user.email?.split('@')[0] || session.user.id.slice(0, 8)} />;
}
