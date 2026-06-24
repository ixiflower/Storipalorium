import { db } from '@/lib/db';
import { items, rooms, roomMembers } from '@/lib/db-schema';
import { eq, and, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { validateBearerToken } from '@/lib/api-auth';

function err(msg: string, status: number) { return NextResponse.json({ error: msg }, { status }); }

export async function GET(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  if (roomId) {
    const member = await db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))).limit(1);
    if (!member.length) return err('Not a member of this room', 403);
    const list = await db.select().from(items).where(eq(items.roomId, roomId)).orderBy(items.createdAt);
    return NextResponse.json({ items: list });
  }
  const list = await db.select().from(items).where(and(eq(items.userId, userId), isNull(items.roomId))).orderBy(items.createdAt);
  return NextResponse.json({ items: list });
}

export async function POST(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const { title, link, category, roomId, tags } = await request.json();
  if (!title) return err('Title is required', 400);
  if (roomId) {
    const member = await db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))).limit(1);
    if (!member.length) return err('Not a member of this room', 403);
  }
  const result = await db.insert(items).values({
    userId, title, link: link || '', category: category || 'links', roomId: roomId || null, tags: tags || '',
  }).returning();
  return NextResponse.json({ item: result[0] }, { status: 201 });
}

export async function PATCH(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const { id, title, link, category, tags } = await request.json();
  if (!id) return err('Item ID required', 400);
  const item = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!item.length || item[0].userId !== userId) return err('Not found', 404);
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (link !== undefined) updates.link = link;
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) updates.tags = tags;
  const result = await db.update(items).set(updates).where(eq(items.id, id)).returning();
  return NextResponse.json({ item: result[0] });
}

export async function DELETE(request: Request) {
  const userId = await validateBearerToken(request);
  if (!userId) return err('Invalid or missing API token', 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return err('Item ID required', 400);
  const item = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!item.length || item[0].userId !== userId) return err('Not found', 404);
  await db.delete(items).where(eq(items.id, id));
  return NextResponse.json({ success: true });
}
