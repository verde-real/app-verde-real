import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EstadoVazio } from '@/components/estado-vazio';
import { Botao } from '@/src/components/ui/Botao';
import { Cartao } from '@/src/components/ui/Cartao';
import { Emblema } from '@/src/components/ui/Emblema';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { buscarSelosDaEmpresa, Selo } from '@/src/services/selos';
import { supabase } from '@/src/services/supabase';
import {
  ROTULO_STATUS_SOLICITACAO,
  SolicitacaoSelo,
  criarServicoSolicitacaoSelo,
  ehEmpresa,
  solicitacaoEstaAberta,
  StatusSolicitacaoSelo,
} from 'verde-real-core';

const servicoSolicitacao = criarServicoSolicitacaoSelo(supabase as any);

function formatarDataBR(dataISO: string | null | undefined): string {
  if (!dataISO) return 'Não informado';
  const [ano, mes, dia] = dataISO.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}/${ano}`;
}

function iconePorStatus(status: StatusSolicitacaoSelo): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'aprovada':
      return 'checkmark-circle-outline';
    case 'reprovada':
      return 'close-circle-outline';
    case 'cancelada':
      return 'ban-outline';
    case 'auditoria_agendada':
      return 'calendar-outline';
    default:
      return 'time-outline';
  }
}

export default function SolicitarSeloScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const router = useRouter();
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selos, setSelos] = useState<Selo[]>([]);
  const [solicitacaoAtual, setSolicitacaoAtual] = useState<SolicitacaoSelo | null>(null);

  const podeAcessar = !!usuario && ehEmpresa(usuario);

  const carregar = useCallback(async () => {
    if (!usuario || !podeAcessar) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const [listaSelos, solicitacao] = await Promise.all([
        buscarSelosDaEmpresa(usuario.id),
        servicoSolicitacao.buscarSolicitacaoAtual(usuario.id),
      ]);
      setSelos(listaSelos);
      setSolicitacaoAtual(solicitacao);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar as informações do selo.');
    } finally {
      setCarregando(false);
    }
  }, [usuario, podeAcessar]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const seloAtivo = useMemo(() => selos.find((s) => s.status === 'ativo') ?? null, [selos]);
  const solicitacaoAberta =
    solicitacaoAtual && solicitacaoEstaAberta(solicitacaoAtual.status) ? solicitacaoAtual : null;

  function handleSolicitarAuditoria() {
    router.push('/solicitar-selo-form' as any);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={cores.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>Solicitar Selo</Text>
        <View style={{ width: 22 }} />
      </View>

      {!podeAcessar ? (
        <EstadoVazio
          icone="lock-closed-outline"
          titulo="Área exclusiva para empresas"
          descricao="O Selo Verde Real é solicitado apenas por contas empresariais."
        />
      ) : carregando ? (
        <ActivityIndicator size="large" color={cores.tint} style={{ marginTop: 40 }} />
      ) : erro ? (
        <Cartao style={{ margin: 20 }}>
          <Text style={{ color: cores.danger, fontFamily: Fonts.semibold, marginBottom: 8 }}>{erro}</Text>
          <Botao titulo="Tentar novamente" variante="secundario" onPress={carregar} />
        </Cartao>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {seloAtivo ? (
            <Cartao>
              <View style={styles.linhaTitulo}>
                <Ionicons name="ribbon-outline" size={20} color={cores.accent} />
                <Text style={[styles.tituloCartao, { color: cores.text, fontFamily: Fonts.bold }]}>
                  Selo Verde Real ativo
                </Text>
              </View>

              <View style={styles.badges}>
                <Emblema texto={seloAtivo.nivel.toUpperCase()} variante="destaque" icone="trophy-outline" />
                <Emblema texto="Ativo" icone="checkmark-circle-outline" />
              </View>

              <CampoInfo label="Válido até" valor={formatarDataBR(seloAtivo.validade)} cores={cores} />
              <CampoInfo label="Concedido em" valor={formatarDataBR(seloAtivo.criadoEm)} cores={cores} />

              <Text style={[styles.notaRodape, { color: cores.icon, fontFamily: Fonts.regular }]}>
                Outras informações do selo, como certificações e metas registradas na auditoria, ainda não
                estão disponíveis nesta tela.
              </Text>
            </Cartao>
          ) : solicitacaoAberta ? (
            <Cartao>
              <View style={styles.linhaTitulo}>
                <Ionicons name={iconePorStatus(solicitacaoAberta.status)} size={20} color={cores.tint} />
                <Text style={[styles.tituloCartao, { color: cores.text, fontFamily: Fonts.bold }]}>
                  {ROTULO_STATUS_SOLICITACAO[solicitacaoAberta.status]}
                </Text>
              </View>

              <CampoInfo label="Data da solicitação" valor={formatarDataBR(solicitacaoAberta.criadoEm)} cores={cores} />
              <CampoInfo label="Plano" valor={solicitacaoAberta.plano} cores={cores} />
              <CampoInfo label="Data da auditoria" valor={formatarDataBR(solicitacaoAberta.dataAuditoria)} cores={cores} />
              <CampoInfo label="Local da auditoria" valor={solicitacaoAberta.localAuditoria} cores={cores} />

              <Text style={[styles.mensagemStatus, { color: cores.secondary, fontFamily: Fonts.regular }]}>
                Sua documentação foi recebida e está sendo analisada.
              </Text>
            </Cartao>
          ) : (
            <>
              <Cartao>
                <Text style={[styles.tituloCartao, { color: cores.text, fontFamily: Fonts.bold, marginBottom: 10 }]}>
                  Selo Verde Real
                </Text>
                <Text style={[styles.paragrafo, { color: cores.secondary, fontFamily: Fonts.regular }]}>
                  O Selo Verde Real reconhece empresas comprometidas com práticas ambientais sustentáveis,
                  avaliadas por uma auditoria independente.
                </Text>
                <Text style={[styles.paragrafo, { color: cores.secondary, fontFamily: Fonts.regular }]}>
                  Para solicitar, sua empresa vai precisar informar dados cadastrais, enviar documentos
                  (certificações, licenças ou comprovações de metas ambientais), e escolher uma data e um
                  local para a auditoria.
                </Text>
                <Text style={[styles.paragrafo, { color: cores.secondary, fontFamily: Fonts.regular }]}>
                  Depois do envio, a solicitação entra em análise e o andamento ocorre em até 4 dias úteis.
                  Você pode acompanhar o status nesta mesma página.
                </Text>

                {solicitacaoAtual && (
                  <Text style={[styles.notaRodape, { color: cores.icon, fontFamily: Fonts.regular, marginBottom: 14 }]}>
                    Última solicitação: {ROTULO_STATUS_SOLICITACAO[solicitacaoAtual.status]} (
                    {formatarDataBR(solicitacaoAtual.criadoEm)}).
                  </Text>
                )}

                <Botao titulo="Solicitar auditoria" onPress={handleSolicitarAuditoria} />
              </Cartao>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CampoInfo({ label, valor, cores }: { label: string; valor: string; cores: typeof Colors.light }) {
  return (
    <View style={styles.campo}>
      <Text style={[styles.campoLabel, { color: cores.icon, fontFamily: Fonts.mono }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.campoValor, { color: cores.text, fontFamily: Fonts.semibold }]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitulo: { fontSize: 16 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tituloCartao: { fontSize: 16 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  campo: { marginBottom: 12 },
  campoLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: 2 },
  campoValor: { fontSize: 14 },
  paragrafo: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  mensagemStatus: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  notaRodape: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});