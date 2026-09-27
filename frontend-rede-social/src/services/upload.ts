import { File } from 'expo-file-system';

import { supabase } from '@/src/services/supabase';

// Mapa mime -> extensão. Serve de "fonte da verdade" para o nome do
// arquivo no Storage, em vez de tentar adivinhar a extensão a partir da
// URI (no Android a URI da galeria costuma vir como "content://..." e
// não tem extensão nenhuma, o que gerava um caminho de arquivo inválido
// e, por consequência, uma URL pública quebrada — a imagem "publicava"
// mas nunca aparecia).
const EXTENSAO_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

function extensaoSegura(nomeArquivo: string | undefined | null, contentType: string): string {
  // 1) Tenta pelo mimetype (fonte mais confiável em ambas as plataformas)
  const porMime = EXTENSAO_POR_MIME[contentType.toLowerCase()];
  if (porMime) return porMime;

  // 2) Tenta pelo nome do arquivo, mas só se realmente houver uma
  // extensão plausível (curta, sem "://" ou "/", que indicaria que na
  // verdade pegamos uma URI inteira em vez de um nome de arquivo).
  if (nomeArquivo) {
    const partes = nomeArquivo.split('.');
    const possivel = partes.length > 1 ? partes.pop() : null;
    if (possivel && possivel.length <= 5 && !possivel.includes('/') && !possivel.includes(':')) {
      return possivel.toLowerCase();
    }
  }

  // 3) Fallback final
  return contentType.startsWith('video') ? 'mp4' : 'jpg';
}

/**
 * Lê o conteúdo do arquivo local (foto/vídeo escolhido no ImagePicker) como
 * bytes binários, prontos para enviar ao Supabase Storage.
 *
 * Usamos a API de arquivos do Expo (expo-file-system) em vez de
 * `fetch(uri).arrayBuffer()`. As duas abordagens funcionam no iOS, mas no
 * Android o `fetch` sobre uris locais (file:// e principalmente
 * content://) é conhecido por, em alguns aparelhos/versões do Android,
 * retornar um corpo vazio ou incompleto — o upload "funciona" (não dá
 * erro), só que sobe um arquivo de 0 bytes / corrompido, e a imagem some.
 * Ler o arquivo diretamente do sistema de arquivos evita essa camada de
 * rede e resolve o problema nas duas plataformas.
 */
async function arquivoParaBytes(uri: string): Promise<Uint8Array> {
  try {
    const arquivo = new File(uri);
    return await arquivo.bytes();
  } catch (erroFileSystem) {
    // Fallback (ex.: uri remota tipo data:/http, ou ambiente sem suporte
    // nativo ao módulo) — mantém compatibilidade.
    const resposta = await fetch(uri);
    const buffer = await resposta.arrayBuffer();
    return new Uint8Array(buffer);
  }
}

export async function enviarMidia(
  usuarioId: string,
  uri: string,
  nomeArquivo: string,
  contentType: string
): Promise<string> {
  const extensao = extensaoSegura(nomeArquivo, contentType);
  const caminho = `${usuarioId}/${Date.now()}.${extensao}`;
  const bytes = await arquivoParaBytes(uri);

  if (!bytes || bytes.byteLength === 0) {
    throw new Error('Não foi possível ler o arquivo selecionado. Tente escolher a mídia novamente.');
  }

  const { error } = await supabase.storage.from('midias').upload(caminho, bytes, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('midias').getPublicUrl(caminho);
  return data.publicUrl;
}