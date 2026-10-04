import type { RankingItem } from '@/src/types';

/** Item do ranking já enriquecido com o @username (quando existir). */
export interface Participante extends RankingItem {
  username: string | null;
}

/** Mesmo padrão dos perfis públicos: @username, ou o nome quando não há username. */
export function nomeExibicao(p: Participante): string {
  return p.username ? `@${p.username}` : p.nome;
}