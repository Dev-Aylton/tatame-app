"use strict";

const demoRoles = {
  adm: { label: "Adm", home: "admin-home" },
  professor: { label: "Professor", home: "home" },
  instructor: { label: "Instrutor", home: "home" },
  student: { label: "Aluno", home: "home" }
};

const accessScreens = [
  ["login", "Entrar"],
  ["create-account", "Criar conta"],
  ["forgot-password", "Esqueci a senha"],
  ["password-recovery", "Definir nova senha"],
  ["no-access", "Aguardando liberação"],
  ["instructor-invite", "Convite de Instrutor"],
  ["real-account", "Conta"]
];

const navigationByRole = {
  adm: [
    ["Início", [["admin-home", "Painel do Adm"]]],
    ["Alunos", [["admin-students", "Alunos"]]],
    ["Professores e papéis", [["teacher-invites", "Professores convidados"], ["role-management", "Papéis e autorizações"]]],
    ["Conta e academia", [["academy", "Academia"], ["user-settings", "Preferências"], ["privacy", "Privacidade"]]]
  ],
  professor: [
    ["Início", [["home", "Início"]]],
    ["Alunos e vínculos", [["students", "Alunos"], ["student-detail", "Ficha do aluno"], ["teacher-code", "Código e convites"], ["role-management", "Papéis e autorizações"]]],
    ["Pagamentos", [["payment-review", "Pagamentos a confirmar"], ["monthly-charges", "Cobranças mensais"]]],
    ["Comunicação e treino", [["teacher-chat", "Conversas"], ["training-board", "Mural e grade"], ["training-plan", "Plano semanal"]]],
    ["Conta e academia", [["academy", "Academia"], ["user-settings", "Preferências"], ["privacy", "Privacidade"]]]
  ],
  instructor: [
    ["Início", [["home", "Início"]]],
    ["Treino", [["instructor-class", "Treino compartilhado"], ["instructor-students", "Alunos vinculados"], ["training-board", "Mural e grade"], ["training-plan", "Plano semanal"]]],
    ["Minha conta de aluno", [["student-payments", "Meus pagamentos"], ["student-grades", "Minhas graduações"]]],
    ["Comunicação e conta", [["instructor-chat", "Conversa com o Professor"], ["academy", "Academia"], ["user-settings", "Preferências"], ["privacy", "Privacidade"]]]
  ],
  student: [
    ["Início", [["home", "Início"]]],
    ["Vínculo", [["link-teacher", "Vincular a um Professor"]]],
    ["Minha conta", [["student-payments", "Meus pagamentos"], ["student-grades", "Minhas graduações"], ["student-progress", "Feedbacks e metas"]]],
    ["Comunicação e treino", [["student-chat", "Conversa com o Professor"], ["training-board", "Mural e grade"]]],
    ["Conta e academia", [["academy", "Academia"], ["user-settings", "Preferências"], ["privacy", "Privacidade"]]]
  ]
};

const screenTitles = Object.fromEntries(
  Object.values(navigationByRole).flatMap((groups) => groups.flatMap(([, items]) => items))
);
Object.assign(screenTitles, Object.fromEntries(accessScreens));
screenTitles["instructor-class"] = "Treino compartilhado";
screenTitles["instructor-students"] = "Alunos vinculados";

const screenDescriptions = {
  "admin-home": "Resumo fictício de academias, Professores, Alunos e convites pendentes.",
  "admin-students": "Consulta demonstrativa limitada a nomes e faixa/grau, sem foto ou dados financeiros.",
  "teacher-invites": "Prévia de convites de Professor com dados descartáveis.",
  "role-management": "Exemplo de papéis e autorizações para visualizar a organização das permissões.",
  academy: "Dados de academia inventados para esta demonstração.",
  "user-settings": "Preferências temporárias desta aba, incluindo o tema visual.",
  privacy: "A política completa permanece na página independente.",
  home: "Resumo e atalhos demonstrativos para o perfil selecionado.",
  students: "Lista fictícia de alunos vinculados ao Professor.",
  "student-detail": "Ficha demonstrativa de um aluno, com graduação fictícia.",
  "teacher-code": "Código e convites de exemplo; nenhum convite é enviado.",
  "payment-review": "Avisos fictícios aguardando decisão; nenhuma confirmação é gravada.",
  "monthly-charges": "Cobranças inventadas para demonstrar estados e filtros.",
  "teacher-chat": "Conversa fictícia somente para leitura.",
  "student-chat": "Conversa fictícia somente para leitura.",
  "instructor-chat": "Conversa fictícia somente para leitura.",
  "training-board": "Mural e grade semanal de exemplo.",
  "training-plan": "Plano de treino inventado para demonstração.",
  "instructor-class": "Orientação fictícia compartilhada pelo Professor.",
  "instructor-students": "Somente nomes e faixa/grau atuais; sem foto, histórico ou pagamentos.",
  "student-payments": "Situação fictícia das cobranças do perfil Aluno.",
  "student-grades": "Faixa e histórico de graduação inventados.",
  "student-progress": "Feedbacks e metas de exemplo.",
  "link-teacher": "Prévia do vínculo sem validar ou enviar código.",
  login: "Prévia da entrada. O formulário está desativado e não inicia autenticação.",
  "create-account": "Prévia do cadastro. Nenhum dado é solicitado ou enviado.",
  "forgot-password": "Prévia da recuperação de acesso, sem envio de e-mail.",
  "password-recovery": "Prévia da definição de senha, sem alterar uma conta.",
  "no-access": "Estado demonstrativo de uma conta que aguarda liberação.",
  "instructor-invite": "Prévia do convite sem validar token ou criar conta.",
  "real-account": "Informações da conta real não são carregadas na demonstração."
};

const demoPeople = [
  { name: "Aluno de demonstração 01", belt: "Azul · 2 graus" },
  { name: "Aluno de demonstração 02", belt: "Branca · 3 graus" },
  { name: "Aluno de demonstração 03", belt: "Roxa · 1 grau" }
];

const demoCharges = [
  { name: "Aluno de demonstração 01", month: "Junho", amount: "R$ 120,00", status: "Atrasada" },
  { name: "Aluno de demonstração 02", month: "Junho", amount: "R$ 120,00", status: "Pendente" },
  { name: "Aluno de demonstração 03", month: "Junho", amount: "R$ 100,00", status: "Paga" }
];

const demoState = {
  role: "professor",
  screen: "home",
  theme: "dark",
  chargeFilter: "Todas",
  instructorReadPlan: false
};

const sidebar = document.querySelector("#app-sidebar");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");
const menuButton = document.querySelector("#mobile-menu-button");
const screenNavigation = document.querySelector("#screen-navigation");
const mobileNavigation = document.querySelector("#mobile-navigation");
const screenContent = document.querySelector("#screen-content");
const screenTitle = document.querySelector("#current-screen-title");

function metricCard(label, value, note, tone = "") {
  return `<article class="metric-card ${tone}"><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><span class="metric-note">${note}</span></article>`;
}

function panel(title, body, extraClass = "") {
  return `<section class="panel-card ${extraClass}"><div class="panel-heading"><h3>${title}</h3></div>${body}</section>`;
}

function personRows(people = demoPeople) {
  return `<div class="list-stack">${people.map((person) => `
    <div class="student-entry">
      <div class="row-copy"><strong>${person.name}</strong></div>
      <span class="row-value">${person.belt}</span>
    </div>`).join("")}</div>`;
}

function chargeRows(filter = "Todas") {
  const rows = demoCharges.filter((charge) => filter === "Todas" || charge.status === filter);
  if (!rows.length) {
    return `<div class="empty-state"><div><strong>Nenhum resultado</strong><p>Não há cobranças neste filtro fictício.</p></div></div>`;
  }
  return `<div class="list-stack">${rows.map((charge) => `
    <div class="student-entry">
      <div class="row-copy"><strong>${charge.name}</strong><small>${charge.month} · ${charge.status}</small></div>
      <span class="row-value">${charge.amount}</span>
    </div>`).join("")}</div>`;
}

function screenHeading(id) {
  const title = screenTitles[id] || "Demonstração";
  const description = screenDescriptions[id] || "Conteúdo fictício para revisão visual e de navegação.";
  return `<div class="screen-heading">
    <div><p class="eyebrow">PRÉVIA · ${demoRoles[demoState.role].label.toUpperCase()}</p><h2>${title}</h2><p class="panel-copy">${description}</p></div>
    <div class="field demo-role-field"><label for="demo-role">Perfil demonstrativo</label><select id="demo-role">
      ${Object.entries(demoRoles).map(([role, details]) => `<option value="${role}" ${role === demoState.role ? "selected" : ""}>${details.label}</option>`).join("")}
    </select></div>
  </div>`;
}

function shortcut(screen, label) {
  return `<button class="button button--quiet" type="button" data-demo-screen="${screen}">${label}</button>`;
}

function overviewContent() {
  if (demoState.role === "adm") {
    return `<div class="stack"><div class="card-grid card-grid--four">
      ${metricCard("ACADEMIAS", "2", "registros fictícios")}
      ${metricCard("PROFESSORES", "3", "perfis demonstrativos")}
      ${metricCard("ALUNOS", "18", "vínculos de exemplo")}
      ${metricCard("CONVITES", "1", "aguardando")}
    </div>${panel("Atalhos", `<div class="row-actions">${shortcut("academy", "Academias")}${shortcut("teacher-invites", "Professores")}${shortcut("admin-students", "Alunos")}</div>`)}</div>`;
  }
  if (demoState.role === "professor") {
    return `<div class="stack"><div class="card-grid card-grid--three">
      ${metricCard("A CONFIRMAR", "2", "avisos fictícios", "metric-card--amber")}
      ${metricCard("ATRASADAS", "1", "cobrança de exemplo", "metric-card--red")}
      ${metricCard("ALUNOS", "18", "na turma fictícia")}
    </div>${panel("Atalhos", `<div class="row-actions">${shortcut("payment-review", "Pagamentos a confirmar")}${shortcut("monthly-charges", "Cobranças mensais")}${shortcut("students", "Alunos")}${shortcut("teacher-code", "Código e convites")}</div>`)}</div>`;
  }
  if (demoState.role === "student") {
    return `<div class="stack"><div class="card-grid card-grid--three">
      ${metricCard("JUNHO", "Pendente", "cobrança fictícia", "metric-card--amber")}
      ${metricCard("MAIO", "Paga", "cobrança fictícia", "metric-card--green")}
      ${metricCard("ABRIL", "Atrasada", "cobrança fictícia", "metric-card--red")}
    </div>${panel("Atalhos", `<div class="row-actions">${shortcut("student-payments", "Meus pagamentos")}${shortcut("student-grades", "Minhas graduações")}${shortcut("student-chat", "Conversa")}${shortcut("link-teacher", "Vincular a um Professor")}</div>`)}</div>`;
  }
  return `<div class="stack"><div class="card-grid card-grid--two">
    ${metricCard("TREINO COMPARTILHADO", "Disponível", "plano fictício do Professor")}
    ${metricCard("ALUNOS VINCULADOS", "3", "somente nome e faixa/grau")}
  </div>${panel("Atalhos", `<div class="row-actions">${shortcut("instructor-class", "Treino compartilhado")}${shortcut("instructor-students", "Alunos vinculados")}</div>`)}</div>`;
}

function renderScreenBody(id) {
  if (id === "home" || id === "admin-home") return overviewContent();
  if (id === "students" || id === "admin-students" || id === "instructor-students") {
    return panel("Turma de demonstração", personRows(demoPeople));
  }
  if (id === "student-detail") {
    return `<div class="content-grid">${panel("Perfil fictício", `<div class="student-belt"><span class="profile-orb" aria-hidden="true">AD</span><span><strong>Aluno de demonstração 01</strong><small>Maior de idade — exemplo</small></span></div><p class="panel-copy">Nenhuma foto ou dado real é exibido.</p>`)}${panel("Graduação", `<div class="student-belt"><span>Azul · 2 graus</span><span class="row-value">Última atualização fictícia</span></div>`)}</div>`;
  }
  if (id === "payment-review" || id === "monthly-charges" || id === "student-payments") {
    const filter = id === "monthly-charges" ? `<div class="field"><label for="demo-charge-filter">Filtrar cobranças</label><select id="demo-charge-filter"><option>Todas</option><option>Pendente</option><option>Paga</option><option>Atrasada</option></select></div>` : "";
    return `${id === "monthly-charges" ? `<div class="screen-toolbar">${filter}</div>` : ""}${panel(id === "payment-review" ? "Avisos de pagamento" : "Cobranças fictícias", chargeRows(demoState.chargeFilter))}<p class="field-help">Nenhum pagamento é confirmado, enviado ou alterado.</p>`;
  }
  if (id === "teacher-invites" || id === "teacher-code" || id === "link-teacher") {
    return `<div class="content-grid">${panel("Código demonstrativo", `<div class="code-display">TATAME-TESTE</div><p class="panel-copy">Este código é fictício e não pode criar vínculos.</p>`)}${panel(id === "link-teacher" ? "Situação do vínculo" : "Convites de exemplo", `<div class="empty-state"><div><strong>${id === "link-teacher" ? "Nenhuma solicitação enviada" : "1 convite fictício pendente"}</strong><p>Esta prévia não consulta nem altera convites reais.</p></div></div>`)}</div>`;
  }
  if (id === "role-management") {
    return panel("Papéis disponíveis", `<div class="list-stack">${["Adm", "Professor", "Instrutor", "Aluno"].map((role) => `<div class="student-entry"><div class="row-copy"><strong>${role}</strong></div><span class="row-value">Acesso de exemplo</span></div>`).join("")}</div>`);
  }
  if (id === "academy") {
    return panel("Academia fictícia", `<div class="student-belt"><span><strong>Academia Tatame de Exemplo</strong><small>Endereço e contatos não informados</small></span></div><p class="panel-copy">Nenhum dado real de academia é usado nesta demonstração.</p>`);
  }
  if (id === "training-board" || id === "training-plan" || id === "instructor-class") {
    const entries = id === "training-board"
      ? ["Segunda · Fundamentos", "Quarta · Passagem de guarda", "Sexta · Rola leve"]
      : ["Aquecimento · 10 min", "Técnica · 25 min", "Treino situacional · 20 min"];
    return `${panel(id === "training-board" ? "Grade semanal fictícia" : "Plano de treino fictício", `<div class="list-stack">${entries.map((entry) => `<div class="student-entry"><div class="row-copy"><strong>${entry}</strong><small>Conteúdo ilustrativo</small></div></div>`).join("")}</div>`)}
      ${id === "instructor-class" ? `<label class="consent-row"><input id="demo-read-plan" type="checkbox" ${demoState.instructorReadPlan ? "checked" : ""}><span>Li a orientação fictícia do Professor</span></label><p class="field-help" id="demo-read-status" role="status">${demoState.instructorReadPlan ? "Marcado somente nesta aba." : "A marcação não é enviada nem salva."}</p>` : ""}`;
  }
  if (id === "student-grades" || id === "student-progress") {
    return `<div class="content-grid">${panel("Minha faixa", `<div class="student-belt"><span class="profile-orb" aria-hidden="true">AL</span><span><strong>Azul · 2 graus</strong><small>Informação fictícia</small></span></div>`)}${panel(id === "student-grades" ? "Histórico de exemplo" : "Metas de demonstração", `<div class="list-stack"><div class="student-entry"><div class="row-copy"><strong>${id === "student-grades" ? "Graduação registrada" : "Meta técnica"}</strong><small>Registro fictício</small></div><span class="row-value">${id === "student-grades" ? "Azul" : "Em andamento"}</span></div></div>`)}</div>`;
  }
  if (id === "teacher-chat" || id === "student-chat" || id === "instructor-chat") {
    return panel("Conversa de exemplo", `<div class="chat-thread"><p class="chat-bubble">Professor: treino compartilhado atualizado.</p><p class="chat-bubble chat-bubble--outgoing">Conta demonstrativa: obrigado!</p></div><p class="field-help">Mensagens somente ilustrativas; o envio está desativado.</p>`);
  }
  if (id === "user-settings") {
    return panel("Preferências temporárias", `<p class="panel-copy">A escolha do tema vale somente enquanto esta página estiver aberta.</p><button class="button button--quiet" type="button" data-demo-theme aria-pressed="${demoState.theme === "light"}">Tema: ${demoState.theme === "light" ? "claro" : "escuro"}</button>`);
  }
  if (id === "privacy") {
    return panel("Privacidade", `<p class="panel-copy">Esta demonstração usa somente exemplos fictícios em memória e não carrega o perfil real.</p><a class="text-link" href="privacidade.html">Abrir a página de privacidade</a>`);
  }
  if (accessScreens.some(([screen]) => screen === id)) {
    return panel("Prévia de acesso", `<p class="panel-copy">${screenDescriptions[id]}</p><p class="notice notice--info">Nenhuma autenticação, recuperação, convite ou alteração de conta é iniciada neste modo.</p><a class="button button--quiet" href="index.html">Ir para o acesso real</a>`);
  }
  return panel("Prévia da tela", `<p class="panel-copy">${screenDescriptions[id] || "Conteúdo fictício para revisão."}</p>`);
}

function renderSidebar() {
  const groups = navigationByRole[demoState.role].map(([title, items]) =>
    `<section class="nav-group"><h2 class="nav-group-title">${title}</h2>${items.map(([id, label]) => `<button class="nav-item" type="button" data-demo-screen="${id}" data-screen-target="${id}" ${id === demoState.screen ? 'aria-current="page"' : ""}><span class="nav-item-label">${label}</span></button>`).join("")}</section>`
  );
  groups.push(`<section class="nav-group"><h2 class="nav-group-title">Fluxos de acesso · prévia</h2>${accessScreens.map(([id, label]) => `<button class="nav-item" type="button" data-demo-screen="${id}" data-screen-target="${id}" ${id === demoState.screen ? 'aria-current="page"' : ""}><span class="nav-item-label">${label}</span></button>`).join("")}</section>`);
  screenNavigation.innerHTML = groups.join("");
}

function renderMobileNavigation() {
  const items = navigationByRole[demoState.role].flatMap(([, screens]) => screens).slice(0, 4);
  mobileNavigation.style.setProperty("--mobile-nav-items", String(items.length));
  mobileNavigation.innerHTML = items.map(([id, label]) => `<button type="button" data-demo-screen="${id}" data-screen-target="${id}" aria-label="${label}" ${id === demoState.screen ? 'aria-current="page"' : ""}><span class="mobile-nav-icon" aria-hidden="true">${label.slice(0, 1)}</span><span class="mobile-nav-label">${label}</span></button>`).join("");
}

function renderDemo() {
  const title = screenTitles[demoState.screen] || "Demonstração";
  screenTitle.textContent = title;
  document.title = `${title} | Demonstração Tatame`;
  screenContent.innerHTML = `<div class="notice notice--info" role="note">Demonstração interativa: dados fictícios apenas nesta aba. Nada é enviado ao Supabase ou salvo no navegador.</div>${screenHeading(demoState.screen)}${renderScreenBody(demoState.screen)}`;
  renderSidebar();
  renderMobileNavigation();
}

function setMenuOpen(open) {
  const wasOpen = sidebar.classList.contains("is-open");
  sidebar.classList.toggle("is-open", open);
  sidebarBackdrop.classList.toggle("is-visible", open);
  menuButton.setAttribute("aria-expanded", String(open));
  document.querySelectorAll(".app-main, #mobile-navigation").forEach((element) => { element.inert = open; });
  if (open) sidebar.querySelector("button")?.focus();
  else if (wasOpen) menuButton.focus();
}

function setTheme() {
  demoState.theme = demoState.theme === "dark" ? "light" : "dark";
  document.body.dataset.theme = demoState.theme;
  document.querySelectorAll("[data-demo-theme]").forEach((button) => {
    const isLight = demoState.theme === "light";
    button.setAttribute("aria-pressed", String(isLight));
    button.textContent = `Tema: ${isLight ? "claro" : "escuro"}`;
  });
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const navigationButton = target.closest("[data-demo-screen]");
  if (navigationButton) {
    demoState.screen = navigationButton.dataset.demoScreen;
    renderDemo();
    setMenuOpen(false);
    return;
  }
  if (target.closest("[data-demo-theme]")) {
    setTheme();
    return;
  }
  if (target.closest("[data-demo-close-sidebar]") || target === sidebarBackdrop) {
    setMenuOpen(false);
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement || target instanceof HTMLInputElement)) return;
  if (target.id === "demo-role") {
    demoState.role = target.value;
    demoState.screen = demoRoles[demoState.role].home;
    renderDemo();
  } else if (target.id === "demo-charge-filter") {
    demoState.chargeFilter = target.value;
    renderDemo();
  } else if (target.id === "demo-read-plan") {
    demoState.instructorReadPlan = target.checked;
    renderDemo();
  }
});

menuButton.addEventListener("click", () => setMenuOpen(true));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("is-open")) setMenuOpen(false);
});

renderDemo();
