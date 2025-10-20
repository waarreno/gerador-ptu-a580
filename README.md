# 🏥 Gerador PTU A580

Sistema web para geração de arquivos PTU A580 (Fatura de Uso Geral) para o sistema Unimed.

![Versão](https://img.shields.io/badge/vers%C3%A3o-1.1.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-yellow)

## 📋 Sobre

Este sistema permite a geração automatizada de arquivos PTU A580 para faturamento no sistema Unimed, incluindo:

- Geração de registros R581 (Header)
- Geração de registros R998 (Hash MD5)
- Validação automática de dados
- Preview do conteúdo antes de gerar
- Exportação em formato ZIP
- Sugestão automática de nome para PDF da fatura

## ✨ Características

- ✅ Interface web intuitiva
- ✅ Validação em tempo real
- ✅ Preview do arquivo antes de gerar
- ✅ Formatação automática de valores monetários
- ✅ Log de atividades detalhado
- ✅ Geração de arquivo ZIP automatizada
- ✅ 100% portátil (inclui Node.js embutido)
- ✅ Dados de teste para facilitar uso

## 🚀 Como Usar

### Opção 1: Modo Portátil (Windows)

1. Baixe o projeto
2. Execute o arquivo `iniciar.bat`
3. O sistema instalará automaticamente o Node.js (primeira vez)
4. O navegador abrirá automaticamente em `http://localhost:3000`

### Opção 2: Com Node.js Instalado

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Ou modo desenvolvimento (com auto-reload)
npm run dev
```

Acesse: `http://localhost:3000`

## 📦 Dependências

- **express** - Framework web
- **body-parser** - Parser de requisições
- **ejs** - Template engine
- **archiver** - Geração de arquivos ZIP

## 🔧 Estrutura do Projeto

```
gerador-ptu-a580/
├── server.js             # Servidor Node.js
├── views/
│   └── index.ejs         # Interface web
├── arquivos_gerados/     # Arquivos PTU gerados
├── iniciar.bat           # Launcher Windows
├── package.json          # Configuração npm
└── README.md             # Este arquivo
```

## 📝 Campos Obrigatórios

- Código Unimed Destino
- Código Unimed Origem
- Competência (AAMM)
- Data Vencimento (AAAAMMDD)
- Valor Total
- Número Documento
- Tipo Documento
- ID Cobrança

## 🎯 Tipos de Documento

| Código | Descrição |
|--------|-----------|
| 1 | Fatura |
| 2 | NF |
| 3 | NFe |
| 4 | NDC |
| 5 | Débito |

## 💡 ID Cobrança

| Código | Descrição |
|--------|-----------|
| 1 | Benefício Família |
| 2 | Câmara Nacional Compensação |
| 3 | Contribuição Confederativa |
| 4 | Programas/Fundos Especiais |
| 9 | Outros |
| 10 | Produtos de TI |
| 11 | Consultorias |
| 12 | Rateios e mensalidades |
| 13 | Compensação aferição |
| 14 | Programas atenção à saúde |
| 15 | Remoção/Transporte |
| 16 | RDA |
| 17 | Acordo Operacional CNU |
| 18 | Fluxo Pagamento Dinâmico |
| 19 | Rateio Federação RJ |

## 🛠️ Funcionalidades

### Validar Dados
Verifica se todos os campos obrigatórios estão preenchidos corretamente.

### Visualizar Arquivo
Mostra um preview do conteúdo do arquivo antes de gerar.

### Gerar Arquivo
Cria o arquivo PTU A580 e gera automaticamente um ZIP para download.

### Dados de Teste
Preenche o formulário automaticamente com dados de exemplo para testes.

## 📄 Formato do Arquivo

O arquivo gerado segue o padrão:

```
F{7_ultimos_digitos_documento}.988
```

Exemplo: `F0000001.988`

## 🔒 Segurança

- Validação de entrada no frontend e backend
- Hash MD5 automático no registro R998
- Sanitização de dados

## 👤 Autor

**Wárreno Hendrick Costa Lima Guimarães**

Coordenador de Contas Médicas

## 📜 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma Branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a Branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request

## 📞 Suporte

Para questões ou sugestões, abra uma issue no repositório.

---

Desenvolvido com ❤️ para a área de Contas Médicas da Unimed Cerrado