// Android / Web fallback for SF Symbols → Material Icons.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'checkmark.circle.fill': 'check-circle',
  'checkmark': 'check',
  'chart.bar.fill': 'bar-chart',
  'gearshape.fill': 'settings',
  'plus': 'add',
  'trash': 'delete',
  'pencil': 'edit',
  'tag.fill': 'label',
  'xmark': 'close',
  'square.and.arrow.up': 'ios-share',
  'square.and.arrow.down': 'file-download',
  'moon.fill': 'nightlight-round',
  'sun.max.fill': 'wb-sunny',
  'sparkles': 'auto-awesome',
  'flame.fill': 'local-fire-department',
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
