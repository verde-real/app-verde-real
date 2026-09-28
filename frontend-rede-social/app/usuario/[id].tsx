import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rotuloConquista } from 'verde-real-core';

import { EstadoVazio } from '@/components/estado-vazio';
import { PostCard } from '@/components/post-card';
import { Botao } from '@/src/components/ui/Botao';
import { Emblema } from '@/src/components/ui/Emblema';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { contarPublicacoes } from '@/src/services/estatisticas';
import { buscarPerfilPorId } from '@/src/services/profile';
import { alternarCurtida, buscarPostsPorAutor } from '@/src/services/posts';
import { contarSeguidores, deixarDeSeguir, estaSeguindo, seguirEmpresa } from '@/src/services/seguidores';
import { Post } from '@/src/types';

/**
 * Perfil PÚBLICO de qualquer usuário (cliente ou empresa). Aberto pelo nome do
 * autor no feed e pela lista "Seguindo" — é a MESMA tela nos dois caminhos.
 */
export default function PerfilPublicoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const router = useRouter();
  const { usuario } = useAuth();

  const [perfil, setPerfil] = useState<Awaited<ReturnType<typeof buscarPerfilPorId>>>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalSeguidores, setTotalSeguidores] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [seguindo, setSeguindo] = useState(false);
  const [carregandoSeguir, setCarregandoSeguir] = useState(false);

  const ehMeuProprioPerfil = !!usuario && !!id && usuario.id === id;

  const carregar = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    const [dadosPerfil, listaPosts, publicacoes, seguidores] = await Promise.all([
      buscarPerfilPorId(id),
      buscarPostsPorAutor(id, usuario?.id ?? null),
      contarPublicacoes(id),
      contarSeguidores(id),
    ]);
    setPerfil(dadosPerfil);
    setPosts(listaPosts);
    setTotalPosts(publicacoes);
    setTotalSeguidores(seguidores);
    if (usuario && !ehMeuProprioPerfil) {
      setSeguindo(await estaSeguindo(usuario.id, id));
    }
    setCarregando(false);
  }, [id, usuario, ehMeuProprioPerfil]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSeguir() {
    if (!usuario || !id || ehMeuProprioPerfil) return;
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

  function handlePostAtualizado(postAtualizado: Post) {
    setPosts((atual) => atual.map((p) => (p.id === postAtualizado.id ? postAtualizado : p)));
  }

  function handlePostExcluido(postId: string) {
    setPosts((atual) => atual.filter((p) => p.id !== postId));
    setTotalPosts((atual) => Math.max(0, atual - 1));
  }

  if (carregando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
        <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!perfil) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
        <View style={[styles.header, { borderBottomColor: cores.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={cores.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>Perfil</Text>
          <View style={{ width: 22 }} />
        </View>
        <Text style={{ color: cores.text, textAlign: 'center', marginTop: 60 }}>Usuário não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const ehEmpresa = perfil.tipo === 'empresa' || perfil.tipo === 'empresa_selo';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={cores.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>Perfil</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.topo}>
          <View style={[styles.avatar, { backgroundColor: cores.tintSoft, borderColor: cores.border }]}>
            {perfil.avatarUrl ? (
              <Image source={{ uri: perfil.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarIniciais, { color: cores.tint, fontFamily: Fonts.bold }]}>
                {perfil.nome.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <Text style={[styles.nome, { color: cores.text, fontFamily: Fonts.bold }]}>
            {perfil.username ? `@${perfil.username}` : perfil.nome}
          </Text>
          {perfil.username && (
            <Text style={[styles.nomeSecundario, { color: cores.icon, fontFamily: Fonts.mono }]}>{perfil.nome}</Text>
          )}

          <View style={styles.badges}>
            <Emblema texto={ehEmpresa ? 'Empresa' : 'Consumidor'} icone={ehEmpresa ? 'business-outline' : 'person-outline'} />
            {!ehEmpresa && (
              <Emblema texto={rotuloConquista(totalPosts)} icone="ribbon-outline" variante="destaque" />
            )}
          </View>

          <Text style={[styles.seguidoresTexto, { color: cores.icon, fontFamily: Fonts.mono }]}>
            {totalSeguidores} {totalSeguidores === 1 ? 'SEGUIDOR' : 'SEGUIDORES'}
          </Text>

          {usuario && !ehMeuProprioPerfil && (
            <Botao
              titulo={seguindo ? 'Seguindo' : 'Seguir'}
              onPress={handleSeguir}
              carregando={carregandoSeguir}
              variante={seguindo ? 'secundario' : 'primario'}
              style={{ marginTop: 14, alignSelf: 'stretch', marginHorizontal: 40 }}
            />
          )}
        </View>

        <Text
          style={[
            styles.secaoTitulo,
            { color: cores.text, fontFamily: Fonts.bold, marginTop: 8, marginHorizontal: 15 },
          ]}>
          Publicações ({posts.length})
        </Text>

        {posts.length === 0 ? (
          <EstadoVazio icone="megaphone-outline" titulo="Nenhuma publicação ainda" descricao="As denúncias publicadas por este usuário vão aparecer aqui." />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCurtir={handleCurtir}
              onPress={() => router.push({ pathname: '/denuncia/[id]', params: { id: post.id } })}
              usuarioLogadoId={usuario?.id}
              onAtualizado={handlePostAtualizado}
              onExcluido={handlePostExcluido}
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
  avatarIniciais: { fontSize: 30 },
  nome: { fontSize: 19, marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
  nomeSecundario: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  seguidoresTexto: { fontSize: 10, letterSpacing: 1, marginTop: 10 },
  secaoTitulo: { fontSize: 15, marginBottom: 10 },
});