import { supabase } from '@/src/services/supabase';
import { criarServicoCurtidas, criarServicoPosts } from 'verde-real-core';

const servicoPosts = criarServicoPosts(supabase);
const servicoCurtidas = criarServicoCurtidas(supabase);

export const buscarPosts = servicoPosts.buscarPosts;
export const buscarPostPorId = servicoPosts.buscarPostPorId;
export const criarPost = servicoPosts.criarPost;
export const atualizarPost = servicoPosts.atualizarPost;
export const deletarPost = servicoPosts.deletarPost;
export const buscarPostsPorAutor = servicoPosts.buscarPostsPorAutor;
export const buscarPostsPorEmpresa = servicoPosts.buscarPostsPorEmpresa;
export const buscarPostsCurtidosPorMim = servicoPosts.buscarPostsCurtidosPorMim;
export const buscarEmpresas = servicoPosts.buscarEmpresas;
export const alternarCurtida = servicoCurtidas.alternarCurtida;
export const verificarCurtida = servicoCurtidas.verificarCurtida;