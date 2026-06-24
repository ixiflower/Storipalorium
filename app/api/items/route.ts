import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { items, rooms, roomMembers, type NewItem, parseRoomSettings } from '@/lib/db-schema';
import { eq, and, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

function error(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return error('Unauthorized', 401);
  try {
    const body = await request.json();
    const { title, link, category, roomId, tags, shareFromId } = body;

    // Share: copy an existing item to a target room
    if (shareFromId && roomId) {
      const source = await db.select().from(items).where(eq(items.id, shareFromId)).limit(1);
      if (!source.length) return error('Source item not found', 404);

      const src = source[0];
      // Must have access to source: own it, or be in its room
      if (src.userId !== session.user.id) {
        if (src.roomId) {
          const srcMember = await db.select().from(roomMembers)
            .where(and(eq(roomMembers.roomId, src.roomId), eq(roomMembers.userId, session.user.id))).limit(1);
          if (!srcMember.length) return error('Not a member of source room', 403);
        } else {
          return error('Not your item', 403);
        }
      }

      // Must be a member of target room
      const tgtMember = await db.select().from(roomMembers)
        .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id))).limit(1);
      if (!tgtMember.length) return error('Not a member of target room', 403);

      // Check target room add permissions
      const tgtRoom = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
      if (tgtRoom.length) {
        const tgtSettings = parseRoomSettings(tgtRoom[0].settings);
        if (tgtSettings.whoCanAdd === 'owner' && tgtRoom[0].ownerId !== session.user.id) {
          return error('Only the room owner can add items to this room', 403);
        }
      }

      const copy: NewItem = {
        userId: session.user.id,
        title: src.title,
        link: src.link,
        category: src.category,
        roomId,
        tags: src.tags,
      };
      const result = await db.insert(items).values(copy).returning();
      return NextResponse.json({ item: result[0], shared: true }, { status: 201 });
    }

    if (!title || !category) return error('Title and category are required', 400);

    if (roomId) {
      const member = await db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id))).limit(1);
      if (!member.length) return error('Not a member', 403);

      // Check room settings: whoCanAdd
      const room = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
      if (room.length) {
        const settings = parseRoomSettings(room[0].settings);
        if (settings.whoCanAdd === 'owner' && room[0].ownerId !== session.user.id) {
          return error('Only the room owner can add items', 403);
        }
      }
    }

    const newItem: NewItem = { userId: session.user.id, title, link: link || '', category, roomId: roomId || null, tags: tags || '' };
    const result = await db.insert(items).values(newItem).returning();
    return NextResponse.json({ item: result[0] }, { status: 201 });
  } catch (e) { console.error('Failed to create item:', e); return error('Failed to create item', 500); }
}

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return error('Unauthorized', 401);
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    if (roomId) {
      const member = await db.select().from(roomMembers).where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, session.user.id))).limit(1);
      if (!member.length) return error('Not a member', 403);
      const roomItems = await db.select().from(items).where(eq(items.roomId, roomId)).orderBy(items.createdAt);
      return NextResponse.json({ items: roomItems });
    }
    const userItems = await db.select().from(items).where(and(eq(items.userId, session.user.id), isNull(items.roomId))).orderBy(items.createdAt);
    return NextResponse.json({ items: userItems });
  } catch (e) { console.error('Failed to fetch items:', e); return error('Failed to fetch items', 500); }
}

export async function PATCH(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return error('Unauthorized', 401);
  try {
    const body = await request.json();
    const { id, title, link, category, tags } = body;
    if (!id) return error('Item ID required', 400);
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!item.length) return error('Not found', 404);

    const target = item[0];

    // Check ownership or room permissions
    if (target.userId !== session.user.id) {
      if (target.roomId) {
        // In a room: check room edit permissions
        const room = await db.select().from(rooms).where(eq(rooms.id, target.roomId)).limit(1);
        if (room.length) {
          // Room owner always has full control
          if (room[0].ownerId !== session.user.id) {
            const settings = parseRoomSettings(room[0].settings);
            if (settings.whoCanEdit === 'owner') {
              return error('Only the room owner can edit items', 403);
            }
            if (settings.whoCanEdit === 'own') return error('You can only edit your own items', 403);
          }
        }
      } else {
        return error('Not your item', 403);
      }
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (link !== undefined) updates.link = link;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (Object.keys(updates).length === 0) return error('No fields to update', 400);
    const result = await db.update(items).set(updates).where(eq(items.id, id)).returning();
    return NextResponse.json({ item: result[0] });
  } catch (e) { console.error('Failed to update item:', e); return error('Failed to update item', 500); }
}

export async function DELETE(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return error('Unauthorized', 401);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return error('Item ID required', 400);
    const item = await db.select().from(items).where(eq(items.id, id)).limit(1);
    if (!item.length) return error('Not found', 404);

    const target = item[0];

    // Check ownership or room permissions
    if (target.userId !== session.user.id) {
      if (target.roomId) {
        const room = await db.select().from(rooms).where(eq(rooms.id, target.roomId)).limit(1);
        if (room.length) {
          // Room owner always has full control
          if (room[0].ownerId !== session.user.id) {
            const settings = parseRoomSettings(room[0].settings);
            if (settings.whoCanDelete === 'owner') {
              return error('Only the room owner can delete items', 403);
            }
            if (settings.whoCanDelete === 'own') return error('You can only delete your own items', 403);
          }
        }
      } else {
        return error('Not your item', 403);
      }
    }

    await db.delete(items).where(eq(items.id, id));
    return NextResponse.json({ success: true });
  } catch (e) { console.error('Failed to delete item:', e); return error('Failed to delete item', 500); }
}
