import { supabase } from '@/src/services/supabase';
import { Notificacao } from '@/src/types';

function mapearNotificacao(linha: any): Notificacao {
  return {
    id: linha.id,
    tipo: linha.tipo,
    mensagem: linha.mensagem,
    lida: linha.lida,
    postId: linha.post_id,
    empresaId: linha.empresa_id,
    criadoEm: linha.criado_em,
  };
}

export async function buscarNotificacoes(usuarioId: string): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from('notificacoes')
    .select('*')
    .eq('destinatario_id', usuarioId)
    .order('criado_em', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapearNotificacao);
}

export async function contarNaoLidas(usuarioId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notificacoes')
    .select('*', { count: 'exact', head: true })
    .eq('destinatario_id', usuarioId)
    .eq('lida', false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function marcarComoLida(notificacaoId: string) {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('id', notificacaoId);

  if (error) throw new Error(error.message);
}

export async function marcarTodasComoLidas(usuarioId: string) {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('destinatario_id', usuarioId)
    .eq('lida', false);

  if (error) throw new Error(error.message);
}

export function ouvirNovasNotificacoes(
  usuarioId: string,
  aoReceber: (n: Notificacao) => void
) {
  const channelName = `notificacoes:${usuarioId}:${Date.now()}`;

  const canal = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `destinatario_id=eq.${usuarioId}`,
      },
      (payload) => aoReceber(mapearNotificacao(payload.new))
    );

  canal.subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}