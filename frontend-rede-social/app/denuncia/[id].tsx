import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TextInputSelectionChangeEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { Botao } from '@/src/components/ui/Botao';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  Comentario,
  UsuarioParaMencao,
  buscarComentarios,
  buscarUsuariosParaMencao,
  criarComentario,
  excluirComentario,
} from '@/src/services/comentarios';
import { alternarCurtida, buscarPostPorId } from '@/src/services/posts';
import { Post, StatusDenuncia } from '@/src/types';

const ETAPAS: StatusDenuncia[] = ['recebida', 'em_analise', 'resolvida'];
const ETAPA_LABEL: Record<StatusDenuncia, string> = {
  recebida: 'Recebida',
  em_analise: 'Em análise',
  resolvida: 'Resolvida',
  rejeitada: 'Rejeitada',
};

// ============================================================
// FAÇA 2 — @menções: procura o token "@algumacoisa" que está
// imediatamente antes do cursor. Só dispara a busca se o "@" estiver
// no começo do texto ou depois de um espaço (evita disparar no meio
// de um e-mail, por exemplo). Retorna null quando não há menção em
// digitação naquele ponto.
// ============================================================
function encontrarMencaoEmDigitacao(texto: string, cursor: number) {
  const antesDoCursor = texto.slice(0, cursor);
  const match = antesDoCursor.match(/(^|\s)@([a-zA-Z0-9._]{0,24})$/);
  if (!match) return null;
  const inicioArroba = match.index! + match[1].length;
  return { inicioArroba, termo: match[2] };
}

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

  // --- estado da @menção em digitação ---
  const [cursorPos, setCursorPos] = useState(0);
  const [mencaoAtiva, setMencaoAtiva] = useState<{ inicioArroba: number; termo: string } | null>(null);
  const [sugestoes, setSugestoes] = useState<UsuarioParaMencao[]>([]);
  const debounceMencaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Busca (com debounce de 300ms) as sugestões de usuário toda vez que o
  // termo depois do "@" muda. Lista pequena (máx. 8, já limitado no core)
  // e cancela buscas obsoletas — não bate no banco a cada tecla sem controle.
  useEffect(() => {
    if (debounceMencaoRef.current) clearTimeout(debounceMencaoRef.current);

    if (!mencaoAtiva) {
      setSugestoes([]);
      return;
    }

    debounceMencaoRef.current = setTimeout(async () => {
      try {
        const resultado = await buscarUsuariosParaMencao(mencaoAtiva.termo, usuario?.id ?? null);
        setSugestoes(resultado);
      } catch {
        setSugestoes([]);
      }
    }, 300);

    return () => {
      if (debounceMencaoRef.current) clearTimeout(debounceMencaoRef.current);
    };
  }, [mencaoAtiva, usuario?.id]);

  function handleMudarTexto(novoTexto: string) {
    setTexto(novoTexto);
    // cursorPos ainda reflete a posição ANTES desta digitação em alguns
    // casos no Android; recalculamos com base no fim do texto novo quando
    // o texto cresceu exatamente 1 caractere (digitação normal).
    const cursorEstimado = novoTexto.length >= texto.length ? cursorPos + (novoTexto.length - texto.length) : cursorPos;
    setMencaoAtiva(encontrarMencaoEmDigitacao(novoTexto, cursorEstimado));
  }

  function handleSelecaoMudou(evento: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    const posicao = evento.nativeEvent.selection.start;
    setCursorPos(posicao);
    setMencaoAtiva(encontrarMencaoEmDigitacao(texto, posicao));
  }

  function selecionarMencao(usuarioMencionado: UsuarioParaMencao) {
    if (!mencaoAtiva) return;
    const antes = texto.slice(0, mencaoAtiva.inicioArroba);
    const depois = texto.slice(cursorPos);
    const novoTexto = `${antes}@${usuarioMencionado.username} ${depois}`;
    setTexto(novoTexto);
    setMencaoAtiva(null);
    setSugestoes([]);
    inputComentarioRef.current?.focus();
  }

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
      setMencaoAtiva(null);
      setSugestoes([]);
      const novos = await buscarComentarios(post.id);
      setComentarios(novos);
    } catch (error) {
      console.error(error);
    } finally {
      setEnviando(false);
    }
  }

  // FAÇA 1 — excluir o próprio comentário. Atualização otimista da lista
  // (sem recarregar a tela toda); se a exclusão falhar no servidor (por
  // exemplo, alguém que não é o autor tentando excluir), reverte
  // recarregando os comentários reais e avisa o usuário.
  function confirmarExclusaoComentario(comentario: Comentario) {
    Alert.alert('Excluir comentário', 'Tem certeza de que deseja excluir este comentário?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => handleExcluirComentario(comentario.id) },
    ]);
  }

  async function handleExcluirComentario(comentarioId: string) {
    if (!usuario) return;
    const comentariosAnteriores = comentarios;
    setComentarios((atual) => atual.filter((c) => c.id !== comentarioId));
    try {
      await excluirComentario(comentarioId, usuario.id);
    } catch (error) {
      setComentarios(comentariosAnteriores);
      Alert.alert(
        'Não foi possível excluir',
        error instanceof Error ? error.message : 'Não foi possível excluir o comentário. Tente novamente.'
      );
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

            {comentarios.map((c) => {
              const souAutorDoComentario = !!usuario && usuario.id === c.autor.id;
              return (
                <View key={c.id} style={[styles.comentarioLinha, { borderBottomColor: cores.border }]}>
                  <View style={styles.comentarioCabecalho}>
                    <Text style={[styles.comentarioAutor, { color: cores.text, fontFamily: Fonts.semibold }]}>
                      {c.autor.nome}
                    </Text>

                    {souAutorDoComentario && (
                      <TouchableOpacity
                        onPress={() => confirmarExclusaoComentario(c)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.comentarioMenuBotao}>
                        <Ionicons name="ellipsis-vertical" size={16} color={cores.icon} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.comentarioTexto, { color: cores.text, fontFamily: Fonts.regular }]}>
                    {c.conteudo}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.inputAreaWrapper}>
          {mencaoAtiva && sugestoes.length > 0 && (
            <View
              style={[
                styles.sugestoesPainel,
                { backgroundColor: cores.card, borderColor: cores.border, shadowColor: cores.shadow },
              ]}>
              <FlatList
                data={sugestoes}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.sugestaoItem} onPress={() => selecionarMencao(item)}>
                    <View style={[styles.sugestaoAvatar, { backgroundColor: cores.tintSoft }]}>
                      <Text style={[styles.sugestaoAvatarTexto, { color: cores.tint, fontFamily: Fonts.bold }]}>
                        {item.nome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sugestaoUsername, { color: cores.text, fontFamily: Fonts.semibold }]}>
                        @{item.username}
                      </Text>
                      <Text style={[styles.sugestaoNome, { color: cores.icon, fontFamily: Fonts.regular }]} numberOfLines={1}>
                        {item.nome}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <View style={[styles.inputArea, { borderTopColor: cores.border, backgroundColor: cores.background }]}>
            <TextInput
              ref={inputComentarioRef}
              style={[styles.input, { borderColor: cores.border, color: cores.text, fontFamily: Fonts.regular }]}
              placeholder="Escreva um comentário... use @ para mencionar"
              placeholderTextColor={cores.icon}
              value={texto}
              onChangeText={handleMudarTexto}
              onSelectionChange={handleSelecaoMudou}
            />

            <TouchableOpacity onPress={handleEnviarComentario} disabled={enviando || !texto.trim()}>
              {enviando ? (
                <ActivityIndicator color={cores.tint} />
              ) : (
                <Ionicons name="send" size={22} color={texto.trim() ? cores.tint : cores.icon} />
              )}
            </TouchableOpacity>
          </View>
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
  comentarioCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  comentarioAutor: { fontSize: 13, marginBottom: 2 },
  comentarioMenuBotao: { padding: 2 },
  comentarioTexto: { fontSize: 14, lineHeight: 19 },
  inputAreaWrapper: { position: 'relative' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
  },
  input: { flex: 1, borderWidth: 1, borderRadius: Radius, padding: 11, fontSize: 14 },
  sugestoesPainel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: '100%',
    marginBottom: 6,
    borderWidth: 1,
    maxHeight: 220,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  sugestaoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 12 },
  sugestaoAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  sugestaoAvatarTexto: { fontSize: 13 },
  sugestaoUsername: { fontSize: 13 },
  sugestaoNome: { fontSize: 11, marginTop: 1 },
});