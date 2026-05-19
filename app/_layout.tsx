import 'react-native-get-random-values';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { ClimatePulseDark } from '../constants/paper-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
      <PaperProvider theme={ClimatePulseDark}>
        <ThemeProvider value={DarkTheme}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: ClimatePulseDark.colors.surface },
              headerTintColor: ClimatePulseDark.colors.onSurface,
              contentStyle: { backgroundColor: ClimatePulseDark.colors.background },
              headerTitleStyle: { fontFamily: 'Sora_700Bold' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Crisis Details' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </PaperProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
