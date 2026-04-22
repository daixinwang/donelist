import * as SQLite from 'expo-sqlite';
import { defaultTags } from '@/constants/default-tags';
import { INITIAL_SCHEMA_SQL, MIGRATIONS, SCHEMA_VERSION } from '@/db/schema';

const DB_NAME = 'donelist.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(INITIAL_SCHEMA_SQL);
      await runMigrations(db);
      await seedIfNeeded(db);
      return db;
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

async function runMigrations(db: SQLite.SQLiteDatabase) {
  const current = await readVersion(db);
  if (current === SCHEMA_VERSION) return;

  // Fresh install: INITIAL_SCHEMA_SQL already created latest shape; just stamp version.
  if (current === 0) {
    await writeVersion(db, SCHEMA_VERSION);
    return;
  }

  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const sql = MIGRATIONS[v];
    if (!sql) continue;
    await db.execAsync(sql);
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
