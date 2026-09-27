import { supabase } from '@/src/services/supabase';

export async function atualizarAvatar(usuarioId: string, avatarUrl: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', usuarioId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
export async function buscarPerfilPorId(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error || !data) return null;
  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    tipo: data.tipo,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    username: data.username,
  };
}