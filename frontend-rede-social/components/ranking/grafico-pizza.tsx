import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface FatiaPizza {
  rotulo: string;
  total: number;
  cor: string;
}

const TAMANHO = 220;
const RAIO = 104;
const CENTRO = TAMANHO / 2;

function pontoNoCirculo(angulo: number) {
  // 0 rad = topo do círculo, sentido horário
  return { x: CENTRO + RAIO * Math.sin(angulo), y: CENTRO - RAIO * Math.cos(angulo) };
}

function caminhoFatia(inicio: number, fim: number) {
  const a = pontoNoCirculo(inicio);
  const b = pontoNoCirculo(fim);
  const arcoGrande = fim - inicio > Math.PI ? 1 : 0;
  return `M ${CENTRO} ${CENTRO} L ${a.x} ${a.y} A ${RAIO} ${RAIO} 0 ${arcoGrande} 1 ${b.x} ${b.y} Z`;
}

function formatarPercentual(valor: number) {
  // Uma casa decimal, com vírgula (padrão brasileiro); sem ",0" quando for inteiro.
  const arredondado = Math.round(valor * 10) / 10;
  return `${String(arredondado).replace('.', ',')}%`;
}

/** Gráfico de pizza interativo: tocar numa fatia mostra o nome da categoria e sua porcentagem. */
export function GraficoPizza({ fatias }: { fatias: FatiaPizza[] }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const [selecionada, setSelecionada] = useState<string | null>(null);

  const comDados = fatias.filter((f) => f.total > 0);
  const soma = comDados.reduce((s, f) => s + f.total, 0);

  let acumulado = 0;
  const desenhadas = comDados.map((f) => {
    const inicio = (acumulado / soma) * 2 * Math.PI;
    acumulado += f.total;
    const fim = (acumulado / soma) * 2 * Math.PI;
    return { ...f, inicio, fim, percentual: (f.total / soma) * 100 };
  });

  const atual = desenhadas.find((f) => f.rotulo === selecionada) ?? null;

  const alternar = (rotulo: string) => setSelecionada((s) => (s === rotulo ? null : rotulo));
  const opacidade = (rotulo: string) => (selecionada === null || selecionada === rotulo ? 1 : 0.35);

  return (
    <View style={styles.container}>
      {/* Área fixa para o detalhe da fatia: o gráfico não "pula" ao tocar. */}
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.detalhe,
          { borderColor: atual ? atual.cor : cores.border, backgroundColor: cores.cardAlt },
        ]}>
        {atual ? (
          <>
            <View style={[styles.cor, { backgroundColor: atual.cor }]} />
            <Text style={[styles.detalheNome, { color: cores.text, fontFamily: Fonts.bold }]} numberOfLines={1}>
              {atual.rotulo}
            </Text>
            <Text style={[styles.detalhePercentual, { color: cores.tint, fontFamily: Fonts.bold }]}>
              {formatarPercentual(atual.percentual)}
            </Text>
          </>
        ) : (
          <Text style={[styles.dica, { color: cores.icon, fontFamily: Fonts.regular }]}>
            Toque em uma fatia para ver os detalhes.
          </Text>
        )}
      </View>

      <Svg width={TAMANHO} height={TAMANHO} viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}>
        {desenhadas.length === 1 ? (
          // Uma única categoria: um arco de 360° não pode ser desenhado como caminho.
          <Circle
            cx={CENTRO}
            cy={CENTRO}
            r={RAIO}
            fill={desenhadas[0].cor}
            opacity={opacidade(desenhadas[0].rotulo)}
            onPress={() => alternar(desenhadas[0].rotulo)}
          />
        ) : (
          desenhadas.map((f) => (
            <Path
              key={f.rotulo}
              d={caminhoFatia(f.inicio, f.fim)}
              fill={f.cor}
              opacity={opacidade(f.rotulo)}
              stroke={cores.card}
              strokeWidth={2}
              onPress={() => alternar(f.rotulo)}
            />
          ))
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16 },
  detalhe: {
    alignSelf: 'stretch',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius,
    paddingHorizontal: 14,
  },
  cor: { width: 12, height: 12 },
  detalheNome: { fontSize: 15, flexShrink: 1 },
  detalhePercentual: { fontSize: 18 },
  dica: { fontSize: 12 },
});