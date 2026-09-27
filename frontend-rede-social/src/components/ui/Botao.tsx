import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BotaoProps {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'perigo';
  carregando?: boolean;
  desabilitado?: boolean;
  style?: ViewStyle;
}

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  carregando = false,
  desabilitado = false,
  style,
}: BotaoProps) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];

  // Importante: o botão "secundario" (ex.: "Cancelar") usa fundo opaco
  // (cores.card) em vez de transparente e um texto que nunca é a mesma
  // cor da borda. Isso evita o bug em que o texto "Cancelar" ficava
  // invisível (fundo transparente + borda e texto na mesma cor podiam
  // se misturar dependendo do tema/composição do Android).
  const corFundo =
    variante === 'primario' ? cores.tint : variante === 'perigo' ? cores.danger : cores.card;
  const corTexto = variante === 'secundario' ? cores.text : cores.card;
  const corBorda = variante === 'perigo' ? cores.danger : cores.tint;

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.sombra, { backgroundColor: cores.shadow }]} />
      <Pressable
        onPress={onPress}
        disabled={desabilitado || carregando}
        style={({ pressed }) => [
          styles.botao,
          {
            backgroundColor: corFundo,
            borderColor: corBorda,
            transform: pressed
              ? [{ translateX: 2 }, { translateY: 2 }]
              : [{ translateX: 0 }, { translateY: 0 }],
            opacity: desabilitado ? 0.5 : 1,
          },
        ]}>
        {carregando ? (
          <ActivityIndicator color={corTexto} />
        ) : (
          <Text
            style={[styles.texto, { color: corTexto, fontFamily: Fonts.bold }]}
            numberOfLines={1}
            allowFontScaling={false}>
            {titulo}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  sombra: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    borderRadius: Radius,
  },
  botao: {
    borderWidth: 2,
    borderRadius: Radius,
    paddingVertical: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontSize: 13,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    includeFontPadding: false, // Android: evita corte/"sumiço" do texto com fontes customizadas
    textAlignVertical: 'center',
  },
});