import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { precisaEscolherUsername } from 'verde-real-core';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';

export default function Index() {
  const { usuario, carregando } = useAuth();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.background }}>
        <ActivityIndicator size="large" color={cores.tint} />
      </View>
    );
  }

  if (!usuario) return <Redirect href="/(auth)/login" />;
  if (precisaEscolherUsername(usuario)) return <Redirect href="/escolher-username" />;
  return <Redirect href="/(tabs)" />;
}