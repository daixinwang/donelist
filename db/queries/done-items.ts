import { getDb } from '@/db/client';
import {
  type DoneItem,
  type DoneItemRow,
  type TagRow,
  toDoneItem,
  toTag,
} from '@/db/types';

const DEFAULT_DURATION_MS = 30 * 60 * 1000;

export async function createDoneItem(params: {
  content: string;
  startedAt?: number;
  completedAt?: number;
  tagIds?: number[];
}): Promise<DoneItem> {
  const db = await getDb();
  const now = Date.now();
  const completedAt = params.completedAt ?? now;
  const startedAt = params.startedAt ?? completedAt - DEFAULT_DURATION_MS;
  const res = await db.runAsync(
    'INSERT INTO done_items (content, started_at, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [params.content.trim(), startedAt, completedAt, now, now]
  );
  const id = res.lastInsertRowId;

  if (params.tagIds && params.tagIds.length > 0) {
    for (const tagId of params.tagIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO done_tags (done_id, tag_id) VALUES (?, ?)',
        [id, tagId]
      );
    }
  }

  return (await getDoneItem(id))!;
}

export async function getDoneItem(id: number): Promise<DoneItem | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DoneItemRow>(
    'SELECT * FROM done_items WHERE id = ?',
    [id]
  );
  if (!row) return null;
  const tags = await listTagsForDone(id);
  return toDoneItem(row, tags);
}

async function listTagsForDone(doneId: number) {
  const db = await getDb();
  const rows = await db.getAllAsync<TagRow>(
    `SELECT t.* FROM tags t
     INNER JOIN done_tags dt ON dt.tag_id = t.id
     WHERE dt.done_id = ?
     ORDER BY t.sort_order ASC`,
    [doneId]
  );
  return rows.map(toTag);
}

export async function listDoneItems(params?: {
  limit?: number;
  offset?: number;
}): Promise<DoneItem[]> {
  const db = await getDb();
  const limit = params?.limit ?? 200;
  const offset = params?.offset ?? 0;
  const rows = await db.getAllAsync<DoneItemRow>(
    'SELECT * FROM done_items ORDER BY completed_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  return hydrateWithTags(rows);
}

export async function listDoneItemsInRange(
  fromMs: number,
  toMs: number
): Promise<DoneItem[]> {
  const db = await getDb();
  // Return any item whose [startedAt, completedAt] interval overlaps [fromMs, toMs).
  const rows = await db.getAllAsync<DoneItemRow>(
    `SELECT * FROM done_items
     WHERE completed_at >= ? AND started_at < ?
     ORDER BY started_at ASC`,
    [fromMs, toMs]
  );
  return hydrateWithTags(rows);
}

/**
 * Items whose completed_at falls within [fromMs, toMs). Differs from
 * listDoneItemsInRange (which uses interval overlap) — this one is
 * what stats need when attributing a task to the day it was finished.
 */
export async function listDoneItemsByCompletion(
  fromMs: number,
  toMs: number
): Promise<DoneItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DoneItemRow>(
    `SELECT * FROM done_items
     WHERE completed_at >= ? AND completed_at < ?
     ORDER BY completed_at ASC`,
    [fromMs, toMs]
  );
  return hydrateWithTags(rows);
}

async function hydrateWithTags(rows: DoneItemRow[]): Promise<DoneItem[]> {
  const db = await getDb();
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const tagRows = await db.getAllAsync<TagRow & { done_id: number }>(
    `SELECT dt.done_id AS done_id, t.*
     FROM done_tags dt
     INNER JOIN tags t ON t.id = dt.tag_id
     WHERE dt.done_id IN (${placeholders})
     ORDER BY t.sort_order ASC`,
    ids
  );
  const byDone = new Map<number, ReturnType<typeof toTag>[]>();
  for (const tr of tagRows) {
    const arr = byDone.get(tr.done_id) ?? [];
    arr.push(toTag(tr));
    byDone.set(tr.done_id, arr);
  }
  return rows.map((r) => toDoneItem(r, byDone.get(r.id) ?? []));
}

export async function updateDoneItem(
  id: number,
  patch: {
    content?: string;
    startedAt?: number;
    completedAt?: number;
    tagIds?: number[];
  }
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const sets: string[] = ['updated_at = ?'];
  const args: (string | number)[] = [now];
  if (patch.content !== undefined) {
    sets.push('content = ?');
    args.push(patch.content.trim());
  }
  if (patch.startedAt !== undefined) {
    sets.push('started_at = ?');
    args.push(patch.startedAt);
  }
  if (patch.completedAt !== undefined) {
    sets.push('completed_at = ?');
    args.push(patch.completedAt);
  }
  args.push(id);
  await db.runAsync(`UPDATE done_items SET ${sets.join(', ')} WHERE id = ?`, args);

  if (patch.tagIds !== undefined) {
    await db.runAsync('DELETE FROM done_tags WHERE done_id = ?', [id]);
    for (const tagId of patch.tagIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO done_tags (done_id, tag_id) VALUES (?, ?)',
        [id, tagId]
      );
    }
  }
}

export async function deleteDoneItem(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM done_items WHERE id = ?', [id]);
}

export async function countAllDoneItems(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM done_items'
  );
  return row?.c ?? 0;
}
