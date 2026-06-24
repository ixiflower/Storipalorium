import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  ownerId: text('owner_id').notNull(),
  settings: text('settings').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type RoomSettings = {
  whoCanAdd: 'anyone' | 'owner';
  whoCanDelete: 'anyone' | 'owner' | 'own';
  whoCanEdit: 'anyone' | 'owner' | 'own';
};

export function defaultRoomSettings(): RoomSettings {
  return { whoCanAdd: 'anyone', whoCanDelete: 'own', whoCanEdit: 'anyone' };
}

export const roomMembers = pgTable(
  'room_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex('room_member_unique').on(t.roomId, t.userId)],
);

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  link: text('link').default(''),
  category: text('category').notNull().default('notes'),
  tags: text('tags').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  members: many(roomMembers),
  items: many(items),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(rooms, { fields: [roomMembers.roomId], references: [rooms.id] }),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  room: one(rooms, { fields: [items.roomId], references: [rooms.id] }),
}));

// Types
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type RoomMember = typeof roomMembers.$inferSelect;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

// Helper: parse room settings with defaults
export function parseRoomSettings(raw: string | null | undefined): RoomSettings {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    const defs = defaultRoomSettings();
    return {
      whoCanAdd: parsed.whoCanAdd || defs.whoCanAdd,
      whoCanDelete: parsed.whoCanDelete || defs.whoCanDelete,
      whoCanEdit: parsed.whoCanEdit || defs.whoCanEdit,
    };
  } catch { return defaultRoomSettings(); }
}
