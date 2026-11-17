"use strict";

// Fase F4 — Qualidade, design e correções técnicas (nov/2026)
// Cobre os itens implementados na sessão de revisão técnica e de design:
// segurança (config.js, consent), performance (debounce, índices), UX/design e acessibilidade.

window.CASOS_ACEITE_F4 = [

  // ── SEGURANÇA ────────────────────────────────────────────────────────────────

  {
    id: "F4-SEC-01",
    fase: "F4",
    area: "Segurança",
    titulo: "config.js ausente do rastreamento Git",
    perfil: "Responsável pela publicação",
    regras: "Chaves e segredos nunca entram no repositório",
    precondicoes: "Repositório clonado localmente com .gitignore atualizado.",
    passos: [
      "Executar git ls-files js/config.js.",
      "Confirmar que o comando não retorna nenhum resultado."
    ],
    esperado: "config.js não está rastreado pelo Git; apenas config.example.js consta no repositório."
  },

  {
    id: "F4-SEC-02",
    fase: "F4",
    area: "Segurança",
    titulo: "Versão do termo de consentimento é definitiva",
    perfil: "Qualquer perfil autenticado",
    regras: "LGPD — consentimento deve ser registrado com versão válida",
    precondicoes: "App aberto no preview local.",
    passos: [
      "Abrir js/app.js e localizar CONSENT_TERM_VERSION.",
      "Confirmar que o valor é \"final-1\" (não \"rascunho-1\" ou variante).",
      "No fluxo de onboarding do preview, confirmar que a versão exibida ao usuário condiz com o termo publicado."
    ],
    esperado: "CONSENT_TERM_VERSION === \"final-1\"; o registro de consentimento no banco usa esse identificador definitivo."
  },

  {
    id: "F4-SEC-03",
    fase: "F4",
    area: "Segurança",
    titulo: "Variável --danger tem contraste suficiente no tema claro",
    perfil: "Qualquer usuário com tema claro ativo",
    regras: "WCAG 2.1 AA — razão de contraste mínima 3:1 para elementos não-textuais (badge)",
    precondicoes: "App aberto no preview local com tema claro.",
    passos: [
      "Ativar o tema claro.",
      "Verificar que o badge de notificação é vermelho escuro (#b51c2d), não rosa (#ff6975).",
      "Verificar contraste do badge sobre o fundo --surface (#ffffff)."
    ],
    esperado: "Badge de notificação usa --danger: #b51c2d no tema claro; contraste ≥ 3:1 sobre fundo branco."
  },

  // ── PERFORMANCE ──────────────────────────────────────────────────────────────

  {
    id: "F4-PERF-01",
    fase: "F4",
    area: "Performance",
    titulo: "Eventos realtime de mensagens usam debounce",
    perfil: "Professor ou Aluno com conversa ativa",
    regras: "Realtime não deve disparar mais de uma chamada RPC por rafaga de eventos",
    precondicoes: "App rodando com Supabase real; canal de mensagens ativo.",
    passos: [
      "Abrir DevTools → Network.",
      "Enviar três mensagens consecutivas rapidamente na conversa.",
      "Observar as chamadas RPC de refreshRealConversationUnread e refreshRealNotifications."
    ],
    esperado: "Cada rajada de mensagens gera no máximo uma chamada RPC por função após o intervalo de debounce (350ms), sem flood de requisições paralelas."
  },

  {
    id: "F4-PERF-02",
    fase: "F4",
    area: "Performance",
    titulo: "Fila de fotos de perfil limitada a 6 requisições simultâneas",
    perfil: "Professor com lista de alunos",
    regras: "Requisições simultâneas ao Storage controladas para não sobrecarregar redes móveis",
    precondicoes: "Professor com 10+ alunos vinculados, cada um com foto de perfil.",
    passos: [
      "Abrir a tela de alunos.",
      "No DevTools → Network, filtrar por requests ao Storage do Supabase.",
      "Observar quantas requisições de foto ocorrem em paralelo."
    ],
    esperado: "No máximo 6 requisições de foto de perfil ocorrem simultaneamente; as demais aguardam na fila."
  },

  {
    id: "F4-PERF-03",
    fase: "F4",
    area: "Performance",
    titulo: "Índices de cobrança aplicados no banco",
    perfil: "Administrador do banco",
    regras: "Migration 41 aplicada — índices parciais em cobrancas_mensais",
    precondicoes: "Migration 20261117_41_indice_cobrancas_status.sql aplicada ao banco de produção/teste.",
    passos: [
      "No painel SQL do Supabase, executar: SELECT indexname FROM pg_indexes WHERE tablename = 'cobrancas_mensais';",
      "Verificar presença de cobrancas_status_professor_idx e cobrancas_abertas_aluno_idx.",
      "Executar EXPLAIN ANALYZE em uma query de cobranças abertas de um professor e confirmar uso do índice."
    ],
    esperado: "Ambos os índices existem; a query de cobranças abertas usa Index Scan em vez de Seq Scan."
  },

  {
    id: "F4-PERF-04",
    fase: "F4",
    area: "Performance",
    titulo: "Array de diagnóstico limitado a 100 entradas",
    perfil: "Sessão longa com muitos erros",
    regras: "Sem vazamento de memória em sessões longas",
    precondicoes: "App aberto no preview; console do DevTools disponível.",
    passos: [
      "No console, executar: for(let i=0;i<110;i++) recordDiagnostic('teste','teste');",
      "Executar: diagnosticEvents.length"
    ],
    esperado: "diagnosticEvents.length === 100; entradas mais antigas são descartadas automaticamente."
  },

  // ── DESIGN E ACESSIBILIDADE ───────────────────────────────────────────────────

  {
    id: "F4-UX-01",
    fase: "F4",
    area: "Interface responsiva",
    titulo: "Inputs com estado de foco visível e transição suave",
    perfil: "Qualquer usuário",
    regras: "WCAG 2.1 AA — estado de foco deve ser perceptível",
    precondicoes: "App aberto no preview local, qualquer tela com formulário.",
    passos: [
      "Usar Tab para navegar até um campo de texto.",
      "Observar a borda e o foco do campo.",
      "Repetir no tema claro e no escuro."
    ],
    esperado: "Campo focado exibe borda na cor --accent e box-shadow suave; a transição é animada (não abrupta); funciona em ambos os temas."
  },

  {
    id: "F4-UX-02",
    fase: "F4",
    area: "Interface responsiva",
    titulo: "Tamanho mínimo de fonte legível em toda a interface",
    perfil: "Qualquer usuário",
    regras: "Nenhum texto de leitura abaixo de 11px; inputs mínimo 13px desktop",
    precondicoes: "App aberto no preview local.",
    passos: [
      "Abrir tela de alunos (lista com nomes e notas).",
      "Inspecionar font-size de: nome do aluno (.row-copy strong), legenda (.row-copy small), nota do aluno (.student-entry-note), texto de suporte do empty state.",
      "Repetir em tela de cobranças para .metric-note e .panel-copy."
    ],
    esperado: "Nome do aluno ≥ 13px; legendas e notas ≥ 11px; textos de suporte e panel-copy ≥ 13px; nenhum texto de leitura com 10px."
  },

  {
    id: "F4-UX-03",
    fase: "F4",
    area: "Interface responsiva",
    titulo: "Alvo de toque mínimo em botões pequenos e linhas de lista",
    perfil: "Usuário mobile",
    regras: "WCAG 2.5.5 — alvo de toque mínimo recomendado: 44×44px; mínimo aceitável: 36px",
    precondicoes: "App aberto no preview com largura 390px.",
    passos: [
      "Inspecionar min-height de .button--small.",
      "Inspecionar min-height de .list-row.",
      "Verificar botões de ação secundária (desvincular, cancelar item)."
    ],
    esperado: ".button--small tem min-height ≥ 36px; .list-row tem min-height ≥ 48px."
  },

  {
    id: "F4-UX-04",
    fase: "F4",
    area: "Interface responsiva",
    titulo: "Mobile nav exibe item ativo na renderização inicial",
    perfil: "Qualquer usuário mobile",
    regras: "Indicador de tela ativa deve estar presente desde o primeiro render",
    precondicoes: "App aberto no preview com largura ≤ 860px.",
    passos: [
      "Reduzir a janela do preview para 390px.",
      "Verificar que o botão da tela atual na nav inferior tem aria-current=\"page\".",
      "Navegar para outra tela e confirmar que o indicador migra corretamente."
    ],
    esperado: "O item ativo da nav mobile tem aria-current=\"page\" desde o primeiro render e atualiza ao navegar."
  },

  {
    id: "F4-UX-05",
    fase: "F4",
    area: "Interface responsiva",
    titulo: "Empty states exibem ícone de ancoragem visual",
    perfil: "Qualquer usuário",
    regras: "Empty states com ícone melhoram a orientação visual e reduzem ambiguidade",
    precondicoes: "App aberto no preview com perfil sem dados (aluno sem vínculo, professor sem alunos).",
    passos: [
      "Abrir tela de alunos sem alunos vinculados.",
      "Verificar presença do SVG .empty-state-icon acima do título.",
      "Repetir em telas de cobranças, conversas e planos de treino."
    ],
    esperado: "Todos os empty states exibem o ícone SVG inline acima do texto; ícone tem aria-hidden=\"true\"."
  },

  {
    id: "F4-UX-06",
    fase: "F4",
    area: "Interface responsiva",
    titulo: "Toast não sobrepõe a barra de navegação mobile",
    perfil: "Qualquer usuário mobile",
    regras: "Toast deve aparecer acima da nav bar com espaço mínimo de 20px",
    precondicoes: "App aberto no preview com largura 390px.",
    passos: [
      "Disparar um toast (ex: copiar código de turma).",
      "Medir a distância visual entre a borda inferior do toast e a borda superior da nav bar."
    ],
    esperado: "Toast aparece acima da nav bar com pelo menos 20px de distância; não há sobreposição."
  },

  {
    id: "F4-UX-07",
    fase: "F4",
    area: "Interface responsiva",
    titulo: "Cor da borda do orbe de perfil é neutra no tema escuro",
    perfil: "Qualquer usuário no tema escuro",
    regras: "Consistência visual — borda do avatar não deve ser dourada no dark mode",
    precondicoes: "App aberto no preview com tema escuro (padrão).",
    passos: [
      "Abrir qualquer tela com o botão de perfil visível no header.",
      "Inspecionar a borda do .profile-orb.",
      "Confirmar que a cor é --line, não --accent-text."
    ],
    esperado: "Borda do .profile-orb usa var(--line) no tema escuro; no tema claro mantém a mesma regra."
  },

  {
    id: "F4-UX-08",
    fase: "F4",
    area: "Interface responsiva",
    titulo: "Hover da nav mobile responsivo em dispositivos com ponteiro",
    perfil: "Usuário em tablet com teclado ou desktop em janela estreita",
    regras: "Estados de hover devem existir para dispositivos não-touch",
    precondicoes: "App aberto no preview com largura ≤ 860px em desktop.",
    passos: [
      "Passar o ponteiro sobre botões inativos da nav mobile.",
      "Verificar que há feedback visual de hover.",
      "Confirmar que o botão ativo não muda de estilo ao receber hover."
    ],
    esperado: "Botões inativos da nav mobile exibem background sutil no hover; botão ativo mantém seu estilo de destaque."
  },

  // ── PWA E SERVICE WORKER ──────────────────────────────────────────────────────

  {
    id: "F4-PWA-01",
    fase: "F4",
    area: "PWA",
    titulo: "Service Worker versiona e invalida cache corretamente",
    perfil: "Qualquer usuário",
    regras: "Cache prefixado com APP_VERSION; versões antigas são removidas na ativação",
    precondicoes: "App instalado como PWA; uma nova versão do app.js disponível.",
    passos: [
      "No DevTools → Application → Cache Storage, verificar o nome do cache ativo.",
      "Atualizar APP_VERSION em sw.js e recarregar.",
      "Verificar que o cache antigo foi removido e o novo criado."
    ],
    esperado: "Cache com prefixo tatame-app-static-5.26 (ou versão atual) está ativo; caches de versões anteriores são deletados."
  },

  {
    id: "F4-PWA-02",
    fase: "F4",
    area: "PWA",
    titulo: "App abre shell estático offline",
    perfil: "Qualquer usuário",
    regras: "Cache-first para assets estáticos; fallback para shell em navegação offline",
    precondicoes: "App instalado como PWA com cache populado.",
    passos: [
      "Desligar a conexão de rede (DevTools → Network → Offline).",
      "Atualizar a página.",
      "Verificar que o shell do app carrega sem rede."
    ],
    esperado: "index.html, css/app.css e js/app.js carregam do cache; erros de API são tratados sem quebrar a interface."
  },

  // ── README E DOCUMENTAÇÃO ─────────────────────────────────────────────────────

  {
    id: "F4-DOC-01",
    fase: "F4",
    area: "Documentação",
    titulo: "README completo e sem placeholders",
    perfil: "Qualquer pessoa que acesse o repositório",
    regras: "README deve conter instruções de execução local, stack, arquitetura e contato",
    precondicoes: "README.md atualizado no repositório.",
    passos: [
      "Abrir o README.md no GitHub.",
      "Verificar ausência de placeholders como [SEU-USUARIO], [contato@exemplo.com].",
      "Verificar que o link 'Ver app ao vivo' aponta para a URL correta do GitHub Pages.",
      "Confirmar que o comando git clone usa o nome do repositório correto (tatame-app)."
    ],
    esperado: "README sem placeholders; links funcionais; stack, arquitetura, instruções de execução e contato do autor presentes."
  }
];
