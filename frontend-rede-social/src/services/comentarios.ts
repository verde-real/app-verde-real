import { supabase } from '@/src/services/supabase';
import { criarServicoComentarios } from 'verde-real-core';

const servico = criarServicoComentarios(supabase);

export const buscarComentarios = servico.buscarComentarios;
export const criarComentario = servico.criarComentario;
export type { Comentario } from 'verde-real-core';