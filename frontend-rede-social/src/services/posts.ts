import { supabase } from '@/src/services/supabase';
import { Post } from '@/src/types';

function mapearPost(linha: any, idsCurtidos: Set<string>): Post {
  return {
    id: linha.id,
    conteudo: linha.conteudo,
    categoria: linha.categoria,
    status: linha.status,
    midiaUrl: linha.midia_url,
    tipoMidia: linha.tipo_midia,
    latitude: linha.latitude,
    longitude: linha.longitude,
    criadoEm: linha.criado_em,
    autor: {
      id: linha.autor.id,
      nome: linha.autor.nome,
      email: linha.autor.email,
      tipo: linha.autor.tipo,
      avatarUrl: linha.autor.avatar_url,
    },
    empresa: linha.empresa
      ? {
          id: linha.empresa.id,
          nome: linha.empresa.nome,
          email: linha.empresa.email,
          tipo: linha.empresa.tipo,
          avatarUrl: linha.empresa.avatar_url,
        }
      : null,
    totalCurtidas: linha.curtidas?.[0]?.count ?? 0,
    curtidoPorMim: idsCurtidos.has(linha.id),
  };
}

export async function buscarPosts(usuarioId: string | null, categoria?: string | null): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select(
      `*,
      autor:profiles!posts_autor_id_fkey(*),
      empresa:profiles!posts_empresa_id_fkey(*),
      curtidas(count)`
    )
    .order('criado_em', { ascending: false });

  if (categoria) {
    query = query.eq('categoria', categoria);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let idsCurtidos = new Set<string>();
  if (usuarioId && data && data.length > 0) {
    const { data: curtidas } = await supabase.from('curtidas').select('post_id').eq('user_id', usuarioId);
    idsCurtidos = new Set((curtidas ?? []).map((c) => c.post_id));
  }

  return (data ?? []).map((linha) => mapearPost(linha, idsCurtidos));
}

export async function buscarPostPorId(postId: string, usuarioId: string | null): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `*,
      autor:profiles!posts_autor_id_fkey(*),
      empresa:profiles!posts_empresa_id_fkey(*),
      curtidas(count)`
    )
    .eq('id', postId)
    .single();

  if (error || !data) return null;

  let idsCurtidos = new Set<string>();
  if (usuarioId) {
    const { data: curtidas } = await supabase
      .from('curtidas')
      .select('post_id')
      .eq('user_id', usuarioId)
      .eq('post_id', postId);
    idsCurtidos = new Set((curtidas ?? []).map((c) => c.post_id));
  }

  return mapearPost(data, idsCurtidos);
}

export async function alternarCurtida(usuarioId: string, postId: string, curtidoAtualmente: boolean) {
  if (curtidoAtualmente) {
    const { error } = await supabase.from('curtidas').delete().eq('user_id', usuarioId).eq('post_id', postId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('curtidas').insert({ user_id: usuarioId, post_id: postId });
    if (error) throw new Error(error.message);
  }
}

export async function criarPost(dados: {
  autorId: string;
  conteudo: string;
  categoria: string;
  midiaUrl?: string | null;
  tipoMidia?: 'imagem' | 'video' | null;
  latitude?: number | null;
  longitude?: number | null;
  empresaId?: string | null;
}) {
  const { error } = await supabase.from('posts').insert({
    autor_id: dados.autorId,
    conteudo: dados.conteudo,
    categoria: dados.categoria,
    midia_url: dados.midiaUrl ?? null,
    tipo_midia: dados.tipoMidia ?? null,
    latitude: dados.latitude ?? null,
    longitude: dados.longitude ?? null,
    empresa_id: dados.empresaId ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Publicações criadas pelo próprio usuário (aba "Minhas Publicações" da Área do Usuário). */
export async function buscarPostsPorAutor(autorId: string, usuarioId: string | null): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `*,
      autor:profiles!posts_autor_id_fkey(*),
      empresa:profiles!posts_empresa_id_fkey(*),
      curtidas(count)`
    )
    .eq('autor_id', autorId)
    .order('criado_em', { ascending: false });

  if (error) throw new Error(error.message);

  let idsCurtidos = new Set<string>();
  if (usuarioId && data && data.length > 0) {
    const { data: curtidas } = await supabase.from('curtidas').select('post_id').eq('user_id', usuarioId);
    idsCurtidos = new Set((curtidas ?? []).map((c) => c.post_id));
  }

  return (data ?? []).map((linha) => mapearPost(linha, idsCurtidos));
}

/** Publicações que o usuário curtiu (aba "Postagens Curtidas" da Área do Usuário). */
export async function buscarPostsCurtidosPorMim(usuarioId: string): Promise<Post[]> {
  const { data: curtidas, error: erroCurtidas } = await supabase
    .from('curtidas')
    .select('post_id')
    .eq('user_id', usuarioId);
  if (erroCurtidas) throw new Error(erroCurtidas.message);

  const idsPosts = (curtidas ?? []).map((c) => c.post_id);
  if (idsPosts.length === 0) return [];

  const { data, error } = await supabase
    .from('posts')
    .select(
      `*,
      autor:profiles!posts_autor_id_fkey(*),
      empresa:profiles!posts_empresa_id_fkey(*),
      curtidas(count)`
    )
    .in('id', idsPosts)
    .order('criado_em', { ascending: false });

  if (error) throw new Error(error.message);

  const idsCurtidosSet = new Set(idsPosts);
  return (data ?? []).map((linha) => mapearPost(linha, idsCurtidosSet));
}

export async function buscarEmpresas(termo: string) {
  if (!termo.trim()) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, avatar_url')
    .eq('tipo', 'empresa')
    .ilike('nome', `%${termo.trim()}%`)
    .limit(8);
  if (error) throw new Error(error.message);
  return data ?? [];
}
export async function buscarPostsPorEmpresa(empresaId: string, usuarioId: string | null): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`*, autor:profiles!posts_autor_id_fkey(*), empresa:profiles!posts_empresa_id_fkey(*), curtidas(count)`)
    .eq('empresa_id', empresaId)
    .order('criado_em', { ascending: false });

  if (error) throw new Error(error.message);

  let idsCurtidos = new Set<string>();
  if (usuarioId && data && data.length > 0) {
    const { data: curtidas } = await supabase.from('curtidas').select('post_id').eq('user_id', usuarioId);
    idsCurtidos = new Set((curtidas ?? []).map((c) => c.post_id));
  }

  return (data ?? []).map((linha) => mapearPost(linha, idsCurtidos));
}