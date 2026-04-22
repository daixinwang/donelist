import { create } from 'zustand';
import {
  createDoneItem,
  deleteDoneItem,
  listDoneItems,
  updateDoneItem,
} from '@/db/queries/done-items';
import type { DoneItem } from '@/db/types';

type DoneState = {
  items: DoneItem[];
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  add: (params: {
    content: string;
    startedAt?: number;
    completedAt?: number;
    tagIds: number[];
  }) => Promise<DoneItem>;
  update: (
    id: number,
    patch: {
      content?: string;
      startedAt?: number;
      completedAt?: number;
      tagIds?: number[];
    }
  ) => Promise<void>;
  remove: (id: number) => Promise<void>;
};

export const useDoneStore = create<DoneState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const items = await listDoneItems({ limit: 500 });
      set({ items, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  add: async (params) => {
    const item = await createDoneItem(params);
    set({ items: [item, ...get().items] });
    return item;
  },

  update: async (id, patch) => {
    await updateDoneItem(id, patch);
    await get().refresh();
  },

  remove: async (id) => {
    await deleteDoneItem(id);
    set({ items: get().items.filter((i) => i.id !== id) });
  },
}));
