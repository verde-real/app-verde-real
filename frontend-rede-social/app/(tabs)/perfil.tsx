import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GraficoSemanal } from '@/components/grafico-semanal';
import { EstadoVazio } from '@/components/estado-vazio';
import { PostCard } from '@/components/post-card';
import { Botao } from '@/src/components/ui/Botao';
import { Cartao } from '@/src/components/ui/Cartao';
import { Emblema } from '@/src/components/ui/Emblema';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { rotuloConquista } from '@/src/constants/categorias';
import { useAuth } from '@/src/contexts/AuthContext';
import { atualizarAvatar } from '@/src/services/profile';
import { alternarCurtida, buscarPostsCurtidosPorMim, buscarPostsPorAutor } from '@/src/services/posts';
import { contarSeguidores, contarSeguindo } from '@/src/services/seguidores';
import { AtividadeDia, buscarAtividadeSemanal, contarCurtidasRecebidas, contarPublicacoes } from '@/src/services/estatisticas';
import { enviarMidia } from '@/src/services/upload';
import { Post } from '@/src/types';

type Aba = 'publicacoes' | 'salvos' | 'curtidas';

export default function PerfilScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const router = useRouter();
  const { usuario, sair, atualizarUsuario } = useAuth();

  const [enviandoAvatar, setEnviandoAvatar] = useState(false);

  // Métricas + gráfico semanal
  const [carregandoMetricas, setCarregandoMetricas] = useState(true);
  const [erroMetricas, setErroMetricas] = useState<string | null>(null);
  const [totalPublicacoes, setTotalPublicacoes] = useState(0);
  const [totalCurtidasRecebidas, setTotalCurtidasRecebidas] = useState(0);
  const [totalSeguirRelacao, setTotalSeguirRelacao] = useState(0);
  const [atividade, setAtividade] = useState<AtividadeDia[]>([]);

  // Navegação de conteúdo (aba ativa) + cache por aba
  const [abaAtiva, setAbaAtiva] = useState<Aba>('publicacoes');
  const [cacheConteudo, setCacheConteudo] = useState<Partial<Record<Aba, Post[]>>>({});
  const [carregandoConteudo, setCarregandoConteudo] = useState(true);
  const [erroConteudo, setErroConteudo] = useState<string | null>(null);

  const nomeDeUsuario = useMemo(() => {
    if (!usuario?.email) return null;
    return `@${usuario.email.split('@')[0]}`;
  }, [usuario?.email]);

  const carregarMetricas = useCallback(async () => {
    if (!usuario) return;
    setCarregandoMetricas(true);
    setErroMetricas(null);
    try {
      const [publicacoes, curtidasRecebidas, seguirRelacao, atividadeSemana] = await Promise.all([
        contarPublicacoes(usuario.id),
        contarCurtidasRecebidas(usuario.id),
        usuario.tipo === 'empresa' ? contarSeguidores(usuario.id) : contarSeguindo(usuario.id),
        buscarAtividadeSemanal(usuario.id),
      ]);
      setTotalPublicacoes(publicacoes);
      setTotalCurtidasRecebidas(curtidasRecebidas);
      setTotalSeguirRelacao(seguirRelacao);
      setAtividade(atividadeSemana);
    } catch (error) {
      setErroMetricas(error instanceof Error ? error.message : 'Não foi possível carregar suas estatísticas.');
    } finally {
      setCarregandoMetricas(false);
    }
  }, [usuario]);

  const carregarConteudo = useCallback(
    async (aba: Aba, forcar = false) => {
      if (!usuario) return;
      if (aba === 'salvos') {
        setCarregandoConteudo(false);
        setErroConteudo(null);
        return;
      }
      if (!forcar && cacheConteudo[aba]) {
        setCarregandoConteudo(false);
        setErroConteudo(null);
        return;
      }

      setCarregandoConteudo(true);
      setErroConteudo(null);
      try {
        const dados =
          aba === 'publicacoes'
            ? await buscarPostsPorAutor(usuario.id, usuario.id)
            : await buscarPostsCurtidosPorMim(usuario.id);
        setCacheConteudo((atual) => ({ ...atual, [aba]: dados }));
      } catch (error) {
        setErroConteudo(error instanceof Error ? error.message : 'Não foi possível carregar essa lista.');
      } finally {
        setCarregandoConteudo(false);
      }
    },
    [usuario, cacheConteudo]
  );

  useEffect(() => {
    carregarMetricas();
  }, [carregarMetricas]);

  useEffect(() => {
    carregarConteudo(abaAtiva);
  }, [abaAtiva, carregarConteudo]);

  async function handleTrocarAvatar() {
    if (!usuario) return;

    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Preciso de acesso às suas fotos para trocar o avatar.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (resultado.canceled || resultado.assets.length === 0) return;

    const imagem = resultado.assets[0];
    setEnviandoAvatar(true);
    try {
      const nomeArquivo = imagem.fileName ?? `avatar.${imagem.uri.split('.').pop()}`;
      const contentType = imagem.mimeType ?? 'image/jpeg';
      const url = await enviarMidia(usuario.id, imagem.uri, nomeArquivo, contentType);
      await atualizarAvatar(usuario.id, url);
      atualizarUsuario({ avatarUrl: url });
    } catch (error) {
      Alert.alert('Ops', error instanceof Error ? error.message : 'Não foi possível trocar o avatar.');
    } finally {
      setEnviandoAvatar(false);
    }
  }

  function handleSair() {
    Alert.alert('Sair da conta', 'Tem certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await sair();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  async function handleCurtir(postId: string) {
    if (!usuario) return;
    const listaAtual = cacheConteudo[abaAtiva] ?? [];
    const post = listaAtual.find((p) => p.id === postId);
    if (!post) return;

    const listaAtualizada = listaAtual.map((p) =>
      p.id === postId
        ? { ...p, curtidoPorMim: !p.curtidoPorMim, totalCurtidas: p.curtidoPorMim ? p.totalCurtidas - 1 : p.totalCurtidas + 1 }
        : p
    );
    setCacheConteudo((atual) => ({ ...atual, [abaAtiva]: listaAtualizada }));

    try {
      await alternarCurtida(usuario.id, postId, post.curtidoPorMim);
      if (abaAtiva !== 'publicacoes') {
        contarCurtidasRecebidas(usuario.id).then(setTotalCurtidasRecebidas).catch(() => {});
      }
    } catch (error) {
      carregarConteudo(abaAtiva, true);
    }
  }
  
  function handlePostAtualizado(postAtualizado: Post) {
    setCacheConteudo((atual) => ({
      ...atual,
      [abaAtiva]: (atual[abaAtiva] ?? []).map((p) => (p.id === postAtualizado.id ? postAtualizado : p)),
    }));
  }

  function handlePostExcluido(postId: string) {
    setCacheConteudo((atual) => ({
      ...atual,
      [abaAtiva]: (atual[abaAtiva] ?? []).filter((p) => p.id !== postId),
    }));
    setTotalPublicacoes((atual) => Math.max(0, atual - 1));
  }

  if (!usuario) return null;

  const labelSeguirRelacao = usuario.tipo === 'empresa' ? 'Seguidores' : 'Seguindo';

  const listaAtiva = cacheConteudo[abaAtiva] ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Cabeçalho */}
        <View style={styles.topo}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: cores.tintSoft, borderColor: cores.border }]}
            onPress={handleTrocarAvatar}
            disabled={enviandoAvatar}>
            {enviandoAvatar ? (
              <ActivityIndicator color={cores.tint} />
            ) : usuario.avatarUrl ? (
              <Image source={{ uri: usuario.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarIniciais, { color: cores.tint, fontFamily: Fonts.bold }]}>
                {usuario.nome.charAt(0).toUpperCase()}
              </Text>
            )}
            <View style={[styles.editarIcone, { backgroundColor: cores.tint }]}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.nome, { color: cores.text, fontFamily: Fonts.bold }]}>{usuario.nome}</Text>
          {nomeDeUsuario && (
            <Text style={[styles.arroba, { color: cores.icon, fontFamily: Fonts.mono }]}>{nomeDeUsuario}</Text>
          )}

          <View style={styles.badges}>
            <Emblema
              texto={usuario.tipo === 'empresa' ? 'Empresa' : 'Consumidor'}
              icone={usuario.tipo === 'empresa' ? 'business-outline' : 'person-outline'}
            />
            {usuario.tipo === 'cliente' && (
              <Emblema texto={rotuloConquista(totalPublicacoes)} icone="ribbon-outline" variante="destaque" />
            )}
          </View>
        </View>

        {/* Métricas */}
        {erroMetricas ? (
          <Cartao style={{ marginHorizontal: 20 }}>
            <Text style={{ color: cores.danger, fontFamily: Fonts.semibold, marginBottom: 8 }}>{erroMetricas}</Text>
            <Botao titulo="Tentar novamente" variante="secundario" onPress={carregarMetricas} />
          </Cartao>
        ) : (
          <View style={styles.metricasLinha}>
            <MetricaCard
              icone="megaphone-outline"
              valor={totalPublicacoes}
              label="Publicações"
              carregando={carregandoMetricas}
            />
            <MetricaCard
              icone="people-outline"
              valor={totalSeguirRelacao}
              label={labelSeguirRelacao}
              carregando={carregandoMetricas}
            />
            <MetricaCard
              icone="heart-outline"
              valor={totalCurtidasRecebidas}
              label="Curtidas"
              carregando={carregandoMetricas}
            />
          </View>
        )}

        {/* Gráfico de atividade semanal */}
        <Cartao style={{ marginHorizontal: 20, marginTop: 16 }}>
          <Text style={[styles.secaoTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>
            Atividade nos últimos 7 dias
          </Text>
          {carregandoMetricas ? (
            <ActivityIndicator color={cores.tint} style={{ paddingVertical: 30 }} />
          ) : atividade.every((d) => d.total === 0) ? (
            <Text style={[styles.semAtividade, { color: cores.icon, fontFamily: Fonts.regular }]}>
              Você ainda não teve atividade nos últimos 7 dias.
            </Text>
          ) : (
            <GraficoSemanal dados={atividade} />
          )}
        </Cartao>

        {/* Navegação do conteúdo, alinhada à direita */}
        <View style={styles.navConteudoLinha}>
          <Text style={[styles.secaoTitulo, { color: cores.text, fontFamily: Fonts.bold, marginBottom: 0 }]}>
            Meus conteúdos
          </Text>
          <View style={styles.navIcones}>
            <AbaIcone
              ativo={abaAtiva === 'publicacoes'}
              icone="grid-outline"
              onPress={() => setAbaAtiva('publicacoes')}
              cores={cores}
            />
            <AbaIcone
              ativo={abaAtiva === 'salvos'}
              icone="bookmark-outline"
              onPress={() => setAbaAtiva('salvos')}
              cores={cores}
            />
            <AbaIcone
              ativo={abaAtiva === 'curtidas'}
              icone="heart-outline"
              onPress={() => setAbaAtiva('curtidas')}
              cores={cores}
            />
          </View>
        </View>

        {/* Conteúdo da aba selecionada */}
        {abaAtiva === 'salvos' ? (
          <EstadoVazio
            icone="bookmark-outline"
            titulo="Salvos ainda não está disponível"
            descricao="Este app ainda não tem uma função para salvar publicações. Em breve você poderá guardar denúncias aqui para ver depois."
          />
        ) : carregandoConteudo ? (
          <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 30 }} />
        ) : erroConteudo ? (
          <Cartao style={{ marginHorizontal: 20 }}>
            <Text style={{ color: cores.danger, fontFamily: Fonts.semibold, marginBottom: 8 }}>{erroConteudo}</Text>
            <Botao titulo="Tentar novamente" variante="secundario" onPress={() => carregarConteudo(abaAtiva, true)} />
          </Cartao>
        ) : listaAtiva.length === 0 ? (
          <EstadoVazio
            icone={abaAtiva === 'publicacoes' ? 'megaphone-outline' : 'heart-outline'}
            titulo={
              abaAtiva === 'publicacoes' ? 'Você ainda não possui publicações.' : 'Você ainda não curtiu nenhuma publicação.'
            }
            descricao={
              abaAtiva === 'publicacoes'
                ? 'Suas denúncias e posts vão aparecer aqui.'
                : 'As denúncias que você curtir vão aparecer aqui.'
            }
          />
        ) : (
          listaAtiva.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCurtir={handleCurtir}
              onPress={() => router.push({ pathname: '/denuncia/[id]', params: { id: post.id } })}
              usuarioLogadoId={usuario.id}
              onAtualizado={handlePostAtualizado}
              onExcluido={handlePostExcluido}
            />
          ))
        )}

        <Botao titulo="Sair da conta" onPress={handleSair} variante="perigo" style={{ marginTop: 24, marginHorizontal: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricaCard({
  icone,
  valor,
  label,
  carregando,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  valor: number;
  label: string;
  carregando: boolean;
}) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];

  return (
    <Cartao style={styles.metricaCartao} comSombra={false}>
      <Ionicons name={icone} size={18} color={cores.tint} />
      {carregando ? (
        <ActivityIndicator color={cores.tint} style={{ marginTop: 6 }} />
      ) : (
        <Text style={[styles.metricaValor, { color: cores.text, fontFamily: Fonts.bold }]}>{valor}</Text>
      )}
      <Text style={[styles.metricaLabel, { color: cores.icon, fontFamily: Fonts.mono }]}>{label.toUpperCase()}</Text>
    </Cartao>
  );
}

function AbaIcone({
  ativo,
  icone,
  onPress,
  cores,
}: {
  ativo: boolean;
  icone: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  cores: typeof Colors.light;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.abaIconeBotao,
        { borderColor: ativo ? cores.tint : cores.border, backgroundColor: ativo ? cores.tintSoft : 'transparent' },
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Ionicons name={icone} size={18} color={ativo ? cores.tint : cores.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topo: { alignItems: 'center', marginTop: 16, marginBottom: 20, paddingHorizontal: 20 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarIniciais: { fontSize: 32 },
  editarIcone: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nome: { fontSize: 19, marginTop: 12 },
  arroba: { fontSize: 12, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
   metricasLinha: {
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     gap: 14,
     paddingHorizontal: 20,
     flexWrap: 'wrap',
   },
   metricaCartao: {
     flexGrow: 0,
     flexShrink: 1,
     minWidth: 92,
     maxWidth: 120,
     alignItems: 'center',
     paddingVertical: 14,
     paddingHorizontal: 12,
   },
  metricaValor: { fontSize: 20, marginTop: 6 },
  metricaLabel: { fontSize: 9, letterSpacing: 0.5, marginTop: 2 },
  secaoTitulo: { fontSize: 15, marginBottom: 10 },
  semAtividade: { fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  navConteudoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  navIcones: { flexDirection: 'row', gap: 8 },
  abaIconeBotao: {
    width: 34,
    height: 34,
    borderRadius: Radius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
