import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/theme';

const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const NOMES_DIA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

interface CalendarioCompactoProps {
  valorSelecionado: string | null;
  aoSelecionar: (iso: string) => void;
  cores: typeof Colors.light;
  dataMinima?: Date;
}

export function CalendarioCompacto({ valorSelecionado, aoSelecionar, cores, dataMinima }: CalendarioCompactoProps) {
  const hoje = useMemo(() => inicioDoDia(new Date()), []);
  const minimo = dataMinima ? inicioDoDia(dataMinima) : hoje;

  const inicial = valorSelecionado ? new Date(`${valorSelecionado}T00:00:00`) : minimo;
  const [mesExibido, setMesExibido] = useState(new Date(inicial.getFullYear(), inicial.getMonth(), 1));

  const celulas = useMemo(() => {
    const primeiroDiaSemana = mesExibido.getDay();
    const diasNoMes = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 0).getDate();
    const lista: (Date | null)[] = [];
    for (let i = 0; i < primeiroDiaSemana; i++) lista.push(null);
    for (let dia = 1; dia <= diasNoMes; dia++) {
      lista.push(new Date(mesExibido.getFullYear(), mesExibido.getMonth(), dia));
    }
    while (lista.length % 7 !== 0) lista.push(null);
    return lista;
  }, [mesExibido]);

  function mudarMes(delta: number) {
    setMesExibido((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1));
  }

  return (
    <View style={[styles.container, { borderColor: cores.border }]}>
      <View style={styles.topo}>
        <TouchableOpacity onPress={() => mudarMes(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={18} color={cores.text} />
        </TouchableOpacity>
        <Text style={[styles.mesTitulo, { color: cores.text, fontFamily: Fonts.semibold }]}>
          {NOMES_MES[mesExibido.getMonth()]} {mesExibido.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => mudarMes(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-forward" size={18} color={cores.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.linhaSemana}>
        {NOMES_DIA_SEMANA.map((d, i) => (
          <Text key={i} style={[styles.diaSemanaTexto, { color: cores.icon, fontFamily: Fonts.mono }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grade}>
        {celulas.map((data, indice) => {
          if (!data) return <View key={indice} style={styles.celula} />;
          const iso = paraISO(data);
          const desabilitado = data < minimo;
          const selecionado = iso === valorSelecionado;
          const ehHoje = iso === paraISO(hoje);

          return (
            <TouchableOpacity
              key={indice}
              style={styles.celula}
              disabled={desabilitado}
              onPress={() => aoSelecionar(iso)}>
              <View
                style={[
                  styles.diaBolha,
                  selecionado && { backgroundColor: cores.tint },
                  !selecionado && ehHoje && { borderWidth: 1, borderColor: cores.tint },
                ]}>
                <Text
                  style={[
                    styles.diaTexto,
                    { fontFamily: Fonts.regular },
                    desabilitado ? { color: cores.icon, opacity: 0.4 } : { color: selecionado ? cores.card : cores.text },
                  ]}>
                  {data.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: Radius, padding: 10 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 8 },
  mesTitulo: { fontSize: 13 },
  linhaSemana: { flexDirection: 'row' },
  diaSemanaTexto: { flex: 1, textAlign: 'center', fontSize: 10 },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  diaBolha: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  diaTexto: { fontSize: 12 },
});