export interface PlanoSelo {
  id: string;
  nome: string;
  precoExibicao: string;
  descricao: string;
  recursos: string[];
}

/**
 * Valores de referência propostos — ainda não confirmados pela Verde Real.
 * Quando houver definição comercial oficial, troque só esta lista;
 * nenhuma outra parte do app precisa mudar.
 */
export const PLANOS_SELO: PlanoSelo[] = [
  {
    id: 'essencial',
    nome: 'Essencial',
    precoExibicao: 'R$ 890/ano',
    descricao: 'Para empresas de pequeno porte iniciando a jornada de certificação.',
    recursos: ['1 auditoria anual', 'Selo nível Bronze ou Prata', 'Suporte por e-mail'],
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    precoExibicao: 'R$ 1.890/ano',
    descricao: 'Para empresas de médio porte com metas ambientais já estruturadas.',
    recursos: ['1 auditoria anual', 'Selo em qualquer nível', 'Suporte prioritário', 'Relatório de impacto'],
  },
  {
    id: 'corporativo',
    nome: 'Corporativo',
    precoExibicao: 'R$ 3.490/ano',
    descricao: 'Para empresas de grande porte com múltiplas unidades.',
    recursos: ['Auditoria em até 3 unidades', 'Selo nível Ouro prioritário', 'Suporte dedicado', 'Relatório de impacto'],
  },
];

export const NOTA_VALORES_PLANOS =
  'Valores de referência, sujeitos a confirmação final antes da cobrança.';