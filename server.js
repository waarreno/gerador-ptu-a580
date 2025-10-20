const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const app = express();
const PORT = 3000;

// Configuração
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Criar pasta para arquivos
const outputDir = path.join(__dirname, 'arquivos_gerados');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Rota principal
app.get('/', (req, res) => {
  res.render('index');
});

// Validar dados
app.post('/api/validar', (req, res) => {
  const erros = validarDados(req.body);
  res.json({ valido: erros.length === 0, erros });
});

// Preview
app.post('/api/preview', (req, res) => {
  try {
    const conteudo = gerarConteudoA580(req.body);
    const nomeArquivo = gerarNomeArquivo(req.body.NR_DOCUMENTO);
    const nomePdfSugerido = gerarNomePdfSugerido(req.body);
    const analise = analisarConteudo(conteudo);
    
    res.json({ 
      success: true, 
      nomeArquivo: nomeArquivo + '.zip', 
      nomePdfSugerido,
      conteudo, 
      analise 
    });
  } catch (error) {
    res.status(500).json({ success: false, erro: error.message });
  }
});

// Gerar arquivo
app.post('/api/gerar-arquivo', (req, res) => {
  try {
    const erros = validarDados(req.body);
    if (erros.length > 0) {
      return res.status(400).json({ success: false, erros });
    }
    
    const conteudo = gerarConteudoA580(req.body);
    const nomeArquivoBase = gerarNomeArquivo(req.body.NR_DOCUMENTO);
    const nomeArquivoZip = nomeArquivoBase + '.zip';
    const caminhoZip = path.join(outputDir, nomeArquivoZip);
    
    // Criar arquivo ZIP
    const output = fs.createWriteStream(caminhoZip);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Nível máximo de compressão
    });
    
    output.on('close', () => {
      console.log(`[INFO] Arquivo ZIP criado: ${archive.pointer()} bytes`);
      res.json({ 
        success: true, 
        nomeArquivo: nomeArquivoZip, 
        caminho: caminhoZip,
        tamanho: archive.pointer()
      });
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    
    // Adicionar o arquivo PTU ao ZIP
    archive.append(conteudo, { name: nomeArquivoBase });
    
    archive.finalize();
    
  } catch (error) {
    res.status(500).json({ success: false, erro: error.message });
  }
});

// Download
app.get('/api/download/:filename', (req, res) => {
  const filepath = path.join(outputDir, req.params.filename);
  if (fs.existsSync(filepath)) {
    res.download(filepath);
  } else {
    res.status(404).send('Arquivo não encontrado');
  }
});

// Rota para encerrar servidor
app.post('/api/shutdown', (req, res) => {
  res.json({ success: true, message: 'Servidor será encerrado' });
  
  const lockFile = path.join(__dirname, 'server.lock');
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
  
  setTimeout(() => {
    console.log('\n[INFO] Encerrando servidor conforme solicitado...');
    process.exit(0);
  }, 500);
});

// Funções auxiliares
function validarDados(data) {
  const erros = [];
  
  if (!data.CD_UNI_DES || isNaN(data.CD_UNI_DES)) {
    erros.push('Código Unimed Destino deve ser numérico');
  }
  if (!data.CD_UNI_ORI || isNaN(data.CD_UNI_ORI)) {
    erros.push('Código Unimed Origem deve ser numérico');
  }
  if (!data.NR_COMP || !data.NR_COMP.trim() || data.NR_COMP.trim().length !== 4 || isNaN(data.NR_COMP.trim())) {
    erros.push('Competência (AAMM) é obrigatória e deve ter 4 dígitos numéricos');
  }
  if (!validarDataYYYYMMDD(data.DT_VEN_DOC)) {
    erros.push('Data Vencimento inválida (formato AAAAMMDD)');
  }
  if (!data.VL_TOT_DOC || isNaN(data.VL_TOT_DOC) || parseFloat(data.VL_TOT_DOC) <= 0) {
    erros.push('Valor Total deve ser numérico e maior que zero');
  }
  if (!data.NR_DOCUMENTO || !data.NR_DOCUMENTO.trim()) {
    erros.push('Número do Documento é obrigatório');
  }
  if (!data.TP_DOC_A580) {
    erros.push('Tipo de Documento é obrigatório');
  }
  if (!data.ID_COBRANCA) {
    erros.push('ID Cobrança é obrigatório');
  }
  
  if (data.TIPO_PTU === '1' && (!data.NR_DOC_COB || !data.NR_DOC_COB.trim())) {
    erros.push('Número Doc. Cobrança obrigatório quando Tipo PTU = 1');
  }
  if (data.TIPO_PTU === '2' && (!data.NR_NDC || !data.NR_NDC.trim())) {
    erros.push('Número NDC obrigatório quando Tipo PTU = 2');
  }
  if (data.TIPO_PTU === '2' && (!data.NR_ORIG_COB || !data.NR_ORIG_COB.trim())) {
    erros.push('Número Orig. Cobrança obrigatório quando Tipo PTU = 2');
  }
  if ((data.TIPO_PTU === '1' || data.TIPO_PTU === '2') && !data.VAL_PAGO) {
    erros.push('Valor Pago obrigatório quando Tipo PTU = 1 ou 2');
  }
  
  return erros;
}

function validarDataYYYYMMDD(valor) {
  if (!valor || valor.length !== 8 || isNaN(valor)) return false;
  const ano = parseInt(valor.substring(0, 4));
  const mes = parseInt(valor.substring(4, 6));
  const dia = parseInt(valor.substring(6, 8));
  return ano >= 1900 && ano <= 2100 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31;
}

function formatarValor(valor, tamanho) {
  const num = parseFloat(valor) || 0;
  return Math.round(num * 100).toString().padStart(tamanho, '0');
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function gerarConteudoA580(data) {
  let linha = '';
  
  linha += '00000001';
  linha += '581';
  linha += data.CD_UNI_DES.padStart(4, '0');
  linha += data.CD_UNI_ORI.padStart(4, '0');
  linha += formatDate(new Date());
  linha += (data.NR_COMP || '').padStart(4, ' ').substring(0, 4);
  linha += ' '.repeat(11);
  linha += data.DT_VEN_DOC;
  linha += formatDate(new Date());
  linha += formatarValor(data.VL_TOT_DOC, 14);
  linha += '09';
  linha += formatarValor(data.VL_IR || '0', 14);
  linha += (data.NR_DOCUMENTO + ' '.repeat(20)).substring(0, 20);
  linha += (data.DOC_FISCAL + ' '.repeat(20)).substring(0, 20);
  linha += data.TP_DOC_A580;
  linha += data.ID_COBRANCA.padStart(2, '0');
  linha += data.TIPO_PTU || ' ';
  linha += (data.NR_DOC_COB + ' '.repeat(20)).substring(0, 20);
  linha += (data.NR_NDC || '').padStart(11, ' ').substring(0, 11);
  linha += (data.NR_ORIG_COB + ' '.repeat(20)).substring(0, 20);
  linha += data.VAL_PAGO ? formatarValor(data.VAL_PAGO, 14) : ' '.repeat(14);
  
  const hash = crypto.createHash('md5').update(linha).digest('hex');
  let linhaHash = '00000002998' + (hash + ' '.repeat(32)).substring(0, 32);
  
  return linha + '\n' + linhaHash;
}

function gerarNomeArquivo(nrDocumento) {
  const docLimpo = nrDocumento.trim();
  const docFormatado = docLimpo.length >= 7 
    ? docLimpo.substring(docLimpo.length - 7)
    : '_'.repeat(7 - docLimpo.length) + docLimpo;
  return `F${docFormatado}.988`;
}

function gerarNomePdfSugerido(data) {
  // Formato: F{CD_UNI_ORI(3)}{NR_DOCUMENTO(20)}{CD_UNI_DES(3)}01.pdf
  // Exemplo: F988999999______________06401.pdf
  const uniOri = data.CD_UNI_ORI.padStart(3, '0');
  const uniDes = data.CD_UNI_DES.padStart(3, '0');
  const nrDoc = (data.NR_DOCUMENTO.trim() + '_'.repeat(20)).substring(0, 20);
  
  return `F${uniOri}${nrDoc}${uniDes}01.pdf`;
}

function analisarConteudo(conteudo) {
  return conteudo.split('\n').filter(l => l.length > 0).map((linha, idx) => {
    const tipoReg = linha.substring(8, 11);
    return {
      numero: idx + 1,
      tipo: tipoReg === '581' ? 'R581 - HEADER' : tipoReg === '998' ? 'R998 - HASH' : 'Desconhecido',
      tamanho: linha.length,
      conteudo: linha
    };
  });
}

// Monitoramento do arquivo de lock
const lockFile = path.join(__dirname, 'server.lock');
const checkInterval = setInterval(() => {
  if (!fs.existsSync(lockFile)) {
    console.log('\n[INFO] Lock file removido. Encerrando servidor...');
    clearInterval(checkInterval);
    process.exit(0);
  }
}, 2000);

// Tratamento de sinais de encerramento
process.on('SIGINT', () => {
  console.log('\n[INFO] CTRL+C detectado. Encerrando...');
  clearInterval(checkInterval);
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[INFO] Sinal de término recebido. Encerrando...');
  clearInterval(checkInterval);
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
  process.exit(0);
});

const server = app.listen(PORT, () => {
  console.log('\n╔═════════════════════════════════════════════════════╗');
  console.log('║                🧾 Gerador PTU A580                  ║');
  console.log('║   (c) 2025 Wárreno Hendrick Costa Lima Guimarães    ║');
  console.log('║                   Versão 1.1.0                      ║');
  console.log('╠═════════════════════════════════════════════════════╣');
  console.log(`║            Acesse: http://localhost:${PORT}            ║`);
  console.log('║         Pasta arquivos: ./arquivos_gerados          ║');
  console.log('╚═════════════════════════════════════════════════════╝\n');
});

// Encerramento gracioso
process.on('exit', () => {
  console.log('[INFO] Processo finalizado.');
});