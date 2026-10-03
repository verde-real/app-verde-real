import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useRef, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Marca, Radius } from '@/constants/theme';

type TipoToast = 'sucesso' | 'erro' | 'aviso' | 'info';

interface Opcoes {
  titulo?: string;
  duracao?: number; // ms
}

interface ToastDados {
  tipo: TipoToast;
  mensagem: string;
  titulo?: string;
}

interface ToastApi {
  sucesso: (mensagem: string, opcoes?: Opcoes) => void;
  erro: (mensagem: string, opcoes?: Opcoes) => void;
  aviso: (mensagem: string, opcoes?: Opcoes) => void;
  info: (mensagem: string, opcoes?: Opcoes) => void;
  esconder: () => void;
}

// Mesmas cores das mensagens do site (login)
const VISUAL: Record<TipoToast, { icone: keyof typeof Ionicons.glyphMap; cor: string; fundo: string }> = {
  sucesso: { icone: 'checkmark-circle', cor: '#2e7d32', fundo: '#e8f5e9' },
  erro: { icone: 'alert-circle', cor: Marca.danger, fundo: '#ffebee' },
  aviso: { icone: 'warning', cor: '#8a5a00', fundo: '#fff8e1' },
  info: { icone: 'information-circle', cor: '#1565c0', fundo: '#e3f2fd' },
};

// No web não existe driver nativo de animação
const USAR_DRIVER_NATIVO = Platform.OS !== 'web';
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastDados | null>(null);
  const [anim] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const esconder = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: USAR_DRIVER_NATIVO,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [anim]);

  const mostrar = useCallback(
    (tipo: TipoToast, mensagem: string, opcoes?: Opcoes) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ tipo, mensagem, titulo: opcoes?.titulo });
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: USAR_DRIVER_NATIVO,
      }).start();
      AccessibilityInfo.announceForAccessibility(opcoes?.titulo ? `${opcoes.titulo}. ${mensagem}` : mensagem);
      timer.current = setTimeout(esconder, opcoes?.duracao ?? (tipo === 'erro' ? 6000 : 4500));
    },
    [anim, esconder]
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      sucesso: (m, o) => mostrar('sucesso', m, o),
      erro: (m, o) => mostrar('erro', m, o),
      aviso: (m, o) => mostrar('aviso', m, o),
      info: (m, o) => mostrar('info', m, o),
      esconder,
    }),
    [mostrar, esconder]
  );

  const visual = toast ? VISUAL[toast.tipo] : null;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && visual && (
        <Animated.View
          style={[
            styles.container,
            {
              pointerEvents: 'box-none',
              top: insets.top + 12,
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}>
          <View
            accessibilityRole="alert"
            style={[styles.card, { backgroundColor: visual.fundo, borderLeftColor: visual.cor }]}>
            <Ionicons name={visual.icone} size={22} color={visual.cor} style={{ marginTop: 1 }} />
            <View style={styles.textos}>
              {toast.titulo ? (
                <Text style={[styles.titulo, { color: visual.cor, fontFamily: Fonts.semibold }]}>{toast.titulo}</Text>
              ) : null}
              <Text style={[styles.mensagem, { color: visual.cor, fontFamily: Fonts.regular }]}>
                {toast.mensagem}
              </Text>
            </View>
            <TouchableOpacity
              onPress={esconder}
              accessibilityRole="button"
              accessibilityLabel="Fechar mensagem"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={18} color={visual.cor} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast precisa estar dentro de <ToastProvider> (veja app/_layout.tsx).');
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderLeftWidth: 5,
    borderRadius: Radius,
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)',
  },
  textos: { flex: 1 },
  titulo: { fontSize: 14, marginBottom: 2 },
  mensagem: { fontSize: 13, lineHeight: 18 },
});