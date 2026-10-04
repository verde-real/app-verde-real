import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rotuloConquista } from 'verde-real-core';

import { Cartao } from '@/src/components/ui/Cartao';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Participante, nomeExibicao } from './participante';

interface Props {
  participantes: Participante[]; // 4º ao 10º
  posicaoInicial: number; // 4
  idUsuarioAtual?: string;
  aoAbrirPerfil: (id: string) => void;
}

export function ListaClassificacao({ participantes, posicaoInicial, idUsuarioAtual, aoAbrirPerfil }: Props) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];

  return (
    <Cartao comSombra={false} style={styles.cartao}>
      {participantes.map((p, i) => {
        const souEu = p.id === idUsuarioAtual;
        const ultimo = i === participantes.length - 1;
        return (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.7}
            onPress={() => aoAbrirPerfil(p.id)}
            accessibilityRole="button"
            accessibilityLabel={`${posicaoInicial + i}º lugar: ${nomeExibicao(p)}. Abrir perfil público`}
            style={[
              styles.linha,
              { borderBottomColor: cores.border, borderBottomWidth: ultimo ? 0 : 1 },
              souEu && { backgroundColor: cores.tintSoft },
            ]}>
            <Text style={[styles.posicao, { color: cores.icon, fontFamily: Fonts.bold }]}>{posicaoInicial + i}º</Text>

            <View style={[styles.avatar, { backgroundColor: cores.tintSoft, borderColor: cores.border }]}>
              {p.avatarUrl ? (
                <Image source={{ uri: p.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.iniciais, { color: cores.tint, fontFamily: Fonts.bold }]}>
                  {p.nome.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.nome, { color: cores.text, fontFamily: Fonts.semibold }]} numberOfLines={1}>
                {nomeExibicao(p)}
                {souEu ? ' (você)' : ''}
              </Text>
              <Text style={[styles.nivel, { color: cores.icon, fontFamily: Fonts.mono }]}>
                {rotuloConquista(p.totalDenuncias)}
              </Text>
            </View>

            <Text style={[styles.total, { color: cores.tint, fontFamily: Fonts.bold }]}>{p.totalDenuncias}</Text>
          </TouchableOpacity>
        );
      })}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: 0 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12 },
  posicao: { width: 26, fontSize: 13 },
  avatar: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: Radius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  iniciais: { fontSize: 14 },
  nome: { fontSize: 13 },
  nivel: { fontSize: 9, marginTop: 1, letterSpacing: 0.4 },
  total: { fontSize: 15 },
});