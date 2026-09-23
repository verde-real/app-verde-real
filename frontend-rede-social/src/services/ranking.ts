import { supabase } from '@/src/services/supabase';
import { criarServicoRanking } from 'verde-real-core';

export const buscarRanking = criarServicoRanking(supabase).buscarRanking;