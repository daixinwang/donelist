import { useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useAppTheme } from '@/hooks/use-theme-color';

type Props = {
  onSubmit: (text: string) => void | Promise<void>;
  placeholder?: string;
};

export function QuickInputBar({
  onSubmit,
  placeholder = '记下刚刚完成的事…',
}: Props) {
  const { colors } = useAppTheme();
  const haptics = useHaptics();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    haptics.success();
    await onSubmit(trimmed);
    setText('');
    Keyboard.dismiss();
  };

  const canSubmit = text.trim().length > 0;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}>
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        returnKeyType="done"
        style={[styles.input, { color: colors.text }]}
        blurOnSubmit={false}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: canSubmit ? colors.accent : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityLabel="完成">
        <IconSymbol name="checkmark" size={22} color={colors.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
