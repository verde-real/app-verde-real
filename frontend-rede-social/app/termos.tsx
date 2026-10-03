import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DATA_ATUALIZACAO_TERMOS, POLITICA_PRIVACIDADE, TERMOS_DE_USO } from 'verde-real-core';

import { Fonts, Marca, Radius } from '@/constants/theme';

type Aba = 'termos' | 'privacidade';

export default function TermosScreen() {
  const router = useRouter();
  const { aba: abaParam } = useLocalSearchParams<{ aba?: string }>();
  const [aba, setAba] = useState<Aba>(abaParam === 'privacidade' ? 'privacidade' : 'termos');
  const secoes = aba === 'termos' ? TERMOS_DE_USO : POLITICA_PRIVACIDADE;

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topo}>
        <TouchableOpacity onPress={voltar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={22} color={Marca.heroText} />
        </TouchableOpacity>
        <Text style={[styles.topoTitulo, { fontFamily: Fonts.bold }]}>Termos e privacidade</Text>
      </View>

      <View style={styles.painel}>
        <View style={styles.abas}>
          {(['termos', 'privacidade'] as Aba[]).map((item) => (
            <TouchableOpacity key={item} style={styles.abaBotao} onPress={() => setAba(item)}>
              <Text
                style={[
                  styles.abaTexto,
                  { fontFamily: Fonts.semibold, color: aba === item ? Marca.tint : Marca.formIcon },
                ]}>
                {item === 'termos' ? 'TERMOS DE USO' : 'PRIVACIDADE'}
              </Text>
              {aba === item && <View style={styles.abaLinha} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.conteudo}>
          <Text style={[styles.versao, { fontFamily: Fonts.mono }]}>
            ÚLTIMA ATUALIZAÇÃO: {DATA_ATUALIZACAO_TERMOS}
          </Text>
          {secoes.map((secao) => (
            <View key={secao.id}>
              <Text style={[styles.secaoTitulo, { fontFamily: Fonts.bold }]}>{secao.titulo}</Text>
              {secao.paragrafos.map((p, i) => (
                <Text key={i} style={[styles.paragrafo, { fontFamily: Fonts.regular }]}>
                  {p}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Marca.heroBg },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  topoTitulo: { fontSize: 20, color: Marca.heroText },
  painel: { flex: 1, backgroundColor: Marca.formBg, borderRadius: Radius, paddingHorizontal: 24, paddingTop: 20 },
  abas: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Marca.formBorder, marginBottom: 16 },
  abaBotao: { marginRight: 24, paddingBottom: 10 },
  abaTexto: { fontSize: 12, letterSpacing: 1 },
  abaLinha: { height: 2, marginTop: 8, backgroundColor: Marca.tint },
  conteudo: { paddingBottom: 40 },
  versao: { fontSize: 11, letterSpacing: 1, color: Marca.formIcon, marginBottom: 8 },
  secaoTitulo: { fontSize: 15, color: Marca.formSecondary, marginTop: 16, marginBottom: 6 },
  paragrafo: { fontSize: 14, lineHeight: 22, color: Marca.formText, marginBottom: 8 },
});