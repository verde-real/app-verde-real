import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Emblema } from '@/src/components/ui/Emblema';
import { Botao } from '@/src/components/ui/Botao';
import { Fonts, Marca, Radius } from '@/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';

type Aba = 'entrar' | 'cadastro' | 'recuperar';

export default function LoginScreen() {
  const router = useRouter();
  const { entrar, cadastrar, recuperarSenha } = useAuth();

  const [aba, setAba] = useState<Aba>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [tipo, setTipo] = useState<'cliente' | 'empresa'>('cliente');
  const [carregando, setCarregando] = useState(false);

  async function handleEnviar() {
    if (aba === 'recuperar') {
      if (!email.trim()) {
        Alert.alert('Atenção', 'Informe seu e-mail.');
        return;
      }
      setCarregando(true);
      try {
        await recuperarSenha(email.trim());
        Alert.alert(
          'Verifique seu email',
          'Se este email estiver cadastrado, você vai receber um link para redefinir sua senha.'
        );
        setAba('entrar');
      } catch (error) {
        Alert.alert('Ops', error instanceof Error ? error.message : 'Algo deu errado.');
      } finally {
        setCarregando(false);
      }
      return;
    }

    if (!email.trim() || !senha.trim() || (aba === 'cadastro' && !nome.trim())) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    setCarregando(true);
    try {
      if (aba === 'cadastro') {
        const resultado = await cadastrar({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          confirmarSenha,
          tipo,
          aceitouTermos,
        });
        if (resultado.precisaConfirmarEmail) {
          Alert.alert(
            'Quase lá!',
            'Enviamos um link de confirmação para o seu email. Confirme para poder entrar.'
          );
          setAba('entrar');
          return;
        }
      } else {
        await entrar(email.trim(), senha);
      }
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Ops', error instanceof Error ? error.message : 'Algo deu errado.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroIconCirculo}>
              <Ionicons name="leaf" size={26} color={Marca.heroBg} />
            </View>
            <Text style={[styles.heroTitulo, { fontFamily: Fonts.bold }]}>Verde Real</Text>
            <Text style={[styles.heroTag, { fontFamily: Fonts.mono }]}>TRANSPARÊNCIA AMBIENTAL</Text>
            <Text style={[styles.heroFrase, { fontFamily: Fonts.regular }]}>
              "O futuro é verde,{'\n'}mas só se for verdadeiro."
            </Text>
          </View>

          <View style={styles.formPainel}>
            <Text style={[styles.formTitulo, { fontFamily: Fonts.bold }]}>Acessar plataforma</Text>

            <View style={styles.abas}>
              {(['entrar', 'cadastro', 'recuperar'] as Aba[]).map((item) => (
                <TouchableOpacity key={item} style={styles.abaBotao} onPress={() => setAba(item)}>
                  <Text
                    style={[
                      styles.abaTexto,
                      { fontFamily: Fonts.semibold, color: aba === item ? Marca.tint : Marca.formIcon },
                    ]}>
                    {item === 'entrar' ? 'ENTRAR' : item === 'cadastro' ? 'CRIAR CONTA' : 'RECUPERAR'}
                  </Text>
                  {aba === item && <View style={styles.abaLinha} />}
                </TouchableOpacity>
              ))}
            </View>

            {aba === 'cadastro' && (
              <>
                <Text style={[styles.rotulo, { fontFamily: Fonts.mono }]}>NOME / RAZÃO SOCIAL</Text>
                <TextInput
                  style={[styles.input, { fontFamily: Fonts.regular }]}
                  placeholder="Seu nome completo"
                  placeholderTextColor={Marca.formIcon}
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                />
              </>
            )}

            <Text style={[styles.rotulo, { fontFamily: Fonts.mono }]}>E-MAIL</Text>
            <TextInput
              style={[styles.input, { fontFamily: Fonts.regular }]}
              placeholder="seu@email.com"
              placeholderTextColor={Marca.formIcon}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {aba !== 'recuperar' && (
              <>
                <Text style={[styles.rotulo, { fontFamily: Fonts.mono }]}>SENHA</Text>
                <TextInput
                  style={[styles.input, { fontFamily: Fonts.regular }]}
                  placeholder="••••••••"
                  placeholderTextColor={Marca.formIcon}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                />
              </>
            )}

            {aba === 'cadastro' && (
              <>
                <Text style={[styles.rotulo, { fontFamily: Fonts.mono }]}>CONFIRMAR SENHA</Text>
                <TextInput
                  style={[styles.input, { fontFamily: Fonts.regular }]}
                  placeholder="••••••••"
                  placeholderTextColor={Marca.formIcon}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  secureTextEntry
                />

                <Text style={[styles.rotulo, { fontFamily: Fonts.mono }]}>TIPO DE CONTA</Text>
                <View style={styles.tipoGrupo}>
                  <TouchableOpacity
                    style={[styles.tipoBotao, tipo === 'cliente' && styles.tipoBotaoAtivo]}
                    onPress={() => setTipo('cliente')}>
                    <Ionicons
                      name="person-outline"
                      size={14}
                      color={tipo === 'cliente' ? Marca.formBg : Marca.formText}
                    />
                    <Text
                      style={[
                        styles.tipoTexto,
                        { fontFamily: Fonts.semibold, color: tipo === 'cliente' ? Marca.formBg : Marca.formText },
                      ]}>
                      Cliente
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tipoBotao, tipo === 'empresa' && styles.tipoBotaoAtivo]}
                    onPress={() => setTipo('empresa')}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color={tipo === 'empresa' ? Marca.formBg : Marca.formText}
                    />
                    <Text
                      style={[
                        styles.tipoTexto,
                        { fontFamily: Fonts.semibold, color: tipo === 'empresa' ? Marca.formBg : Marca.formText },
                      ]}>
                      Empresa
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.termosLinha}
                  onPress={() => setAceitouTermos((atual) => !atual)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={aceitouTermos ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={aceitouTermos ? Marca.tint : Marca.formIcon}
                  />
                  <Text style={[styles.termosTexto, { fontFamily: Fonts.regular }]}>
                    Li e aceito os termos de uso
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <Botao
              titulo={aba === 'entrar' ? 'Entrar' : aba === 'cadastro' ? 'Cadastrar' : 'Enviar link'}
              onPress={handleEnviar}
              carregando={carregando}
              style={{ marginTop: 20 }}
            />

            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <Emblema texto="Rede social de transparência ambiental" icone="leaf-outline" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Marca.heroBg },
  scroll: { flexGrow: 1 },
  hero: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 28, alignItems: 'flex-start' },
  heroIconCirculo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Marca.heroText,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitulo: { fontSize: 30, color: Marca.heroText },
  heroTag: { fontSize: 11, letterSpacing: 2, color: Marca.heroTagText, marginTop: 6, marginBottom: 20 },
  heroFrase: { fontSize: 16, color: Marca.heroText, lineHeight: 24 },
  formPainel: {
    flex: 1,
    backgroundColor: Marca.formBg,
    borderRadius: Radius,
    padding: 24,
    marginTop: -16,
  },
  formTitulo: { fontSize: 20, color: Marca.formText, marginBottom: 18 },
  abas: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Marca.formBorder, marginBottom: 20 },
  abaBotao: { marginRight: 24, paddingBottom: 10 },
  abaTexto: { fontSize: 12, letterSpacing: 1 },
  abaLinha: { height: 2, marginTop: 8, backgroundColor: Marca.tint },
  rotulo: { fontSize: 11, letterSpacing: 1, color: Marca.formIcon, marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: Marca.formBorder,
    color: Marca.formText,
    borderRadius: Radius,
    padding: 13,
    fontSize: 15,
    marginBottom: 10,
  },
  tipoGrupo: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  tipoBotao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Marca.formBorder,
    borderRadius: Radius,
    padding: 11,
  },
  tipoBotaoAtivo: { backgroundColor: Marca.tint, borderColor: Marca.tint },
  tipoTexto: { fontSize: 13 },
  termosLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 4 },
  termosTexto: { fontSize: 13, color: Marca.formText, flexShrink: 1 },
});