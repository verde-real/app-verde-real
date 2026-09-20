import { supabase } from '@/src/services/supabase';

export interface AtividadeDia {
  dia: string; // 'SEG', 'TER', ...
  total: number;
}

// Índice 0 = domingo, igual ao Date.getDay() do JavaScript
const DIAS_LABEL = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

/** Quantidade total de publicações (denúncias) criadas pelo usuário. */
export async function contarPublicacoes(usuarioId: string): Promise<number> {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('autor_id', usuarioId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Soma de todas as curtidas recebidas em todas as publicações do usuário. */
export async function contarCurtidasRecebidas(usuarioId: string): Promise<number> {
  const { data, error } = await supabase
    .from('posts')
    .select('curtidas(count)')
    .eq('autor_id', usuarioId);

  if (error) throw new Error(error.message);

  return (data ?? []).reduce((soma: number, linha: any) => soma + (linha.curtidas?.[0]?.count ?? 0), 0);
}

/**
 * Atividade do usuário nos últimos 7 dias (posts + curtidas dadas + comentários),
 * agrupada por dia da semana, de segunda a domingo.
 *
 * Não existe uma tabela de "log de atividade" no banco — os dados vêm direto de
 * `criado_em` das tabelas já existentes. Isso cobre publicações, curtidas e
 * comentários; outras ações (como seguir uma empresa) não entram na contagem
 * porque a tabela `seguidores_empresa` não tem uma coluna de data confiável para isso hoje.
 */
export async function buscarAtividadeSemanal(usuarioId: string): Promise<AtividadeDia[]> {
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
  seteDiasAtras.setHours(0, 0, 0, 0);
  const desde = seteDiasAtras.toISOString();

  const [posts, curtidas, comentarios] = await Promise.all([
    supabase.from('posts').select('criado_em').eq('autor_id', usuarioId).gte('criado_em', desde),
    supabase.from('curtidas').select('criado_em').eq('user_id', usuarioId).gte('criado_em', desde),
    supabase.from('comentarios').select('criado_em').eq('autor_id', usuarioId).gte('criado_em', desde),
  ]);

  if (posts.error) throw new Error(posts.error.message);
  if (curtidas.error) throw new Error(curtidas.error.message);
  if (comentarios.error) throw new Error(comentarios.error.message);

  const contagemPorDiaSemana = [0, 0, 0, 0, 0, 0, 0];

  [...(posts.data ?? []), ...(curtidas.data ?? []), ...(comentarios.data ?? [])].forEach((linha: any) => {
    const diaSemana = new Date(linha.criado_em).getDay();
    contagemPorDiaSemana[diaSemana] += 1;
  });

  const ordemSegundaADomingo = [1, 2, 3, 4, 5, 6, 0];
  return ordemSegundaADomingo.map((indice) => ({
    dia: DIAS_LABEL[indice],
    total: contagemPorDiaSemana[indice],
  }));
}
