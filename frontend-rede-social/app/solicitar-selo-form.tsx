import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

import { Botao } from '@/src/components/ui/Botao';
import { Cartao } from '@/src/components/ui/Cartao';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/contexts/AuthContext';
import { ArquivoSelecionado, selecionarDocumentos } from '@/src/services/documentos-selo';
import { supabase } from '@/src/services/supabase';
import {
  DadosEmpresaSolicitacao,
  ErroValidacaoSolicitacao,
  ROTULO_TIPO_DOCUMENTO,
  TipoDocumentoSelo,
  formatarCNPJ,
  validarDadosEmpresa,
  validarDocumentos,
} from 'verde-real-core';

type Etapa = 1 | 2 | 3 | 4;

const ROTULOS_ETAPA: Record<Etapa, string> = {
  1: 'Dados da empresa',
  2: 'Documentos',
  3: 'Auditoria',
  4: 'Pagamento',
};

const TIPOS_DOCUMENTO: TipoDocumentoSelo[] = [
  'certificacao_ambiental',
  'licenca',
  'contrato',
  'comprovacao_metas',
  'outro',
];

function vazioDadosEmpresa(): DadosEmpresaSolicitacao {
  return {
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
    responsavelNome: '',
    responsavelCargo: '',
    informacoesAdicionais: '',
  };
}

function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d{4})(\d{0,4})$/, (_, a, b, c) => (c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : `(${a}`));
  }
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})$/, (_, a, b, c) => (c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`));
}

function formatarCEP(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 8);
  return d.replace(/^(\d{5})(\d{0,3})$/, (_, a, b) => (b ? `${a}-${b}` : a));
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconePorMime(mimeType: string): keyof typeof Ionicons.glyphMap {
  return mimeType === 'application/pdf' ? 'document-text-outline' : 'image-outline';
}

export default function SolicitarSeloFormScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cores = Colors[scheme];
  const router = useRouter();
  const { usuario } = useAuth();

  const [etapa, setEtapa] = useState<Etapa>(1);

  // Etapa 1
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresaSolicitacao>(vazioDadosEmpresa());
  const [errosEmpresa, setErrosEmpresa] = useState<ErroValidacaoSolicitacao[]>([]);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  // Etapa 2
  const [documentos, setDocumentos] = useState<ArquivoSelecionado[]>([]);
  const [errosDocumentos, setErrosDocumentos] = useState<string[]>([]);
  const [adicionandoDocumento, setAdicionandoDocumento] = useState(false);

  const mapaErrosEmpresa = useMemo(() => {
    const mapa: Record<string, string> = {};
    errosEmpresa.forEach((e) => {
      if (!mapa[e.campo]) mapa[e.campo] = e.mensagem;
    });
    return mapa;
  }, [errosEmpresa]);

  useEffect(() => {
    if (!usuario) return;
    setDadosEmpresa((atual) => ({
      ...atual,
      nomeFantasia: atual.nomeFantasia || usuario.nome || '',
      email: atual.email || usuario.email || '',
    }));

    (async () => {
      try {
        const { data } = await supabase.from('profiles').select('telefone').eq('id', usuario.id).single();
        if (data?.telefone) {
          setDadosEmpresa((atual) => ({ ...atual, telefone: atual.telefone || formatarTelefone(data.telefone) }));
        }
      } catch {
        // Sugestão de preenchimento é best-effort; se falhar, o campo continua vazio e editável.
      } finally {
        setCarregandoPerfil(false);
      }
    })();
  }, [usuario]);

  function atualizarCampoEmpresa<K extends keyof DadosEmpresaSolicitacao>(
    campo: K,
    valor: DadosEmpresaSolicitacao[K]
  ) {
    setDadosEmpresa((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleAdicionarDocumentos() {
    setAdicionandoDocumento(true);
    try {
      const novos = await selecionarDocumentos();
      if (novos.length > 0) {
        setDocumentos((atual) => [...atual, ...novos]);
        setErrosDocumentos([]);
      }
    } catch (error) {
      Alert.alert('Ops', error instanceof Error ? error.message : 'Não foi possível selecionar o arquivo.');
    } finally {
      setAdicionandoDocumento(false);
    }
  }

  function handleRemoverDocumento(indice: number) {
    setDocumentos((atual) => atual.filter((_, i) => i !== indice));
  }

  function handleAlterarTipoDocumento(indice: number, tipo: TipoDocumentoSelo) {
    setDocumentos((atual) => atual.map((doc, i) => (i === indice ? { ...doc, tipo } : doc)));
  }

  function handleContinuar() {
    if (etapa === 1) {
      const erros = validarDadosEmpresa(dadosEmpresa);
      setErrosEmpresa(erros);
      if (erros.length > 0) return;
      setEtapa(2);
      return;
    }
    if (etapa === 2) {
      const erros = validarDocumentos(documentos);
      if (erros.length > 0) {
        setErrosDocumentos(erros.map((e) => e.mensagem));
        return;
      }
      setErrosDocumentos([]);
      setEtapa(3);
      return;
    }
    setEtapa((atual) => Math.min(4, atual + 1) as Etapa);
  }

  function handleVoltar() {
    if (etapa === 1) {
      router.back();
      return;
    }
    setEtapa((atual) => (atual - 1) as Etapa);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cores.background }]} edges={['top']}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { borderBottomColor: cores.border }]}>
        <TouchableOpacity onPress={handleVoltar} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={cores.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>
          Solicitação de auditoria
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.indicador}>
        {([1, 2, 3, 4] as Etapa[]).map((n, i) => (
          <React.Fragment key={n}>
            <View style={styles.indicadorItem}>
              <View
                style={[
                  styles.indicadorBolha,
                  {
                    borderColor: n <= etapa ? cores.tint : cores.border,
                    backgroundColor: n === etapa ? cores.tint : 'transparent',
                  },
                ]}>
                <Text
                  style={[
                    styles.indicadorNumero,
                    { color: n === etapa ? cores.card : n < etapa ? cores.tint : cores.icon, fontFamily: Fonts.bold },
                  ]}>
                  {n}
                </Text>
              </View>
              <Text
                style={[
                  styles.indicadorLabel,
                  { color: n <= etapa ? cores.text : cores.icon, fontFamily: Fonts.mono },
                ]}
                numberOfLines={1}>
                {ROTULOS_ETAPA[n].toUpperCase()}
              </Text>
            </View>
            {i < 3 && <View style={[styles.indicadorLinha, { backgroundColor: n < etapa ? cores.tint : cores.border }]} />}
          </React.Fragment>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {etapa === 1 ? (
            carregandoPerfil ? (
              <ActivityIndicator color={cores.tint} style={{ marginTop: 20 }} />
            ) : (
              <Cartao>
                <Campo
                  label="CNPJ"
                  valor={dadosEmpresa.cnpj}
                  onChangeText={(v) => atualizarCampoEmpresa('cnpj', formatarCNPJ(v))}
                  erro={mapaErrosEmpresa.cnpj}
                  cores={cores}
                  keyboardType="numeric"
                  placeholder="00.000.000/0000-00"
                />
                <Campo
                  label="Razão social"
                  valor={dadosEmpresa.razaoSocial}
                  onChangeText={(v) => atualizarCampoEmpresa('razaoSocial', v)}
                  erro={mapaErrosEmpresa.razaoSocial}
                  cores={cores}
                  placeholder="Razão social da empresa"
                />
                <Campo
                  label="Nome fantasia"
                  valor={dadosEmpresa.nomeFantasia}
                  onChangeText={(v) => atualizarCampoEmpresa('nomeFantasia', v)}
                  erro={mapaErrosEmpresa.nomeFantasia}
                  cores={cores}
                  placeholder="Nome fantasia"
                />
                <Campo
                  label="E-mail empresarial"
                  valor={dadosEmpresa.email}
                  onChangeText={(v) => atualizarCampoEmpresa('email', v)}
                  erro={mapaErrosEmpresa.email}
                  cores={cores}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="contato@empresa.com"
                />
                <Campo
                  label="Telefone empresarial"
                  valor={dadosEmpresa.telefone}
                  onChangeText={(v) => atualizarCampoEmpresa('telefone', formatarTelefone(v))}
                  erro={mapaErrosEmpresa.telefone}
                  cores={cores}
                  keyboardType="numeric"
                  placeholder="(00) 00000-0000"
                />
                <Campo
                  label="CEP"
                  valor={dadosEmpresa.cep}
                  onChangeText={(v) => atualizarCampoEmpresa('cep', formatarCEP(v))}
                  erro={mapaErrosEmpresa.cep}
                  cores={cores}
                  keyboardType="numeric"
                  placeholder="00000-000"
                />
                <Campo
                  label="Endereço"
                  valor={dadosEmpresa.endereco}
                  onChangeText={(v) => atualizarCampoEmpresa('endereco', v)}
                  erro={mapaErrosEmpresa.endereco}
                  cores={cores}
                  placeholder="Rua, número, bairro"
                />
                <View style={styles.linhaDupla}>
                  <View style={{ flex: 2 }}>
                    <Campo
                      label="Cidade"
                      valor={dadosEmpresa.cidade}
                      onChangeText={(v) => atualizarCampoEmpresa('cidade', v)}
                      erro={mapaErrosEmpresa.cidade}
                      cores={cores}
                      placeholder="Cidade"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Campo
                      label="UF"
                      valor={dadosEmpresa.estado}
                      onChangeText={(v) => atualizarCampoEmpresa('estado', v.toUpperCase())}
                      erro={mapaErrosEmpresa.estado}
                      cores={cores}
                      autoCapitalize="characters"
                      maxLength={2}
                      placeholder="SP"
                    />
                  </View>
                </View>
                <Campo
                  label="Responsável pela solicitação"
                  valor={dadosEmpresa.responsavelNome}
                  onChangeText={(v) => atualizarCampoEmpresa('responsavelNome', v)}
                  erro={mapaErrosEmpresa.responsavelNome}
                  cores={cores}
                  placeholder="Nome completo"
                />
                <Campo
                  label="Cargo do responsável"
                  valor={dadosEmpresa.responsavelCargo}
                  onChangeText={(v) => atualizarCampoEmpresa('responsavelCargo', v)}
                  erro={mapaErrosEmpresa.responsavelCargo}
                  cores={cores}
                  placeholder="Ex.: Diretora de sustentabilidade"
                />
                <Campo
                  label="Informações adicionais (opcional)"
                  valor={dadosEmpresa.informacoesAdicionais ?? ''}
                  onChangeText={(v) => atualizarCampoEmpresa('informacoesAdicionais', v)}
                  cores={cores}
                  multiline
                  placeholder="Algo mais que devemos saber?"
                />
              </Cartao>
            )
          ) : etapa === 2 ? (
            <Cartao>
              <Text style={[styles.secaoTitulo, { color: cores.text, fontFamily: Fonts.bold }]}>
                Documentos da auditoria
              </Text>
              <Text style={[styles.secaoDesc, { color: cores.icon, fontFamily: Fonts.regular }]}>
                Envie certificações, licenças, contratos ou comprovações de metas ambientais. Aceitamos PDF,
                JPG e PNG, até 10 MB cada.
              </Text>

              {documentos.map((doc, indice) => (
                <View key={`${doc.nomeArquivo}-${indice}`} style={[styles.documentoLinha, { borderColor: cores.border }]}>
                  <View style={styles.documentoTopo}>
                    <Ionicons name={iconePorMime(doc.mimeType)} size={18} color={cores.tint} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.documentoNome, { color: cores.text, fontFamily: Fonts.semibold }]} numberOfLines={1}>
                        {doc.nomeArquivo}
                      </Text>
                      <Text style={[styles.documentoTamanho, { color: cores.icon, fontFamily: Fonts.mono }]}>
                        {formatarTamanho(doc.tamanhoBytes)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoverDocumento(indice)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={18} color={cores.danger} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipsLinha}>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <TouchableOpacity
                        key={tipo}
                        onPress={() => handleAlterarTipoDocumento(indice, tipo)}
                        style={[
                          styles.chip,
                          {
                            borderColor: doc.tipo === tipo ? cores.tint : cores.border,
                            backgroundColor: doc.tipo === tipo ? cores.tintSoft : 'transparent',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.chipTexto,
                            { color: doc.tipo === tipo ? cores.tint : cores.icon, fontFamily: Fonts.mono },
                          ]}>
                          {ROTULO_TIPO_DOCUMENTO[tipo].toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <Botao
                titulo="Adicionar documento"
                variante="secundario"
                onPress={handleAdicionarDocumentos}
                carregando={adicionandoDocumento}
                style={{ marginTop: documentos.length > 0 ? 16 : 6 }}
              />

              {errosDocumentos.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  {errosDocumentos.map((msg, i) => (
                    <Text key={i} style={[styles.erroTexto, { color: cores.danger, fontFamily: Fonts.regular }]}>
                      {msg}
                    </Text>
                  ))}
                </View>
              )}
            </Cartao>
          ) : (
            <Cartao style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="construct-outline" size={32} color={cores.icon} />
              <Text style={[styles.emConstrucao, { color: cores.text, fontFamily: Fonts.semibold }]}>
                Etapa "{ROTULOS_ETAPA[etapa]}" ainda será implementada
              </Text>
              <Text style={[styles.emConstrucaoDesc, { color: cores.icon, fontFamily: Fonts.regular }]}>
                A navegação já está funcionando — esta etapa chega num próximo bloco.
              </Text>
            </Cartao>
          )}
        </ScrollView>

        <View style={[styles.rodape, { borderTopColor: cores.border, backgroundColor: cores.background }]}>
          <Botao titulo="Voltar" variante="secundario" onPress={handleVoltar} style={{ flex: 1 }} />
          <Botao titulo="Continuar" onPress={handleContinuar} style={{ flex: 1 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Campo({
  label,
  valor,
  onChangeText,
  erro,
  cores,
  ...rest
}: {
  label: string;
  valor: string;
  onChangeText: (v: string) => void;
  erro?: string;
  cores: typeof Colors.light;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.rotulo, { color: cores.icon, fontFamily: Fonts.mono }]}>{label.toUpperCase()}</Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: erro ? cores.danger : cores.border,
            color: cores.text,
            fontFamily: Fonts.regular,
            backgroundColor: cores.card,
          },
        ]}
        placeholderTextColor={cores.icon}
        value={valor}
        onChangeText={onChangeText}
        {...rest}
      />
      {erro && <Text style={[styles.erroTexto, { color: cores.danger, fontFamily: Fonts.regular }]}>{erro}</Text>}
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
  headerTitulo: { fontSize: 15 },
  indicador: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 14, paddingVertical: 14 },
  indicadorItem: { alignItems: 'center', width: 64 },
  indicadorBolha: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicadorNumero: { fontSize: 12 },
  indicadorLabel: { fontSize: 8, letterSpacing: 0.4, marginTop: 4, textAlign: 'center' },
  indicadorLinha: { flex: 1, height: 2, marginTop: 12 },
  rotulo: { fontSize: 10, letterSpacing: 0.8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: Radius, padding: 12, fontSize: 14 },
  erroTexto: { fontSize: 11, marginTop: 4 },
  linhaDupla: { flexDirection: 'row', gap: 10 },
  emConstrucao: { fontSize: 14, marginTop: 10 },
  emConstrucaoDesc: { fontSize: 12, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 },
  rodape: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1 },
  secaoTitulo: { fontSize: 15, marginBottom: 6 },
  secaoDesc: { fontSize: 12, lineHeight: 17, marginBottom: 16 },
  documentoLinha: { borderWidth: 1, borderRadius: Radius, padding: 12, marginBottom: 10 },
  documentoTopo: { flexDirection: 'row', alignItems: 'center' },
  documentoNome: { fontSize: 13 },
  documentoTamanho: { fontSize: 10, marginTop: 2 },
  chipsLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { borderWidth: 1, borderRadius: Radius, paddingVertical: 5, paddingHorizontal: 8 },
  chipTexto: { fontSize: 9, letterSpacing: 0.4 },
});