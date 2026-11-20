<div align="center">
  <img src="assets/logos/tatame-icone-escudo.svg" width="72" alt="Tatame">
  <h1>Tatame</h1>
  <p><strong>PWA de gestão de academias de jiu-jitsu</strong></p>
  <p>
    <a href="https://dev-aylton.github.io/tatame-app/">🔗 Ver app ao vivo</a>
    &nbsp;·&nbsp;
    <a href="#-funcionalidades">Funcionalidades</a>
    &nbsp;·&nbsp;
    <a href="#-stack-técnica">Stack</a>
    &nbsp;·&nbsp;
    <a href="#-como-rodar-localmente">Rodar localmente</a>
  </p>
  <br>
  <img src="https://img.shields.io/badge/versão-5.26-blue?style=flat-square" alt="Versão 5.26">
  <img src="https://img.shields.io/badge/PWA-instalável-5A0FC8?style=flat-square&logo=pwa" alt="PWA">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/sem_framework-Vanilla_JS-F7DF1E?style=flat-square&logo=javascript" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/LGPD-conformidade-green?style=flat-square" alt="LGPD">
</div>

---

## 📌 Sobre o projeto

O **Tatame** é uma aplicação web progressiva (PWA) completa para gestão de academias de artes marciais, com foco em jiu-jitsu. Foi desenvolvido do zero — sem framework de frontend nem etapa de build — usando HTML, CSS e JavaScript puros com backend no Supabase.

O app cobre todo o ciclo de gestão de uma academia: **vínculo professor–aluno, cobranças mensais, comprovantes de pagamento, graduações, mensagens, planos de treino e muito mais**, com controle de acesso por perfil aplicado diretamente no banco (RLS).

> Projeto de portfólio desenvolvido durante o curso de **Análise e Desenvolvimento de Sistemas — UNINTER**.

---

## ✨ Funcionalidades

O app tem quatro papéis com telas e permissões independentes:

### 🏫 Administrador (Adm)
- Painel com indicadores de academias, professores, alunos e convites pendentes
- Cadastro e edição de academias com foto de fundo e grade semanal de professores
- Convite e gerenciamento de professores e papéis

### 🥋 Professor
- Gestão completa de alunos: vínculos, pedidos e convites de instrutor
- **Cobranças mensais** com regras por aluno (valor, vencimento, desconto, isenção)
- Revisão de comprovantes de pagamento com **OCR local no navegador** (sem envio a serviços externos)
- Registro de **graduações** com histórico por aluno
- **Chat em tempo real** com alunos e instrutores (Supabase Realtime)
- Publicação de **planos de treino** semanais e mensais com compartilhamento opcional
- Delegação de aulas para instrutores com conteúdo vinculado

### 🎽 Instrutor
- Acesso às aulas delegadas pelo professor
- Visualização de alunos vinculados (nome e graduação atual)
- Registro de execução de aulas e chat com o professor

### 👤 Aluno
- Solicitação de vínculo com professor via código
- Visualização de cobranças enviadas e histórico de pagamentos
- **Aviso de pagamento** com upload de comprovante
- Consulta de graduações, feedbacks e metas
- Acesso a planos de treino compartilhados pelo professor
- Chat com o professor

> O app registra informações de cobrança e pagamento, mas **não processa transações financeiras**.

---

## 🛠 Stack técnica

| Camada | Tecnologia | Decisão |
|--------|-----------|---------|
| **Frontend** | HTML5 · CSS3 · JavaScript ES2022+ | Sem framework — sem etapa de build, deploy direto no GitHub Pages |
| **PWA** | Service Worker · Web App Manifest | Cache-first para assets, network-first para navegação; instalável no celular |
| **Backend** | [Supabase](https://supabase.com) (PostgreSQL) | Autenticação, banco, RLS, Storage e Realtime |
| **Edge Function** | Deno (TypeScript) | Exclusão segura de conta com `service_role` apenas no servidor |
| **OCR local** | [Tesseract.js](https://tesseract.projectnaptha.com/) + WASM | Leitura de comprovantes no navegador, sem upload a serviços externos |
| **PDF** | [PDF.js](https://mozilla.github.io/pdf.js/) | Renderização local de comprovantes em PDF |
| **Realtime** | Supabase Realtime (WebSocket) | Notificações e chat em tempo real com debounce para evitar flood de chamadas |

**Versões de bibliotecas:** `supabase-js 2.49.8` · `PDF.js` · `Tesseract.js` (com modelos WASM e treinamento em inglês)

---

## 🏗 Arquitetura

```
tatame/
├── index.html                    # Shell da SPA — entrada única do app
├── privacidade.html              # Política de privacidade (página estática)
├── sw.js                         # Service Worker (cache versionado)
├── manifest.webmanifest          # Manifesto PWA
├── css/
│   └── app.css                   # ~4.700 linhas — temas claro/escuro, layout responsivo
├── js/
│   ├── app.js                    # ~13.100 linhas — toda a lógica do app
│   ├── exportar.js               # Exportação de dados do professor
│   ├── offline.js                # Suporte offline
│   ├── config.js                 # URL e chave pública do Supabase (não versionado)
│   └── vendor/                   # Dependências copiadas localmente (sem npm)
│       ├── supabase-2.49.8.js
│       ├── pdfjs/
│       └── tesseract/
├── supabase/
│   ├── migrations/               # 47 migrations SQL (estrutura completa do banco)
│   └── functions/excluir-conta/  # Edge Function em TypeScript/Deno
├── assets/                       # Logos, ícones e avatares padrão
└── tests/                        # Plano de testes e casos de aceite (F1–F3)
```

### Decisões de arquitetura

- **SPA sem roteamento de URL:** uma única `index.html` troca de tela via JavaScript, sem `history.pushState`. Simplifica o deploy em qualquer servidor estático.
- **Zero build:** nenhum bundler, transpilador ou gerenciador de pacotes. As bibliotecas de terceiros ficam em `js/vendor/` para funcionar offline via Service Worker.
- **Papel do usuário no banco, nunca no código:** o frontend lê o perfil do Supabase e adapta a navegação. Toda autorização de leitura/escrita é reforçada por **RLS (Row Level Security)** no PostgreSQL.
- **OCR 100% local:** os arquivos WASM do Tesseract são servidos como assets estáticos e ficam no cache do Service Worker. Comprovantes nunca saem do dispositivo do usuário.
- **Realtime com debounce:** os listeners do Supabase Realtime usam debounce (350ms) para evitar rajadas de chamadas RPC quando mensagens chegam em sequência rápida.

---

## 🔐 Segurança e privacidade

- **RLS em todas as tabelas:** as políticas definem o que cada perfil pode ler e gravar. O frontend não substitui essas verificações.
- **Funções SQL com `security definer` e `set search_path = ''`:** impede ataques de substituição de schema.
- **Consentimentos imutáveis:** um trigger de banco bloqueia `UPDATE` e `DELETE` na tabela `consentimentos` — conformidade LGPD.
- **Exclusão de conta via Edge Function:** a chave `service_role` fica somente no servidor Supabase, nunca no cliente ou no repositório.
- **Configuração do Supabase no site publicado:** `js/config.js` é carregado pelo aplicativo e deve ser versionado junto com a publicação do GitHub Pages. Como o conteúdo é público no navegador, use somente a URL do projeto e uma chave publicável (`sb_publishable_` ou `anon`); nunca inclua chave `sb_secret_`, `service_role`, senha ou token. `config.example.js` documenta o formato esperado.

### Consentimento e primeiro acesso

- Para contas sujeitas ao termo, somente o aceite da versão vigente libera as áreas com dados pessoais. Antes dele, o app usa apenas os dados mínimos de autenticação e não exibe nem altera dados do perfil.
- A criação de perfil novo e o registro de consentimento ocorrem juntos; recusar não cria perfil nem grava aceite. A declaração de idade de Aluno e Instrutor é opcional, só é persistida após o aceite e pode ser solicitada novamente no próximo login se continuar ausente. Convites de Instrutor exigem declaração de adulto.
- Adm é isento do aceite. Professor aceita a versão vigente sem receber modal de idade. O mesmo aceite não é solicitado novamente enquanto aquela versão continuar vigente.
- Ao registrar o e-mail de uma conta Google existente como Professor, o Adm altera o papel imediatamente; registros, vínculos e consentimentos existentes são mantidos. A idade declarada segue a regra adulta do papel Professor. O perfil passa a exibir somente os recursos de Professor. Para uma conta ainda sem perfil, a atribuição ocorre no primeiro login Google após o aceite do termo; não há aceite de convite.
- O controle de acesso é aplicado no banco por RLS e funções SQL; depende das migrations `20261120_41_consentimento_versao_legada.sql` e `20261120_42_consentimento_primeiro_acesso.sql`.
- A conversão automática de contas existentes depende também da migration `20261120_43_professor_automatico_por_email.sql`.

---

## 🗄 Banco de dados

**47 migrations SQL** organizam a evolução do schema em ordem cronológica:

| Faixa | Domínio |
|-------|---------|
| 01–08 | Academias, perfis, vínculos, instrutores e auditoria |
| 09–12 | Troca de professor, consentimento LGPD e perfil de aluno |
| 13–22 | Cobranças, pagamentos, graduações, notas, mural, grade e planos de treino |
| 23–28 | Storage de comprovantes, fotos de perfil e avatar |
| 29–34 | Grade semanal por academia, edição adm e acesso de aluno ao adm |
| 35–41 | Reemissão de cobrança, conversas, notificações, exclusão de conta e índices de performance |
| 20261120_41–42 | Compatibilidade de consentimento e acesso no primeiro acesso |
| 20261120_43–44 | Conversão automática de Professor e cobrança sem código de turma |

Destaques do schema: `CHECK` constraints em status e valores monetários, índices parciais em cobranças abertas, trigger de imutabilidade em consentimentos.

---

## ♿ Acessibilidade

- Uso de `<dialog>` nativo para modais (acessível por padrão)
- `aria-live`, `role="alert"`, `aria-expanded`, `aria-label` e `aria-current="page"` aplicados consistentemente (446+ atributos ARIA no código)
- Suporte a `prefers-reduced-motion` no CSS
- Foco e estados de teclado em todos os botões de ação
- Tema claro e escuro com troca manual e persistência

---

## 🚀 Como rodar localmente

**Pré-requisitos:** um projeto no [Supabase](https://supabase.com) com as migrations aplicadas.

```bash
# 1. Clone o repositório
git clone https://github.com/Dev-Aylton/tatame-app.git
cd tatame

# 2. Configure o cliente Supabase
cp js/config.example.js js/config.js
# Edite js/config.js com a URL e a chave publicável do seu projeto Supabase
# Inclua js/config.js na publicação do GitHub Pages para habilitar o login no site

# 3. Inicie um servidor HTTP local (Python, Node ou qualquer outro)
python -m http.server 8766 --bind 127.0.0.1

# 4. Acesse no navegador
# http://127.0.0.1:8766/
```

> O app não lê variáveis de ambiente no navegador. Autenticação e dados dependem de um projeto Supabase configurado com as migrations correspondentes.

### Aplicar as migrations

No painel SQL do Supabase (ou via CLI), execute os arquivos de `supabase/migrations/` em ordem numérica. Cada arquivo é idempotente e documentado com o contexto da mudança.

### Edge Function (exclusão de conta)

```bash
supabase functions deploy excluir-conta
# Configure o segredo no painel Supabase:
# SUPABASE_SERVICE_ROLE_KEY = <sua service role key>
```

---

## 🧪 Testes

| Arquivo | Conteúdo |
|---------|----------|
| `tests/teste.html` | Catálogo de casos de aceite — fases F1, F2, F3 e F4 |
| `tests/plano.html` | Painel visual do plano de trabalho |
| `tests/roteiro-marco2.md` | Roteiro de testes funcionais do marco 2 |

O painel verifica a estrutura e a cobertura do catálogo. Para esta entrega, o desenvolvedor confirmou a aplicação das migrations e a validação do fluxo de consentimento e primeiro acesso; o painel de integridade passou em 5/5 verificações. Isso não substitui a regressão geral nem valida as demais políticas RLS.

---

## 📋 Roadmap

- [ ] Executar fluxos de autenticação, cadastro e convites em ambiente Supabase de teste
- [ ] Validar permissões RLS em cenários autorizados e negados
- [ ] Conferência responsiva completa em 360, 390, 430 e 768 px nos dois temas
- [ ] Regressão ponta a ponta e validação de instalação e comportamento offline da PWA

---

## 👨‍💻 Autor

**Aylton Alberto** — Desenvolvedor e estudante de Análise e Desenvolvimento de Sistemas (UNINTER)

- 💼 [LinkedIn](https://www.linkedin.com/in/aylton-alberto-806726220/)
- 🐙 [GitHub](https://github.com/Dev-Aylton/tatame-app)
- 📧 desenvolvedor.aylton@gmail.com

---

<div align="center">
  <sub>Feito com JavaScript puro, Supabase e muita dedicação · 2026</sub>
</div>
