import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { rooms, roomMembers } from '@/lib/db-schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 });

  // Only the room owner can see the member list
  const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room[0].ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Only the room owner can view members' }, { status: 403 });
  }

  const members = await db.select().from(roomMembers)
    .where(eq(roomMembers.roomId, roomId))
    .orderBy(roomMembers.joinedAt);

  return NextResponse.json({ members });
}

export async function DELETE(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');
    if (!memberId) return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });

    // Find the member record
    const member = await db.select().from(roomMembers).where(eq(roomMembers.id, memberId)).limit(1);
    if (!member.length) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const m = member[0];

    // Only the room owner can kick
    const room = await db.select().from(rooms).where(eq(rooms.id, m.roomId)).limit(1);
    if (!room.length) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    if (room[0].ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the room owner can kick members' }, { status: 403 });
    }

    // Owner cannot kick themselves
    if (m.userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot kick yourself' }, { status: 400 });
    }

    await db.delete(roomMembers).where(eq(roomMembers.id, memberId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to kick member:', error);
    return NextResponse.json({ error: 'Failed to kick member' }, { status: 500 });
  }
}
