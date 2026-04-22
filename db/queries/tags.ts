import { getDb } from '@/db/client';
import { type Tag, type TagRow, toTag } from '@/db/types';

export async function listTags(): Promise<Tag[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TagRow>(
    'SELECT * FROM tags ORDER BY sort_order ASC, id ASC'
  );
  return rows.map(toTag);
}

export async function createTag(
  name: string,
  color: string | null
): Promise<Tag> {
  const db = await getDb();
  const maxRow = await db.getFirstAsync<{ m: number | null }>(
    'SELECT MAX(sort_order) AS m FROM tags'
  );
  const sortOrder = (maxRow?.m ?? -1) + 1;
  const res = await db.runAsync(
    'INSERT INTO tags (name, color, sort_order) VALUES (?, ?, ?)',
    [name, color, sortOrder]
  );
  return { id: res.lastInsertRowId, name, color, sortOrder };
}

export async function updateTag(
  id: number,
  patch: { name?: string; color?: string | null; sortOrder?: number }
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (patch.name !== undefined) {
    sets.push('name = ?');
    args.push(patch.name);
  }
  if (patch.color !== undefined) {
    sets.push('color = ?');
    args.push(patch.color);
  }
  if (patch.sortOrder !== undefined) {
    sets.push('sort_order = ?');
    args.push(patch.sortOrder);
  }
  if (sets.length === 0) return;
  args.push(id);
  await db.runAsync(`UPDATE tags SET ${sets.join(', ')} WHERE id = ?`, args);
}

export async function deleteTag(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
}
