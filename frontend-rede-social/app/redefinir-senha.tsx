import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { avaliarSenha, mensagemSenhaInsegura } from 'verde-real-core';

import { Fonts, Marca, Radius } from '@/constants/theme';
import { Botao } from '@/src/components/ui/Botao';
import { AvisoConfirmacao, CampoSenha, ChecklistSenha } from '@/src/components/ui/CampoSenha';
import { supabase } from '@/src/services/supabase';

type Estado = 'validando' | 'pronto' | 'invalido';

// O Supabase devolve os tokens no fragmento: verdereal://redefinir-senha#access_token=...&refresh_token=...
function lerTokens(url: string) {
  const i = url.indexOf('#');
  const params = new URLSearchParams(i >= 0 ? url.slice(i + 1) : '');
  return { access: params.get('access_token'), refresh: params.get('refresh_token') };
}

export default function RedefinirSenhaScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const [estado, setEstado] = useState<Estado>('validando');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!url) return;
    const { access, refresh } = lerTokens(url);
    if (!access || !refresh) {
      setEstado('invalido');
      return;
    }
    supabase.auth
      .setSession({ access_token: access, refresh_token: refresh })
      .then(({ error }) => setEstado(error ? 'invalido' : 'pronto'));
  }, [url]);

  // Se a tela for aberta sem link, não fica "validando" para sempre
  useEffect(() => {
    const t = setTimeout(() => setEstado((e) => (e === 'validando' ? 'invalido' : e)), 4000);
    return () => clearTimeout(t);
  }, []);

  async function irParaLogin() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  async function salvar() {
    const av = avaliarSenha(senha);
    if (!av.valida) {
      Alert.alert('Atenção', mensagemSenhaInsegura(av));
      return;
    }
    if (senha !== confirmar) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      Alert.alert('Ops', error.message);
      return;
    }
    Alert.alert('Senha alterada', 'Entre com a sua nova senha.');
    await irParaLogin();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.topo}>
            <Text style={[styles.titulo, { fontFamily: Fonts.bold }]}>Redefinir senha</Text>
          </View>

          <View style={styles.painel}>
            {estado === 'validando' && (
              <Text style={[styles.texto, { fontFamily: Fonts.regular }]}>Validando o link...</Text>
            )}

            {estado === 'invalido' && (
              <>
                <Text style={[styles.texto, { fontFamily: Fonts.regular }]}>
                  Este link é inválido ou expirou. Peça um novo link na aba "Recuperar".
                </Text>
                <Botao titulo="Voltar ao login" onPress={irParaLogin} style={{ marginTop: 20 }} />
              </>
            )}

            {estado === 'pronto' && (
              <>
                <Text style={[styles.rotulo, { fontFamily: Fonts.mono }]}>NOVA SENHA</Text>
                <CampoSenha value={senha} onChangeText={setSenha} />
                <ChecklistSenha senha={senha} />

                <Text style={[styles.rotulo, { fontFamily: Fonts.mono }]}>CONFIRMAR SENHA</Text>
                <CampoSenha value={confirmar} onChangeText={setConfirmar} />
                <AvisoConfirmacao senha={senha} confirmar={confirmar} />

                <Botao titulo="Salvar nova senha" onPress={salvar} carregando={salvando} style={{ marginTop: 20 }} />
                <Botao titulo="Cancelar" variante="secundario" onPress={irParaLogin} style={{ marginTop: 12 }} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Marca.heroBg },
  scroll: { flexGrow: 1 },
  topo: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 28 },
  titulo: { fontSize: 26, color: Marca.heroText },
  painel: { flex: 1, backgroundColor: Marca.formBg, borderRadius: Radius, padding: 24, marginTop: -16 },
  texto: { fontSize: 14, lineHeight: 22, color: Marca.formText },
  rotulo: { fontSize: 11, letterSpacing: 1, color: Marca.formIcon, marginBottom: 6, marginTop: 4 },
});