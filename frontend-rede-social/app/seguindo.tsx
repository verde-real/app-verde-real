import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PerfilSeguido } from 'verde-real-core';

import { EstadoVazio } from '@/components/estado-vazio';
import { Cartao } from '@/src/components/ui/Cartao';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { buscarSeguindo } from '@/src/services/seguidores';

/**
 * Lista de quem o usuário logado está seguindo. Cada linha abre o MESMO
 * perfil público usado a partir do feed (`app/usuario/[id].tsx`).
 */
export default function SeguindoScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const router = useRouter();
  const { usuario } = useAuth();

  const [lista, setLista] = useState<PerfilSeguido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const dados = await buscarSeguindo(usuario.id);
      setLista(dados);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar essa lista.');
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={cores.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>Seguindo</Text>
        <View style={{ width: 22 }} />
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 40 }} />
      ) : erro ? (
        <Text style={{ color: cores.danger, textAlign: 'center', marginTop: 40, fontFamily: Fonts.regular }}>
          {erro}
        </Text>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 15, flexGrow: 1 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: item.id } })}>
              <Cartao style={styles.linha} comSombra={false}>
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
                  </Text>
                  {item.username && (
                    <Text style={[styles.username, { color: cores.icon, fontFamily: Fonts.mono }]} numberOfLines={1}>
                      @{item.username}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={cores.icon} />
              </Cartao>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EstadoVazio
              icone="people-outline"
              titulo="Você ainda não segue ninguém"
              descricao="Perfis que você seguir vão aparecer aqui."
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitulo: { fontSize: 16 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, padding: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarIniciais: { fontSize: 17 },
  nome: { fontSize: 14 },
  username: { fontSize: 11, marginTop: 1 },
});