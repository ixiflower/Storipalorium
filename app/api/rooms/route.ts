import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { rooms, roomMembers } from '@/lib/db-schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    // Check for duplicate name by this owner
    const existing = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.name, name.trim()), eq(rooms.ownerId, session.user.id)))
      .limit(1);
    if (existing.length) {
      return NextResponse.json({ error: 'You already have a room with this name' }, { status: 409 });
    }

    const code = generateCode();
    const result = await db
      .insert(rooms)
      .values({ name: name.trim(), code, ownerId: session.user.id })
      .returning();

    await db.insert(roomMembers).values({
      roomId: result[0].id,
      userId: session.user.id,
    });

    return NextResponse.json({ room: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRooms = await db
      .select({
        id: rooms.id,
        name: rooms.name,
        code: rooms.code,
        ownerId: rooms.ownerId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
      .where(eq(roomMembers.userId, session.user.id))
      .orderBy(rooms.createdAt);

    return NextResponse.json({ rooms: userRooms });
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Only the owner can delete
    const room = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    if (!room.length) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (room[0].ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Only the room owner can delete it' }, { status: 403 });
    }

    await db.delete(rooms).where(eq(rooms.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
