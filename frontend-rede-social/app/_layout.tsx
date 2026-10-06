import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ToastProvider } from '@/src/components/ui/Toast';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/contexts/AuthContext';

export const unstable_settings = {
  anchor: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="escolher-username" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="denuncia/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="empresa/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="usuario/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="seguindo" options={{ headerShown: false }} />
            <Stack.Screen name="notificacoes" options={{ headerShown: false }} />
            <Stack.Screen name="solicitar-selo-form" options={{ headerShown: false }} />
            <Stack.Screen name="termos" options={{ headerShown: false }} />
            <Stack.Screen name="redefinir-senha" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}