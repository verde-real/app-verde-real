import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Marca, Radius } from '@/constants/theme';

const LIMITE_ROLAGEM = 150; // px rolados para o botão aparecer

interface BotaoProps {
  visivel: boolean;
  onPress: () => void;
  /** true dentro das abas: a barra de abas já cuida da área segura inferior */
  naBarraDeAbas?: boolean;
  /** espaço extra embaixo (ex.: telas com campo de texto fixo) */
  margemExtra?: number;
}

export function BotaoVoltarTopo({ visivel, onPress, naBarraDeAbas = false, margemExtra = 0 }: BotaoProps) {
  const insets = useSafeAreaInsets();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visivel ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visivel, anim]);

  return (
    <Animated.View
      accessibilityElementsHidden={!visivel}
      importantForAccessibility={visivel ? 'auto' : 'no-hide-descendants'}
      style={[
        styles.container,
        {
          bottom: 16 + margemExtra + (naBarraDeAbas ? 0 : insets.bottom),
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.85] }),
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          pointerEvents: visivel ? 'auto' : 'none',
        },
      ]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Voltar ao topo"
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={styles.botao}>
        <Ionicons name="chevron-up" size={20} color={Marca.heroText} />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface Opcoes {
  naBarraDeAbas?: boolean;
  margemExtra?: number;
}

/**
 * Uso na tela:
 *   const topo = useVoltarAoTopo();
 *   <FlatList ref={topo.ref} onScroll={topo.aoRolar} scrollEventThrottle={16} ... />
 *   {topo.botao}   // como último filho do container da tela
 */
export function useVoltarAoTopo(opcoes?: Opcoes) {
  // any: serve tanto para FlatList quanto para ScrollView
  const ref = useRef<any>(null);
  const [visivel, setVisivel] = useState(false);

  const aoRolar = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const deveMostrar = e.nativeEvent.contentOffset.y > LIMITE_ROLAGEM;
    setVisivel((atual) => (atual === deveMostrar ? atual : deveMostrar));
  }, []);

  const voltarAoTopo = useCallback(() => {
    const lista = ref.current;
    if (!lista) return;
    if (typeof lista.scrollToOffset === 'function') lista.scrollToOffset({ offset: 0, animated: true });
    else if (typeof lista.scrollTo === 'function') lista.scrollTo({ y: 0, animated: true });
  }, []);

  const botao = (
    <BotaoVoltarTopo
      visivel={visivel}
      onPress={voltarAoTopo}
      naBarraDeAbas={opcoes?.naBarraDeAbas}
      margemExtra={opcoes?.margemExtra}
    />
  );

  return { ref, aoRolar, botao };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    zIndex: 50,
    elevation: 12,
  },
  botao: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Marca.heroBg,
    borderRadius: Radius,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
});