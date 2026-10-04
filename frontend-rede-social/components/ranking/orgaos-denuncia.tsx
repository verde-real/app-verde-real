import { Ionicons } from '@expo/vector-icons';
import { openBrowserAsync } from 'expo-web-browser';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Cartao } from '@/src/components/ui/Cartao';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { TituloSecao } from './titulo-secao';

const URL_CONAR = 'https://www.conar.org.br';
const URL_PROCON = 'https://www.procon.sp.gov.br/';

const QUANDO_DENUNCIAR = [
  'Anúncios com informações possivelmente falsas ou enganosas.',
  'Omissão de informações essenciais sobre produtos ou serviços.',
  'Práticas publicitárias que possam prejudicar os direitos dos consumidores.',
];

const COMO_SE_PREPARAR = [
  'Reúna informações sobre o anúncio ou a publicidade.',
  'Guarde registros e documentos relacionados ao caso, quando disponíveis.',
  'Identifique o anunciante ou fornecedor envolvido.',
  'Descreva o ocorrido de maneira clara e objetiva.',
];

function ListaMarcadores({ itens }: { itens: string[] }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  return (
    <View style={{ gap: 6 }}>
      {itens.map((item) => (
        <View key={item} style={styles.itemLista}>
          <View style={[styles.marcador, { backgroundColor: cores.tint }]} />
          <Text style={[styles.texto, styles.textoItem, { color: cores.text, fontFamily: Fonts.regular }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function OrgaosDenuncia() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];

  const estiloTitulo = [styles.titulo, { color: cores.text, fontFamily: Fonts.bold }];
  const estiloTexto = [styles.texto, { color: cores.text, fontFamily: Fonts.regular }];
  const estiloSubtitulo = [styles.subtituloLista, { color: cores.text, fontFamily: Fonts.semibold }];

  return (
    <View>
      <TituloSecao
        icone="shield-checkmark-outline"
        titulo="Como e Onde Denunciar Publicidade Enganosa"
        subtitulo="Conheça o papel dos órgãos de fiscalização e regulamentação da publicidade e saiba como buscar os canais oficiais de denúncia, além do nosso aplicativo."
      />

      <View style={styles.lista}>
        <Cartao comSombra={false}>
          <Text style={estiloTitulo}>CONAR — Conselho Nacional de Autorregulamentação Publicitária</Text>
          <Text style={estiloTexto}>
            O CONAR atua na defesa da ética na publicidade brasileira, buscando garantir que os anúncios respeitem
            princípios de honestidade, transparência e veracidade das informações divulgadas.
          </Text>
          <Text style={estiloTexto}>
            O órgão recebe denúncias relacionadas a anúncios publicitários e pode recomendar a alteração ou a suspensão de
            campanhas que desrespeitem as normas de autorregulamentação publicitária.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openBrowserAsync(URL_CONAR)}
            accessibilityRole="link"
            accessibilityLabel="Abrir o site oficial do CONAR"
            style={[styles.botaoLink, { borderColor: cores.tint }]}>
            <Ionicons name="open-outline" size={14} color={cores.tint} />
            <Text style={[styles.textoLink, { color: cores.tint, fontFamily: Fonts.semibold }]}>
              Site oficial do CONAR
            </Text>
          </TouchableOpacity>
        </Cartao>

        <Cartao comSombra={false}>
          <Text style={estiloTitulo}>PROCON — Proteção e Defesa do Consumidor</Text>
          <Text style={estiloTexto}>
            Os Procons são órgãos de proteção e defesa do consumidor que atuam na orientação dos cidadãos, na fiscalização
            das relações de consumo e na aplicação das medidas administrativas previstas na legislação.
          </Text>
          <Text style={estiloTexto}>
            Entre suas atribuições estão a apuração de possíveis infrações ao Código de Defesa do Consumidor e a aplicação
            de sanções administrativas, que podem incluir multas, conforme a legislação aplicável.
          </Text>
          <Text style={estiloTexto}>
            É possível procurar o Procon para registrar reclamações e denúncias relacionadas a práticas que possam violar
           os direitos do consumidor. Os procedimentos e os canais de atendimento podem variar de acordo com o estado ou
            o município.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openBrowserAsync(URL_PROCON)}
            accessibilityRole="link"
            accessibilityLabel="Abrir o site do Procon de São Paulo"
            style={[styles.botaoLink, { borderColor: cores.tint }]}>
            <Ionicons name="open-outline" size={14} color={cores.tint} />
            <Text style={[styles.textoLink, { color: cores.tint, fontFamily: Fonts.semibold }]}>
              Site do Procon-SP
            </Text>
          </TouchableOpacity>
        </Cartao>

        <Cartao comSombra={false}>
          <Text style={estiloTitulo}>Orientações para denúncias formais</Text>

          <Text style={estiloSubtitulo}>Quando denunciar</Text>
          <ListaMarcadores itens={QUANDO_DENUNCIAR} />

          <Text style={estiloSubtitulo}>Como se preparar</Text>
          <ListaMarcadores itens={COMO_SE_PREPARAR} />

          <Text style={estiloSubtitulo}>Onde buscar atendimento</Text>
          <ListaMarcadores
            itens={[
              'CONAR, por meio de seus canais oficiais de denúncia.',
              'Procon do estado ou do município, por meio dos canais de atendimento disponibilizados pelo órgão responsável.',
            ]}
          />

          <Text style={[styles.aviso, { color: cores.text, fontFamily: Fonts.regular, borderTopColor: cores.border }]}>
            Esta é uma orientação introdutória e não substitui o atendimento ou a análise realizada pelos órgãos
            competentes.
          </Text>
        </Cartao>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 12 },
  titulo: { fontSize: 15, lineHeight: 21, marginBottom: 4 },
  texto: { fontSize: 13, lineHeight: 20, marginTop: 6 },
  textoItem: { flex: 1, marginTop: 0 },
  subtituloLista: { fontSize: 13, marginTop: 14, marginBottom: 8 },
  itemLista: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  marcador: { width: 6, height: 6, marginTop: 7 },
  botaoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  textoLink: { fontSize: 12 },
  aviso: { fontSize: 11, lineHeight: 17, marginTop: 16, paddingTop: 12, borderTopWidth: 1 },
});