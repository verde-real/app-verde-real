import { CATEGORIAS } from '@/src/constants/categorias';
import { supabase } from '@/src/services/supabase';
import { Categoria } from '@/src/types';

/**
 * Consultas SOMENTE DE LEITURA usadas pela aba Ranking, sobre tabelas que já
 * existem (`posts` e `profiles`). Nenhuma tabela, coluna ou view é criada ou
 * alterada — o ranking em si continua vindo de `buscarRanking` (verde-real-core).
 */

export interface PerfilRanking {
  id: string;
  tipo: string;
  username: string | null;
}

export interface FatiaCategoria {
  categoria: Categoria;
  total: number;
}

const TAMANHO_PAGINA = 1000; // limite padrão de linhas por consulta do Supabase

/**
 * Conta as denúncias por categoria, lendo apenas a coluna `categoria` de `posts`.
 * A leitura é paginada para não perder registros acima de 1000 linhas.
 * Categorias sem denúncias retornam total 0 (quem desenha decide se as oculta).
 * Valores fora da lista oficial de categorias são somados em "Outro".
 */
export async function buscarDenunciasPorCategoria(): Promise<FatiaCategoria[]> {
  const contagem = new Map<Categoria, number>(CATEGORIAS.map((c) => [c, 0]));

  let inicio = 0;
  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('categoria')
      .range(inicio, inicio + TAMANHO_PAGINA - 1);

    if (error) throw new Error(error.message);

    const linhas = data ?? [];
    linhas.forEach((linha: any) => {
      const categoria: Categoria = CATEGORIAS.includes(linha.categoria) ? linha.categoria : 'Outro';
      contagem.set(categoria, (contagem.get(categoria) ?? 0) + 1);
    });

    if (linhas.length < TAMANHO_PAGINA) break;
    inicio += TAMANHO_PAGINA;
  }

  return CATEGORIAS.map((categoria) => ({ categoria, total: contagem.get(categoria) ?? 0 }));
}

/** Tipo de conta e @username dos usuários informados (leitura em `profiles`). */
export async function buscarPerfisDoRanking(ids: string[]): Promise<Map<string, PerfilRanking>> {
  const mapa = new Map<string, PerfilRanking>();
  if (ids.length === 0) return mapa;

  const { data, error } = await supabase.from('profiles').select('id, tipo, username').in('id', ids);
  if (error) throw new Error(error.message);

  (data ?? []).forEach((linha: any) => {
    mapa.set(linha.id, { id: linha.id, tipo: linha.tipo, username: linha.username ?? null });
  });
  return mapa;
}