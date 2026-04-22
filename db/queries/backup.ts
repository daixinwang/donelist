import { getDb } from '@/db/client';
import type { DoneItemRow, TagRow } from '@/db/types';

export type BackupPayload = {
  version: 1;
  exportedAt: number;
  tags: TagRow[];
  items: (DoneItemRow & { tag_ids: number[] })[];
};

export async function exportAll(): Promise<BackupPayload> {
  const db = await getDb();
  const tags = await db.getAllAsync<TagRow>(
    'SELECT * FROM tags ORDER BY sort_order ASC, id ASC'
  );
  const items = await db.getAllAsync<DoneItemRow>(
    'SELECT * FROM done_items ORDER BY completed_at ASC'
  );
  const links = await db.getAllAsync<{ done_id: number; tag_id: number }>(
    'SELECT done_id, tag_id FROM done_tags'
  );
  const byDone = new Map<number, number[]>();
  for (const l of links) {
    const arr = byDone.get(l.done_id) ?? [];
    arr.push(l.tag_id);
    byDone.set(l.done_id, arr);
  }
  return {
    version: 1,
    exportedAt: Date.now(),
    tags,
    items: items.map((it) => ({ ...it, tag_ids: byDone.get(it.id) ?? [] })),
  };
}

export async function wipeAll(): Promise<void> {
  const db = await getDb();
  await db.execAsync(
    'DELETE FROM done_tags; DELETE FROM done_items; DELETE FROM tags;'
  );
}

export async function importAll(payload: BackupPayload): Promise<{
  importedItems: number;
  importedTags: number;
}> {
  if (payload.version !== 1) {
    throw new Error('不支持的备份文件版本');
  }
  const db = await getDb();

  await db.execAsync('BEGIN');
  try {
    await db.execAsync(
      'DELETE FROM done_tags; DELETE FROM done_items; DELETE FROM tags;'
    );
    for (const t of payload.tags) {
      await db.runAsync(
        'INSERT INTO tags (id, name, color, sort_order) VALUES (?, ?, ?, ?)',
        [t.id, t.name, t.color, t.sort_order]
      );
    }
    for (const it of payload.items) {
      await db.runAsync(
        'INSERT INTO done_items (id, content, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [it.id, it.content, it.completed_at, it.created_at, it.updated_at]
      );
      for (const tagId of it.tag_ids) {
        await db.runAsync(
          'INSERT OR IGNORE INTO done_tags (done_id, tag_id) VALUES (?, ?)',
          [it.id, tagId]
        );
      }
    }
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }

  return { importedItems: payload.items.length, importedTags: payload.tags.length };
}
