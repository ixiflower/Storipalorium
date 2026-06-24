import { db } from '@/lib/db';
import { apiTokens } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';

export async function validateBearerToken(request: Request): Promise<string | null> {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const result = await db.select().from(apiTokens).where(eq(apiTokens.token, token)).limit(1);
  if (!result.length) return null;
  await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, result[0].id));
  return result[0].userId;
}
