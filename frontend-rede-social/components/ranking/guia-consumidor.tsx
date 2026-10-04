import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Cartao } from '@/src/components/ui/Cartao';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { TituloSecao } from './titulo-secao';

interface CartaoCdc {
  icone: keyof typeof Ionicons.glyphMap;
  referencia: string;
  titulo: string;
  paragrafos: string[];
}

const CARTOES: CartaoCdc[] = [
  {
    icone: 'megaphone-outline',
    referencia: 'Art. 37, § 1º, do CDC',
    titulo: 'O que é publicidade enganosa?',
    paragrafos: [
      'É considerada enganosa qualquer comunicação publicitária falsa, total ou parcialmente, ou que, por qualquer outro modo, seja capaz de induzir o consumidor ao erro sobre o preço, a qualidade, a quantidade ou as características de um produto ou serviço.',
      'Reconhecer esse tipo de informação ajuda o consumidor a evitar decisões equivocadas.',
    ],
  },
  {
    icone: 'eye-off-outline',
    referencia: 'Art. 37, § 3º, do CDC',
    titulo: 'O direito à informação clara',
    paragrafos: [
      'Uma publicidade também pode ser considerada enganosa quando omite informações essenciais sobre um produto ou serviço.',
      'A ausência de informações relevantes pode criar expectativas equivocadas e comprometer a decisão de compra. Por isso, a transparência e a apresentação de informações completas são fundamentais nas campanhas publicitárias.',
    ],
  },
  {
    icone: 'newspaper-outline',
    referencia: 'Arts. 56, XII, e 60 do CDC',
    titulo: 'Correção de informações enganosas',
    paragrafos: [
      'O Código de Defesa do Consumidor prevê a possibilidade de aplicação de contrapropaganda ao fornecedor que incorrer na prática de publicidade enganosa ou abusiva.',
      'Essa medida busca corrigir publicamente a informação veiculada de forma irregular, utilizando meios de comunicação compatíveis com aqueles empregados na publicidade original. Ela depende da apuração do caso pelos órgãos competentes e não decorre automaticamente de toda denúncia.',
    ],
  },
  {
    icone: 'document-text-outline',
    referencia: 'Art. 38 do CDC',
    titulo: 'Quem deve comprovar a publicidade?',
    paragrafos: [
      'O ônus da prova da veracidade e da correção da informação ou comunicação publicitária cabe a quem a patrocina.',
      'Isso significa que a responsabilidade de comprovar a veracidade das informações anunciadas é do anunciante, e não do consumidor. Esse direito protege o consumidor diante de possíveis práticas publicitárias enganosas.',
    ],
  },
];

export function GuiaConsumidor() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const corReferencia = scheme === 'dark' ? cores.accent : cores.secondary;

  return (
    <View>
      <TituloSecao
        icone="library-outline"
        titulo="Guia do Consumidor Consciente"
        subtitulo="Código de Defesa do Consumidor (CDC — Lei nº 8.078/1990)"
      />

      <View style={styles.lista}>
        {CARTOES.map((c) => (
          <Cartao key={c.referencia} comSombra={false}>
            <View style={styles.cabecalho}>
              <View style={[styles.icone, { backgroundColor: cores.tintSoft }]}>
                <Ionicons name={c.icone} size={18} color={cores.tint} />
              </View>
              <Text style={[styles.referencia, { color: corReferencia, fontFamily: Fonts.mono }]}>{c.referencia}</Text>
            </View>
            <Text style={[styles.titulo, { color: cores.text, fontFamily: Fonts.bold }]}>{c.titulo}</Text>
            {c.paragrafos.map((texto) => (
              <Text key={texto} style={[styles.texto, { color: cores.text, fontFamily: Fonts.regular }]}>
                {texto}
              </Text>
            ))}
          </Cartao>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 12 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  icone: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  referencia: { fontSize: 11, letterSpacing: 0.4, flexShrink: 1 },
  titulo: { fontSize: 15, marginBottom: 6 },
  texto: { fontSize: 13, lineHeight: 20, marginTop: 6 },
});