import { getDb } from '@/db/client';

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
