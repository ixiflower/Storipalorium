import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { rooms, roomMembers } from '@/lib/db-schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase(); // 8-char code
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

    const code = generateCode();
    const result = await db
      .insert(rooms)
      .values({ name: name.trim(), code, ownerId: session.user.id })
      .returning();

    // Auto-join the creator to the room
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
