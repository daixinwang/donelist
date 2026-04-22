import * as SQLite from 'expo-sqlite';
import { defaultTags } from '@/constants/default-tags';
import { SCHEMA_SQL, SCHEMA_VERSION } from '@/db/schema';

const DB_NAME = 'donelist.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA_SQL);
      await seedIfNeeded(db);
      return db;
    })();
  }
  return dbPromise;
}

async function seedIfNeeded(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    ['schema_version']
  );
  if (row?.value === String(SCHEMA_VERSION)) return;

  const tagCount = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM tags'
  );
  if ((tagCount?.c ?? 0) === 0) {
    for (const t of defaultTags) {
      await db.runAsync(
        'INSERT OR IGNORE INTO tags (name, color, sort_order) VALUES (?, ?, ?)',
        [t.name, t.color, t.sortOrder]
      );
    }
  }

  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    ['schema_version', String(SCHEMA_VERSION)]
  );
}

/** Reset cached connection — used after importing data. */
export function resetDbCache() {
  dbPromise = null;
}
