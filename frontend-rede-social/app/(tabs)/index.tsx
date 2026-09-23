import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoVazio } from '@/components/estado-vazio';
import { PostCard } from '@/components/post-card';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { CATEGORIAS } from '@/src/constants/categorias';
import { alternarCurtida, buscarPosts } from '@/src/services/posts';
import { contarNaoLidas, ouvirNovasNotificacoes } from '@/src/services/notificacoes';
import { Post } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';

export default function FeedScreen() {
  const router = useRouter();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const { usuario } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [naoLidas, setNaoLidas] = useState(0);

    useFocusEffect(
    useCallback(() => {
      if (!usuario) {
        setNaoLidas(0);
        return;
      }
      contarNaoLidas(usuario.id)
        .then(setNaoLidas)
        .catch(() => {});
    }, [usuario])
  );

  useEffect(() => {
    if (!usuario) return;
    return ouvirNovasNotificacoes(usuario.id, () => setNaoLidas((atual) => atual + 1));
  }, [usuario]);

  const carregarPosts = useCallback(
    async (mostrarSpinner = true) => {
      if (mostrarSpinner) setCarregando(true);
      try {
        const dados = await buscarPosts(usuario?.id ?? null, categoriaFiltro);
        setPosts(dados);
      } catch (error) {
        console.error(error);
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [usuario?.id, categoriaFiltro]
  );

  useEffect(() => {
    carregarPosts();
  }, [carregarPosts]);

  async function handleCurtir(postId: string) {
    if (!usuario) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    setPosts((atual) =>
      atual.map((p) =>
        p.id === postId
          ? {
              ...p,
              curtidoPorMim: !p.curtidoPorMim,
              totalCurtidas: p.curtidoPorMim ? p.totalCurtidas - 1 : p.totalCurtidas + 1,
            }
          : p
      )
    );

    try {
      await alternarCurtida(usuario.id, postId, post.curtidoPorMim);
    } catch (error) {
      carregarPosts(false);
    }
  }

  return (
  <SafeAreaView
    style={[styles.container, { backgroundColor: cores.background }]}
    edges={['top']}
  >
    <StatusBar
      barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'}
    />

    <View style={[styles.header, { borderBottomColor: cores.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons
          name="leaf"
          size={18}
          color={cores.secondary}
        />

        <Text
          style={[
            styles.headerTitulo,
            { color: cores.secondary, fontFamily: Fonts.bold }
          ]}
        >
          Verde Real
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14
        }}
      >
        {usuario && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Text
              style={[
                styles.headerSaudacao,
                { color: cores.icon, fontFamily: Fonts.mono }
              ]}
            >
              OLÁ,{' '}
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/perfil')}
              hitSlop={{
                top: 10,
                bottom: 10,
                left: 6,
                right: 6
              }}
            >
              <Text
                style={[
                  styles.headerSaudacao,
                  { color: cores.icon, fontFamily: Fonts.mono }
                ]}
              >
                {usuario.nome.split(' ')[0].toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {usuario && (
          <TouchableOpacity
            onPress={() => router.push('/notificacoes')}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10
            }}
            style={{ position: 'relative' }}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={cores.text}
            />

            {naoLidas > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: cores.danger }
                ]}
              >
                <Text style={styles.badgeTexto}>
                  {naoLidas > 9 ? '9+' : naoLidas}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>

      <FlatList
        horizontal
        style={styles.filtrosLista}
        showsHorizontalScrollIndicator={false}
        data={['Todas', ...CATEGORIAS]}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.filtros}
        renderItem={({ item }) => {
          const ativo = item === 'Todas' ? categoriaFiltro === null : categoriaFiltro === item;
          return (
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: ativo ? cores.tint : 'transparent',
                  borderColor: ativo ? cores.tint : cores.border,
                },
              ]}
              onPress={() => setCategoriaFiltro(item === 'Todas' ? null : item)}>
              <Text style={[styles.chipTexto, { color: ativo ? cores.card : cores.text, fontFamily: Fonts.semibold }]}>
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {carregando ? (
        <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
  <PostCard post={item} onCurtir={handleCurtir} onPress={() => router.push({ pathname: '/denuncia/[id]', params: { id: item.id } })} />
)}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 20, flexGrow: 1 }}
          refreshing={atualizando}
          onRefresh={() => {
            setAtualizando(true);
            carregarPosts(false);
          }}
          ListEmptyComponent={
            <EstadoVazio
              icone="leaf-outline"
              titulo="Nenhuma denúncia por aqui ainda"
              descricao="Seja o primeiro a proteger o meio ambiente da sua região."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitulo: { fontSize: 20 },
  headerSaudacao: { fontSize: 11 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexto: { color: '#fff', fontSize: 9, fontWeight: '700' },
  filtrosLista: { flexGrow: 0, flexShrink: 0, height: 52 },
  filtros: { paddingHorizontal: 15, paddingVertical: 10, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius,
    borderWidth: 1,
    marginRight: 8,
  },
  chipTexto: { fontSize: 11, letterSpacing: 0.5 },
});