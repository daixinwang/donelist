import { View, type ViewProps } from 'react-native';

import { type ColorToken } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  token?: ColorToken;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  token = 'background',
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, token);
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
