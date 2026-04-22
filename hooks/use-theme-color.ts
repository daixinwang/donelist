import { Colors, type ColorToken } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorToken
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];
  return colorFromProps ?? Colors[theme][colorName];
}

export function useAppTheme() {
  const scheme = useColorScheme() ?? 'light';
  return { scheme, colors: Colors[scheme] };
}
