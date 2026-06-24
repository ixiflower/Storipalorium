import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { apiTokens } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tokens = await db.select().from(apiTokens)
    .where(eq(apiTokens.userId, session.user.id))
    .orderBy(apiTokens.createdAt);
  return NextResponse.json({ tokens });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Token name required' }, { status: 400 });
  const token = 'stori_' + randomBytes(24).toString('hex');
  const result = await db.insert(apiTokens).values({
    userId: session.user.id,
    name: name.trim(),
    token,
  }).returning();
  return NextResponse.json({ token: result[0] }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
  const t = await db.select().from(apiTokens).where(eq(apiTokens.id, id)).limit(1);
  if (!t.length || t[0].userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await db.delete(apiTokens).where(eq(apiTokens.id, id));
  return NextResponse.json({ success: true });
}
