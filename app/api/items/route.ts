import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { items, roomMembers, type NewItem } from '@/lib/db-schema';
import { eq, and, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { title, link, category, roomId, tags } = body;
    if (!title || !category) return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
    if (roomId) {
      const member = await db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id))).limit(1);
      if (!member.length) return NextResponse.json({ error: 'Not a member' }, { status: 403 });
    }
    const newItem: NewItem = { userId: session.user.id, title, link: link || '', category, roomId: roomId || null, tags: tags || '' };
    const result = await db.insert(items).values(newItem).returning();
    return NextResponse.json({ item: result[0] }, { status: 201 });
  } catch (error) { console.error('Failed to create item:', error); return NextResponse.json({ error: 'Failed to create item' }, { status: 500 }); }
}

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    if (roomId) {
      const member = await db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id))).limit(1);
      if (!member.length) return NextResponse.json({ error: 'Not a member' }, { status: 403 });
      const roomItems = await db.select().from(items).where(eq(items.roomId, roomId)).orderBy(items.createdAt);
      return NextResponse.json({ items: roomItems });
    }
    const userItems = await db.select().from(items).where(and(eq(items.userId, session.user.id), isNull(items.roomId))).orderBy(items.createdAt);
    return NextResponse.json({ items: userItems });
  } catch (error) { console.error('Failed to fetch items:', error); return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!item.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (item[0].userId !== session.user.id) return NextResponse.json({ error: 'Not your item' }, { status: 403 });
    await db.delete(items).where(eq(items.id, id));
    return NextResponse.json({ success: true });
  } catch (error) { console.error('Failed to delete item:', error); return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 }); }
}
