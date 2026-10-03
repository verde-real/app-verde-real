import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { avaliarSenha } from 'verde-real-core';

import { Fonts, Marca, Radius } from '@/constants/theme';

const COR_OK = '#2e7d32';
const COR_BARRAS = ['#ef5350', '#ffa726', '#66bb6a']; // fraca, média, forte (igual ao site)
const COR_TRILHO = '#d8e6e1';

/** Campo de senha com botão de mostrar/ocultar. */
export function CampoSenha({
  value,
  onChangeText,
  placeholder = '••••••••',
}: {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <View style={styles.campo}>
      <TextInput
        style={[styles.input, { fontFamily: Fonts.regular }]}
        placeholder={placeholder}
        placeholderTextColor={Marca.formIcon}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visivel}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.olho}
        onPress={() => setVisivel((v) => !v)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}>
        <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={20} color={Marca.formIcon} />
      </TouchableOpacity>
    </View>
  );
}

/** Barras (vermelho/amarelo/verde) + lista do que falta, usando a regra do core. */
export function ChecklistSenha({ senha }: { senha: string }) {
  const av = useMemo(() => avaliarSenha(senha), [senha]);
  return (
    <View style={styles.checklist}>
      <View style={styles.barras}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.barra, av.nivel > i && { backgroundColor: COR_BARRAS[av.nivel - 1] }]}
          />
        ))}
      </View>
      {av.nivel > 0 && (
        <Text style={[styles.rotulo, { fontFamily: Fonts.semibold }]}>Senha {av.rotulo.toLowerCase()}</Text>
      )}
      {av.requisitos.map((r) => (
        <View key={r.id} style={styles.requisito}>
          <Ionicons
            name={r.atendido ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={r.atendido ? COR_OK : Marca.formIcon}
          />
          <Text
            style={[
              styles.requisitoTexto,
              {
                fontFamily: r.atendido ? Fonts.semibold : Fonts.regular,
                color: r.atendido ? COR_OK : Marca.formIcon,
              },
            ]}>
            {r.texto}
            {r.atendido ? ' (ok)' : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** "As senhas coincidem / não coincidem". Não aparece enquanto a confirmação está vazia. */
export function AvisoConfirmacao({ senha, confirmar }: { senha: string; confirmar: string }) {
  if (!confirmar) return null;
  const ok = senha === confirmar;
  return (
    <Text style={[styles.confirmacao, { fontFamily: Fonts.semibold, color: ok ? COR_OK : Marca.danger }]}>
      {ok ? '✔ As senhas coincidem' : '✖ As senhas ainda não coincidem'}
    </Text>
  );
}

const styles = StyleSheet.create({
  campo: { position: 'relative', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: Marca.formBorder,
    color: Marca.formText,
    borderRadius: Radius,
    padding: 13,
    paddingRight: 46,
    fontSize: 15,
  },
  olho: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklist: { marginBottom: 10, gap: 4 },
  barras: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  barra: { flex: 1, height: 3, backgroundColor: COR_TRILHO },
  rotulo: { fontSize: 12, color: Marca.formSecondary },
  requisito: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  requisitoTexto: { fontSize: 12 },
  confirmacao: { fontSize: 12, marginBottom: 10 },
});