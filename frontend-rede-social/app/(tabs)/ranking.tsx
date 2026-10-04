import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoVazio } from '@/components/estado-vazio';
import { GraficoPizza } from '@/components/ranking/grafico-pizza';
import { GuiaConsumidor } from '@/components/ranking/guia-consumidor';
import { ListaClassificacao } from '@/components/ranking/lista-classificacao';
import { OrgaosDenuncia } from '@/components/ranking/orgaos-denuncia';
import { Participante } from '@/components/ranking/participante';
import { Podio } from '@/components/ranking/podio';
import { TituloSecao } from '@/components/ranking/titulo-secao';
import { Cartao } from '@/src/components/ui/Cartao';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { useVoltarAoTopo } from '@/src/components/ui/BotaoVoltarTopo';
import { CORES_CATEGORIA } from '@/src/constants/categorias';
import { buscarRanking } from '@/src/services/ranking';
import { buscarDenunciasPorCategoria, buscarPerfisDoRanking, FatiaCategoria } from '@/src/services/ranking-extras';

// Quantos itens do ranking geral são lidos antes de filtrar só os consumidores.
const LIMITE_LEITURA = 100;

export default function RankingScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const { usuario } = useAuth();
  const router = useRouter();
  const topo = useVoltarAoTopo({ naBarraDeAbas: true });

  const [consumidores, setConsumidores] = useState<Participante[]>([]);
  const [fatias, setFatias] = useState<FatiaCategoria[] | null>(null);
  const [erroGrafico, setErroGrafico] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregarRanking = useCallback(async () => {
    try {
      const dados = await buscarRanking(LIMITE_LEITURA);
      // Só consumidores entram na classificação: o tipo vem de `profiles`.
      // Quem não tiver perfil localizado não pode ser confirmado como consumidor e fica de fora.
      const perfis = await buscarPerfisDoRanking(dados.map((d) => d.id));
      const apenasConsumidores: Participante[] = dados
        .filter((d) => perfis.get(d.id)?.tipo === 'cliente')
        .map((d) => ({ ...d, username: perfis.get(d.id)?.username ?? null }))
        .sort((a, b) => b.totalDenuncias - a.totalDenuncias);
      setConsumidores(apenasConsumidores);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const carregarGrafico = useCallback(async () => {
    try {
      setFatias(await buscarDenunciasPorCategoria());
      setErroGrafico(false);
    } catch (error) {
      console.error(error);
      setErroGrafico(true);
    }
  }, []);

  const carregar = useCallback(
    async (mostrarSpinner = true) => {
      if (mostrarSpinner) setCarregando(true);
      await Promise.all([carregarRanking(), carregarGrafico()]);
      setCarregando(false);
      setAtualizando(false);
    },
    [carregarRanking, carregarGrafico]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirPerfil = useCallback(
    (id: string) => router.push({ pathname: '/usuario/[id]', params: { id } }),
    [router]
  );

  const podio = consumidores.slice(0, 3);
  const classificacao = consumidores.slice(3, 10);

  const totalDenuncias = (fatias ?? []).reduce((soma, f) => soma + f.total, 0);
  const fatiasPizza = (fatias ?? []).map((f) => ({
    rotulo: f.categoria,
    total: f.total,
    cor: CORES_CATEGORIA[f.categoria],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <View style={[styles.headerIcone, { borderColor: cores.accent }]}>
          <Ionicons name="trophy" size={20} color={cores.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.mono }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityRole="header">
            Ranking de Guardiões
          </Text>
          <View style={[styles.headerTraco, { backgroundColor: cores.accent }]} />
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: cores.background }}>
        {carregando ? (
          <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            ref={topo.ref}
            onScroll={topo.aoRolar}
            scrollEventThrottle={16}
            contentContainerStyle={styles.conteudo}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={() => {
                  setAtualizando(true);
                  carregar(false);
                }}
                tintColor={cores.tint}
              />
            }>
            {/* BLOCO 1 — Pódio e classificação */}
            <View style={styles.bloco}>
              <TituloSecao
                icone="ribbon-outline"
                titulo="Consumidores em destaque"
                subtitulo="Consumidores com mais denúncias publicadas no Verde Real."
              />
              {consumidores.length === 0 ? (
                <EstadoVazio
                  icone="trophy-outline"
                  titulo="O ranking ainda está vazio"
                  descricao="Publique a primeira denúncia e apareça aqui!"
                />
              ) : (
                <View style={styles.espacoInterno}>
                  <Podio participantes={podio} idUsuarioAtual={usuario?.id} aoAbrirPerfil={abrirPerfil} />
                  {classificacao.length > 0 && (
                    <ListaClassificacao
                      participantes={classificacao}
                      posicaoInicial={4}
                      idUsuarioAtual={usuario?.id}
                      aoAbrirPerfil={abrirPerfil}
                    />
                  )}
                </View>
              )}
            </View>

            {/* BLOCO 2 — Tendências e alertas */}
            <View style={styles.bloco}>
              <TituloSecao
                icone="pie-chart-outline"
                titulo="Tendências & Alertas"
                subtitulo="Setores mais denunciados: distribuição das denúncias registradas no Verde Real por categoria."
              />
              <Cartao comSombra={false}>
                {erroGrafico ? (
                  <Text style={[styles.mensagem, { color: cores.icon, fontFamily: Fonts.regular }]}>
                    Não foi possível carregar os dados das denúncias. Puxe a tela para baixo para tentar novamente.
                  </Text>
                ) : totalDenuncias === 0 ? (
                  <Text style={[styles.mensagem, { color: cores.icon, fontFamily: Fonts.regular }]}>
                    Os dados das denúncias ainda são insuficientes para gerar esta visualização.
                  </Text>
                ) : (
                  <>
                    <GraficoPizza fatias={fatiasPizza} />
                    <Text style={[styles.totalGrafico, { color: cores.icon, fontFamily: Fonts.mono }]}>
                      Total: {totalDenuncias} {totalDenuncias === 1 ? 'denúncia publicada' : 'denúncias publicadas'}
                    </Text>
                  </>
                )}
              </Cartao>
            </View>

            {/* BLOCO 3 — Central de conscientização */}
            <View style={styles.bloco}>
              <GuiaConsumidor />
            </View>

            {/* BLOCO 4 — Órgãos reguladores e denúncia formal */}
            <View style={styles.bloco}>
              <OrgaosDenuncia />
            </View>
          </ScrollView>
        )}
      </View>
      {topo.botao}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerIcone: { width: 40, height: 40, borderWidth: 2, borderRadius: Radius, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { fontSize: 18 },
  headerTraco: { width: 40, height: 3, marginTop: 6 },
  conteudo: { padding: 18, paddingTop: 28, paddingBottom: 56, gap: 52 },
  bloco: {},
  espacoInterno: { gap: 20 },
  mensagem: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  totalGrafico: { fontSize: 11, textAlign: 'center', marginTop: 16 },
});