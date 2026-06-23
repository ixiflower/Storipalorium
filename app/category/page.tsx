import { auth } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { items } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Item = {
  id: string;
  title: string;
  link: string;
  category: 'notes' | 'links' | 'media';
  createdAt: Date;
};

export default async function CategoryPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userItems = await db
    .select()
    .from(items)
    .where(eq(items.userId, session.user.id))
    .orderBy(items.createdAt);

  const groups = {
    links: userItems.filter((i) => i.category === 'links'),
    notes: userItems.filter((i) => i.category === 'notes'),
    media: userItems.filter((i) => i.category === 'media'),
  } as const;

  const labels: Record<string, string> = {
    links: 'Links',
    notes: 'Notes',
    media: 'Media',
  };

  const total = userItems.length;

  return (
    <div className="min-h-screen pt-24 px-8 md:px-16 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl text-foreground mb-4">Categories</h1>
          <p className="text-foreground/60 text-lg">
            {total === 0
              ? 'Nothing saved yet.'
              : `${total} item${total === 1 ? '' : 's'} saved`}
          </p>
        </div>

        {total === 0 ? (
          <div className="text-center py-24">
            <div className="text-foreground/40 text-xl mb-6">
              Your collection is empty
            </div>
            <Link
              href="/create"
              className="inline-block px-10 py-4 text-xl text-foreground border-secondary border-t border-l border-r-6 border-b-6 hover:border-foreground/40 transition-colors"
            >
              ADD SOMETHING
            </Link>
          </div>
        ) : (
          <div className="space-y-20">
            {(['links', 'notes', 'media'] as const).map((cat) => {
              const catItems = groups[cat];
              if (catItems.length === 0) return null;

              return (
                <section key={cat}>
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-2xl md:text-3xl text-foreground">
                      {labels[cat]}
                    </h2>
                    <span className="text-foreground/30 text-lg">
                      {catItems.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="border-secondary border-t border-l border-r-6 border-b-6 p-5"
                      >
                        <div className="text-foreground text-lg mb-1">
                          {item.title}
                        </div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent text-sm hover:underline break-all"
                          >
                            {item.link}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
