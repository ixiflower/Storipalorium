import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  link: text('link').default(''),
  category: text('category', { enum: ['notes', 'links', 'media'] })
    .notNull()
    .default('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
