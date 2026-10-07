import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DadosCadastro, validarCadastro } from 'verde-real-core';
import * as Linking from 'expo-linking';

import { supabase } from '@/src/services/supabase';
import { Usuario } from '@/src/types';

interface AuthContextValue {
  usuario: Usuario | null;
  token: string | null;
  ehAdmin: boolean;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario | null>;
  cadastrar: (dados: DadosCadastro) => Promise<{ precisaConfirmarEmail: boolean; usuario: Usuario | null }>;
  recuperarSenha: (email: string) => Promise<void>;
  sair: () => Promise<void>;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapearPerfil(perfil: any, email: string): Usuario {
  return {
    id: perfil.id,
    nome: perfil.nome,
    email,
    tipo: perfil.tipo,
    avatarUrl: perfil.avatar_url,
    username: perfil.username,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ehAdmin, setEhAdmin] = useState(false);
  const [carregando, setCarregando] = useState(true);

  async function carregarPerfil(userId: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const emailAuth = sessionData.session?.user?.email ?? '';
    const { data, error } = await supabase
      .from('profiles')
      .select('id, tipo, nome, avatar_url, username')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    const u = mapearPerfil(data, emailAuth);

    const { data: resultadoAdmin, error: erroAdmin } =
      await supabase.rpc('eh_admin');

    if (erroAdmin) {
      setEhAdmin(false);
    } else {
      setEhAdmin(resultadoAdmin === true);
    }

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
        setEhAdmin(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function entrar(email: string, senha: string): Promise<Usuario | null> {
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
      return await carregarPerfil(data.session.user.id);
    }
    return null;
  }

  async function cadastrar(dados: DadosCadastro) {
    const erros = validarCadastro(dados);
    if (erros.length > 0) {
      throw new Error(erros[0].mensagem);
    }

    const { data, error } = await supabase.auth.signUp({
      email: dados.email.toLowerCase().trim(),
      password: dados.senha,
      options: { data: { nome: dados.nome.trim(), tipo: dados.tipo } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        throw new Error('Este email já está cadastrado.');
      }
      throw new Error(error.message);
    }

    let usuarioCriado: Usuario | null = null;
    if (data.session?.user) {
      setToken(data.session.access_token);
      usuarioCriado = await carregarPerfil(data.session.user.id);
    }

    return { precisaConfirmarEmail: !data.session, usuario: usuarioCriado };
  }

  async function recuperarSenha(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: Linking.createURL('redefinir-senha'),
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    setUsuario(null);
    setToken(null);
    setEhAdmin(false);
  }

  function atualizarUsuario(dadosParciais: Partial<Usuario>) {
    setUsuario((atual) => (atual ? { ...atual, ...dadosParciais } : atual));
  }

  const value = useMemo(
    () => ({
      usuario,
      token,
      ehAdmin,
      carregando,
      entrar,
      cadastrar,
      recuperarSenha,
      sair,
      atualizarUsuario,
    }),
    [usuario, token, ehAdmin, carregando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}