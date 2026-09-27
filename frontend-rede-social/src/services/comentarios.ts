import { supabase } from '@/src/services/supabase';
import { criarServicoComentarios } from 'verde-real-core';

const servico = criarServicoComentarios(supabase);

export const buscarComentarios = servico.buscarComentarios;
export const criarComentario = servico.criarComentario;
export const excluirComentario = servico.excluirComentario;
export const buscarUsuariosParaMencao = servico.buscarUsuariosParaMencao;
export type { Comentario, UsuarioParaMencao } from 'verde-real-core';