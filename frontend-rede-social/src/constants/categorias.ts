import { Categoria } from '@/src/types';

export const CATEGORIAS: Categoria[] = [
  'Desmatamento',
  'Poluição',
  'Queimada',
  'Descarte Irregular',
  'Água',
  'Fauna',
  'Outro',
];

export const CORES_CATEGORIA: Record<Categoria, string> = {
  Desmatamento: '#8D6E4E',
  Poluição: '#6B7280',
  Queimada: '#E4572E',
  'Descarte Irregular': '#C9963B',
  Água: '#2E86AB',
  Fauna: '#A64AC9',
  Outro: '#2F6B4F',
};

// A classificação por nível (Iniciante/Explorador/Vigilante Ambiental) foi
// centralizada no pacote compartilhado `verde-real-core` (rotuloConquista /
// calcularNivelUsuario). Importe de lá:
// import { rotuloConquista } from 'verde-real-core';