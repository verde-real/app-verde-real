import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';

import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/services/supabase';

type PostPendente = {
  id: string;
  conteudo: string;
  categoria: string;
  midia_url: string | null;
  criado_em: string;
  autor_nome: string;
  autor_username: string | null;
  empresa_nome: string | null;
};

type SeloPendente = {
  id: string;
  status: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cidade: string;
  estado: string;
  plano: string;
  informacoes_adicionais: string | null;
  documentos: number;
};

export default function Admin() {
  const { usuario, carregando, sair } = useAuth();

  const [posts, setPosts] = useState<PostPendente[]>([]);
  const [selos, setSelos] = useState<SeloPendente[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregandoDados(true);

      const [postsResult, selosResult] = await Promise.all([
        supabase.rpc('admin_listar_posts_pendentes', {
          p_limite: 50,
        }),
        supabase.rpc('admin_listar_solicitacoes_selo'),
      ]);

      if (postsResult.error) throw postsResult.error;
      if (selosResult.error) throw selosResult.error;

      setPosts(postsResult.data ?? []);
      setSelos(selosResult.data ?? []);
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível carregar a moderação.'
      );
    } finally {
      setCarregandoDados(false);
    }
  }, []);

  useEffect(() => {
    if (usuario?.tipo === 'admin') {
      carregar();
    }
  }, [usuario, carregar]);

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!usuario) {
    return <Redirect href="/(auth)/login" />;
  }

  if (usuario.tipo !== 'admin') {
    return <Redirect href="/(tabs)" />;
  }

  async function moderarPost(
    id: string,
    acao: 'aprovar' | 'rejeitar'
  ) {
    let motivo: string | null = null;

    if (acao === 'rejeitar') {
      motivo = await pedirMotivo('Motivo da rejeição');
      if (!motivo) return;
    }

    const { error } = await supabase.rpc('admin_moderar_post', {
      p_post_id: id,
      p_acao: acao,
      p_motivo: motivo,
    });

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    await carregar();
  }

  async function moderarSelo(
    id: string,
    acao: 'aprovar' | 'reprovar' | 'em_analise'
  ) {
    let observacao: string | null = null;
    let nivel: string | null = null;

    if (acao === 'reprovar') {
      observacao = await pedirMotivo('Motivo da reprovação');
      if (!observacao) return;
    }

    if (acao === 'aprovar') {
      nivel = await escolherNivel();

      if (!nivel) return;
    }

    const { error } = await supabase.rpc(
      'admin_moderar_solicitacao_selo',
      {
        p_solicitacao_id: id,
        p_acao: acao,
        p_observacao: observacao,
        p_nivel: nivel,
      }
    );

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    await carregar();
  }

  function pedirMotivo(titulo: string): Promise<string | null> {
    return new Promise((resolve) => {
      Alert.prompt(
        titulo,
        'Informe o motivo:',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: 'Confirmar',
            onPress: (texto) => resolve(texto?.trim() || null),
          },
        ],
        'plain-text'
      );
    });
  }

  function escolherNivel(): Promise<string | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Nível do selo',
        'Escolha o nível:',
        [
          {
            text: 'Bronze',
            onPress: () => resolve('bronze'),
          },
          {
            text: 'Prata',
            onPress: () => resolve('prata'),
          },
          {
            text: 'Ouro',
            onPress: () => resolve('ouro'),
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }

  async function sairAdmin() {
    await sair();
    router.replace('/(auth)/login');
  }

  async function atualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Administração</Text>
          <Text style={styles.subtitulo}>Moderação do Verde Real</Text>
        </View>

        <Pressable style={styles.botaoSair} onPress={sairAdmin}>
          <Text style={styles.textoBotaoSair}>Sair</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
          />
        }
      >
        <View style={styles.resumo}>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Posts pendentes</Text>
            <Text style={styles.resumoNumero}>{posts.length}</Text>
          </View>

          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Selos pendentes</Text>
            <Text style={styles.resumoNumero}>{selos.length}</Text>
          </View>
        </View>

        <Text style={styles.secaoTitulo}>Posts pendentes</Text>

        {carregandoDados ? (
          <ActivityIndicator />
        ) : posts.length === 0 ? (
          <Text style={styles.vazio}>
            Nenhum post aguardando aprovação.
          </Text>
        ) : (
          posts.map((post) => (
            <View style={styles.card} key={post.id}>
              <Text style={styles.cardTitulo}>
                {post.autor_nome}
              </Text>

              {post.autor_username ? (
                <Text style={styles.meta}>
                  @{post.autor_username}
                </Text>
              ) : null}

              <Text style={styles.meta}>
                {post.categoria} ·{' '}
                {new Date(post.criado_em).toLocaleString('pt-BR')}
              </Text>

              <Text style={styles.postTexto}>
                {post.conteudo}
              </Text>

              {post.empresa_nome ? (
                <Text style={styles.meta}>
                  Empresa: {post.empresa_nome}
                </Text>
              ) : null}

              <View style={styles.acoes}>
                <Pressable
                  style={[styles.botao, styles.aprovar]}
                  onPress={() =>
                    moderarPost(post.id, 'aprovar')
                  }
                >
                  <Text style={styles.textoBotao}>Aprovar</Text>
                </Pressable>

                <Pressable
                  style={[styles.botao, styles.reprovar]}
                  onPress={() =>
                    moderarPost(post.id, 'rejeitar')
                  }
                >
                  <Text style={styles.textoBotao}>Rejeitar</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text style={styles.secaoTitulo}>
          Solicitações de selo
        </Text>

        {selos.length === 0 ? (
          <Text style={styles.vazio}>
            Nenhuma solicitação aguardando moderação.
          </Text>
        ) : (
          selos.map((selo) => (
            <View style={styles.card} key={selo.id}>
              <Text style={styles.cardTitulo}>
                {selo.nome_fantasia || selo.razao_social}
              </Text>

              <Text style={styles.meta}>
                Status: {selo.status}
              </Text>

              <Text style={styles.info}>
                CNPJ: {selo.cnpj || '—'}
              </Text>

              <Text style={styles.info}>
                Cidade: {selo.cidade || '—'} / {selo.estado || '—'}
              </Text>

              <Text style={styles.info}>
                Plano: {selo.plano || '—'}
              </Text>

              <Text style={styles.info}>
                Documentos: {selo.documentos ?? 0}
              </Text>

              {selo.informacoes_adicionais ? (
                <Text style={styles.postTexto}>
                  {selo.informacoes_adicionais}
                </Text>
              ) : null}

              <View style={styles.acoes}>
                <Pressable
                  style={[styles.botao, styles.analise]}
                  onPress={() =>
                    moderarSelo(selo.id, 'em_analise')
                  }
                >
                  <Text style={styles.textoBotao}>
                    Em análise
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.botao, styles.aprovar]}
                  onPress={() =>
                    moderarSelo(selo.id, 'aprovar')
                  }
                >
                  <Text style={styles.textoBotao}>
                    Aprovar
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.botao, styles.reprovar]}
                  onPress={() =>
                    moderarSelo(selo.id, 'reprovar')
                  }
                >
                  <Text style={styles.textoBotao}>
                    Reprovar
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f5',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  titulo: {
    fontSize: 25,
    fontWeight: '800',
  },

  subtitulo: {
    marginTop: 3,
    color: '#6b7280',
  },

  botaoSair: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  textoBotaoSair: {
    color: '#ffffff',
    fontWeight: '700',
  },

  conteudo: {
    padding: 16,
    paddingBottom: 40,
  },

  resumo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  resumoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
  },

  resumoLabel: {
    color: '#6b7280',
    fontSize: 13,
  },

  resumoNumero: {
    fontSize: 30,
    fontWeight: '800',
    marginTop: 5,
  },

  secaoTitulo: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 10,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 17,
    marginBottom: 13,
  },

  cardTitulo: {
    fontSize: 17,
    fontWeight: '700',
  },

  meta: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },

  info: {
    fontSize: 14,
    marginTop: 6,
  },

  postTexto: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    marginBottom: 12,
  },

  acoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  botao: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
  },

  aprovar: {
    backgroundColor: '#16a34a',
  },

  reprovar: {
    backgroundColor: '#dc2626',
  },

  analise: {
    backgroundColor: '#d97706',
  },

  textoBotao: {
    color: '#ffffff',
    fontWeight: '700',
  },

  vazio: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
});