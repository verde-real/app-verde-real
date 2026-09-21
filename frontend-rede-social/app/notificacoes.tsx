import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  buscarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  ouvirNovasNotificacoes,
} from '@/src/services/notificacoes';
import { Notificacao, TipoNotificacao } from '@/src/types';

const ICONE_POR_TIPO: Record<TipoNotificacao, keyof typeof Ionicons.glyphMap> = {
  curtida: 'heart',
  comentario: 'chatbubble',
  status_denuncia: 'flag',
  selo_empresa: 'ribbon',
};

function formatarTempo(criadoEm: string): string {
  const diffMs = Date.now() - new Date(criadoEm).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas}h`;
  const dias = Math.floor(horas / 24);
  return `${dias}d`;
}

export default function NotificacoesScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const router = useRouter();
  const { usuario } = useAuth();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    try {
      const dados = await buscarNotificacoes(usuario.id);
      setNotificacoes(dados);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

    useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!usuario?.id) return;

    const unsubscribe = ouvirNovasNotificacoes(usuario.id, (novaNotificacao) => {
        setNotificacoes((prev) => [novaNotificacao, ...prev]);
    });

    return () => {
        unsubscribe();
    };
    }, [usuario?.id]);

  async function handleTocar(notificacao: Notificacao) {
    if (!notificacao.lida) {
      setNotificacoes((atual) =>
        atual.map((n) => (n.id === notificacao.id ? { ...n, lida: true } : n))
      );
      marcarComoLida(notificacao.id).catch(() => {});
    }

    if (notificacao.tipo === 'selo_empresa' && notificacao.empresaId) {
      router.push({ pathname: '/empresa/[id]', params: { id: String(notificacao.empresaId) } });
    } else if (notificacao.postId) {
      router.push({ pathname: '/denuncia/[id]', params: { id: String(notificacao.postId) } });
    }
  }

  async function handleMarcarTodas() {
    if (!usuario) return;
    setNotificacoes((atual) => atual.map((n) => ({ ...n, lida: true })));
    try {
      await marcarTodasComoLidas(usuario.id);
    } catch (error) {
      console.error(error);
    }
  }

  const temNaoLida = notificacoes.some((n) => !n.lida);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={cores.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>Notificações</Text>
        <TouchableOpacity onPress={handleMarcarTodas} disabled={!temNaoLida}>
          <Text
            style={[
              styles.marcarTodas,
              { color: temNaoLida ? cores.tint : cores.icon, fontFamily: Fonts.semibold },
            ]}>
            LER TUDO
          </Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notificacoes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.linha,
                { borderBottomColor: cores.border, backgroundColor: item.lida ? 'transparent' : cores.tintSoft },
              ]}
              onPress={() => handleTocar(item)}>
              <View style={[styles.iconeCirculo, { backgroundColor: cores.card, borderColor: cores.border }]}>
                <Ionicons name={ICONE_POR_TIPO[item.tipo]} size={16} color={cores.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mensagem, { color: cores.text, fontFamily: Fonts.regular }]}>
                  {item.mensagem}
                </Text>
                <Text style={[styles.tempo, { color: cores.icon, fontFamily: Fonts.mono }]}>
                  {formatarTempo(item.criadoEm)}
                </Text>
              </View>
              {!item.lida && <View style={[styles.pontoNaoLido, { backgroundColor: cores.tint }]} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EstadoVazio
              icone="notifications-outline"
              titulo="Nenhuma notificação ainda"
              descricao="Curtidas, comentários e novidades de empresas que você segue aparecem aqui."
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
  headerTitulo: { fontSize: 16 },
  marcarTodas: { fontSize: 10, letterSpacing: 0.8 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconeCirculo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mensagem: { fontSize: 13.5, lineHeight: 18 },
  tempo: { fontSize: 10, marginTop: 4 },
  pontoNaoLido: { width: 8, height: 8, borderRadius: 4 },
});