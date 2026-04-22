import * as SQLite from 'expo-sqlite';
import { defaultTags } from '@/constants/default-tags';
import { INITIAL_SCHEMA_SQL, SCHEMA_VERSION } from '@/db/schema';

const DB_NAME = 'donelist.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        await db.execAsync(INITIAL_SCHEMA_SQL);
        await runMigrations(db);
        await seedIfNeeded(db);
        return db;
      } catch (err) {
        // Don't cache a rejected promise — next call retries.
        dbPromise = null;
        throw err;
      }
    })();
  }
  return dbPromise;
}

async function readVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    ['schema_version']
  );
  return row ? Number(row.value) : 0;
}

async function writeVersion(db: SQLite.SQLiteDatabase, v: number) {
  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    ['schema_version', String(v)]
  );
}

type MigrationFn = (db: SQLite.SQLiteDatabase) => Promise<void>;

const MIGRATIONS: Record<number, MigrationFn> = {
  2: migrateToV2,
};

/**
 * v1 → v2: introduce started_at. Guarded with PRAGMA table_info so
 * the ALTER is safe if a previous (broken) run already added the
 * column but failed before bumping the stored version.
 */
async function migrateToV2(db: SQLite.SQLiteDatabase) {
  const cols = await db.getAllAsync<{ name: string }>(
    'PRAGMA table_info(done_items)'
  );
  const hasStartedAt = cols.some((c) => c.name === 'started_at');
  if (!hasStartedAt) {
    await db.execAsync(
      'ALTER TABLE done_items ADD COLUMN started_at INTEGER'
    );
  }
  await db.execAsync(
    "UPDATE done_items SET started_at = completed_at WHERE started_at IS NULL"
  );
  await db.execAsync(
    'CREATE INDEX IF NOT EXISTS idx_done_started_at ON done_items(started_at DESC)'
  );
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  const current = await readVersion(db);
  if (current === SCHEMA_VERSION) return;
  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const fn = MIGRATIONS[v];
    if (fn) await fn(db);
    await writeVersion(db, v);
  }
}

async function seedIfNeeded(db: SQLite.SQLiteDatabase) {
  const tagCount = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM tags'
  );
  if ((tagCount?.c ?? 0) > 0) return;
  for (const t of defaultTags) {
    await db.runAsync(
      'INSERT OR IGNORE INTO tags (name, color, sort_order) VALUES (?, ?, ?)',
      [t.name, t.color, t.sortOrder]
    );
  }
}

export function resetDbCache() {
  dbPromise = null;
}
