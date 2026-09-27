import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usernameValido } from 'verde-real-core';

import { Botao } from '@/src/components/ui/Botao';
import { Fonts, Marca, Radius } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/services/supabase';

export default function EscolherUsernameScreen() {
  const router = useRouter();
  const { usuario, sair, atualizarUsuario } = useAuth();

  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!usuario) return null;

  function limparEValidar(texto: string) {
    const limpo = texto.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setValor(limpo);
    if (!limpo) {
      setErro(null);
      return;
    }
    setErro(usernameValido(limpo) ? null : 'Use de 3 a 24 letras minúsculas, números, ponto ou underscore.');
  }

  async function handleConfirmar() {
    if (!usernameValido(valor)) {
      setErro('Use de 3 a 24 letras minúsculas, números, ponto ou underscore.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const { data: existente } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', valor)
        .maybeSingle();

      if (existente) {
        setErro('Esse @ já está em uso. Tente outro.');
        return;
      }

      const { error } = await supabase.from('profiles').update({ username: valor }).eq('id', usuario.id);

      if (error) {
        setErro(
          error.code === '23505' ? 'Esse @ já está em uso. Tente outro.' : 'Não foi possível salvar. Tente novamente.'
        );
        return;
      }

      atualizarUsuario({ username: valor });
      router.replace('/(tabs)');
    } catch {
      setErro('Não foi possível salvar. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function handleSair() {
    Alert.alert('Sair da conta', 'Tem certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await sair();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.painel}>
          <Text style={[styles.titulo, { fontFamily: Fonts.bold }]}>Escolha seu @</Text>
          <Text style={[styles.subtitulo, { fontFamily: Fonts.regular }]}>
            É assim que as pessoas vão te encontrar no Verde Real. Minúsculo, sem espaço — igual Instagram ou TikTok.
          </Text>

          <View style={styles.campo}>
            <Text style={[styles.arroba, { fontFamily: Fonts.mono }]}>@</Text>
            <TextInput
              style={[styles.input, { fontFamily: Fonts.regular }]}
              placeholder="seunome"
              placeholderTextColor={Marca.formIcon}
              value={valor}
              onChangeText={limparEValidar}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={24}
            />
          </View>
          {erro && <Text style={[styles.erro, { fontFamily: Fonts.regular }]}>{erro}</Text>}

          {salvando ? (
            <ActivityIndicator color={Marca.tint} style={{ marginTop: 16 }} />
          ) : (
            <Botao titulo="Confirmar @" onPress={handleConfirmar} carregando={salvando} style={{ marginTop: 12 }} />
          )}

          <TouchableOpacity onPress={handleSair} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={[styles.sairTexto, { fontFamily: Fonts.semibold }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Marca.formBg },
  painel: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  titulo: { fontSize: 22, color: Marca.formText, marginBottom: 8, textAlign: 'center' },
  subtitulo: { fontSize: 13, color: Marca.formIcon, lineHeight: 19, marginBottom: 24, textAlign: 'center' },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Marca.formBorder,
    borderRadius: Radius,
    paddingHorizontal: 13,
  },
  arroba: { fontSize: 15, color: Marca.formIcon, marginRight: 2 },
  input: { flex: 1, color: Marca.formText, paddingVertical: 13, fontSize: 15 },
  erro: { fontSize: 12, color: Marca.danger, marginTop: 8 },
  sairTexto: { fontSize: 13, color: Marca.formIcon },
});