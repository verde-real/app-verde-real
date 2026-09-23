import { supabase } from '@/src/services/supabase';
import { criarServicoNotificacoes } from 'verde-real-core';

const servico = criarServicoNotificacoes(supabase);

export const buscarNotificacoes = servico.buscarNotificacoes;
export const contarNaoLidas = servico.contarNaoLidas;
export const marcarComoLida = servico.marcarComoLida;
export const marcarTodasComoLidas = servico.marcarTodasComoLidas;
export const ouvirNovasNotificacoes = servico.ouvirNovasNotificacoes;
