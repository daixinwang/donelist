import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'muted' | 'caption';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const mutedColor = useThemeColor({}, 'textMuted');
  const subtleColor = useThemeColor({}, 'textSubtle');
  const linkColor = useThemeColor({}, 'accent');

  const color =
    type === 'muted' ? mutedColor :
    type === 'caption' ? subtleColor :
    type === 'link' ? linkColor :
    textColor;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'muted' ? styles.muted : undefined,
        type === 'caption' ? styles.caption : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontSize: 16, lineHeight: 22 },
  defaultSemiBold: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '700', lineHeight: 32 },
  subtitle: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  link: { fontSize: 16, lineHeight: 22 },
  muted: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
});
