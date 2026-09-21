import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { AtividadeDia } from '@/src/services/estatisticas';

const ALTURA_MIN = 6;
const ALTURA_MAX = 84;

export function GraficoSemanal({ dados }: { dados: AtividadeDia[] }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const maior = Math.max(1, ...dados.map((d) => d.total));

  return (
    <View style={styles.container}>
      {dados.map((d) => {
        const altura = d.total === 0 ? ALTURA_MIN : ALTURA_MIN + (d.total / maior) * (ALTURA_MAX - ALTURA_MIN);
        return (
          <View key={d.dia} style={styles.coluna}>
            <Text style={[styles.valor, { color: cores.icon, fontFamily: Fonts.mono }]}>{d.total}</Text>
            <View style={styles.barraArea}>
              <View
                style={[
                  styles.barra,
                  {
                    height: altura,
                    backgroundColor: d.total > 0 ? cores.text : cores.border,
                    borderRadius: Radius,
                  },
                ]}
              />
            </View>
            <Text style={[styles.dia, { color: cores.icon, fontFamily: Fonts.mono }]}>{d.dia}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between' },
  coluna: { alignItems: 'center', flex: 1, gap: 6 },
  barraArea: { height: ALTURA_MAX, justifyContent: 'flex-end' },
  barra: { width: 16 },
  valor: { fontSize: 10 },
  dia: { fontSize: 10, letterSpacing: 0.5 },
});
