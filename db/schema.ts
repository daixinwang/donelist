export const SCHEMA_VERSION = 2;

/** Initial schema for a fresh install. */
export const INITIAL_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS done_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_done_completed_at
  ON done_items(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_done_started_at
  ON done_items(started_at DESC);

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

/** Migration from v1 → v2: add started_at column, backfill equal to completed_at. */
export const MIGRATIONS: Record<number, string> = {
  2: `
    ALTER TABLE done_items ADD COLUMN started_at INTEGER;
    UPDATE done_items SET started_at = completed_at WHERE started_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_done_started_at
      ON done_items(started_at DESC);
  `,
};
