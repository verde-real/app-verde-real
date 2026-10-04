import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { rotuloConquista } from 'verde-real-core';

import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Participante, nomeExibicao } from './participante';

// Mesmas cores de medalha que já eram usadas na aba Ranking.
export const CORES_MEDALHA = ['#c9a959', '#9CA8A5', '#B08968'];
const ROTULO_POSICAO = ['1º lugar, ouro', '2º lugar, prata', '3º lugar, bronze'];
const ICONE_POSICAO: (keyof typeof Ionicons.glyphMap)[] = ['trophy', 'medal', 'medal'];
const ALTURA_PEDESTAL = [76, 56, 40];
const TAMANHO_AVATAR = [76, 60, 60];

interface Props {
  participantes: Participante[]; // até 3, já em ordem de classificação
  idUsuarioAtual?: string;
  aoAbrirPerfil: (id: string) => void;
}

export function Podio({ participantes, idUsuarioAtual, aoAbrirPerfil }: Props) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];

  // Ordem visual: 2º, 1º, 3º. Só renderiza as posições que realmente existem.
  const ordemVisual = [1, 0, 2].filter((indice) => participantes[indice]);

  return (
    <View style={styles.container}>
      {ordemVisual.map((indice) => {
        const p = participantes[indice];
        const medalha = CORES_MEDALHA[indice];
        const tamanho = TAMANHO_AVATAR[indice];
        const souEu = p.id === idUsuarioAtual;

        return (
          <View key={p.id} style={styles.coluna}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => aoAbrirPerfil(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`${ROTULO_POSICAO[indice]}: ${nomeExibicao(p)}. Abrir perfil público`}
              style={styles.identificacao}>
              <Ionicons name={ICONE_POSICAO[indice]} size={indice === 0 ? 26 : 20} color={medalha} />

              <View
                style={[
                  styles.avatar,
                  {
                    width: tamanho,
                    height: tamanho,
                    borderColor: medalha,
                    borderWidth: indice === 0 ? 3 : 2,
                    backgroundColor: cores.tintSoft,
                  },
                ]}>
                {p.avatarUrl ? (
                  <Image source={{ uri: p.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.iniciais, { color: cores.tint, fontFamily: Fonts.bold, fontSize: tamanho / 2.4 }]}>
                    {p.nome.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <Text style={[styles.nome, { color: cores.text, fontFamily: Fonts.semibold }]} numberOfLines={1}>
                {nomeExibicao(p)}
                {souEu ? ' (você)' : ''}
              </Text>
              <Text style={[styles.nivel, { color: cores.icon, fontFamily: Fonts.mono }]} numberOfLines={1}>
                {rotuloConquista(p.totalDenuncias)}
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.pedestal,
                { height: ALTURA_PEDESTAL[indice], backgroundColor: medalha, borderColor: medalha },
              ]}>
              <Text style={[styles.posicao, { fontFamily: Fonts.bold }]}>{indice + 1}º</Text>
              <Text style={[styles.total, { fontFamily: Fonts.mono }]}>
                {p.totalDenuncias} {p.totalDenuncias === 1 ? 'denúncia' : 'denúncias'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  coluna: { flex: 1, alignItems: 'stretch' },
  identificacao: { alignItems: 'center', gap: 6, paddingBottom: 8 },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: Radius },
  avatarImg: { width: '100%', height: '100%' },
  iniciais: {},
  nome: { fontSize: 12, textAlign: 'center', maxWidth: '100%' },
  nivel: { fontSize: 9, letterSpacing: 0.4, textAlign: 'center' },
  pedestal: {
    borderWidth: 1,
    borderRadius: Radius,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  posicao: { fontSize: 18, color: '#1e2b2b' },
  total: { fontSize: 9, color: '#1e2b2b' },
});