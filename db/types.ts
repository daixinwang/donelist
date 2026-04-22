export type Tag = {
  id: number;
  name: string;
  color: string | null;
  sortOrder: number;
};

export type DoneItem = {
  id: number;
  content: string;
  completedAt: number;
  createdAt: number;
  updatedAt: number;
  tags: Tag[];
};

export type DoneItemRow = {
  id: number;
  content: string;
  completed_at: number;
  created_at: number;
  updated_at: number;
};

export type TagRow = {
  id: number;
  name: string;
  color: string | null;
  sort_order: number;
};

export const toTag = (r: TagRow): Tag => ({
  id: r.id,
  name: r.name,
  color: r.color,
  sortOrder: r.sort_order,
});

export const toDoneItem = (r: DoneItemRow, tags: Tag[]): DoneItem => ({
  id: r.id,
  content: r.content,
  completedAt: r.completed_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  tags,
});
