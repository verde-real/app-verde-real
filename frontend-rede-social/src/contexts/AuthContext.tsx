import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/src/services/supabase';
import { Usuario } from '@/src/types';

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (
    nome: string,
    email: string,
    senha: string,
    tipo: 'cliente' | 'empresa'
  ) => Promise<{ precisaConfirmarEmail: boolean }>;
  recuperarSenha: (email: string) => Promise<void>;
  sair: () => Promise<void>;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapearPerfil(perfil: any): Usuario {
  return {
    id: perfil.id,
    nome: perfil.nome,
    email: perfil.email,
    tipo: perfil.tipo,
    avatarUrl: perfil.avatar_url,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarPerfil(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    const u = mapearPerfil(data);
    setUsuario(u);
    return u;
  }

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setToken(session.access_token);
        await carregarPerfil(session.user.id);
      }
      setCarregando(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setToken(session.access_token);
        await carregarPerfil(session.user.id);
      } else {
        setToken(null);
        setUsuario(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function entrar(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: senha,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou senha incorretos.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Confirme seu email antes de entrar.');
      }
      throw new Error(error.message);
    }

    if (data.session?.user) {
      setToken(data.session.access_token);
      await carregarPerfil(data.session.user.id);
    }
  }

  async function cadastrar(nome: string, email: string, senha: string, tipo: 'cliente' | 'empresa') {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: senha,
      options: { data: { nome: nome.trim(), tipo } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        throw new Error('Este email já está cadastrado.');
      }
      throw new Error(error.message);
    }

    if (data.session?.user) {
      setToken(data.session.access_token);
      await carregarPerfil(data.session.user.id);
    }

    return { precisaConfirmarEmail: !data.session };
  }

  async function recuperarSenha(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: 'verde-real://redefinir-senha',
    });
    if (error) {
      throw new Error(error.message);
    }
    // Por segurança, não revelamos se o email existe ou não.
  }

  async function sair() {
    await supabase.auth.signOut();
    setUsuario(null);
    setToken(null);
  }

  function atualizarUsuario(dadosParciais: Partial<Usuario>) {
    setUsuario((atual) => (atual ? { ...atual, ...dadosParciais } : atual));
  }

  const value = useMemo(
    () => ({ usuario, token, carregando, entrar, cadastrar, recuperarSenha, sair, atualizarUsuario }),
    [usuario, token, carregando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}