import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { Botao } from '@/src/components/ui/Botao';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { Comentario, buscarComentarios, criarComentario } from '@/src/services/comentarios';
import { alternarCurtida, buscarPostPorId } from '@/src/services/posts';
import { Post, StatusDenuncia } from '@/src/types';

const ETAPAS: StatusDenuncia[] = ['recebida', 'em_analise', 'resolvida'];
const ETAPA_LABEL: Record<StatusDenuncia, string> = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  resolvida: 'Resolvida',
  rejeitada: 'Rejeitada',
};

export default function DetalheDenunciaScreen() {
  const { id, foco } = useLocalSearchParams<{ id: string; foco?: string }>();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const router = useRouter();
  const { usuario } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState('');
  const inputComentarioRef = useRef<TextInput>(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    const [p, c] = await Promise.all([buscarPostPorId(id, usuario?.id ?? null), buscarComentarios(id)]);
    setPost(p);
    setComentarios(c);
    setCarregando(false);
  }, [id, usuario?.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

    useEffect(() => {
    if (foco === 'comentario' && !carregando) {
      const timer = setTimeout(() => inputComentarioRef.current?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [foco, carregando]);

  async function handleCurtir() {
    if (!usuario || !post) return;
    const curtidoAntes = post.curtidoPorMim;
    setPost({
      ...post,
      curtidoPorMim: !curtidoAntes,
      totalCurtidas: curtidoAntes ? post.totalCurtidas - 1 : post.totalCurtidas + 1,
    });
    try {
      await alternarCurtida(usuario.id, post.id, curtidoAntes);
    } catch {
      carregar();
    }
  }

  async function handleEnviarComentario() {
    if (!usuario || !post || !texto.trim()) return;
    setEnviando(true);
    try {
      await criarComentario(post.id, usuario.id, texto.trim());
      setTexto('');
      const novos = await buscarComentarios(post.id);
      setComentarios(novos);
    } catch (error) {
      console.error(error);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
        <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]}>
        <Text style={{ color: cores.text, textAlign: 'center', marginTop: 60 }}>Denúncia não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const etapaAtualIndex = ETAPAS.indexOf(post.status as StatusDenuncia);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={cores.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>Denúncia</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          <PostCard post={post} onCurtir={handleCurtir} />

          {post.status !== 'rejeitada' && (
            <View style={styles.etapas}>
              {ETAPAS.map((etapa, index) => {
                const ativo = index <= etapaAtualIndex;
                return (
                  <View key={etapa} style={styles.etapaItem}>
                    <View
                      style={[
                        styles.etapaBola,
                        { borderColor: ativo ? cores.tint : cores.border, backgroundColor: ativo ? cores.tint : 'transparent' },
                      ]}
                    />
                    <Text style={[styles.etapaTexto, { color: ativo ? cores.tint : cores.icon, fontFamily: Fonts.mono }]}>
                      {ETAPA_LABEL[etapa].toUpperCase()}
                    </Text>
                    {index < ETAPAS.length - 1 && (
                      <View style={[styles.etapaLinha, { backgroundColor: ativo ? cores.tint : cores.border }]} />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.comentariosArea}>
            <Text style={[styles.comentariosTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>
              Comentários ({comentarios.length})
            </Text>

            {comentarios.length === 0 && (
              <Text style={[styles.semComentarios, { color: cores.icon, fontFamily: Fonts.regular }]}>
                Nenhum comentário ainda. Seja o primeiro a comentar.
              </Text>
            )}

            {comentarios.map((c) => (
              <View key={c.id} style={[styles.comentarioLinha, { borderBottomColor: cores.border }]}>
                <Text style={[styles.comentarioAutor, { color: cores.text, fontFamily: Fonts.semibold }]}>
                  {c.autor.nome}
                </Text>
                <Text style={[styles.comentarioTexto, { color: cores.text, fontFamily: Fonts.regular }]}>
                  {c.conteudo}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.inputArea, { borderTopColor: cores.border, backgroundColor: cores.background }]}>
          <TextInput
            ref={inputComentarioRef}
            style={[styles.input, { borderColor: cores.border, color: cores.text, fontFamily: Fonts.regular }]}
            placeholder="Escreva um comentário..."
            placeholderTextColor={cores.icon}
            value={texto}
            onChangeText={setTexto}
          />
          <TouchableOpacity onPress={handleEnviarComentario} disabled={enviando || !texto.trim()}>
            {enviando ? (
              <ActivityIndicator color={cores.tint} />
            ) : (
              <Ionicons name="send" size={22} color={texto.trim() ? cores.tint : cores.icon} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  etapas: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 6, marginBottom: 6 },
  etapaItem: { flex: 1, alignItems: 'center' },
  etapaBola: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  etapaTexto: { fontSize: 8, marginTop: 4, letterSpacing: 0.5, textAlign: 'center' },
  etapaLinha: { position: 'absolute', top: 5, left: '55%', right: '-45%', height: 2 },
  comentariosArea: { paddingHorizontal: 15, marginTop: 14 },
  comentariosTitulo: { fontSize: 15, marginBottom: 10 },
  semComentarios: { fontSize: 13 },
  comentarioLinha: { paddingVertical: 10, borderBottomWidth: 1 },
  comentarioAutor: { fontSize: 13, marginBottom: 2 },
  comentarioTexto: { fontSize: 14, lineHeight: 19 },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  input: { flex: 1, borderWidth: 1, borderRadius: Radius, padding: 11, fontSize: 14 },
});