// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  state: text('state').notNull(),
  revision: integer('revision').notNull().default(0),
  updated: integer('updated').notNull(),
});
export const profiles = sqliteTable('profiles', {
  token: text('token').primaryKey(),
  name: text('name').notNull(),
  avatar: text('avatar').notNull().default(''),
  updated: integer('updated').notNull(),
});
