import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoVazio } from '@/components/estado-vazio';
import { Cartao } from '@/src/components/ui/Cartao';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { rotuloConquista } from 'verde-real-core';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVoltarAoTopo } from '@/src/components/ui/BotaoVoltarTopo';
import { buscarRanking } from '@/src/services/ranking';
import { RankingItem } from '@/src/types';

const CORES_MEDALHA = ['#c9a959', '#9CA8A5', '#B08968'];

export default function RankingScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const { usuario } = useAuth();
  const topo = useVoltarAoTopo({ naBarraDeAbas: true });

  const [lista, setLista] = useState<RankingItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async (mostrarSpinner = true) => {
    if (mostrarSpinner) setCarregando(true);
    try {
      const dados = await buscarRanking();
      setLista(dados);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="trophy" size={20} color={cores.tint} />
          <Text style={[styles.headerTitulo, { color: cores.tint, fontFamily: Fonts.bold }]}>
            Ranking de Guardiões
          </Text>
        </View>
        <Text style={[styles.headerSubtitulo, { color: cores.icon, fontFamily: Fonts.regular }]}>
          Quem mais denuncia, mais protege o meio ambiente.
        </Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={lista}
          ref={topo.ref}
          onScroll={topo.aoRolar}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 15, flexGrow: 1 }}
          refreshing={atualizando}
          onRefresh={() => {
            setAtualizando(true);
            carregar(false);
          }}
          renderItem={({ item, index }) => {
            const souEu = item.id === usuario?.id;
            const corMedalha = CORES_MEDALHA[index];

            return (
              <View style={styles.linhaWrapper}>
                <Cartao comSombra={index < 3} style={souEu ? { backgroundColor: cores.tintSoft } : undefined}>
                  <View style={styles.linha}>
                    <View
                      style={[
                        styles.posicao,
                        {
                          borderColor: corMedalha ?? cores.border,
                          backgroundColor: corMedalha ? corMedalha : 'transparent',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.posicaoTexto,
                          { color: corMedalha ? '#1e2b2b' : cores.icon, fontFamily: Fonts.bold },
                        ]}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={[styles.avatar, { backgroundColor: cores.tintSoft, borderColor: cores.border }]}>
                      {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                      ) : (
                        <Text style={[styles.avatarIniciais, { color: cores.tint, fontFamily: Fonts.bold }]}>
                          {item.nome.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nome, { color: cores.text, fontFamily: Fonts.semibold }]} numberOfLines={1}>
                        {item.nome}
                        {souEu ? ' (você)' : ''}
                      </Text>
                      <Text style={[styles.selo, { color: cores.icon, fontFamily: Fonts.mono }]}>
                        {rotuloConquista(item.totalDenuncias)}
                      </Text>
                    </View>

                    <Text style={[styles.total, { color: cores.tint, fontFamily: Fonts.bold }]}>
                      {item.totalDenuncias}
                    </Text>
                  </View>
                </Cartao>
              </View>
            );
          }}
          ListEmptyComponent={
            <EstadoVazio
              icone="trophy-outline"
              titulo="O ranking ainda está vazio"
              descricao="Publique a primeira denúncia e apareça aqui!"
            />
          }
        />
      )}
      {topo.botao}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 18, borderBottomWidth: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitulo: { fontSize: 19 },
  headerSubtitulo: { fontSize: 12, marginTop: 4 },
  linhaWrapper: { marginBottom: 12 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  posicao: {
    width: 28,
    height: 28,
    borderRadius: Radius,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posicaoTexto: { fontSize: 13 },
  avatar: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarIniciais: { fontSize: 16 },
  nome: { fontSize: 14 },
  selo: { fontSize: 10, marginTop: 2, letterSpacing: 0.5 },
  total: { fontSize: 18 },
});