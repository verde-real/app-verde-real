import * as DocumentPicker from 'expo-document-picker';
import { ArquivoDocumentoSelo, MIMES_DOCUMENTO_PERMITIDOS, TipoDocumentoSelo } from 'verde-real-core';

import { arquivoParaBytes } from '@/src/services/upload';

export interface ArquivoSelecionado extends ArquivoDocumentoSelo {
  corpo: Uint8Array;
}

/** Abre o seletor nativo (permite múltiplos arquivos) e devolve já prontos para envio. */
export async function selecionarDocumentos(
  tipoPadrao: TipoDocumentoSelo = 'outro'
): Promise<ArquivoSelecionado[]> {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: MIMES_DOCUMENTO_PERMITIDOS,
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
    return [];
  }

  const arquivos: ArquivoSelecionado[] = [];
  for (const asset of resultado.assets) {
    const corpo = await arquivoParaBytes(asset.uri);
    if (!corpo || corpo.byteLength === 0) {
      throw new Error(`Não foi possível ler o arquivo "${asset.name}". Tente selecioná-lo novamente.`);
    }
    arquivos.push({
      tipo: tipoPadrao,
      nomeArquivo: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      tamanhoBytes: asset.size ?? corpo.byteLength,
      corpo,
    });
  }
  return arquivos;
}