import { getDb } from '@/db/client';

export type DailyCount = { day: string; count: number };

/**
 * Returns YYYY-MM-DD (local time) → count for items whose completed_at
 * falls in [fromMs, toMs).
 */
export async function countByDay(
  fromMs: number,
  toMs: number
): Promise<DailyCount[]> {
  const db = await getDb();
  return db.getAllAsync<DailyCount>(
    `SELECT DATE(completed_at / 1000, 'unixepoch', 'localtime') AS day,
            COUNT(*) AS count
     FROM done_items
     WHERE completed_at >= ? AND completed_at < ?
     GROUP BY day
     ORDER BY day ASC`,
    [fromMs, toMs]
  );
}

export type TagCount = {
  tagId: number | null;
  name: string | null;
  color: string | null;
  count: number;
};

export async function countByTag(
  fromMs: number,
  toMs: number
): Promise<TagCount[]> {
  const db = await getDb();
  const tagged = await db.getAllAsync<TagCount>(
    `SELECT t.id AS tagId, t.name AS name, t.color AS color, COUNT(*) AS count
     FROM done_tags dt
     INNER JOIN tags t ON t.id = dt.tag_id
     INNER JOIN done_items di ON di.id = dt.done_id
     WHERE di.completed_at >= ? AND di.completed_at < ?
     GROUP BY t.id
     ORDER BY count DESC`,
    [fromMs, toMs]
  );

  const untagged = await db.getFirstAsync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM done_items di
     WHERE di.completed_at >= ? AND di.completed_at < ?
       AND NOT EXISTS (SELECT 1 FROM done_tags dt WHERE dt.done_id = di.id)`,
    [fromMs, toMs]
  );

  if ((untagged?.c ?? 0) > 0) {
    tagged.push({
      tagId: null,
      name: '无标签',
      color: null,
      count: untagged!.c,
    });
  }
  return tagged;
}

export type TagDuration = {
  tagId: number | null;
  name: string | null;
  color: string | null;
  totalMs: number;
};

/**
 * Total interval duration (completed_at − started_at) grouped by tag
 * for items whose completed_at falls in [fromMs, toMs).
 *
 * An item with multiple tags contributes its full duration to each
 * of them — intentional, since "this block of time was spent on
 * both #工作 and #学习" is a valid reading of the user's categories.
 */
export async function durationByTag(
  fromMs: number,
  toMs: number
): Promise<TagDuration[]> {
  const db = await getDb();
  const tagged = await db.getAllAsync<TagDuration>(
    `SELECT t.id AS tagId, t.name AS name, t.color AS color,
            SUM(di.completed_at - di.started_at) AS totalMs
     FROM done_tags dt
     INNER JOIN tags t ON t.id = dt.tag_id
     INNER JOIN done_items di ON di.id = dt.done_id
     WHERE di.completed_at >= ? AND di.completed_at < ?
     GROUP BY t.id
     ORDER BY totalMs DESC`,
    [fromMs, toMs]
  );

  const untagged = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(di.completed_at - di.started_at) AS total FROM done_items di
     WHERE di.completed_at >= ? AND di.completed_at < ?
       AND NOT EXISTS (SELECT 1 FROM done_tags dt WHERE dt.done_id = di.id)`,
    [fromMs, toMs]
  );

  if ((untagged?.total ?? 0) > 0) {
    tagged.push({
      tagId: null,
      name: '无标签',
      color: null,
      totalMs: untagged!.total!,
    });
  }
  return tagged;
}

/** ms timestamp of the oldest completed_at across all rows, or null if empty. */
export async function getEarliestCompletedAt(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ t: number | null }>(
    'SELECT MIN(completed_at) AS t FROM done_items'
  );
  return row?.t ?? null;
}

export async function currentStreak(): Promise<number> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT DATE(completed_at / 1000, 'unixepoch', 'localtime') AS day
     FROM done_items
     ORDER BY day DESC`
  );
  if (rows.length === 0) return 0;

  const days = new Set(rows.map((r) => r.day));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (streak < 10000) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (streak === 0) {
        // if today is empty, allow streak to count from yesterday
        cursor.setDate(cursor.getDate() - 1);
        const y2 = cursor.getFullYear();
        const m2 = String(cursor.getMonth() + 1).padStart(2, '0');
        const d2 = String(cursor.getDate()).padStart(2, '0');
        const key2 = `${y2}-${m2}-${d2}`;
        if (days.has(key2)) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }
  return streak;
}
