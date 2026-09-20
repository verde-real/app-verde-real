import { supabase } from '@/src/services/supabase';

export async function estaSeguindo(seguidorId: string, empresaId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('seguidores_empresa')
    .select('id')
    .eq('seguidor_id', seguidorId)
    .eq('empresa_id', empresaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

export async function seguirEmpresa(seguidorId: string, empresaId: string) {
  const { error } = await supabase
    .from('seguidores_empresa')
    .insert({ seguidor_id: seguidorId, empresa_id: empresaId });

  if (error) throw new Error(error.message);
}

export async function deixarDeSeguir(seguidorId: string, empresaId: string) {
  const { error } = await supabase
    .from('seguidores_empresa')
    .delete()
    .eq('seguidor_id', seguidorId)
    .eq('empresa_id', empresaId);

  if (error) throw new Error(error.message);
}

export async function contarSeguidores(empresaId: string): Promise<number> {
  const { count, error } = await supabase
    .from('seguidores_empresa')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Quantidade de empresas que o usuário (cliente) está seguindo. */
export async function contarSeguindo(seguidorId: string): Promise<number> {
  const { count, error } = await supabase
    .from('seguidores_empresa')
    .select('*', { count: 'exact', head: true })
    .eq('seguidor_id', seguidorId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}