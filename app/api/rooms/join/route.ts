import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { rooms, roomMembers } from '@/lib/db-schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await request.json();
    if (!code?.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, code.trim().toUpperCase()))
      .limit(1);

    if (!room.length) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if already a member
    const existing = await db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, room[0].id), eq(roomMembers.userId, session.user.id)));

    if (existing.length) {
      return NextResponse.json({ room: room[0], alreadyJoined: true });
    }

    await db.insert(roomMembers).values({
      roomId: room[0].id,
      userId: session.user.id,
      name: (session.user as any).name || (session.user as any).user_metadata?.name || session.user.email || '',
    });

    return NextResponse.json({ room: room[0] });
  } catch (error) {
    console.error('Failed to join room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
