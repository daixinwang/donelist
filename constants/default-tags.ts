import { tagColorPalette } from '@/constants/theme';

export const defaultTags = [
  { name: '工作', color: tagColorPalette[0], sortOrder: 0 },
  { name: '学习', color: tagColorPalette[1], sortOrder: 1 },
  { name: '健康', color: tagColorPalette[2], sortOrder: 2 },
  { name: '娱乐', color: tagColorPalette[3], sortOrder: 3 },
] as const;
