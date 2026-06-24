import { db } from '@/lib/db';
import { rooms, roomMembers } from '@/lib/db-schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { validateBearerToken } from '@/lib/api-auth';

function err(msg: string, status: number) { return NextResponse.json({ error: msg }, { status }); }

export async function GET(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  if (!roomId) return err('roomId required', 400);
  const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room.length) return err('Room not found', 404);
  if (room[0].ownerId !== userId) return err('Only owner can view members', 403);
  const members = await db.select().from(roomMembers).where(eq(roomMembers.roomId, roomId)).orderBy(roomMembers.joinedAt);
  return NextResponse.json({ members });
}

export async function DELETE(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('id');
  if (!memberId) return err('Member ID required', 400);
  const member = await db.select().from(roomMembers).where(eq(roomMembers.id, memberId)).limit(1);
  if (!member.length) return err('Not found', 404);
  const room = await db.select().from(rooms).where(eq(rooms.id, member[0].roomId)).limit(1);
  if (!room.length || room[0].ownerId !== userId) return err('Only owner can kick', 403);
  if (member[0].userId === userId) return err('Cannot kick yourself', 400);
  await db.delete(roomMembers).where(eq(roomMembers.id, memberId));
  return NextResponse.json({ success: true });
}
