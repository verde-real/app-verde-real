import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Props {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  subtitulo?: string;
}

/** Título padrão dos blocos da aba Ranking. */
export function TituloSecao({ icone, titulo, subtitulo }: Props) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  // Ícone com contraste: creme sobre o verde (claro) e verde-escuro sobre o dourado (escuro).
  const corIcone = scheme === 'dark' ? cores.background : '#faf4eb';

  return (
    <View style={styles.container}>
      <View style={styles.linha}>
        <View style={[styles.caixaIcone, { backgroundColor: cores.tint }]}>
          <Ionicons name={icone} size={22} color={corIcone} />
        </View>
        <View style={styles.textos}>
          <Text style={[styles.titulo, { color: cores.text, fontFamily: Fonts.bold }]} accessibilityRole="header">
            {titulo}
          </Text>
          <View style={[styles.traco, { backgroundColor: cores.accent }]} />
        </View>
      </View>
      {subtitulo ? (
        <Text style={[styles.subtitulo, { color: cores.icon, fontFamily: Fonts.regular }]}>{subtitulo}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  caixaIcone: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius },
  textos: { flex: 1 },
  titulo: { fontSize: 20, lineHeight: 26 },
  traco: { width: 44, height: 3, marginTop: 6 },
  subtitulo: { fontSize: 13, lineHeight: 19, marginTop: 12 },
});