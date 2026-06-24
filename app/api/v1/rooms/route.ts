import { db } from '@/lib/db';
import { rooms, roomMembers, defaultRoomSettings } from '@/lib/db-schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { validateBearerToken } from '@/lib/api-auth';
import { randomBytes } from 'crypto';

function err(msg: string, status: number) { return NextResponse.json({ error: msg }, { status }); }

export async function GET(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const list = await db.select().from(rooms)
    .innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
    .where(eq(roomMembers.userId, userId))
    .orderBy(rooms.createdAt);
  return NextResponse.json({ rooms: list.map(r => r.rooms) });
}

export async function POST(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const body = await request.json();

  // Join room by code
  if (body.code) {
    const room = await db.select().from(rooms).where(eq(rooms.code, body.code.toUpperCase())).limit(1);
    if (!room.length) return err('Invalid invite code', 404);
    const existing = await db.select().from(roomMembers)
      .where(and(eq(roomMembers.roomId, room[0].id), eq(roomMembers.userId, userId)));
    if (existing.length) return NextResponse.json({ room: room[0], alreadyJoined: true });
    await db.insert(roomMembers).values({ roomId: room[0].id, userId, name: '' });
    return NextResponse.json({ room: room[0] });
  }

  // Create room
  const { name } = body;
  if (!name?.trim()) return err('Room name is required', 400);
  const code = randomBytes(4).toString('hex').toUpperCase();
  const settings = JSON.stringify(defaultRoomSettings());
  const result = await db.insert(rooms).values({ name: name.trim(), code, ownerId: userId, settings }).returning();
  await db.insert(roomMembers).values({ roomId: result[0].id, userId, name: '' });
  return NextResponse.json({ room: result[0] }, { status: 201 });
}

export async function DELETE(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return err('Room ID required', 400);
  const room = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  if (!room.length || room[0].ownerId !== userId) return err('Not found or not owner', 404);
  await db.delete(rooms).where(eq(rooms.id, id));
  return NextResponse.json({ success: true });
}
