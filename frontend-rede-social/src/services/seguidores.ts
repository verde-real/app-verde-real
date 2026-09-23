import { supabase } from '@/src/services/supabase';
import { criarServicoSeguidores } from 'verde-real-core';

const servico = criarServicoSeguidores(supabase);

export const estaSeguindo = servico.estaSeguindo;
export const seguirEmpresa = servico.seguirEmpresa;
export const deixarDeSeguir = servico.deixarDeSeguir;
export const contarSeguidores = servico.contarSeguidores;
export const contarSeguindo = servico.contarSeguindo;