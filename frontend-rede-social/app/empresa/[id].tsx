import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { Botao } from '@/src/components/ui/Botao';
import { Emblema } from '@/src/components/ui/Emblema';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { buscarPerfilPorId } from '@/src/services/profile';
import { alternarCurtida, buscarPostsPorEmpresa } from '@/src/services/posts';
import {
  contarSeguidores,
  deixarDeSeguir,
  estaSeguindo,
  seguirEmpresa,
} from '@/src/services/seguidores';
import { Selo, buscarSelosDaEmpresa } from '@/src/services/selos';
import { Post } from '@/src/types';

const NIVEL_LABEL: Record<Selo['nivel'], string> = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro' };
const NIVEL_COR: Record<Selo['nivel'], string> = { bronze: '#B08968', prata: '#9CA8A5', ouro: '#c9a959' };
const STATUS_LABEL: Record<Selo['status'], string> = {
  pendente: 'Pendente',
  ativo: 'Ativo',
  expirado: 'Expirado',
  revogado: 'Revogado',
};

export default function PerfilEmpresaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const router = useRouter();
  const { usuario } = useAuth();

  const [empresa, setEmpresa] = useState<Awaited<ReturnType<typeof buscarPerfilPorId>>>(null);
  const [selos, setSelos] = useState<Selo[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [seguindo, setSeguindo] = useState(false);
  const [totalSeguidores, setTotalSeguidores] = useState(0);
  const [carregandoSeguir, setCarregandoSeguir] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    const [perfil, listaSelos, listaPosts, total] = await Promise.all([
      buscarPerfilPorId(id),
      buscarSelosDaEmpresa(id),
      buscarPostsPorEmpresa(id, usuario?.id ?? null),
      contarSeguidores(id),
    ]);
    setEmpresa(perfil);
    setSelos(listaSelos);
    setPosts(listaPosts);
    setTotalSeguidores(total);
    if (usuario) {
      setSeguindo(await estaSeguindo(usuario.id, id));
    }
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSeguir() {
    if (!usuario || !id) return;
    setCarregandoSeguir(true);
    try {
      if (seguindo) {
        await deixarDeSeguir(usuario.id, id);
        setSeguindo(false);
        setTotalSeguidores((n) => Math.max(0, n - 1));
      } else {
        await seguirEmpresa(usuario.id, id);
        setSeguindo(true);
        setTotalSeguidores((n) => n + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCarregandoSeguir(false);
    }
  }

  async function handleCurtir(postId: string) {
    if (!usuario) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setPosts((atual) =>
      atual.map((p) =>
        p.id === postId
          ? { ...p, curtidoPorMim: !p.curtidoPorMim, totalCurtidas: p.curtidoPorMim ? p.totalCurtidas - 1 : p.totalCurtidas + 1 }
          : p
      )
    );
    try {
      await alternarCurtida(usuario.id, postId, post.curtidoPorMim);
    } catch {
      carregar();
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
        <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!empresa) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
        <Text style={{ color: cores.text, textAlign: 'center', marginTop: 60 }}>Empresa não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const seloAtivo = selos.find((s) => s.status === 'ativo');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={cores.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>Perfil da empresa</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.topo}>
          <View style={[styles.avatar, { backgroundColor: cores.tintSoft, borderColor: cores.border }]}>
            {empresa.avatarUrl ? (
              <Image source={{ uri: empresa.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="business" size={32} color={cores.tint} />
            )}
          </View>
          <Text style={[styles.nome, { color: cores.text, fontFamily: Fonts.bold }]}>
            {empresa.username ? `@${empresa.username}` : empresa.nome}
          </Text>
          {empresa.username && (
            <Text style={[styles.nomeSecundario, { color: cores.icon, fontFamily: Fonts.mono }]}>
              {empresa.nome}
            </Text>
          )}

          <View style={{ marginTop: 10 }}>
            {seloAtivo ? (
              <Emblema
                texto={`Selo ${NIVEL_LABEL[seloAtivo.nivel]}`}
                icone="shield-checkmark-outline"
                corFixa={{ borda: NIVEL_COR[seloAtivo.nivel], texto: NIVEL_COR[seloAtivo.nivel] }}
              />
            ) : (
              <Emblema texto="Sem selo verificado" icone="alert-circle-outline" />
            )}
          </View>

          <Text style={[styles.seguidoresTexto, { color: cores.icon, fontFamily: Fonts.mono }]}>
            {totalSeguidores} {totalSeguidores === 1 ? 'SEGUIDOR' : 'SEGUIDORES'}
          </Text>

          {usuario && usuario.id !== empresa.id && (
            <Botao
              titulo={seguindo ? 'Deixar de seguir' : 'Seguir empresa'}
              onPress={handleSeguir}
              carregando={carregandoSeguir}
              variante={seguindo ? 'secundario' : 'primario'}
              style={{ marginTop: 14, alignSelf: 'stretch', marginHorizontal: 40 }}
            />
          )}
        </View>

        {selos.length > 0 && (
          <View style={styles.selosArea}>
            <Text style={[styles.secaoTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>Histórico de selos</Text>
            {selos.map((s) => (
              <View key={s.id} style={[styles.seloLinha, { borderColor: cores.border }]}>
                <View style={[styles.seloBolinha, { backgroundColor: NIVEL_COR[s.nivel] }]} />
                <Text style={[styles.seloTexto, { color: cores.text, fontFamily: Fonts.semibold }]}>
                  {NIVEL_LABEL[s.nivel]}
                </Text>
                <Text style={[styles.seloStatus, { color: cores.icon, fontFamily: Fonts.mono }]}>
                  {STATUS_LABEL[s.status].toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text
          style={[
            styles.secaoTitulo,
            { color: cores.text, fontFamily: Fonts.bold, marginTop: 18, marginHorizontal: 15 },
          ]}>
          Denúncias vinculadas ({posts.length})
        </Text>

        {posts.length === 0 ? (
          <Text style={[styles.semDados, { color: cores.icon, fontFamily: Fonts.regular }]}>
            Nenhuma denúncia registrada contra esta empresa.
          </Text>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCurtir={handleCurtir}
              onPress={() => router.push({ pathname: '/denuncia/[id]', params: { id: post.id } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitulo: { fontSize: 16 },
  topo: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  nome: { fontSize: 19, marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
  nomeSecundario: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  seguidoresTexto: { fontSize: 10, letterSpacing: 1, marginTop: 8 },
  selosArea: { paddingHorizontal: 15, marginBottom: 10 },
  secaoTitulo: { fontSize: 15, marginBottom: 10 },
  seloLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingVertical: 8 },
  seloBolinha: { width: 10, height: 10, borderRadius: 5 },
  seloTexto: { fontSize: 13, flex: 1 },
  seloStatus: { fontSize: 10, letterSpacing: 0.5 },
  semDados: { fontSize: 13, paddingHorizontal: 15 },
});