import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { items, type NewItem } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, link, category } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 },
      );
    }

    const newItem: NewItem = {
      userId: session.user.id,
      title,
      link: link || '',
      category: category as 'notes' | 'links' | 'media',
    };

    const result = await db.insert(items).values(newItem).returning();

    return NextResponse.json({ item: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 },
    );
  }
}

export async function GET() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userItems = await db
      .select()
      .from(items)
      .where(eq(items.userId, session.user.id))
      .orderBy(items.createdAt);

    return NextResponse.json({ items: userItems });
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 },
    );
  }
}
