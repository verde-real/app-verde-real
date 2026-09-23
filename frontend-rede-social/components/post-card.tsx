import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Emblema } from '@/src/components/ui/Emblema';
import { Cartao } from '@/src/components/ui/Cartao';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post } from '@/src/types';

const STATUS_LABEL: Record<Post['status'], string> = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  resolvida: 'Resolvida',
  rejeitada: 'Rejeitada',
};

function formatarData(iso: string) {
  const data = new Date(iso);
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function PostCard({
  post,
  onCurtir,
  onPress,
}: {
  post: Post;
  onCurtir: (id: string) => void;
  onPress?: () => void;
}) {
  const router = useRouter();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];

  return (
    <TouchableOpacity style={styles.wrapper} activeOpacity={0.85} onPress={onPress} disabled={!onPress}>
      <Cartao style={styles.card}>
        <View style={styles.cabecalho}>
          <View style={[styles.avatar, { backgroundColor: cores.tintSoft, borderColor: cores.border }]}>
            {post.autor.avatarUrl ? (
              <Image source={{ uri: post.autor.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarIniciais, { color: cores.tint, fontFamily: Fonts.bold }]}>
                {post.autor.nome.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.autor, { color: cores.text, fontFamily: Fonts.semibold }]} numberOfLines={1}>
              {post.autor.nome}
            </Text>
            <Text style={[styles.data, { color: cores.icon, fontFamily: Fonts.mono }]}>
              {formatarData(post.criadoEm)}
            </Text>
          </View>
        </View>

        <View style={styles.tags}>
          <Emblema texto={post.categoria} />
          <Emblema texto={STATUS_LABEL[post.status]} variante={post.status === 'resolvida' ? 'destaque' : 'padrao'} />
        </View>

        {post.empresa && (
          <TouchableOpacity
            style={[styles.empresaTag, { borderColor: cores.danger }]}
            onPress={() => router.push({ pathname: '/empresa/[id]', params: { id: post.empresa!.id } })}>
            <Ionicons name="business-outline" size={13} color={cores.danger} />
            <Text style={[styles.empresaTexto, { color: cores.danger, fontFamily: Fonts.semibold }]}>
              Sobre: {post.empresa.nome}
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.conteudo, { color: cores.text, fontFamily: Fonts.regular }]}>{post.conteudo}</Text>

        {post.midiaUrl && post.tipoMidia === 'imagem' && (
          <Image source={{ uri: post.midiaUrl }} style={[styles.midia, { borderRadius: Radius }]} contentFit="cover" />
        )}

        {post.midiaUrl && post.tipoMidia === 'video' && (
          <View style={[styles.midia, styles.videoPlaceholder, { borderRadius: Radius }]}>
            <Ionicons name="play-circle" size={40} color="#fff" />
            <Text style={[styles.videoTexto, { fontFamily: Fonts.semibold }]}>Vídeo anexado</Text>
          </View>
        )}

        {post.latitude != null && post.longitude != null && (
          <View style={styles.localizacao}>
            <Ionicons name="location-outline" size={14} color={cores.icon} />
            <Text style={[styles.localizacaoTexto, { color: cores.icon, fontFamily: Fonts.mono }]}>
              {post.latitude.toFixed(4)}, {post.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        <View style={styles.acoesLinha}>
          <TouchableOpacity
            style={styles.curtirBotao}
            onPress={() => onCurtir(post.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={post.curtidoPorMim ? 'heart' : 'heart-outline'}
              size={20}
              color={post.curtidoPorMim ? cores.danger : cores.icon}
            />
            <Text style={[styles.curtirTexto, { color: cores.icon, fontFamily: Fonts.semibold }]}>
              {post.totalCurtidas} {post.totalCurtidas === 1 ? 'apoio' : 'apoios'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.comentarBotao}
            onPress={() =>
              router.push({ pathname: '/denuncia/[id]', params: { id: post.id, foco: 'comentario' } })
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chatbubble-outline" size={19} color={cores.icon} />
            <Text style={[styles.curtirTexto, { color: cores.icon, fontFamily: Fonts.semibold }]}>Comentar</Text>
          </TouchableOpacity>
        </View>
      </Cartao>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 15, marginBottom: 16 },
  card: { padding: 14 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarIniciais: { fontSize: 16 },
  autor: { fontSize: 15 },
  data: { fontSize: 10 },
  tags: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  empresaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  empresaTexto: { fontSize: 11 },
  conteudo: { fontSize: 15, lineHeight: 21, marginBottom: 10 },
  midia: { width: '100%', height: 180, marginBottom: 10 },
  videoPlaceholder: { backgroundColor: '#1c1c1e', alignItems: 'center', justifyContent: 'center', gap: 6 },
  videoTexto: { color: '#fff', fontSize: 13 },
  localizacao: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  localizacaoTexto: { fontSize: 12 },
  acoesLinha: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  curtirBotao: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  comentarBotao: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  curtirTexto: { fontSize: 13 },
});