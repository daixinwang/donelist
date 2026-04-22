/**
 * 莫兰迪绿主题调色板（浅色 / 深色两套）。
 * 通过 useThemeColor(token) 或 useAppTheme() 访问。
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#8BA888',
    primarySoft: '#B8CBB4',
    accent: '#6B9080',
    background: '#F5F3EE',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEDE6',
    border: '#E2DFD7',
    text: '#2F3E36',
    textMuted: '#7A8A7F',
    textSubtle: '#9AA69E',
    tint: '#6B9080',
    icon: '#7A8A7F',
    tabIconDefault: '#9AA69E',
    tabIconSelected: '#6B9080',
    success: '#6B9080',
    danger: '#C47A6E',
    tagDefault: '#C9D8C5',
    heatmapEmpty: '#EDF2ED',
    heatmap1: '#C9D8C5',
    heatmap2: '#9EB89A',
    heatmap3: '#728D72',
    heatmap4: '#4A6B53',
  },
  dark: {
    primary: '#A8C0A5',
    primarySoft: '#5C7259',
    accent: '#B8CBB4',
    background: '#1C211E',
    surface: '#262C28',
    surfaceAlt: '#2F3633',
    border: '#3A4340',
    text: '#E8EDE9',
    textMuted: '#A4B0A7',
    textSubtle: '#7A8A7F',
    tint: '#B8CBB4',
    icon: '#A4B0A7',
    tabIconDefault: '#7A8A7F',
    tabIconSelected: '#B8CBB4',
    success: '#A8C0A5',
    danger: '#D49589',
    tagDefault: '#4A5C4B',
    heatmapEmpty: '#2A312D',
    heatmap1: '#3D4E3F',
    heatmap2: '#566C58',
    heatmap3: '#728D72',
    heatmap4: '#9EB89A',
  },
} as const;

export type ThemeName = keyof typeof Colors;
export type ColorToken = keyof typeof Colors.light;

/** Heatmap 5 档分级，取色时按级别索引。 */
export const heatmapScaleTokens: ColorToken[] = [
  'heatmapEmpty',
  'heatmap1',
  'heatmap2',
  'heatmap3',
  'heatmap4',
];

/** 标签默认配色循环（新建标签时按顺序派色）。 */
export const tagColorPalette = [
  '#8BA888',
  '#A8B8C1',
  '#C5A57F',
  '#B89AA6',
  '#9CB3A0',
  '#C1B382',
  '#8AA3B6',
  '#B58F8F',
];

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};
