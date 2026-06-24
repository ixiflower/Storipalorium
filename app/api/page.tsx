import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { apiTokens } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { APIDocs } from './api-docs';

export const dynamic = 'force-dynamic';

export default async function APIPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect('/login');

  const tokens = await db.select().from(apiTokens)
    .where(eq(apiTokens.userId, session.user.id))
    .orderBy(apiTokens.createdAt);

  return <APIDocs userId={session.user.id} tokens={tokens} />;
}
