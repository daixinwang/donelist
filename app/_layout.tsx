import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { getDb } from '@/db/client';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDoneStore } from '@/store/use-done-store';
import { useTagStore } from '@/store/use-tag-store';

export const unstable_settings = {
  anchor: '(tabs)',
};

const buildNavTheme = (base: typeof DefaultTheme, scheme: 'light' | 'dark') => {
  const palette = Colors[scheme];
  return {
    ...base,
    colors: {
      ...base.colors,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      primary: palette.primary,
      notification: palette.accent,
    },
  };
};

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';
  const navTheme =
    scheme === 'dark'
      ? buildNavTheme(DarkTheme, 'dark')
      : buildNavTheme(DefaultTheme, 'light');

  useEffect(() => {
    (async () => {
      await getDb();
      await useTagStore.getState().refresh();
      await useDoneStore.getState().refresh();
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="item/[id]"
            options={{
              presentation: 'modal',
              title: '编辑已办',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
