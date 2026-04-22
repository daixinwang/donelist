import { create } from 'zustand';
import {
  createTag,
  deleteTag,
  listTags,
  updateTag,
} from '@/db/queries/tags';
import type { Tag } from '@/db/types';

type TagState = {
  tags: Tag[];
  loaded: boolean;
  refresh: () => Promise<void>;
  add: (name: string, color: string | null) => Promise<Tag>;
  update: (
    id: number,
    patch: { name?: string; color?: string | null; sortOrder?: number }
  ) => Promise<void>;
  remove: (id: number) => Promise<void>;
};

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  loaded: false,

  refresh: async () => {
    const tags = await listTags();
    set({ tags, loaded: true });
  },

  add: async (name, color) => {
    const tag = await createTag(name, color);
    await get().refresh();
    return tag;
  },

  update: async (id, patch) => {
    await updateTag(id, patch);
    await get().refresh();
  },

  remove: async (id) => {
    await deleteTag(id);
    await get().refresh();
  },
}));
