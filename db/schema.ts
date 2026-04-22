export const SCHEMA_VERSION = 2;

/**
 * v1 baseline schema — the shape the DB had BEFORE any feature that
 * was delivered via a migration. Every newer column / index is added
 * in the migration chain below, never here. This way existing users
 * never hit "no such column" when the initial statements run against
 * a stale database, and fresh installs end up in the same state by
 * walking through the same migrations.
 */
export const INITIAL_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS done_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_done_completed_at
  ON done_items(completed_at DESC);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS done_tags (
  done_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (done_id, tag_id),
  FOREIGN KEY (done_id) REFERENCES done_items(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_done_tags_tag ON done_tags(tag_id);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;
