"use strict";

const APP_VERSION = "0.1.2";
const diagnosticEvents = [];
let versionClicks = 0;

function recordDiagnostic(category) {
  diagnosticEvents.push({ category, time: new Date().toLocaleTimeString("pt-BR") });
  const list = document.querySelector("#diagnostics-list");
  if (list) {
    list.replaceChildren(...diagnosticEvents.map((entry) => {
      const item = document.createElement("li");
      item.textContent = `${entry.time} — ${entry.category}`;
      return item;
    }));
  }
}

window.addEventListener("error", () => recordDiagnostic("Erro no aplicativo"), true);
window.addEventListener("unhandledrejection", () => recordDiagnostic("Operação não concluída"));

const navigationGroups = [
  {
    title: "Acesso",
    roles: ["public"],
    items: [
      ["login", "Entrar", "↗"],
      ["register", "Cadastro por convite", "＋"],
      ["link-teacher", "Vincular a um professor", "⌁"],
      ["no-access", "Aguardando liberação", "◷"],
      ["instructor-invite", "Convite de instrutor", "◇"]
    ]
  },
  {
    title: "Vínculo",
    roles: ["student-unregistered"],
    items: [["link-teacher", "Vincular a um professor", "⌁"]]
  },
  {
    title: "Treino",
    roles: ["instructor"],
    items: [["instructor-class", "Treino compartilhado", "▣"]]
  },
  {
    title: "Início e atalhos",
    roles: ["student", "instructor", "professor", "adm"],
    items: [
      ["admin-home", "Painel do Adm", "▦"],
      ["teacher-home", "Painel do professor", "▦"],
      ["student-home", "Início", "⌂"],
      ["quick-actions", "Ações rápidas", "✦"]
    ]
  },
  {
    title: "Minha conta de aluno",
    roles: ["student", "instructor"],
    items: [
      ["student-link", "Meu vínculo", "⌁"],
      ["student-payments", "Meus pagamentos", "▤"],
      ["student-grades", "Minhas graduações", "◇"]
    ]
  },
  {
    title: "Alunos e vínculos",
    roles: ["professor"],
    items: [
      ["students", "Alunos", "♧"],
      ["student-detail", "Ficha do aluno", "▧"],
      ["student-create", "Novo aluno e convite", "＋"],
      ["teacher-code", "Código e convites", "⌁"],
      ["role-management", "Papéis e autorizações", "◈"]
    ]
  },
  {
    title: "Pagamentos",
    roles: ["professor"],
    items: [
      ["payment-review", "Pagamentos a confirmar", "▤"],
      ["overdue", "Atrasados", "◷"],
      ["pix-import", "Importar extrato Pix", "⇧"]
    ]
  },
  {
    title: "Professores e papéis",
    roles: ["adm"],
    items: [
      ["teacher-invites", "Professores convidados", "♧"],
      ["role-management", "Papéis e autorizações", "◈"]
    ]
  },
  {
    title: "Comunicação",
    roles: ["student", "professor", "instructor"],
    items: [
      ["teacher-chat", "Conversas", "✉"],
      ["student-chat", "Conversa com o professor", "✉"],
      ["instructor-chat", "Conversa com o professor", "✉"]
    ]
  },
  {
    title: "Conta e academia",
    roles: ["student", "professor", "instructor", "adm"],
    items: [
      ["academy", "Academia", "⌂"],
      ["user-settings", "Preferências", "◎"],
      ["privacy", "Privacidade", "◇"]
    ]
  }
];

const screenInfo = Object.fromEntries(
  navigationGroups.flatMap((group) =>
    group.items.map(([id, title]) => [id, { title, group: group.title }])
  )
);
const roleScreens = {
  adm: ["admin-home", "teacher-invites", "role-management", "academy", "user-settings", "privacy"],
  professor: ["teacher-home", "students", "student-detail", "student-create", "teacher-code", "role-management", "pix-import", "payment-review", "overdue", "quick-actions", "teacher-chat", "academy", "user-settings", "privacy"],
  instructor: ["student-home", "student-payments", "student-grades", "instructor-class", "instructor-chat", "academy", "user-settings", "privacy"],
  student: ["student-home", "student-link", "student-payments", "student-grades", "student-chat", "link-teacher", "academy", "user-settings", "privacy"],
  "student-unregistered": ["link-teacher"]
};
const demoProfiles = {
  adm: { role: "adm", label: "Adm", name: "ADM FICTÍCIO", start: "admin-home" },
  professor: { role: "professor", label: "Professor", name: "PROFESSOR FICTÍCIO 01", start: "teacher-home", academyId: null },
  instructor: { role: "instructor", label: "Instrutor", name: "INSTRUTOR FICTÍCIO 01", start: "instructor-class", teacherAccount: "professor", academyId: null, grade: "Faixa azul · 1 grau", gradeHistory: ["Graduação fictícia preservada"] },
  student: { role: "student", label: "Aluno registrado", name: "ALUNO FICTÍCIO 01", start: "student-home", teacherAccount: null, academyId: null, grade: "Faixa azul · 2 graus", gradeHistory: ["Graduação fictícia preservada"] },
  "student-unregistered": { role: "student-unregistered", label: "Aluno sem registro", name: "ALUNO FICTÍCIO 04", start: "link-teacher", grade: "Faixa branca", gradeHistory: ["Histórico fictício preservado"] }
};
const demoAcademy = { id: "academia-ficticia-01", name: "Academia Fictícia" };
const defaultProfessorSchedule = [
  ["Segunda e quarta", "19h às 20h30"],
  ["Terça e quinta", "6h30 às 8h"]
];
const publishedAcademyGrades = new Set();
const demoRoster = [
  { account: "student", name: "ALUNO FICTÍCIO 01", grade: "Faixa azul · 2 graus", teacherAccount: "professor" },
  { account: "instructor", name: "INSTRUTOR FICTÍCIO 01", grade: "Faixa azul · 1 grau", teacherAccount: "professor" },
  { account: null, name: "ALUNO FICTÍCIO 02", grade: "Faixa branca", teacherAccount: "professor" },
  { account: null, name: "ALUNO FICTÍCIO 03", grade: "Faixa roxa · 1 grau", teacherAccount: "professor" }
];
const demoBelts = ["Branca", "Azul", "Roxa", "Marrom", "Preta", "Coral vermelha e preta", "Coral vermelha e branca", "Vermelha"];
const demoGradeHistory = new Map();
let selectedGradeStudent = null;
const demoInviteRecipients = [
  { id: "instructor", type: "instructor", name: demoProfiles.instructor.name },
  { id: "student-02", type: "student", name: demoRoster[2].name },
  { id: "student-03", type: "student", name: demoRoster[3].name }
];
const simulatedRoleHistory = [
  "ALUNO FICTÍCIO 03: aluno registrado → instrutor · histórico mantido.",
  "INSTRUTOR FICTÍCIO 03: instrutor → professor · histórico mantido."
];
const authorizedInstructorNames = new Set();
const delegatedLessons = {};
const linkRequests = [];
const cashPayments = [];
const receiptPayments = [];

function loadDemoPayments() {
  try {
    const stored = localStorage.getItem("tatame-demo-payments");
    if (!stored) return;
    const data = JSON.parse(stored);
    const validPayment = (payment) => payment && typeof payment.id === "string" &&
      typeof payment.studentName === "string" && typeof payment.professorAccount === "string" &&
      typeof payment.amount === "string" && typeof payment.date === "string" &&
      ["pending", "confirmed", "rejected", "undone", "reversed"].includes(payment.status) &&
      (typeof payment.account === "string" || payment.account === null);
    if (!data || !Array.isArray(data.cash) || !Array.isArray(data.receipts) ||
        !data.cash.every((payment) => validPayment(payment) && ["student", "teacher"].includes(payment.source) &&
          (payment.source !== "teacher" || (Number.isFinite(payment.undoUntil) &&
            typeof payment.type === "string" && typeof payment.reference === "string"))) ||
        !data.receipts.every((payment) => validPayment(payment) &&
          ["pending", "confirmed", "rejected"].includes(payment.status))) {
      throw new TypeError("Dados fictícios de pagamentos inválidos.");
    }
    cashPayments.push(...data.cash);
    receiptPayments.push(...data.receipts);
  } catch (error) {
    console.error("Não foi possível carregar os pagamentos fictícios:", error);
    window.setTimeout(() => showToast("Não foi possível carregar os pagamentos fictícios; a lista inicial está vazia.", "error"), 0);
  }
}

function saveDemoPayments() {
  try {
    const receipts = receiptPayments.map(({ file, fileInput, ...payment }) => payment);
    localStorage.setItem("tatame-demo-payments", JSON.stringify({ cash: cashPayments, receipts }));
  } catch (error) {
    console.error("Não foi possível salvar os pagamentos fictícios:", error);
    showToast("Não foi possível salvar os pagamentos fictícios.", "error");
    throw error;
  }
}

function updateDemoPayments(update) {
  const previousCash = cashPayments.map((payment) => ({ ...payment }));
  const previousReceipts = receiptPayments.map((payment) => ({ ...payment }));
  update();
  try {
    saveDemoPayments();
  } catch (error) {
    cashPayments.splice(0, cashPayments.length, ...previousCash);
    receiptPayments.splice(0, receiptPayments.length, ...previousReceipts);
    throw error;
  }
}

loadDemoPayments();
function loadDemoInvites() {
  try {
    const stored = localStorage.getItem("tatame-demo-invites");
    const invites = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(invites)) throw new TypeError("O estado local dos convites de demonstração é inválido.");
    return invites;
  } catch (error) {
    console.error("Não foi possível carregar os convites fictícios:", error);
    window.setTimeout(() => showToast("Não foi possível carregar os convites fictícios; a lista inicial está vazia.", "error"), 0);
    return [];
  }
}
const demoInvites = loadDemoInvites();
demoInvites.filter((invite) => invite.used && invite.academyId === demoAcademy.id).forEach((invite) => {
  const professor = demoProfiles[invite.professorAccount];
  if (!professor) return;
  if (invite.type === "instructor") {
    demoProfiles.instructor.teacherAccount = invite.professorAccount;
    demoProfiles.instructor.academyId = invite.academyId;
    return;
  }
  const student = demoRoster.find((item) => item.name === invite.recipientName && !item.account);
  if (!student) return;
  const account = `pre-registered-${invite.recipientId}`;
  demoProfiles[account] = {
    role: "student",
    label: "Aluno registrado",
    name: invite.recipientName,
    start: "student-home",
    teacherAccount: invite.professorAccount,
    academyId: invite.academyId,
    grade: student.grade,
    gradeHistory: ["Graduação fictícia preservada"]
  };
  student.account = account;
  student.teacherAccount = invite.professorAccount;
});
const DEMO_DATA_VERSION = 1;
const demoDataKeys = {
  profiles: "tatame-demo-profiles",
  roster: "tatame-demo-roster",
  links: "tatame-demo-links",
  grades: "tatame-demo-grades",
  invites: "tatame-demo-invites"
};

function readDemoData(key, validate) {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    const record = JSON.parse(stored);
    if (!record || record.version !== DEMO_DATA_VERSION || !validate(record.data)) {
      throw new TypeError("Formato ou versão dos dados fictícios inválidos.");
    }
    return record.data;
  } catch (error) {
    console.error(`Não foi possível carregar ${key}:`, error);
    window.setTimeout(() => showToast("Não foi possível carregar dados fictícios salvos; os dados iniciais serão usados.", "error"), 0);
    return null;
  }
}

function writeDemoData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ version: DEMO_DATA_VERSION, data }));
  } catch (error) {
    console.error(`Não foi possível salvar ${key}:`, error);
    throw error;
  }
}

function saveDemoProfiles() { writeDemoData(demoDataKeys.profiles, demoProfiles); }
function saveDemoRoster() { writeDemoData(demoDataKeys.roster, demoRoster); }
function saveLinkRequests() { writeDemoData(demoDataKeys.links, linkRequests); }
function saveDemoGradeHistory() {
  writeDemoData(demoDataKeys.grades, Array.from(demoGradeHistory, ([student, entries]) => ({
    index: demoRoster.indexOf(student), name: student.name, account: student.account, entries
  })));
}

const isStringOrNull = (value) => value === null || typeof value === "string";
const storedProfiles = readDemoData(demoDataKeys.profiles, (value) =>
  value && typeof value === "object" && !Array.isArray(value) &&
  ["adm", "professor", "instructor", "student", "student-unregistered"].every((key) => Object.hasOwn(value, key)) &&
  Object.entries(value).every(([key, profile]) => /^[a-z0-9-]+$/.test(key) && profile &&
    typeof profile.name === "string" && typeof profile.label === "string" &&
    Object.hasOwn(roleScreens, profile.role) && typeof profile.start === "string" &&
    (profile.teacherAccount === undefined || isStringOrNull(profile.teacherAccount)) &&
    (profile.academyId === undefined || isStringOrNull(profile.academyId)) &&
    (profile.grade === undefined || typeof profile.grade === "string"))
);
if (storedProfiles) Object.assign(demoProfiles, storedProfiles);

const storedRoster = readDemoData(demoDataKeys.roster, (value) =>
  Array.isArray(value) && value.every((student) => student && typeof student.name === "string" &&
    typeof student.grade === "string" && isStringOrNull(student.account) && isStringOrNull(student.teacherAccount))
);
if (storedRoster) demoRoster.splice(0, demoRoster.length, ...storedRoster);

const storedLinks = readDemoData(demoDataKeys.links, (value) =>
  Array.isArray(value) && value.every((request) => request && typeof request.id === "string" &&
    typeof request.account === "string" && typeof request.studentName === "string" &&
    typeof request.professorAccount === "string" && ["pending", "approved", "rejected", "cancelled"].includes(request.status))
);
if (storedLinks) linkRequests.push(...storedLinks);

const storedGrades = readDemoData(demoDataKeys.grades, (value) =>
  Array.isArray(value) && value.every((item) => item && Number.isInteger(item.index) && item.index >= 0 &&
    item.index < demoRoster.length && demoRoster[item.index].name === item.name &&
    demoRoster[item.index].account === item.account && Array.isArray(item.entries) &&
    item.entries.every((entry) => entry && typeof entry.belt === "string" && Number.isInteger(entry.degree) &&
      typeof entry.date === "string" && typeof entry.professor === "string"))
);
if (storedGrades) storedGrades.forEach((item) => demoGradeHistory.set(demoRoster[item.index], item.entries));

function updateDemoData(update, saves) {
  const previous = {
    profiles: structuredClone(demoProfiles),
    roster: structuredClone(demoRoster),
    links: structuredClone(linkRequests),
    invites: structuredClone(demoInvites),
    grades: Array.from(demoGradeHistory, ([student, entries]) => [demoRoster.indexOf(student), structuredClone(entries)]),
    selectedIndex: demoRoster.indexOf(selectedGradeStudent),
    authorized: Array.from(authorizedInstructorNames)
  };
  const previousStorage = new Map();
  try {
    for (const [key] of saves) previousStorage.set(key, localStorage.getItem(key));
    update();
    for (const [, save] of saves) save();
  } catch (error) {
    for (const key of Object.keys(demoProfiles)) delete demoProfiles[key];
    Object.assign(demoProfiles, previous.profiles);
    demoRoster.splice(0, demoRoster.length, ...previous.roster);
    linkRequests.splice(0, linkRequests.length, ...previous.links);
    demoInvites.splice(0, demoInvites.length, ...previous.invites);
    demoGradeHistory.clear();
    previous.grades.forEach(([index, entries]) => demoGradeHistory.set(demoRoster[index], entries));
    selectedGradeStudent = previous.selectedIndex < 0 ? null : demoRoster[previous.selectedIndex];
    authorizedInstructorNames.clear();
    previous.authorized.forEach((name) => authorizedInstructorNames.add(name));
    for (const [key, value] of previousStorage) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch (restoreError) {
        console.error(`Não foi possível restaurar ${key}:`, restoreError);
      }
    }
    console.error("Não foi possível salvar os dados fictícios:", error);
    showToast("Não foi possível salvar os dados fictícios.", "error");
    throw error;
  }
}
const teacherLinkCodes = new Map([["professor", "K7M4PX"]]);
const linkCodeAttempts = new Map();
let currentTeacherLinkPreview = null;
const tutorialStepsByRole = {
  adm: [
    ["admin-home", "Painel do Adm", "Acompanhe os dados administrativos fictícios e os avisos gerais. No celular, use a barra inferior ou o menu para navegar; abra a conta para tutorial e saída."],
    ["teacher-invites", "Professores convidados", "Convide professores. Só o Adm define quem será Professor."],
    ["role-management", "Papéis e academia", "Defina o papel de Professor, vincule-o a uma academia e, quando necessário, gradue um Instrutor a Professor."],
    ["academy", "Academia", "Consulte o quadro da equipe e os horários publicados da academia."],
    ["user-settings", "Preferências", "Confira tema e opções demonstrativas da conta."],
    ["privacy", "Privacidade", "Consulte os avisos de privacidade e o estado do conteúdo pendente."]
  ],
  professor: [
    ["teacher-home", "Painel do Professor", "Veja os indicadores, avisos e atalhos da sua turma. No celular, use a barra inferior ou o menu para navegar; abra a conta para tutorial e saída."],
    ["students", "Alunos", "Consulte somente os alunos da sua turma."],
    ["student-detail", "Ficha do aluno", "Veja perfil, pagamentos, graduações e notas privadas. Em Graduações, escolha um aluno da sua turma, faixa e grau superiores e a data; confirme para registrar. Notas privadas não são compartilhadas com o Instrutor."],
    ["student-create", "Novo aluno", "Cadastre um aluno fictício com sua faixa e grau atuais. Nome e graduação ficam neste navegador; os demais campos não são salvos e nenhum login ou convite é criado."],
    ["teacher-code", "Código e convites", "Veja pedidos de vínculo, aprove ou recuse e gere links de uso único com validade de três dias."],
    ["role-management", "Papéis e aula delegada", "Promova somente seus alunos a Instrutor, autorize-o e decida se compartilha o plano ou deixa o treino livre. O Instrutor é um aluno com função de apoio: vê nome e graduação da turma, nunca pagamentos alheios, notas privadas ou conversas de terceiros; você decide o conteúdo."],
    ["pix-import", "Importar extrato Pix", "Importe um extrato para sugerir correspondências. Nada é pago ou confirmado automaticamente."],
    ["payment-review", "Pagamentos a confirmar", "Confira avisos ou lance dinheiro recebido: busque o aluno da turma, informe tipo e referência e confirme os dados. É possível desfazer por 10 segundos; depois, use Estornar. O histórico é preservado nesta simulação."],
    ["overdue", "Atrasados", "Revise cobranças atrasadas antes de enviar um lembrete."],
    ["quick-actions", "Ações rápidas", "Use os atalhos e limite lotes de mensalidades a 24 cobranças."],
    ["teacher-chat", "Conversas", "Converse somente com seus alunos e Instrutores autorizados."],
    ["academy", "Academia", "Consulte equipe e horários; publique ou retorne a grade para rascunho."],
    ["user-settings", "Preferências", "Confira tema, atualização e acesso à privacidade."],
    ["privacy", "Privacidade", "Leia os avisos de privacidade e o estado do conteúdo pendente."]
  ],
  instructor: [
    ["student-home", "Início pessoal", "Consulte seu perfil e seus próprios avisos, separados das informações dos alunos da turma. No celular, use a barra inferior ou o menu para navegar; abra a conta para tutorial e saída."],
    ["student-payments", "Meus pagamentos", "Consulte somente suas cobranças e seus próprios pagamentos. Nunca verá pagamentos de outros alunos."],
    ["student-grades", "Minhas graduações", "Acompanhe sua própria faixa e seu histórico de graduações."],
    ["instructor-class", "Aula delegada", "Veja nome e graduação atual da turma e a aula que o Professor decidiu compartilhar, ou “Treino livre”. Registre “Segui” ou “Não segui”; pagamentos de outros alunos e notas privadas não aparecem."],
    ["instructor-chat", "Conversa com o Professor", "Converse somente com o Professor. Não há conversas com alunos ou terceiros."],
    ["academy", "Academia", "Consulte o quadro e os horários publicados da academia."],
    ["user-settings", "Preferências", "Confira tema e opções demonstrativas da conta."],
    ["privacy", "Privacidade", "Consulte os avisos de privacidade."]
  ],
  student: [
    ["student-home", "Início", "Consulte seu perfil, o status da mensalidade e atalhos pessoais. No celular, use a barra inferior ou o menu para navegar; abra a conta para tutorial e saída."],
    ["student-link", "Meu vínculo", "Veja seu Professor e academia, troque de Professor por código e acompanhe pedidos pendentes."],
    ["student-payments", "Meus pagamentos", "Consulte suas cobranças, envie comprovante ou informe um pagamento em dinheiro, que fica pendente até a confirmação do Professor."],
    ["student-grades", "Minhas graduações", "Acompanhe sua faixa e seu histórico de graduações."],
    ["student-chat", "Conversa com o Professor", "Envie mensagens somente ao seu Professor."],
    ["link-teacher", "Vincular a um Professor", "Confira o nome do Professor e da academia antes de pedir vínculo."],
    ["academy", "Academia", "Veja professores, Instrutores e horários publicados da sua academia."],
    ["user-settings", "Preferências", "Confira tema e opções demonstrativas da conta."],
    ["privacy", "Privacidade", "Consulte os avisos de privacidade."]
  ],
  "student-unregistered": [
    ["link-teacher", "Vincular a um Professor", "Informe o código de seis caracteres, confira somente o nome do Professor e da academia e envie o pedido. O vínculo depende da aprovação. Abra a conta para rever o tutorial ou sair."]
  ]
};
Object.entries(tutorialStepsByRole).forEach(([role, steps]) => {
  steps.push([
    role === "student-unregistered" ? "link-teacher" : "user-settings",
    "Área de risco",
    "No painel da conta, abra Área de risco para consultar o aviso. A exclusão ainda não está disponível nesta simulação."
  ]);
});
const tutorialIllustrations = [
  '<svg viewBox="0 0 96 72" aria-hidden="true"><rect x="14" y="12" width="68" height="48" rx="8" fill="none" stroke="currentColor" stroke-width="4"/><path d="M25 28h46M25 39h30M25 50h20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="4"/></svg>',
  '<svg viewBox="0 0 96 72" aria-hidden="true"><circle cx="34" cy="27" r="11" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="64" cy="27" r="11" fill="none" stroke="currentColor" stroke-width="4"/><path d="M14 59c2-12 10-18 20-18s18 6 20 18M44 59c2-12 10-18 20-18s18 6 20 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="4"/></svg>',
  '<svg viewBox="0 0 96 72" aria-hidden="true"><path d="M48 9 78 20v17c0 15-12 25-30 31C30 62 18 52 18 37V20z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"/><path d="m34 36 9 9 19-20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/></svg>'
];
let tutorialAccount = null;
let tutorialStepIndex = 0;
let tutorialReturnFocus = null;
const publicScreens = ["login", "register", "link-teacher", "no-access", "instructor-invite"];
let activeRole = null;
let activeDemoAccount = null;

const navigation = document.querySelector("#screen-navigation");
const screenContent = document.querySelector("#screen-content");
const currentTitle = document.querySelector("#current-screen-title");
const sidebar = document.querySelector("#app-sidebar");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");
const menuButton = document.querySelector("#mobile-menu-button");
const toastRegion = document.querySelector("#toast-region");
const privacyDialog = document.querySelector("#privacy-modal");
const termsDialog = document.querySelector("#terms-modal");
const tutorialDialog = document.querySelector("#tutorial-modal");
const userPanel = document.querySelector("#user-panel");
let toastTimeout;

const navigationIconPaths = {
  home: '<path d="M3 11 12 4l9 7M5 10v10h14V10M9 20v-6h6v6"/>',
  login: '<path d="M10 4H5v16h5M13 8l4 4-4 4M8 12h9"/>',
  invite: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  link: '<path d="M10 13a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-2 2M14 11a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l2-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5"/>',
  profile: '<circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  personAdd: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M18 10v6M15 13h6"/>',
  payment: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  grade: '<path d="M3 9h18v6H3zM15 9v6M17 11v2M19 11v2"/>',
  message: '<path d="M4 5h16v12H9l-5 3V5Z"/><path d="M8 9h8M8 13h5"/>',
  shield: '<path d="M12 3 19 6v5c0 4.5-2.7 7.7-7 10-4.3-2.3-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  upload: '<path d="M12 16V4M8 8l4-4 4 4M4 15v5h16v-5"/>',
  actions: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  lesson: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  academy: '<path d="M3 20h18M5 20V8l7-4 7 4v12M9 20v-6h6v6M9 9h.01M15 9h.01"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>'
};
const navigationIconByScreen = {
  login: "login", register: "invite", "link-teacher": "link", "no-access": "clock",
  "instructor-invite": "invite", "student-home": "home", "student-link": "link",
  "student-payments": "payment", "student-grades": "grade", "student-chat": "message",
  "teacher-home": "home", students: "people", "student-detail": "profile",
  "student-create": "personAdd", "teacher-code": "link", "role-management": "shield",
  "pix-import": "upload", "payment-review": "payment", overdue: "clock",
  "quick-actions": "actions", "teacher-chat": "message", "instructor-class": "lesson",
  "instructor-chat": "message", "admin-home": "home", "teacher-invites": "people",
  academy: "academy", "user-settings": "settings", privacy: "shield"
};
const mobileNavigationLabels = {
  login: "Entrar", register: "Cadastro", "link-teacher": "Vincular",
  "student-home": "Início", "student-link": "Vínculo", "student-payments": "Pagamentos",
  "student-grades": "Graduações", "teacher-home": "Início", students: "Alunos",
  "student-detail": "Ficha", "student-create": "Novo aluno", "instructor-class": "Aula",
  "admin-home": "Início", "teacher-invites": "Convites", "role-management": "Papéis",
  academy: "Academia"
};

function navigationIcon(id) {
  const path = navigationIconPaths[navigationIconByScreen[id]];
  if (!path) throw new Error(`Ícone de navegação ausente: ${id}`);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function renderNavigation() {
  const visibleGroups = activeRole
    ? navigationGroups.filter((group) => group.roles.includes(activeRole))
    : navigationGroups.filter((group) => group.roles.includes("public"));
  navigation.innerHTML = visibleGroups.map((group) => ({
    ...group,
    items: group.items.filter(([id]) => canViewScreen(id))
  })).filter((group) => group.items.length > 0).map((group) => `
    <section class="nav-group" aria-label="${group.title}">
      <h2 class="nav-group-title">${group.title}</h2>
      ${group.items.map(([id, title]) => `
        <button class="nav-item" type="button" data-screen-target="${id}">
          <span class="nav-icon">${navigationIcon(id)}</span>
          <span>${title}</span>
        </button>
      `).join("")}
    </section>
  `).join("");
  renderMobileNavigation();
}

function renderMobileNavigation() {
  const mobileNavigation = document.querySelector("#mobile-navigation");
  if (!mobileNavigation) return;
  const items = activeRole
    ? (roleScreens[activeRole] || []).filter((id) => canViewScreen(id)).slice(0, 4)
    : ["login", "register", "link-teacher"];
  mobileNavigation.style.setProperty("--mobile-nav-items", items.length);
  mobileNavigation.innerHTML = items.map((id) => {
    const info = screenInfo[id] || { title: id, group: "" };
    const label = mobileNavigationLabels[id] || info.title;
    return `<button type="button" data-screen-target="${id}" aria-label="${info.title}"><span class="mobile-nav-icon">${navigationIcon(id)}</span><span class="mobile-nav-label">${label}</span></button>`;
  }).join("");
  updateToastPosition();
}

function canViewScreen(id) {
  if (activeRole === null) return publicScreens.includes(id);
  if (id === "academy" && activeRole !== "adm" && !demoProfiles[activeDemoAccount].academyId) return false;
  if (activeRole === "instructor") {
    const profile = demoProfiles[activeDemoAccount];
    if (!profile || !authorizedInstructorNames.has(profile.name)) {
      return ["student-home", "student-payments", "student-grades", "instructor-class", "user-settings", "privacy"].includes(id);
    }
  }
  return (roleScreens[activeRole] || []).includes(id);
}

function startDemoRole(account) {
  const profile = demoProfiles[account];
  if (!profile) return;
  activeDemoAccount = account;
  activeRole = profile.role;
  const profileName = document.querySelector("#user-panel-profile-name");
  const profileRole = document.querySelector("#user-panel-profile-role");
  const roleBadge = document.querySelector(".profile-button-copy");
  if (profileName) profileName.textContent = profile.name;
  if (profileRole) profileRole.textContent = profile.label;
  if (roleBadge) roleBadge.innerHTML = `<strong>${profile.label}</strong><small>Perfil fictício</small>`;
  document.querySelector("#profile-button").hidden = false;
  document.querySelectorAll(".user-panel-link").forEach((link) => {
    link.hidden = activeRole === "student-unregistered" &&
      !link.hasAttribute("data-open-tutorial") &&
      !link.hasAttribute("data-logout-role");
  });
  document.querySelector(".user-panel-links[aria-label='Navegação da conta']").hidden = activeRole === "student-unregistered";
  renderNavigation();
  renderScreen(profile.start);
  maybeOpenFirstTutorial(account);
}

function endDemoRole() {
  activeRole = null;
  activeDemoAccount = null;
  const profileName = document.querySelector("#user-panel-profile-name");
  const profileRole = document.querySelector("#user-panel-profile-role");
  const roleBadge = document.querySelector(".profile-button-copy");
  if (profileName) profileName.textContent = "Sem sessão ativa";
  if (profileRole) profileRole.textContent = "Perfil demonstrativo";
  if (roleBadge) roleBadge.innerHTML = "<strong>Entrar</strong><small>Sem sessão ativa</small>";
  document.querySelector("#profile-button").hidden = true;
  document.querySelectorAll(".user-panel-link").forEach((link) => {
    link.hidden = false;
  });
  document.querySelector(".user-panel-links[aria-label='Navegação da conta']").hidden = false;
  userPanel.close();
  renderNavigation();
  renderScreen("login");
}

function heading(eyebrow, title, copy, actions = "") {
  return `
    <header class="screen-heading">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h2>${title}</h2>
        ${copy ? `<p>${copy}</p>` : ""}
      </div>
      ${actions ? `<div class="heading-actions">${actions}</div>` : ""}
    </header>
  `;
}

function button(label, target, className = "button", icon = "") {
  return `
    <button class="${className}" type="button" data-screen-target="${target}">
      ${icon ? `<span aria-hidden="true">${icon}</span>` : ""}
      <span>${label}</span>
    </button>
  `;
}

function actionButton(label, className = "button button--quiet") {
  return `<button class="${className}" type="button" data-demo-action>${label}</button>`;
}

function panel(title, body, extraClass = "") {
  return `
    <section class="panel-card ${extraClass}">
      <div class="panel-heading"><h3>${title}</h3></div>
      ${body}
    </section>
  `;
}

function metric(label, value, note, tone = "") {
  return `
    <article class="metric-card ${tone ? `metric-card--${tone}` : ""}">
      <span class="metric-label">${label}</span>
      <strong class="metric-value">${value}</strong>
      <span class="metric-note">${note}</span>
    </article>
  `;
}

function avatar(image = "avatar-masculino.svg", alt = "Avatar genérico de demonstração") {
  return `<span class="avatar"><img src="assets/avatars/${image}" alt="${alt}"></span>`;
}

function personRow(name, detail, image = "avatar-masculino.svg", badge = "") {
  return `
    <div class="person-row">
      ${avatar(image)}
      <span class="person-copy"><strong>${name}</strong><small>${detail}</small></span>
      ${badge}
    </div>
  `;
}

function listRow(title, detail, value = "", badge = "") {
  return `
    <div class="list-row">
      <span class="row-copy"><strong>${title}</strong><small>${detail}</small></span>
      ${value ? `<strong class="row-value">${value}</strong>` : ""}
      ${badge}
    </div>
  `;
}

function studentEntry(name, detail, image, status, rosterIndex = demoRoster.findIndex((student) => student.name === name && student.teacherAccount === activeDemoAccount)) {
  return `
    <div class="student-entry">
      ${personRow(escapeHtml(name), "Perfil fictício", image, `<span class="badge ${status}">${detail}</span>`)}
      <span class="student-entry-note">Mensalidade e vencimento: —</span>
      <button class="button button--small button--quiet" type="button" data-screen-target="student-detail" data-roster-index="${rosterIndex}"><span>Abrir ficha</span></button>
    </div>
  `;
}

function gradeBeltIndex(grade) {
  const belt = grade.split(" · ")[0].replace(/^faixa\s+/i, "").trim().toLocaleLowerCase("pt-BR");
  return demoBelts.findIndex((item) => item.toLocaleLowerCase("pt-BR") === belt);
}

function beltDegrees(beltIndex) {
  if (beltIndex >= 0 && beltIndex <= 3) return [0, 1, 2, 3, 4];
  if (beltIndex === 4) return [0, 1, 2, 3, 4, 5, 6];
  if (beltIndex === 5) return [7];
  if (beltIndex === 6) return [8];
  if (beltIndex === 7) return [9, 10];
  return [];
}

function gradeDegree(grade) {
  const match = grade.match(/ · (\d+) graus?$/i);
  return match ? Number(match[1]) : 0;
}

function gradeLabel(belt, degree) {
  return `Faixa ${belt.toLocaleLowerCase("pt-BR")} · ${degree} ${degree === 1 ? "grau" : "graus"}`;
}

function isHigherGrade(currentGrade, beltIndex, degree) {
  const currentIndex = gradeBeltIndex(currentGrade);
  const currentDegree = gradeDegree(currentGrade);
  return beltDegrees(currentIndex).includes(currentDegree) && beltDegrees(beltIndex).includes(degree) &&
    (beltIndex > currentIndex || (beltIndex === currentIndex && degree > currentDegree));
}

function gradeVisual(grade) {
  const index = gradeBeltIndex(grade);
  const degree = gradeDegree(grade);
  if (!beltDegrees(index).includes(degree)) return "";
  return `<span class="rank-belt rank-belt--${index}" aria-hidden="true"><span class="rank-belt-bar">${'<i></i>'.repeat(degree)}</span></span>`;
}

function gradeHistoryEntries(student) {
  return [...(demoGradeHistory.get(student) || [])].sort((a, b) => a.date.localeCompare(b.date));
}

function renderGradeHistory(student) {
  const entries = gradeHistoryEntries(student);
  const existing = `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>Faixa registrada</strong><small>Data: — · Responsável: professor</small></div></div>`;
  return existing + entries.map((entry) => `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>${escapeHtml(gradeLabel(entry.belt, entry.degree))}</strong>${gradeVisual(gradeLabel(entry.belt, entry.degree))}<small>Data: ${escapeHtml(formatDemoDate(entry.date))} · Responsável: ${escapeHtml(entry.professor)}</small></div></div>`).join("");
}

function field(id, label, placeholder, type = "text", help = "") {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input id="${id}" name="${id}" type="${type}" placeholder="${placeholder}">
      ${help ? `<small class="field-help">${help}</small>` : ""}
    </div>
  `;
}

function emptyState(title, copy) {
  return `<div class="empty-state"><div><strong>${title}</strong><p>${copy}</p></div></div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function currentLinkRequest() {
  return linkRequests.find((request) => request.account === activeDemoAccount && request.status === "pending");
}

function formatDemoDate(value) {
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function renderPendingLinkRequests() {
  const pending = linkRequests.filter((request) =>
    request.professorAccount === activeDemoAccount && request.status === "pending"
  );
  if (!pending.length) return emptyState("Nenhum pedido pendente", "Pedidos válidos de vínculo aparecerão aqui.");
  return pending.map((request) => `
    <article class="link-request-row">
      <strong>${escapeHtml(request.studentName)}</strong>
      <small>Pedido de vínculo · ${escapeHtml(demoAcademy.name)}</small>
      <div class="row-actions">
        <button class="button button--small button--primary" type="button" data-link-decision="approve" data-request-id="${escapeHtml(request.id)}">Aprovar</button>
        <button class="button button--small button--danger" type="button" data-link-decision="reject" data-request-id="${escapeHtml(request.id)}">Recusar</button>
      </div>
    </article>
  `).join("");
}

function renderDemoInviteRecipients(type) {
  return demoInviteRecipients
    .filter((recipient) => {
      if (recipient.type !== type) return false;
      if (type === "instructor") return demoProfiles.instructor.role === "instructor";
      const rosterStudent = demoRoster.find((student) => student.name === recipient.name);
      return rosterStudent && !rosterStudent.account;
    })
    .map((recipient) => `<option value="${escapeHtml(recipient.id)}">${escapeHtml(recipient.name)}</option>`)
    .join("");
}

function renderDemoInvites() {
  const invites = demoInvites.filter((invite) => invite.professorAccount === activeDemoAccount);
  if (!invites.length) return emptyState("Nenhum link gerado", "Gere um link para uma pessoa pré-cadastrada.");
  return invites.map((invite) => {
    const url = new URL(window.location.href);
    url.searchParams.set("convite", invite.token);
    const expired = invite.expiresAt <= Date.now();
    const status = invite.used ? "usado" : expired ? "expirado" : `expira em ${formatDemoDate(invite.expiresOn)}`;
    return `
      <div class="invite-result-row">
        <strong>${escapeHtml(invite.recipientName)} · ${invite.type === "instructor" ? "Instrutor" : "Aluno pré-cadastrado"}</strong>
        <small>${escapeHtml(status)} · uso único</small>
        <a href="${escapeHtml(url.href)}">${escapeHtml(url.href)}</a>
      </div>
    `;
  }).join("");
}

function saveDemoInvites() {
  localStorage.setItem("tatame-demo-invites", JSON.stringify(demoInvites));
}

function teacherPaymentButton(label, action, className, attributes = "") {
  return `<div class="student-action-control">
    <button class="${className} button--action" type="button" data-professor-payment-action="${action}" ${attributes}><span data-action-label>${label}</span></button>
    <p class="login-action-error student-action-error" role="alert"></p>
  </div>`;
}

function renderCashPaymentRow(payment) {
  const statusLabel = payment.status === "pending" ? "PENDENTE" : payment.status === "confirmed" ? "CONFIRMADO" : "RECUSADO";
  const badgeClass = payment.status === "pending" ? "badge--amber" : payment.status === "confirmed" ? "badge--green" : "badge--red";
  return `
    <article class="payment-review-row" data-cash-row="${escapeHtml(payment.id)}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(payment.studentName)}</strong><small>Pagamento em dinheiro · informado pelo aluno</small></span>
        <span class="badge ${badgeClass}" data-cash-state>${statusLabel}</span>
      </div>
      <div class="receipt-compare">
        <div><span class="eyebrow">VALOR E DATA INFORMADOS</span><strong>Valor: ${escapeHtml(payment.amount)}</strong><small>Data de recebimento: ${escapeHtml(formatDemoDate(payment.date))}</small></div>
        <div><span class="eyebrow">FORMA</span><strong>Dinheiro</strong><small>Sem comprovante</small></div>
      </div>
      ${payment.status === "pending" ? `
        <div class="row-actions">
          ${teacherPaymentButton("Confirmar", "dinheiro-confirmar", "button button--small button--primary", `data-cash-decision="confirm" data-cash-id="${escapeHtml(payment.id)}"`)}
          ${teacherPaymentButton("Recusar", "dinheiro-recusar", "button button--small button--danger", `data-cash-decision="reject" data-cash-id="${escapeHtml(payment.id)}"`)}
        </div>
        <p class="visually-hidden" role="status" aria-live="polite"></p>
      ` : `<p class="field-help payment-history-entry">${payment.status === "confirmed" ? `Recebido: ${escapeHtml(payment.amount)} · ${escapeHtml(formatDemoDate(payment.date))}.` : "Aviso recusado; nenhum recebimento foi registrado."}</p>`}
    </article>
  `;
}

function renderReceiptPaymentRow(payment) {
  const pending = payment.status === "pending";
  const confirmed = payment.status === "confirmed";
  const amountValue = Number(payment.amount.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  const matches = amountValue === 150 && payment.date === "01/11/2026";
  const statusLabel = pending ? "PENDENTE" : confirmed ? "CONFIRMADO" : "RECUSADO";
  const statusClass = pending ? "badge--amber" : confirmed ? "badge--green" : "badge--red";
  return `
    <article class="payment-review-row" data-payment-row data-receipt-id="${escapeHtml(payment.id)}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(payment.studentName)}</strong><small>Comprovante Pix · aguardando confirmação</small></span>
        <span class="badge ${statusClass}" data-payment-state>${statusLabel}</span>
      </div>
      <div class="receipt-compare">
        <div><span class="eyebrow">COMPROVANTE</span><strong>Valor: ${escapeHtml(payment.amount)}</strong><small>Data: ${escapeHtml(payment.date)}</small></div>
        <div><span class="eyebrow">COBRANÇA</span><strong>Valor: R$ 150,00</strong><small>Vencimento: 01/11/2026</small></div>
        <span class="badge ${matches ? "badge--green" : "badge--red"}">${matches ? "CONFERE" : "DIVERGE"}</span>
      </div>
      ${pending ? `<p class="payment-proof" data-proof>Comprovante temporário recebido; será apagado após a confirmação.</p>
        <div class="row-actions">
          ${teacherPaymentButton("Confirmar", "comprovante-confirmar", "button button--small button--primary", "data-confirm-payment")}
          ${teacherPaymentButton("Recusar", "comprovante-recusar", "button button--small button--danger", "data-reject-payment")}
          ${matches ? "" : `${teacherPaymentButton("Desconto", "desconto", "button button--small button--quiet")}${teacherPaymentButton("Lançar saldo no mês seguinte", "saldo", "button button--small button--quiet")}${teacherPaymentButton("Isentar", "isencao", "button button--small button--quiet")}`}
        </div>
        <p class="visually-hidden" role="status" aria-live="polite"></p>` : ""}
      <p class="field-help payment-history-entry" data-payment-history ${confirmed ? "" : "hidden"}>${confirmed ? `Histórico mantido: ${escapeHtml(payment.amount)} · ${escapeHtml(payment.date)}. Comprovante apagado.` : ""}</p>
    </article>
  `;
}

function renderReceiptHistoryRow(payment) {
  return `
    <div class="list-row">
      <span class="row-copy"><strong>${escapeHtml(payment.studentName)}</strong><small>Comprovante confirmado · ${escapeHtml(payment.date)}</small></span>
      <strong class="row-value">${escapeHtml(payment.amount)}</strong>
    </div>
  `;
}

function renderTeacherCashHistory() {
  const entries = cashPayments.filter((payment) =>
    payment.source === "teacher" && payment.professorAccount === activeDemoAccount
  );
  if (!entries.length) return emptyState("Nenhum lançamento direto", "Recebimentos em dinheiro lançados pelo Professor aparecerão aqui.");
  return entries.map(renderTeacherCashEntry).join("");
}

function renderTeacherCashEntry(payment) {
  const status = payment.status === "undone" ? "Desfeito" : payment.status === "reversed" ? "Estornado" : "Confirmado";
  const canUndo = payment.status === "confirmed" && Date.now() < payment.undoUntil;
  return `
    <article class="teacher-cash-entry" tabindex="-1" data-teacher-cash-entry="${escapeHtml(payment.id)}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(payment.studentName)}</strong><small>Dinheiro ${status.toLowerCase()} · ${escapeHtml(formatDemoDate(payment.date))}</small>${payment.type && payment.reference ? `<small>${escapeHtml(payment.type)} · ${escapeHtml(payment.reference)}</small>` : ""}</span>
        <strong class="row-value">${escapeHtml(payment.amount)}</strong>
      </div>
      ${payment.status === "confirmed" ? `
        <div class="row-actions">
          ${teacherPaymentButton(canUndo ? "Desfazer" : "Estornar", canUndo ? "dinheiro-desfazer" : "dinheiro-estornar", "button button--small button--quiet", `data-teacher-cash-correction="${canUndo ? "undo" : "reverse"}" data-cash-id="${escapeHtml(payment.id)}"`)}
        </div>
        <p class="visually-hidden" role="status" aria-live="polite"></p>
      ` : ""}
    </article>
  `;
}

function teacherCashStudentLabel(student) {
  return `${student.name} · ${student.grade}`;
}

function normalizeTeacherCashSearch(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function renderTeacherCashOptions(query = "") {
  const normalized = normalizeTeacherCashSearch(query);
  return demoRoster
    .map((student, index) => ({ student, index }))
    .filter(({ student }) => student.teacherAccount === activeDemoAccount && normalizeTeacherCashSearch(teacherCashStudentLabel(student)).includes(normalized))
    .map(({ student, index }) => `<button type="button" class="teacher-cash-option" role="option" aria-selected="false" id="teacher-cash-option-${index}" data-teacher-cash-student-index="${index}">${escapeHtml(teacherCashStudentLabel(student))}</button>`)
    .join("") || '<span class="field-help">Nenhum aluno encontrado na sua turma.</span>';
}

function updateTeacherCashOptions(input) {
  const options = document.querySelector("#teacher-cash-students");
  if (!options) return;
  options.innerHTML = renderTeacherCashOptions(input.value);
  options.hidden = false;
  input.setAttribute("aria-expanded", "true");
  input.removeAttribute("aria-activedescendant");
}

function chooseTeacherCashStudent(input, index) {
  const student = demoRoster[index];
  if (!student || student.teacherAccount !== activeDemoAccount) return;
  input.value = teacherCashStudentLabel(student);
  input.dataset.selectedStudent = String(index);
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  document.querySelector("#teacher-cash-students").hidden = true;
  document.querySelector("#teacher-cash-selection").textContent = `Selecionado: ${teacherCashStudentLabel(student)}`;
  input.focus();
}

function refreshTeacherCashHistory() {
  const history = document.querySelector("#teacher-cash-history");
  if (history && activeRole === "professor") history.innerHTML = renderTeacherCashHistory();
}

function scheduleTeacherCashExpiry(payment) {
  window.setTimeout(() => {
    const row = document.querySelector(`[data-teacher-cash-entry="${payment.id}"]`);
    if (!row || payment.status !== "confirmed" || payment.professorAccount !== activeDemoAccount) return;
    if (screenContent.querySelector('[data-professor-payment-action][aria-busy="true"], [data-professor-payment-action][data-action-state="success"]')) {
      scheduleTeacherCashExpiry(payment);
      return;
    }
    const hadFocus = row.contains(document.activeElement);
    const hadError = Boolean(row.querySelector('[role="alert"]:not(:empty)'));
    if (hadError) {
      showToast("O prazo para desfazer terminou. Use Estornar.", "error");
    }
    row.outerHTML = renderTeacherCashEntry(payment);
    const updatedRow = document.querySelector(`[data-teacher-cash-entry="${payment.id}"]`);
    if (hadError) updatedRow.querySelector('[role="alert"]').textContent = "Não foi possível desfazer. Prazo encerrado; use Estornar.";
    if (hadFocus) updatedRow.querySelector("button").focus();
  }, Math.max(100, payment.undoUntil - Date.now()));
}

function renderStudentCashHistory() {
  const notices = cashPayments.filter((payment) => payment.source === "student" && payment.professorAccount === activeDemoAccount && payment.status !== "pending");
  if (!notices.length) return emptyState("Nenhum aviso concluído", "Avisos confirmados ou recusados aparecerão aqui.");
  return notices.map((payment) => `
    <div class="list-row">
      <span class="row-copy"><strong>${escapeHtml(payment.studentName)}</strong><small>${payment.status === "confirmed" ? `Recebido · ${escapeHtml(formatDemoDate(payment.date))}` : "Aviso recusado"}</small></span>
      ${payment.status === "confirmed" ? `<strong class="row-value">${escapeHtml(payment.amount)}</strong>` : ""}
    </div>
  `).join("");
}

function getTeacherLinkCode(account) {
  if (!teacherLinkCodes.has(account)) {
    teacherLinkCodes.set(account, createUniqueTeacherLinkCode(account));
  }
  return teacherLinkCodes.get(account);
}

function createUniqueTeacherLinkCode(account) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const otherCodes = new Set([...teacherLinkCodes.entries()]
    .filter(([owner]) => owner !== account)
    .map(([, code]) => code));
  let code;
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (otherCodes.has(code));
  return code;
}

function validateTeacherLinkCode(code, result, preview) {
  const key = activeDemoAccount || "visitor";
  const attempt = linkCodeAttempts.get(key) || { count: 0, lockedUntil: 0 };
  if (attempt.lockedUntil > Date.now()) {
    result.textContent = "Bloqueio temporário. Tente novamente em 15 minutos.";
    preview.hidden = true;
    currentTeacherLinkPreview = null;
    return false;
  }
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    result.textContent = "Informe um código de seis caracteres.";
    preview.hidden = true;
    currentTeacherLinkPreview = null;
    return false;
  }
  const matchedProfessor = Object.entries(demoProfiles).find(([account, profile]) =>
    profile.role === "professor" && profile.academyId && getTeacherLinkCode(account) === code
  );
  if (!matchedProfessor) {
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.count = 0;
      attempt.lockedUntil = Date.now() + 15 * 60 * 1000;
      result.textContent = "Bloqueio temporário. Tente novamente em 15 minutos.";
    } else {
      result.textContent = "Não foi possível validar este código. Confira e tente novamente.";
    }
    linkCodeAttempts.set(key, attempt);
    preview.hidden = true;
    currentTeacherLinkPreview = null;
    return false;
  }
  linkCodeAttempts.set(key, { count: 0, lockedUntil: 0 });
  currentTeacherLinkPreview = matchedProfessor[0];
  document.querySelector("#link-preview-professor").textContent = matchedProfessor[1].name;
  document.querySelector("#link-preview-academy").textContent = demoAcademy.name;
  result.textContent = "";
  preview.hidden = false;
  return true;
}

function createDemoInvite(type, recipientId) {
  const recipient = demoInviteRecipients.find((item) => item.id === recipientId && item.type === type);
  if (!recipient) return null;
  let token;
  do {
    token = `TATAME-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (demoInvites.some((invite) => invite.token === token));
  const expiresAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
  const expiresOn = new Date(expiresAt).toISOString().slice(0, 10);
  demoInvites.unshift({
    token,
    type,
    recipientId,
    recipientName: recipient.name,
    professorAccount: activeDemoAccount,
    academyId: demoProfiles[activeDemoAccount].academyId,
    expiresAt,
    expiresOn,
    used: false
  });
  saveDemoInvites();
  return token;
}

function tutorialStorageKey(account) {
  return `tatame-tutorial-seen-${account}-${demoProfiles[account].role}`;
}

function renderTutorialStep() {
  const profile = demoProfiles[tutorialAccount];
  const steps = tutorialStepsByRole[profile.role] || [];
  const step = steps[tutorialStepIndex];
  if (!step) return;
  document.querySelector("#tutorial-progress").textContent = `${profile.label} · passo ${tutorialStepIndex + 1} de ${steps.length}`;
  document.querySelector("#tutorial-title").textContent = `Tutorial ${profile.label}`;
  document.querySelector("#tutorial-illustration").innerHTML = tutorialIllustrations[tutorialStepIndex % tutorialIllustrations.length];
  document.querySelector("#tutorial-step-title").textContent = step[1];
  document.querySelector("#tutorial-copy").textContent = step[2] + (tutorialStepIndex === 0
    ? " O menu agrupa as opções disponíveis para sua conta. No painel da conta ficam ajuda, ações simuladas do app e saída; sete toques na versão revelam diagnósticos da sessão."
    : "");
  document.querySelector("[data-tutorial-back]").disabled = tutorialStepIndex === 0;
  document.querySelector("[data-tutorial-next]").textContent = tutorialStepIndex === steps.length - 1 ? "Concluir" : "Próximo";
}

function openTutorial(account) {
  tutorialAccount = account;
  tutorialStepIndex = 0;
  tutorialReturnFocus = document.activeElement;
  renderTutorialStep();
  if (!tutorialDialog.open) tutorialDialog.showModal();
  document.querySelector("[data-tutorial-next]").focus();
}

function closeTutorial() {
  if (tutorialDialog.open) tutorialDialog.close();
  if (tutorialReturnFocus instanceof HTMLElement && tutorialReturnFocus.isConnected) {
    tutorialReturnFocus.focus();
  } else {
    const profileButton = document.querySelector("#profile-button");
    if (profileButton) profileButton.focus();
  }
}

function maybeOpenFirstTutorial(account) {
  const key = tutorialStorageKey(account);
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch (error) {
    console.error("Não foi possível guardar a preferência do tutorial:", error);
    showToast("Não foi possível guardar a preferência do tutorial neste navegador.", "error");
  }
  openTutorial(account);
}

const privacyPlaceholder = "O texto da política e do termo ainda precisa ser revisado e aprovado. Este protótipo não registra consentimento.";

const screens = {
  login() {
    return `
      ${heading("ACESSO", "Entre na sua conta", "A tela de login prevista no roadmap, em uma visualização demonstrativa.")}
      <div class="auth-layout">
        <section class="auth-visual">
          <div>
            <img src="assets/logos/tatame-icone-escudo.svg" alt="">
            <h2>Treino, gestão e evolução no mesmo lugar.</h2>
            <p>Uma experiência clara para a rotina da academia, com acesso definido pelo convite e pelo perfil registrado no banco.</p>
          </div>
          <span class="auth-visual-foot">Acesso protegido · permissões vêm do banco</span>
        </section>
        <section class="auth-card">
          <img class="auth-mobile-mark" src="assets/logos/tatame-icone-escudo.svg" alt="">
          <p class="eyebrow">BEM-VINDO AO TATAME</p>
          <h2>Continuar</h2>
          <p>Use a forma de acesso habilitada para sua conta. Nenhum login é realizado neste protótipo.</p>
          <div class="visually-hidden" id="login-action-status" role="status" aria-live="polite" aria-atomic="true"></div>
          <button class="button button--google button--action" type="button" data-login-action aria-describedby="google-login-error">
            <img class="google-icon" src="assets/logos/google-g.svg" alt="" aria-hidden="true">
            <span data-action-label>Fazer login com o Google</span>
          </button>
          <div class="login-action-error" id="google-login-error" role="alert" aria-atomic="true"></div>
          <div class="auth-divider">ou entre com e-mail</div>
          <form data-demo-form data-login-form>
            ${field("login-email", "E-mail", "seu e-mail", "email")}
            <div class="field" style="margin-top:12px">
              <label for="login-password">Senha</label>
              <input id="login-password" name="password" type="password" placeholder="Sua senha">
            </div>
            <button class="button button--primary button--action" type="submit" data-login-action aria-describedby="email-login-error" style="width:100%;margin-top:14px"><span data-action-label>Entrar</span></button>
            <div class="login-action-error" id="email-login-error" role="alert" aria-atomic="true"></div>
          </form>
          <p class="field-help" style="margin:15px 0 0">Ainda não tem conta? A criação começa por um convite.</p>
          ${button("Tenho um código de convite", "link-teacher", "button button--quiet", "↗")}
          <section class="demo-login-options" aria-labelledby="demo-login-title">
            <p class="eyebrow" id="demo-login-title">ACESSO DE DEMONSTRAÇÃO</p>
            <p class="field-help">Contas fictícias independentes para visualizar cada papel. No produto, o papel vem da conta autenticada; aqui, sair encerra a sessão simulada.</p>
            <div class="demo-login-list">
              ${Object.entries(demoProfiles).map(([account, profile]) => `<button class="button button--quiet" type="button" data-demo-login="${account}">Entrar como ${profile.label} · ${profile.name}</button>`).join("")}
            </div>
          </section>
        </section>
      </div>
    `;
  },

  register() {
    return `
      ${heading("PRIMEIRO ACESSO", "Criar conta por convite", "O perfil será definido no banco a partir do convite. Não há seletor de papel nesta tela.")}
      <div class="content-grid">
        ${panel("Dados de acesso", `
          <form data-accept-demo-invite>
            <div class="form-grid">
              ${field("register-email", "E-mail", "seu e-mail", "email")}
              ${field("invite-code", "Código de convite", "Informe o código recebido")}
              ${field("register-password", "Senha", "Crie uma senha", "password")}
              ${field("register-password-confirm", "Confirmar senha", "Digite novamente", "password")}
            </div>
            <div class="notice notice--pending" style="margin-top:16px">${privacyPlaceholder}</div>
            <div class="form-actions">
              <button class="button button--quiet" type="button" data-open-privacy>Ver política e termo</button>
              <div class="register-action-control">
                <button class="button button--primary button--action" type="submit" data-register-action aria-describedby="register-action-error"><span data-action-label>Validar convite</span></button>
                <div class="login-action-error register-action-error" id="register-action-error" role="alert" aria-atomic="true"></div>
              </div>
            </div>
            <div class="visually-hidden" id="register-action-status" role="status" aria-live="polite" aria-atomic="true"></div>
            <p class="field-help" id="invite-validation-result" role="status" aria-live="polite"></p>
          </form>
        `)}
        <div class="stack">
          ${panel("Como funciona", `
            <div class="stack">
              <div class="person-row"><span class="step-number">01</span><span class="person-copy"><strong>Receba seu convite</strong><small>O professor envia um código ou link.</small></span></div>
              <div class="person-row"><span class="step-number">02</span><span class="person-copy"><strong>Crie sua conta</strong><small>O convite direciona o vínculo e o perfil no banco.</small></span></div>
              <div class="person-row"><span class="step-number">03</span><span class="person-copy"><strong>Revise as informações</strong><small>Termo e política aparecem quando o conteúdo for aprovado.</small></span></div>
            </div>
          `)}
          ${button("Voltar para entrar", "login", "button button--quiet")}
        </div>
      </div>
    `;
  },

  "link-teacher"() {
    const request = currentLinkRequest();
    return `
      ${heading("VÍNCULO", "Vincular a um professor", "Para aluno que já tem conta e ainda não tem vínculo. Conta, nome, faixa e histórico são mantidos.")}
      <div class="content-grid">
        ${panel("Código do professor", `
          <div class="visually-hidden" id="link-action-status" role="status" aria-live="polite" aria-atomic="true"></div>
          ${request ? `
            <div class="notice notice--pending">Aguardando aprovação do Professor. Sua conta, nome, faixa e histórico permanecem os mesmos.</div>
            <div class="form-actions"><div class="link-action-control"><button class="button button--quiet button--action" type="button" data-cancel-link data-link-action aria-describedby="cancel-link-error"><span data-action-label>Cancelar pedido</span></button><div class="login-action-error link-action-error" id="cancel-link-error" role="alert" aria-atomic="true"></div></div></div>
          ` : `
            <div class="field">
              <label for="link-code">Código de 6 caracteres</label>
              <input id="link-code" name="link-code" type="text" minlength="6" maxlength="6" pattern="[A-Z0-9]{6}" autocomplete="off" placeholder="Ex.: K7M4PX" aria-describedby="link-code-help link-code-result" required>
              <small class="field-help" id="link-code-help">Use letras maiúsculas e números, exatamente como recebeu do Professor.</small>
            </div>
            <div class="form-actions"><div class="link-action-control"><button class="button button--quiet button--action" type="button" data-check-link-code data-link-action aria-describedby="link-code-result"><span data-action-label>Consultar código</span></button><div class="login-action-error link-action-error" id="link-code-result" role="alert" aria-atomic="true"></div></div></div>
            <div class="link-preview" id="link-preview" hidden>
              <div id="link-preview-details">
                <span class="eyebrow">PRÉVIA DO VÍNCULO</span>
                <strong id="link-preview-professor"></strong>
                <small id="link-preview-academy"></small>
              </div>
              <div class="link-action-control"><button class="button button--primary button--action" type="button" data-request-link data-link-action aria-describedby="request-link-error"><span data-action-label>Solicitar vínculo</span></button><div class="login-action-error link-action-error" id="request-link-error" role="alert" aria-atomic="true"></div></div>
            </div>
          `}
        `)}
        ${panel("Depois do envio", `
          <p class="panel-copy" style="margin-top:12px">Sua conta, nome, faixa e histórico de graduações continuam os mesmos; só o vínculo com o Professor é criado.</p>
          <p class="field-help">Se o Professor ainda não tiver academia, o código não poderá criar um vínculo.</p>
        `)}
      </div>
    `;
  },

  "no-access"() {
    return `
      ${heading("ACESSO", "Aguardando liberação", "Esta tela não revela dados nem áreas protegidas para uma conta sem autorização.")}
      <div class="auth-card access-card">
        <span class="access-icon" aria-hidden="true">◷</span>
        <p class="eyebrow">CONTA AINDA NÃO AUTORIZADA</p>
        <h2>Não foi possível liberar o acesso</h2>
        <p>Peça ao administrador para confirmar seu convite. O papel e as permissões são verificados no banco, não nesta tela.</p>
        ${button("Voltar para entrar", "login", "button button--primary")}
      </div>
    `;
  },

  "instructor-invite"() {
    return `
      ${heading("CONVITE DE INSTRUTOR", "Aceitar convite", "O Instrutor é um aluno com função de apoio na turma.")}
      <div class="content-grid">
        ${panel("Convite de instrutor", `
          <form data-accept-instructor-invite>
            ${field("instructor-code", "Link de uso único", "Cole o link recebido")}
            <p class="field-help" style="margin-top:10px">O link expira em três dias e só pode ser usado uma vez. O Professor decide o plano ou “Treino livre”; o Instrutor não escolhe o conteúdo.</p>
            <div class="form-actions">
              ${button("Voltar", "login", "button button--quiet")}
              <button class="button button--primary" type="submit" data-loading-text="Validando…">Validar convite</button>
            </div>
            <p class="field-help" id="invite-validation-result" role="status" aria-live="polite"></p>
          </form>
        `)}
        ${panel("Acesso restrito", `
          <div class="notice notice--info">O Professor promove apenas os próprios alunos a Instrutor. O Instrutor vê os nomes e graduações atuais da turma e a aula delegada; não vê pagamentos alheios, notas privadas ou conversas de terceiros.</div>
        `)}
      </div>
    `;
  },

  "student-home"() {
    return `
      ${heading("VISÃO DO ALUNO", "Início", "Resumo pessoal da conta fictícia.")}
      <div class="content-grid">
        <div class="stack">
          ${panel("Meu perfil", personRow("ALUNO FICTÍCIO 01", "Aluno · perfil de demonstração") + `
            <div class="student-belt"><span class="belt-swatch"></span><span><strong>Faixa cadastrada</strong><small>Graus e histórico em Minhas graduações</small></span></div>
          `, "panel-card--highlight")}
          <div class="card-grid card-grid--two">
            ${metric("SITUAÇÃO DA MENSALIDADE", "—", "Status demonstrativo", "gold")}
            ${metric("PRÓXIMO VENCIMENTO", "—", "Data não informada", "amber")}
          </div>
        </div>
        <div class="stack">
          ${panel("Pagamento recente", listRow("Mensalidade", "Referência: —", "R$ —", '<span class="badge badge--pending">AGUARDA CONFIRMAÇÃO</span>'))}
          ${panel("Minha evolução", `
            <p class="panel-copy">Acompanhe as graduações registradas pelo professor.</p>
            ${button("Ver histórico de graduações", "student-grades", "button button--quiet")}
          `)}
          ${panel("Aulas", `<div class="notice notice--info">Consulte a grade da academia.</div>${button("Ver academia", "academy", "button button--quiet")}`)}
        </div>
      </div>
    `;
  },

  "student-link"() {
    const profile = demoProfiles[activeDemoAccount];
    const teacher = profile && profile.teacherAccount ? demoProfiles[profile.teacherAccount] : null;
    const request = currentLinkRequest();
    return `
      ${heading("VISÃO DO ALUNO", "Meu vínculo", "Professor e academia aos quais sua conta está vinculada.")}
      <div class="content-grid">
        ${panel("Vínculo atual", `
          ${teacher ? personRow(teacher.name, `Professor · ${demoAcademy.name}`, "avatar-masculino.svg", '<span class="badge badge--green">ATIVO</span>') : emptyState("Sem Professor vinculado", "Use um código de seis caracteres para solicitar vínculo.")}
          <div class="belt-display" style="margin-top:14px"><span class="belt-swatch"></span><span class="belt-copy"><strong>Sua faixa e graduações acompanham a conta</strong><small>O histórico de pagamentos fica com o Professor anterior</small></span></div>
          <div class="form-actions">
            ${button(teacher ? "Trocar de professor" : "Vincular a um professor", "link-teacher", "button button--quiet", "⌁")}
          </div>
          ${request ? `<div class="notice notice--pending" style="margin-top:12px">Pedido de vínculo aguardando aprovação.</div><button class="button button--quiet" type="button" data-cancel-link>Cancelar pedido</button>` : ""}
        `, "panel-card--highlight")}
        ${panel("Como funciona", `
          <div class="notice notice--info">Confira o nome do Professor e da academia antes de confirmar. O vínculo só muda após aprovação; faixa e graduações acompanham sua conta.</div>
        `)}
      </div>
    `;
  },

  "student-payments"() {
    const lastCashPayment = [...cashPayments].reverse().find((payment) => payment.account === activeDemoAccount && !["undone", "reversed"].includes(payment.status));
    const receiptAlreadySent = receiptPayments.some((payment) => payment.account === activeDemoAccount);
    const cashResult = lastCashPayment
      ? lastCashPayment.status === "pending"
        ? "Pagamento em dinheiro lançado e PENDENTE até a confirmação do Professor."
        : lastCashPayment.status === "confirmed"
          ? `Pagamento confirmado pelo Professor: ${lastCashPayment.amount} · ${formatDemoDate(lastCashPayment.date)}.`
          : "O Professor recusou o aviso de pagamento em dinheiro."
      : "";
    return `
      ${heading("VISÃO DO ALUNO", "Meus pagamentos", "O aluno consulta as próprias cobranças e pode avisar que pagou.")}
      <div class="card-grid card-grid--four">
        ${metric("EM ABERTO", "—", "Valores definidos no cadastro", "gold")}
        ${metric("AGUARDANDO CONFIRMAÇÃO", "—", "Avisos enviados pelo aluno", "amber")}
        ${metric("PAGOS", "—", "Confirmados pelo professor", "green")}
        ${metric("ATRASADOS", "—", "Conforme carência configurada", "red")}
      </div>
      <div class="content-grid" style="margin-top:16px">
        ${panel("Histórico", `
          ${listRow("Mensalidade", "Vencimento: —", "R$ —", '<span class="badge badge--pending">A VENCER</span>')}
          ${listRow("Taxa extra", "Referência: —", "R$ —", '<span class="badge badge--green">PAGO</span>')}
          ${listRow("Mensalidade", "Vencimento: —", "R$ —", '<span class="badge badge--red">ATRASADO</span>')}
        `)}
        ${panel("Avisar pagamento", `
          <p class="panel-copy">O aviso fica pendente até o professor confirmar. O app não movimenta dinheiro.</p>
          <div class="stack" style="margin-top:12px">
            <label class="button button--primary file-action" for="receipt-file">Escolher comprovante Pix (imagem ou PDF)</label>
            <input id="receipt-file" class="visually-hidden" type="file" accept="image/*,application/pdf,.pdf" data-receipt-file ${receiptAlreadySent ? "disabled" : ""}>
            <div class="form-grid cash-entry-fields${activeRole === "student" ? " cash-entry-fields--student" : ""}">
              <div class="field"><label for="cash-amount">Valor recebido</label><input id="cash-amount" type="number" min="0.01" step="0.01" value="150.00"></div>
              <div class="field"><label for="cash-date">Data de recebimento</label><input id="cash-date" type="date" value="2026-11-07"></div>
            </div>
            ${activeRole === "student" ? `
              <div class="student-action-control">
                <button class="button button--quiet button--action" type="button" data-cash-notice data-student-action aria-describedby="student-cash-error"><span data-action-label>Paguei em dinheiro</span></button>
                <div class="login-action-error student-action-error" id="student-cash-error" role="alert" aria-atomic="true"></div>
              </div>
            ` : `<button class="button button--quiet" type="button" data-cash-notice data-loading-text="Enviando…">Paguei em dinheiro</button>`}
          </div>
          <p class="field-help" id="cash-notice-result" aria-live="polite">${escapeHtml(cashResult)}</p>
          <div class="receipt-editor" id="receipt-editor" hidden>
            <p class="field-help">Leitura fictícia do arquivo selecionado; revise os campos antes de enviar.</p>
            <div class="form-grid">
              ${field("receipt-amount", "Valor lido", "R$ 150,00")}
              ${field("receipt-date", "Data lida", "01/11/2026")}
            </div>
            <p class="receipt-result" id="receipt-result" aria-live="polite"></p>
            <p class="field-help" id="receipt-status" aria-live="polite">${receiptAlreadySent ? "Comprovante enviado; aguardando confirmação do professor." : ""}</p>
            ${activeRole === "student" ? `
              <div class="student-action-control">
                <button class="button button--primary button--action" type="button" data-send-receipt data-student-action aria-describedby="student-receipt-error" ${receiptAlreadySent ? "disabled" : ""}><span data-action-label>Enviar comprovante</span></button>
                <div class="login-action-error student-action-error" id="student-receipt-error" role="alert" aria-atomic="true"></div>
              </div>
            ` : `<button class="button button--primary" type="button" data-send-receipt data-loading-text="Enviando…" ${receiptAlreadySent ? "disabled" : ""}>Enviar comprovante</button>`}
          </div>
          ${activeRole === "student" ? '<div class="visually-hidden" id="student-payment-status" role="status" aria-live="polite" aria-atomic="true"></div>' : ""}
          <div class="notice notice--pending" id="duplicate-receipt-warning" style="margin-top:10px" ${receiptAlreadySent ? "" : "hidden"}>Comprovante já enviado para esta cobrança fictícia. Avisos duplicados ficam bloqueados.</div>
          <p class="field-help" style="margin-top:8px">Parser de comprovante: pendente de teste real no iPhone.</p>
          <p class="field-help" style="margin-top:12px">O protótipo não envia nem guarda arquivos.</p>
        `)}
      </div>
    `;
  },

  "student-chat"() {
    return `
      ${heading("VISÃO DO ALUNO", "Conversa com o professor", "Conversa individual entre você e o professor. Não há conversa com outros alunos ou instrutores.")}
      ${panel("Mensagens", `
        <div class="chat-thread">
          <div class="chat-bubble chat-bubble--in"><strong>Professor</strong><p>Mensagem fictícia recebida.</p></div>
          <div class="chat-bubble chat-bubble--out"><strong>Você</strong><p>Mensagem fictícia enviada.</p></div>
        </div>
        <form data-demo-form data-student-chat class="chat-form">
          <input class="search-input" type="text" placeholder="Escreva ao professor (demonstração)" aria-label="Mensagem ao professor">
          <div class="student-action-control">
            <button class="button button--primary button--action" type="submit" data-student-action aria-describedby="student-chat-error"><span data-action-label>Enviar</span></button>
            <div class="login-action-error student-action-error" id="student-chat-error" role="alert" aria-atomic="true"></div>
          </div>
          <div class="visually-hidden" id="student-chat-status" role="status" aria-live="polite" aria-atomic="true"></div>
        </form>
      `)}
    `;
  },

  "student-grades"() {
    const profile = demoProfiles[activeDemoAccount];
    const student = demoRoster.find((item) => item.account === activeDemoAccount);
    const history = student ? renderGradeHistory(student) : `<div class="timeline-item"><span class="timeline-dot"></span><div><strong>Faixa registrada</strong><small>Data: — · Responsável: professor</small></div></div>`;
    return `
      ${heading("VISÃO DO ALUNO", "Minhas graduações", "Histórico manual registrado pelo professor, em ordem cronológica.")}
      <div class="content-grid">
        ${panel("Linha do tempo", `
          <div class="timeline">
            <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Início dos treinos</strong><small>Data e professor: —</small></div></div>
            ${history}
            <div class="timeline-item"><span class="timeline-dot"></span><div><strong>Grau registrado</strong><small>Data: — · Responsável: professor</small></div></div>
          </div>
        `)}
        ${panel("Faixa atual", `
          <div class="belt-display belt-display--rank">${gradeVisual(profile.grade || "")}<span class="belt-copy"><strong>${escapeHtml(profile.grade || "Faixa conforme cadastro")}</strong><small>Graus exibidos no histórico</small></span></div>
          <p class="field-help" style="margin-top:12px">Não há contagem de presença nem previsão automática de graduação.</p>
        `, "panel-card--highlight")}
      </div>
    `;
  },

  "teacher-home"() {
    return `
      ${heading("VISÃO DO PROFESSOR", "Painel do professor", "Acompanhe alunos, cobranças e autorizações fictícias.")}
      <div class="card-grid card-grid--four">
        ${metric("PREVISTO", "R$ —", "Lançamentos do período", "gold")}
        ${metric("RECEBIDO", "R$ —", "Confirmado por você", "green")}
        ${metric("PENDENTE", "R$ —", "A confirmar ou a vencer", "amber")}
        ${metric("ATRASADO", "R$ —", "Após a carência definida", "red")}
      </div>
      <div class="content-grid" style="margin-top:16px">
        ${panel("Alertas", `
          ${listRow("Pagamentos a confirmar", "Avisos de pagamento dos alunos", "", '<span class="badge badge--amber">PENDENTE</span>')}
          ${listRow("Cobranças atrasadas", "Revise antes de enviar lembrete", "", '<span class="badge badge--red">REVISAR</span>')}
          ${listRow("Aniversários", "Lista e aviso entram na fase de operação", "", '<span class="badge">F2</span>')}
        `)}
        ${panel("Acessos rápidos", `
          <div class="stack">
            ${button("Cadastrar aluno", "student-create", "button button--quiet")}
            ${button("Papéis e autorizações", "role-management", "button button--quiet")}
            ${button("Importar extrato Pix", "pix-import", "button button--quiet")}
            ${button("Confirmar pagamentos", "payment-review", "button button--quiet")}
            ${button("Conversas", "teacher-chat", "button button--quiet")}
            <p class="field-help">Lote de mensalidades limitado a 24 cobranças.</p>
          </div>
        `)}
      </div>
      <div style="margin-top:16px">
        ${panel("Aulas de hoje", `<div class="notice notice--info">O plano de aulas, arquivo de temas e sugestões ficam na Fase 2; a decisão é sempre sua.</div>`)}
      </div>
    `;
  },

  students() {
    return `
      ${heading("VISÃO DO PROFESSOR", "Alunos", "Gerencie somente os alunos vinculados ao seu perfil.", button("Novo aluno", "student-create", "button button--primary", "+"))}
      ${panel("Lista de alunos", `
        <label class="search-wrap"><span class="search-symbol" aria-hidden="true">⌕</span><input class="search-input" type="search" placeholder="Buscar aluno (demonstração)" aria-label="Buscar aluno"></label>
        <div class="filter-row" role="group" aria-label="Filtros de demonstração">
          <button class="filter-chip" type="button" aria-pressed="true" data-demo-action>Todos</button>
          <button class="filter-chip" type="button" aria-pressed="false" data-demo-action>Ativos</button>
          <button class="filter-chip" type="button" aria-pressed="false" data-demo-action>Trancados</button>
          <button class="filter-chip" type="button" aria-pressed="false" data-demo-action>Sem acesso</button>
        </div>
        ${studentEntry("ALUNO FICTÍCIO 01", "ATIVO", "avatar-masculino.svg", "badge--green")}
        ${studentEntry("ALUNO FICTÍCIO 02", "SEM LOGIN", "avatar-feminino.svg", "badge--blue")}
        ${studentEntry("ALUNO FICTÍCIO 03", "TRANCADO", "avatar-masculino.svg", "badge--amber")}
        ${demoRoster.map((student, index) => student.demoCreated && student.teacherAccount === activeDemoAccount
          ? studentEntry(student.name, "SEM LOGIN", "avatar-masculino.svg", "badge--blue", index) : "").join("")}
      `)}
    `;
  },

  "student-detail"() {
    const ownStudents = demoRoster.filter((student) => student.teacherAccount === activeDemoAccount);
    if (!selectedGradeStudent || !ownStudents.includes(selectedGradeStudent)) selectedGradeStudent = ownStudents[0] || null;
    const student = selectedGradeStudent;
    const beltIndex = student ? gradeBeltIndex(student.grade) : -1;
    const currentDegree = student ? gradeDegree(student.grade) : -1;
    const currentValid = beltDegrees(beltIndex).includes(currentDegree);
    const availableBelts = currentValid ? demoBelts.filter((belt, index) =>
      index > beltIndex || (index === beltIndex && beltDegrees(index).some((degree) => degree > currentDegree))) : [];
    const history = student ? gradeHistoryEntries(student) : [];
    const latestGrade = history.length ? history[history.length - 1] : null;
    const gradeForm = student ? `
      <div class="field"><label for="grade-student">Aluno da sua turma</label><select id="grade-student">${ownStudents.map((item) => `<option value="${demoRoster.indexOf(item)}" ${item === student ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></div>
      <div class="timeline">${renderGradeHistory(student)}</div>
      ${!currentValid ? `<p class="notice notice--info">Graduação atual não reconhecida; confira o cadastro antes de graduar.</p>` : availableBelts.length ? `
        <form data-register-student-grade>
          <div class="form-grid">
            <div class="field"><label for="grade-belt">Nova faixa</label><select id="grade-belt" required><option value="">Selecione</option>${availableBelts.map((belt) => `<option value="${escapeHtml(belt)}">${escapeHtml(belt)}</option>`).join("")}</select></div>
            <div class="field"><label for="grade-degree">Novo grau</label><select id="grade-degree" required disabled><option value="">Selecione a faixa</option></select></div>
            <div class="field"><label for="grade-date">Data da graduação</label><input id="grade-date" type="date" required></div>
          </div>
          <div class="form-actions"><div class="student-action-control">
            <button class="button button--primary button--action" type="submit" data-grade-action><span data-action-label>Graduar aluno</span></button>
            <p class="login-action-error student-action-error" role="alert"></p>
          </div></div>
          <p class="visually-hidden" role="status" aria-live="polite"></p>
        </form>
      ` : `<p class="field-help">Não há graduação superior na lista.</p>`}
    ` : emptyState("Nenhum aluno da turma", "Alunos vinculados ao Professor aparecerão aqui.");
    return `
      ${heading("VISÃO DO PROFESSOR", "Ficha do aluno", "Resumo e registros do aluno fictício; notas privadas aparecem apenas nesta visualização de professor.")}
      ${panel("Perfil", `
        <div class="profile-summary">
          ${personRow(student ? escapeHtml(student.name) : "Nenhum aluno da turma", "Cadastro demonstrativo · perfil de aluno")}
          <div class="belt-display belt-display--rank">${student ? gradeVisual(student.grade) : ""}<span class="belt-copy"><strong>${student ? escapeHtml(student.grade) : "Faixa não disponível"}</strong><small>Último registro: ${latestGrade ? escapeHtml(formatDemoDate(latestGrade.date)) : "—"}</small></span></div>
        </div>
      `, "panel-card--highlight")}
      <div class="tab-list" role="tablist" aria-label="Seções da ficha do aluno">
        <button class="tab-button" id="tab-summary" type="button" role="tab" aria-selected="true" aria-controls="panel-summary" data-tab="summary">Resumo</button>
        <button class="tab-button" id="tab-payments" type="button" role="tab" aria-selected="false" aria-controls="panel-payments" data-tab="payments">Pagamentos</button>
        <button class="tab-button" id="tab-grades" type="button" role="tab" aria-selected="false" aria-controls="panel-grades" data-tab="grades">Graduações</button>
        <button class="tab-button" id="tab-feedback" type="button" role="tab" aria-selected="false" aria-controls="panel-feedback" data-tab="feedback">Feedbacks</button>
        <button class="tab-button" id="tab-notes" type="button" role="tab" aria-selected="false" aria-controls="panel-notes" data-tab="notes">Notas privadas</button>
      </div>
      <section class="tab-panel panel-card" id="panel-summary" role="tabpanel" aria-labelledby="tab-summary" data-tab-panel="summary">
        <div class="card-grid card-grid--two">${metric("STATUS", "—", "Conforme os registros", "gold")}${metric("MENSALIDADE", "R$ —", "Valor configurado no cadastro")}</div>
        <p class="panel-copy" style="margin-top:16px">Contato, aniversário e outros dados só aparecem conforme o escopo definido para cada perfil.</p>
      </section>
      <section class="tab-panel panel-card" id="panel-payments" role="tabpanel" aria-labelledby="tab-payments" data-tab-panel="payments" hidden>${listRow("Cobrança", "Vencimento: —", "R$ —", '<span class="badge badge--pending">PENDENTE</span>')}${emptyState("Sem registros adicionais", "O histórico é demonstrativo.")}</section>
      <section class="tab-panel panel-card" id="panel-grades" role="tabpanel" aria-labelledby="tab-grades" data-tab-panel="grades" hidden>${gradeForm}</section>
      <section class="tab-panel panel-card" id="panel-feedback" role="tabpanel" aria-labelledby="tab-feedback" data-tab-panel="feedback" hidden>${emptyState("Nenhum feedback demonstrativo", "Mensagens e metas aparecem conforme o roadmap.")}</section>
      <section class="tab-panel panel-card" id="panel-notes" role="tabpanel" aria-labelledby="tab-notes" data-tab-panel="notes" hidden><div class="notice notice--info">Anotações privadas do professor. Não são exibidas ao aluno nem ao instrutor.</div><textarea class="search-input" aria-label="Prévia de anotação privada" placeholder="Campo visual; nada será salvo" style="margin-top:12px"></textarea></section>
    `;
  },

  "student-create"() {
    return `
      ${heading("VISÃO DO PROFESSOR", "Novo aluno e convite", "Use somente dados fictícios. Nome e graduação ficam neste navegador; os demais campos são apenas visuais.")}
      <div class="content-grid">
        ${panel("Cadastro", `
          <form data-create-demo-student>
            <div class="form-grid">
              <div class="field"><label for="student-name">Nome fictício</label><input id="student-name" type="text" placeholder="Nome fictício do aluno" required></div>
              ${field("student-contact", "Contato", "Contato (opcional)")}
              ${field("student-birthday", "Aniversário", "dd/mm/aaaa", "text")}
              <div class="field">
                <label for="student-plan">Plano</label>
                <select id="student-plan"><option>Selecione</option><option>Mensalidade</option><option>Avulso</option></select>
              </div>
              ${field("student-fee", "Valor", "R$ —")}
              ${field("student-due", "Dia do vencimento", "—", "number")}
              <div class="field">
                <label for="student-belt">Faixa</label>
                <select id="student-belt" required><option value="">Selecione</option>${demoBelts.map((belt) => `<option>${belt}</option>`).join("")}</select>
              </div>
              <div class="field"><label for="student-degree">Grau atual</label><select id="student-degree" required disabled><option value="">Selecione a faixa</option></select></div>
              <div class="field">
                <label for="student-access">Acesso</label>
                <select id="student-access"><option>Convite para conta</option><option>Perfil sem login</option></select>
                <small class="field-help">Aluno sem telefone pode permanecer gerenciado pelo professor.</small>
              </div>
            </div>
            <div class="notice notice--info" style="margin-top:16px">O cadastro fictício não cria login nem convite. Contato, aniversário, plano, valor, vencimento e acesso não são salvos.</div>
            <div class="form-actions"><button class="button button--quiet" type="reset">Limpar campos</button><div class="student-action-control"><button class="button button--primary button--action" type="submit" data-student-create-action><span data-action-label>Cadastrar aluno fictício</span></button><p class="login-action-error student-action-error" role="alert"></p></div></div>
            <p class="field-help" role="status" aria-live="polite"></p>
          </form>
        `)}
        ${panel("Convite do aluno", `
          <div class="invite-preview">
            <span class="eyebrow">LINK DE DEMONSTRAÇÃO</span>
            <strong>Convite ainda não gerado</strong>
            <p>Na versão funcional, o vínculo será validado no banco e usado uma única vez.</p>
            ${actionButton("Pré-visualizar convite")}
          </div>
        `)}
      </div>
    `;
  },

  "teacher-code"() {
    const professor = demoProfiles[activeDemoAccount];
    const hasAcademy = Boolean(professor && professor.academyId);
    const linkCode = hasAcademy ? getTeacherLinkCode(activeDemoAccount) : "";
    return `
      ${heading("VISÃO DO PROFESSOR", "Código e convites", "Seu código de vínculo, links de uso único e aprovações pendentes.")}
      <div class="content-grid">
        <div class="stack">
          ${panel("Seu código de vínculo", `
            <div class="invite-preview">
              <span class="eyebrow">CÓDIGO ATUAL</span>
              ${hasAcademy ? `<strong class="code-display">${escapeHtml(linkCode)}</strong><p>Academia: ${escapeHtml(demoAcademy.name)}. Compartilhe com alunos que já têm conta.</p><button class="button button--quiet" type="button" data-change-teacher-code>Trocar código</button>` : `<strong>Professor sem academia</strong><p>O Adm precisa vincular uma academia antes de liberar o código.</p>`}
            </div>
          `, "panel-card--highlight")}
          ${panel("Gerar link de uso único", `
            <form data-create-invite>
              <div class="field">
                <label for="invite-link-type">Destinatário</label>
                <select id="invite-link-type"><option value="instructor">Instrutor</option><option value="student">Aluno pré-cadastrado</option></select>
              </div>
              <div class="field" style="margin-top:12px">
                <label for="invite-link-recipient">Pessoa pré-cadastrada</label>
                <select id="invite-link-recipient">${renderDemoInviteRecipients("instructor")}</select>
              </div>
              <p class="field-help" style="margin-top:10px">O Instrutor é um aluno com função de apoio: vê nome e graduação da turma e somente a aula que você compartilhar. Não vê pagamentos de outras pessoas, notas privadas nem conversas de terceiros.</p>
              <p class="field-help" style="margin-top:10px">O link vale por 3 dias e só pode ser usado uma vez.</p>
              <div class="form-actions"><button class="button button--primary" type="submit" data-loading-text="Gerando…" ${hasAcademy ? "" : "disabled"}>Gerar link</button></div>
            </form>
          `)}
          ${panel("Link gerado", `
            <div class="invite-result" id="invite-result">${renderDemoInvites()}</div>
          `)}
        </div>
        ${panel("Vínculos pendentes", renderPendingLinkRequests())}
      </div>
    `;
  },

  "role-management"() {
    const isAdm = activeRole === "adm";
    const ownStudents = demoRoster.filter((student) => student.teacherAccount === activeDemoAccount && student.account);
    const instructorAccounts = Object.values(demoProfiles).filter((profile) =>
      profile.role === "instructor" && (isAdm || profile.teacherAccount === activeDemoAccount)
    );
    const authorizedInstructorAccounts = instructorAccounts.filter((profile) => authorizedInstructorNames.has(profile.name));
    const professorAccounts = Object.entries(demoProfiles).filter(([, profile]) => profile.role === "professor");
    return `
      ${heading("GESTÃO DE PAPÉIS", "Papéis e autorizações", isAdm ? "Só o Adm define Professores e os vincula à academia." : "Promova somente alunos da sua turma a Instrutor e delegue uma aula.") }
      <div class="content-grid">
        <div class="stack">
          ${isAdm ? panel("Vincular Professor à academia", `
            ${professorAccounts.map(([account, profile]) => `
              <div class="role-change-row">
                <div><strong>${escapeHtml(profile.name)}</strong><small>${profile.academyId ? escapeHtml(demoAcademy.name) : "Professor sem academia"}</small></div>
                <button class="button button--small button--primary" type="button" data-bind-professor-academy="${escapeHtml(account)}" ${profile.academyId ? "disabled" : ""}>${profile.academyId ? "Academia vinculada" : "Vincular à Academia Fictícia"}</button>
              </div>
            `).join("")}
            <p class="field-help">Só o Adm atribui o papel de Professor e vincula sua academia. Antes do vínculo, o código não cria pedidos de aluno.</p>
          `) : ""}
          ${isAdm ? panel("Graduar Instrutor a Professor", `
            ${instructorAccounts.length ? instructorAccounts.map((profile) => {
              const account = Object.keys(demoProfiles).find((key) => demoProfiles[key] === profile);
              return `<div class="role-change-row" data-role-record><div><strong>${escapeHtml(profile.name)}</strong><small>Papel atual: <span data-current-role>${escapeHtml(profile.label)}</span></small></div><button class="button button--small button--quiet" type="button" data-role-transition="professor" data-account="${escapeHtml(account)}">Graduar a Professor</button></div>`;
            }).join("") : emptyState("Nenhum Instrutor para graduar", "Contas com papel de Instrutor aparecerão aqui.")}
            <p class="field-help">A próxima entrada usa a nova tela; histórico e graduação da pessoa são mantidos.</p>
          `) : panel("Alunos da sua turma", `
            ${ownStudents.length ? ownStudents.map((student) => {
              const profile = demoProfiles[student.account];
              return `<div class="role-change-row" data-role-record><div><strong>${escapeHtml(student.name)}</strong><small>Papel atual: <span data-current-role>${escapeHtml(profile.label)}</span></small></div><button class="button button--small button--quiet" type="button" data-role-transition="instructor" data-account="${escapeHtml(student.account)}" ${profile.role === "student" ? "" : "disabled"}>${profile.role === "student" ? "Promover a instrutor" : "Papel atualizado"}</button></div>`;
            }).join("") : emptyState("Nenhum aluno próprio", "Só alunos desta turma podem ser promovidos.")}
            <p class="field-help">A próxima entrada usa a tela de Instrutor; faixa e histórico permanecem vinculados à pessoa.</p>
          `)}
          ${panel("Autorizar instrutor", `
            ${instructorAccounts.length ? instructorAccounts.map((profile) => `
              <div class="role-change-row">
                <div><strong>${profile.name}</strong><small>${authorizedInstructorNames.has(profile.name) ? "Autorização ativa" : "Autorização pendente"}</small></div>
                <button class="button button--small button--primary" type="button" data-authorize-instructor="${profile.name}" ${authorizedInstructorNames.has(profile.name) ? "disabled" : ""}>${authorizedInstructorNames.has(profile.name) ? "Autorizado" : "Autorizar"}</button>
              </div>
            `).join("") : emptyState("Nenhum instrutor", "Não há conta com papel de instrutor nesta demonstração.")}
          `)}
          ${activeRole === "professor" ? panel("Delegar aula", `
            <p class="panel-copy">A turma é única. Você decide se compartilha o plano ou deixa o treino livre; o Instrutor não escolhe o conteúdo.</p>
            <div class="field">
              <label for="delegate-instructor">Instrutor</label>
              <select id="delegate-instructor" ${authorizedInstructorAccounts.length ? "" : "disabled"}>${authorizedInstructorAccounts.map((profile) => `<option value="${escapeHtml(profile.name)}">${escapeHtml(profile.name)}</option>`).join("")}</select>
            </div>
            <div class="field" style="margin-top:12px">
              <label for="delegate-mode">Formato da aula</label>
              <select id="delegate-mode"><option value="plan">Compartilhar o plano</option><option value="free">Treino livre</option></select>
            </div>
            <div class="field" style="margin-top:12px">
              <label for="delegate-plan">Plano da aula</label>
              <textarea class="search-input" id="delegate-plan" aria-describedby="delegate-plan-help" placeholder="Plano decidido pelo Professor"></textarea>
              <small id="delegate-plan-help" class="field-help">O plano só é exibido ao Instrutor quando esta opção está selecionada.</small>
            </div>
            <p class="field-help">Autorize o Instrutor antes de delegar.</p>
            <div class="form-actions"><button class="button button--primary" type="button" data-delegate-class ${authorizedInstructorAccounts.length ? "" : "disabled"}>Delegar aula</button></div>
          `) : ""}
        </div>
        ${panel("Histórico preservado", `
          <ol class="role-history" id="role-history">
            ${simulatedRoleHistory.map((entry) => `<li>${entry}</li>`).join("")}
          </ol>
          <p class="notice notice--info">Alterações fictícias; faixa e histórico permanecem com o aluno.</p>
        `)}
      </div>
    `;
  },

  "pix-import"() {
    return `
      ${heading("VISÃO DO PROFESSOR", "Importar extrato Pix", "Confira o arquivo e revise as correspondências sugeridas. Nada é pago ou confirmado automaticamente.") }
      <div class="content-grid">
        <div class="stack">
          ${panel("Extrato para conferência", `
            <div class="field">
              <label for="pix-statement-file">Arquivo do extrato Pix</label>
              <input id="pix-statement-file" type="file" accept=".csv,.ofx,.txt,application/*" data-pix-file>
              <small class="field-help">Leitura fictícia de data e valor; nenhum arquivo é enviado ou guardado.</small>
            </div>
          `)}
          <section class="panel-card" id="pix-suggestions" hidden>
            <div class="panel-heading"><h3>Sugestões de correspondência</h3></div>
            <div class="pix-match-row" data-pix-match>
              <div><strong>ALUNO FICTÍCIO 01</strong><small>Valor lido: R$ 150,00 · Data lida: 01/11/2026</small><small>Cobrança sugerida: mensalidade · R$ 150,00</small></div>
              ${teacherPaymentButton("Confirmar", "pix-confirmar", "button button--small button--primary", "data-confirm-pix")}
              <p class="visually-hidden" role="status" aria-live="polite"></p>
            </div>
            <div class="pix-match-row" data-pix-match>
              <div><strong>ALUNO FICTÍCIO 02</strong><small>Valor lido: R$ 120,00 · Data lida: 02/11/2026</small><small>Cobrança sugerida: mensalidade · R$ 150,00</small></div>
              ${teacherPaymentButton("Revisar sugestão", "pix-revisar", "button button--small button--quiet", "data-review-pix")}
              <p class="visually-hidden" role="status" aria-live="polite"></p>
            </div>
          </section>
        </div>
        ${panel("Conferência manual", `
          <div class="notice notice--info">O extrato só ajuda a localizar cobranças. O Professor confere cada data e valor e confirma a correspondência; o app não movimenta dinheiro.</div>
          <p class="field-help" style="margin-top:12px">Limite de lote de mensalidades: até 24 por vez.</p>
        `)}
      </div>
    `;
  },

  "payment-review"() {
    const pendingCash = cashPayments.filter((payment) =>
      payment.status === "pending" && payment.source === "student" && payment.professorAccount === activeDemoAccount
    );
    const teacherReceipts = receiptPayments.filter((payment) => payment.professorAccount === activeDemoAccount);
    const pendingItems = [
      ...teacherReceipts.filter((payment) => payment.status === "pending").map(renderReceiptPaymentRow),
      ...pendingCash.map(renderCashPaymentRow)
    ];
    const receiptHistory = teacherReceipts.filter((payment) => payment.status === "confirmed");
    return `
      ${heading("VISÃO DO PROFESSOR", "Pagamentos a confirmar", "Compare a leitura do comprovante com a cobrança e confirme ou recuse. Os registros fictícios ficam neste navegador.")}
      <div class="content-grid">
        ${panel("Aguardando confirmação", `
          ${pendingItems.length ? pendingItems.join("") : emptyState("Nenhum pagamento pendente", "Comprovantes e avisos em dinheiro enviados pelos alunos aparecerão nesta fila.")}
        `)}
        <div class="stack">
          ${panel("Lançar dinheiro recebido", `
            <p class="panel-copy">O recebimento fica confirmado na hora. Você pode desfazê-lo por 10 segundos no histórico; depois, use Estornar.</p>
            <form data-register-teacher-cash>
              <div class="form-grid">
                <div class="field"><label for="teacher-cash-student">Aluno da sua turma</label><input id="teacher-cash-student" type="text" role="combobox" aria-autocomplete="list" aria-controls="teacher-cash-students" aria-expanded="false" autocomplete="off" aria-describedby="teacher-cash-student-help teacher-cash-selection" required><div class="teacher-cash-options" id="teacher-cash-students" role="listbox" aria-label="Alunos da sua turma" hidden></div><small class="field-help" id="teacher-cash-student-help">Digite o nome e selecione o aluno e sua graduação na lista.</small><small class="field-help teacher-cash-selection" id="teacher-cash-selection" role="status"></small></div>
                <div class="field"><label for="teacher-cash-amount">Valor recebido</label><input id="teacher-cash-amount" type="number" min="0.01" step="0.01" value="150.00" required></div>
                <div class="field"><label for="teacher-cash-date">Data de recebimento</label><input id="teacher-cash-date" type="date" value="2026-11-07" required></div>
                <div class="field"><label for="teacher-cash-type">Tipo da cobrança</label><input id="teacher-cash-type" type="text" required></div>
                <div class="field"><label for="teacher-cash-reference">Referência</label><input id="teacher-cash-reference" type="text" required></div>
              </div>
              <div class="form-actions"><div class="student-action-control">
                <button class="button button--primary button--action" type="submit" data-professor-payment-action="dinheiro-lancar"><span data-action-label>Registrar recebido em dinheiro</span></button>
                <p class="login-action-error student-action-error" role="alert"></p>
              </div></div>
              <p class="field-help" id="teacher-cash-result" role="status" aria-live="polite"></p>
            </form>
          `)}
          ${panel("Recebimentos em dinheiro lançados pelo Professor", `<div id="teacher-cash-history">${renderTeacherCashHistory()}</div>`)}
          ${panel("Histórico dos avisos em dinheiro dos alunos", `<div id="student-cash-history">${renderStudentCashHistory()}</div>`)}
          ${panel("Histórico de comprovantes confirmados", `<div>${receiptHistory.length ? receiptHistory.map(renderReceiptHistoryRow).join("") : emptyState("Nenhum comprovante confirmado", "Após a confirmação, ficam somente o valor e a data.")}</div>`)}
          ${panel("Regra de confirmação", `
            <div class="notice notice--info">Avisos dos alunos ficam pendentes até sua confirmação ou recusa. O lançamento direto do Professor já fica confirmado. O app não movimenta dinheiro.</div>
            <div style="margin-top:14px">${metric("A CONFIRMAR", String(pendingItems.length), "Comprovantes e avisos pendentes", "amber")}</div>
          `)}
        </div>
      </div>
    `;
  },

  overdue() {
    return `
      ${heading("VISÃO DO PROFESSOR", "Atrasados e cobrança", "Revise os registros e use uma mensagem manual; automações e envio real não fazem parte do protótipo.")}
      ${panel("Cobranças atrasadas", `
        ${listRow("ALUNO FICTÍCIO 01", "Vencimento: — · Carência conforme configuração", "R$ —", '<span class="badge badge--red">ATRASADO</span>')}
        <div class="row-actions">${actionButton("Prévia de mensagem")}${actionButton("Abrir WhatsApp", "button button--small button--quiet")}</div>
        ${listRow("ALUNO FICTÍCIO 02", "Vencimento: — · Carência conforme configuração", "R$ —", '<span class="badge badge--red">ATRASADO</span>')}
        <div class="row-actions">${actionButton("Prévia de mensagem")}${actionButton("Abrir WhatsApp", "button button--small button--quiet")}</div>
      `)}
      <div class="card-grid card-grid--three" style="margin-top:15px">
        ${panel("Lembrete antes do vencimento", `<p class="panel-copy">Texto pré-definido e editável — conteúdo a configurar.</p>`)}
        ${panel("Lembrete no vencimento", `<p class="panel-copy">Texto pré-definido e editável — conteúdo a configurar.</p>`)}
        ${panel("Lembrete após o vencimento", `<p class="panel-copy">Texto pré-definido e editável — conteúdo a configurar.</p>`)}
      </div>
    `;
  },

  "quick-actions"() {
    return `
      ${heading("VISÃO DO PROFESSOR", "Ações rápidas", "Atalhos previstos para tarefas comuns. Cada botão só navega entre telas do protótipo.")}
      <div class="quick-action-grid">
        <button class="quick-action" type="button" data-screen-target="student-create"><span class="quick-action-icon" aria-hidden="true">＋</span><span><strong>Novo aluno</strong><small>Cadastrar e preparar convite</small></span></button>
        <button class="quick-action" type="button" data-screen-target="role-management"><span class="quick-action-icon" aria-hidden="true">◈</span><span><strong>Papéis e autorizações</strong><small>Administrar contas e instrutores</small></span></button>
        <button class="quick-action" type="button" data-screen-target="pix-import"><span class="quick-action-icon" aria-hidden="true">⇧</span><span><strong>Importar extrato Pix</strong><small>Sugerir cobranças correspondentes</small></span></button>
        <button class="quick-action" type="button" data-screen-target="payment-review"><span class="quick-action-icon" aria-hidden="true">▤</span><span><strong>Confirmar pagamento</strong><small>Revisar avisos dos alunos</small></span></button>
        <button class="quick-action" type="button" data-screen-target="overdue"><span class="quick-action-icon" aria-hidden="true">◷</span><span><strong>Cobrar manualmente</strong><small>Prévia de lembrete com WhatsApp</small></span></button>
        <button class="quick-action" type="button" data-screen-target="students"><span class="quick-action-icon" aria-hidden="true">♧</span><span><strong>Ver alunos</strong><small>Lista e perfis vinculados</small></span></button>
        <button class="quick-action" type="button" data-screen-target="teacher-home"><span class="quick-action-icon" aria-hidden="true">▦</span><span><strong>Voltar ao painel</strong><small>Resumo e alertas</small></span></button>
      </div>
    `;
  },

  "teacher-chat"() {
    return `
      ${heading("VISÃO DO PROFESSOR", "Conversas", "Conversas individuais com seus alunos e instrutores. Não há conversa entre outros usuários.")}
      <div class="content-grid">
        ${panel("Conversas", `
          ${personRow("ALUNO FICTÍCIO 01", "Aluno · última mensagem: —", "avatar-masculino.svg")}
          ${personRow("INSTRUTOR FICTÍCIO 01", "Instrutor · última mensagem: —", "avatar-feminino.svg")}
        `)}
        ${panel("Mensagens", `
          <div class="chat-thread">
            <div class="chat-bubble chat-bubble--in"><strong>Aluno</strong><p>Mensagem fictícia recebida.</p></div>
            <div class="chat-bubble chat-bubble--out"><strong>Você</strong><p>Mensagem fictícia enviada.</p></div>
          </div>
          <form data-demo-form class="chat-form">
            <input class="search-input" type="text" placeholder="Responder (demonstração)" aria-label="Responder">
            <button class="button button--primary" type="submit" data-loading-text="Enviando…">Enviar</button>
          </form>
        `)}
      </div>
    `;
  },

  "admin-home"() {
    return `
      ${heading("VISÃO DO ADMINISTRADOR", "Painel do Adm", "Métricas agregadas e suporte conforme permissões. Sem métricas comerciais ou acesso automático a conversas.")}
      <div class="card-grid card-grid--four">
        ${metric("PROFESSORES", "—", "Convites e contas", "gold")}
        ${metric("ALUNOS", "—", "Total agregado", "green")}
        ${metric("ÚLTIMOS ACESSOS", "—", "Dados demonstrativos", "blue")}
        ${metric("ERROS RECENTES", "—", "Diagnóstico da fase posterior", "amber")}
      </div>
      <div class="content-grid" style="margin-top:16px">
        ${panel("Acessos e convites", `
          ${listRow("Convites de professor", "Enviados e concluídos", "—")}
          ${listRow("Usuários ativos", "Último acesso conforme permissão", "—")}
          ${button("Ver professores convidados", "teacher-invites", "button button--quiet")}
        `)}
        ${panel("Suporte", `
          <div class="notice notice--pending">Acesso individual a dados só em modo de suporte, com auditoria. As regras e a tela de auditoria serão definidas antes de implementar esse recurso.</div>
        `)}
      </div>
    `;
  },

  "teacher-invites"() {
    return `
      ${heading("VISÃO DO ADMINISTRADOR", "Professores convidados", "Apenas o Adm gerencia a lista de professores autorizados.")}
      <div class="content-grid">
        ${panel("Lista de convites", `
          ${listRow("PROFESSOR FICTÍCIO 01", "Estado demonstrativo · sem e-mail ou dado real", "", '<span class="badge badge--green">ATIVO</span>')}
          ${listRow("PROFESSOR FICTÍCIO 02", "Convite demonstrativo", "", '<span class="badge badge--amber">CONVIDADO</span>')}
          ${emptyState("Sem outros registros", "Esta lista não contém pessoas reais.")}
        `)}
        ${panel("Convidar professor", `
          <form data-demo-form>
            ${field("teacher-email", "E-mail", "e-mail do professor", "email")}
            <div class="form-actions"><button class="button button--primary" type="submit">Prévia do convite</button></div>
          </form>
          <p class="field-help" style="margin-top:12px">O convite real e a atribuição do papel serão validados no banco.</p>
        `)}
      </div>
    `;
  },

  "instructor-class"() {
    const profile = demoProfiles[activeDemoAccount];
    if (!profile || !authorizedInstructorNames.has(profile.name)) {
      return `
        ${heading("VISÃO DO INSTRUTOR", "Aguardando autorização", "O Professor precisa delegar uma aula antes de liberar a turma.")}
        ${panel("Acesso restrito", `<div class="notice notice--pending">Nenhum dado de aluno, treino ou conversa é exibido antes da autorização.</div>`)}
      `;
    }
    const lesson = delegatedLessons[profile.name];
    const lessonContent = lesson
      ? lesson.mode === "free" ? "Treino livre" : lesson.plan
      : "Nenhuma aula foi delegada pelo Professor.";
    const followedLabel = lesson && lesson.followed === "yes" ? "Segui" : lesson && lesson.followed === "no" ? "Não segui" : "";
    return `
      ${heading("VISÃO DO INSTRUTOR", "Aula delegada", "O Professor decide a aula; você registra se seguiu a orientação.")}
      <div class="content-grid">
        <div class="stack">
          ${panel("Treino do dia", `
            ${listRow("Aula da turma", "Delegada pelo Professor · data e horário: —", "", `<span class="badge badge--blue">${lesson ? "DELEGADA" : "AGUARDANDO"}</span>`)}
            <p class="instructor-lesson-content">${escapeHtml(lessonContent)}</p>
            ${lesson ? `<div class="form-actions" role="group" aria-label="Registrar se seguiu a orientação"><button class="button button--primary" type="button" data-class-followed="yes" ${followedLabel ? "disabled" : ""}>Segui</button><button class="button button--quiet" type="button" data-class-followed="no" ${followedLabel ? "disabled" : ""}>Não segui</button></div>` : ""}
            <p class="field-help" id="class-follow-result" aria-live="polite">${followedLabel ? `Registro: ${followedLabel}.` : ""}</p>
          `, "panel-card--highlight")}
        </div>
        <div class="stack">
          ${panel("Alunos da turma", `
            ${demoRoster.filter((student) => student.teacherAccount === profile.teacherAccount).map((student) => listRow(escapeHtml(student.name), `Graduação atual: ${escapeHtml(student.grade)}`)).join("")}
            <p class="field-help" style="margin-top:12px">Somente nome e graduação atual. Sem pagamentos, notas privadas ou conversas de terceiros.</p>
          `)}
          ${panel("Limites deste acesso", `
            <div class="stack">
              <span class="badge badge--green">Pode ver a aula delegada</span>
              <span class="badge badge--red">Sem acesso a pagamentos</span>
              <span class="badge badge--red">Sem acesso a notas privadas ou conversas de terceiros</span>
            </div>
          `)}
        </div>
      </div>
    `;
  },

  "instructor-chat"() {
    return `
      ${heading("VISÃO DO INSTRUTOR", "Conversa com o professor", "Conversa individual entre você e o professor principal. Não há conversa com alunos ou outros usuários.")}
      ${panel("Mensagens", `
        <div class="chat-thread">
          <div class="chat-bubble chat-bubble--in"><strong>Professor</strong><p>Mensagem fictícia recebida.</p></div>
          <div class="chat-bubble chat-bubble--out"><strong>Você</strong><p>Mensagem fictícia enviada.</p></div>
        </div>
        <form data-demo-form class="chat-form">
          <input class="search-input" type="text" placeholder="Escreva ao professor (demonstração)" aria-label="Mensagem ao professor">
          <button class="button button--primary" type="submit" data-loading-text="Enviando…">Enviar</button>
        </form>
      `)}
    `;
  },

  academy() {
    const academyProfessors = Object.entries(demoProfiles).filter(([, profile]) =>
      profile.role === "professor" && profile.academyId === demoAcademy.id
    );
    const academyInstructors = Object.values(demoProfiles).filter((profile) =>
      profile.role === "instructor" && profile.academyId === demoAcademy.id && authorizedInstructorNames.has(profile.name)
    );
    return `
      ${heading("ACADEMIA", "Academia", "Página pública para usuários vinculados: equipe e horários de treino.")}
      <div class="content-grid">
        ${academyProfessors.length ? `<div class="stack">
          ${academyProfessors.map(([account, profile]) => panel("Professor e horários", `
            ${personRow(escapeHtml(profile.name), "Professor · uma turma", "avatar-masculino.svg")}
            <div class="schedule-list">
              ${defaultProfessorSchedule.map(([day, hours]) => listRow(day, hours)).join("")}
            </div>
            <p class="field-help">Grade: ${publishedAcademyGrades.has(account) ? "Publicada" : "Rascunho"}.</p>
          `)).join("")}
          ${panel("Instrutores", academyInstructors.length
            ? academyInstructors.map((profile) => personRow(escapeHtml(profile.name), "Aluno com função de apoio", "avatar-feminino.svg")).join("")
            : emptyState("Nenhum Instrutor vinculado", "Instrutores autorizados da academia aparecerão aqui."))}
        </div>
        <div class="stack">
          ${academyProfessors.map(([account, profile]) => panel(`Grade · ${escapeHtml(profile.name)}`, `
            <div class="notice notice--info">Situação: <strong data-grade-state>${publishedAcademyGrades.has(account) ? "Publicada" : "Rascunho"}</strong>.</div>
            ${activeRole === "professor" && activeDemoAccount === account
              ? `<div class="form-actions"><button class="button button--primary" type="button" data-toggle-grade>${publishedAcademyGrades.has(account) ? "Voltar para rascunho" : "Publicar grade"}</button></div>`
              : ""}
          `)).join("")}
        </div>` : panel("Vínculo da academia", `<div class="notice notice--pending">Professor sem academia. Só o Adm pode vincular um Professor à academia.</div>`)}
      </div>
    `;
  },

  "user-settings"() {
    const profile = demoProfiles[activeRole];
    return `
      ${heading("CONTA", "Painel do usuário", "Preferências demonstrativas; perfil e papel vêm do banco na versão funcional.")}
      <div class="content-grid">
        ${panel("Perfil", personRow(profile.name, profile.label) + `
          <div class="stack" style="margin-top:18px">
            ${listRow("Papel", "Simulado para esta demonstração", "", `<span class="badge">${profile.label.toUpperCase()}</span>`)}
            ${listRow("Versão do app", "Visualização do protótipo", "", `<span class="badge badge--gold">${APP_VERSION}</span>`)}
          </div>
        `)}
        ${panel("Preferências", `
          <div class="settings-row"><span><strong>Tema</strong><small>Segue o aparelho por padrão; alterne para conferir.</small></span><button class="button button--small button--quiet" type="button" data-theme-toggle>Alternar tema</button></div>
          <div class="settings-row"><span><strong>Atualização</strong><small>Verificação visual, sem buscar versão remota.</small></span>${actionButton("Buscar versão", "button button--small button--quiet")}</div>
          <div class="settings-row"><span><strong>Privacidade</strong><small>Texto pendente de revisão e aprovação.</small></span><button class="button button--small button--quiet" type="button" data-open-privacy>Consultar</button></div>
          <div class="settings-row"><span><strong>Ajuda e tutorial</strong><small>Conteúdo previsto para fase posterior.</small></span>${actionButton("Abrir ajuda", "button button--small button--quiet")}</div>
        `)}
      </div>
    `;
  },

  privacy() {
    return `
      ${heading("PRIVACIDADE", "Consentimento e política", "A tela existe no protótipo; nenhum termo é exibido como aprovado e nenhum aceite é registrado.")}
      <div class="content-grid">
        ${panel("Conteúdo a revisar", `
          <div class="notice notice--pending">${privacyPlaceholder}</div>
          <div style="margin-top:15px">
            <label class="consent-row"><input type="checkbox" disabled><span>Li e aceito o termo — indisponível até o conteúdo ser aprovado.</span></label>
          </div>
          <div class="form-actions"><button class="button button--primary" type="button" disabled>Continuar</button></div>
        `)}
        ${panel("Apresentações", `
          <p class="panel-copy">O requisito prevê uma página HTML própria e um modal legível no app. Ambos permanecem com o mesmo aviso temporário até a revisão do texto.</p>
          <div class="stack">
            <button class="button button--quiet" type="button" data-open-privacy>Abrir aviso em modal</button>
            <a class="button button--quiet" href="privacidade.html">Abrir página independente</a>
          </div>
        `)}
      </div>
    `;
  }
};

function closeMobileMenu() {
  const wasOpen = sidebar.classList.contains("is-open");
  document.querySelectorAll(".prototype-banner, .app-main, #mobile-navigation").forEach((element) => { element.inert = false; });
  sidebar.classList.remove("is-open");
  sidebarBackdrop.classList.remove("is-visible");
  menuButton.setAttribute("aria-expanded", "false");
  sidebar.removeAttribute("role");
  sidebar.removeAttribute("aria-modal");
  if (wasOpen && menuButton.getClientRects().length) menuButton.focus();
}

function renderScreen(id) {
  const screen = screens[id];
  if (!screen || !canViewScreen(id)) {
    showToast("Esta tela não está disponível para o papel desta conta.", "error");
    return;
  }

  if (screenContent.querySelector('[data-login-action][data-action-state="success"]')) {
    showToast("Simulação concluída. Nenhum login foi realizado.");
  }
  screenContent.innerHTML = screen();
  if (id === "register") {
    const inviteToken = new URLSearchParams(window.location.search).get("convite");
    const inviteCode = screenContent.querySelector("#invite-code");
    ["register-email", "invite-code", "register-password", "register-password-confirm"].forEach((inputId) => {
      screenContent.querySelector(`#${inputId}`).required = true;
    });
    if (inviteToken && inviteCode) inviteCode.value = inviteToken;
  }
  if (id === "role-management" && activeRole === "professor") {
    const select = screenContent.querySelector("#delegate-instructor");
    const mode = screenContent.querySelector("#delegate-mode");
    const plan = screenContent.querySelector("#delegate-plan");
    const lesson = select ? delegatedLessons[select.value] : null;
    if (lesson && mode && plan) {
      mode.value = lesson.mode;
      plan.value = lesson.plan;
      plan.disabled = lesson.mode === "free";
    }
  }
  currentTitle.textContent = screenInfo[id].title;
  document.title = `${screenInfo[id].title} | Tatame`;
  document.querySelectorAll("#screen-navigation [data-screen-target], #mobile-navigation [data-screen-target]").forEach((item) => {
    if (item.dataset.screenTarget === id) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateUserPanelProfile() {
  const profile = demoProfiles[activeDemoAccount];
  document.querySelector("#user-panel-profile-academy").textContent =
    profile && profile.academyId === demoAcademy.id ? demoAcademy.name : "Sem academia vinculada";
}

function closeUserPanel(afterClose) {
  if (!userPanel.open || userPanel.classList.contains("is-closing")) return;
  userPanel.classList.add("is-closing");
  const finish = () => {
    userPanel.classList.remove("is-closing");
    userPanel.close();
    if (afterClose) afterClose();
  };
  window.setTimeout(finish, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
}

function parseReceiptMock(file) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isImage && !isPdf) return null;
  return { amount: "150,00", date: "01/11/2026" };
}

function parsePixStatementMock(file) {
  if (!file) return [];
  return [
    { name: "ALUNO FICTÍCIO 01", amount: "R$ 150,00", date: "01/11/2026", match: "Mensalidade · R$ 150,00" },
    { name: "ALUNO FICTÍCIO 02", amount: "R$ 120,00", date: "02/11/2026", match: "Mensalidade · R$ 150,00" }
  ];
}

function updateReceiptComparison() {
  const editor = document.querySelector("#receipt-editor");
  const result = document.querySelector("#receipt-result");
  const amount = document.querySelector("#receipt-amount");
  const date = document.querySelector("#receipt-date");
  if (!editor || !result || !amount || !date) return;
  const parsedAmount = Number(amount.value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
  const isMatch = parsedAmount === 150 && date.value.trim() === "01/11/2026";
  result.className = `receipt-result ${isMatch ? "receipt-result--match" : "receipt-result--different"}`;
  result.textContent = isMatch ? "Confere com a cobrança." : "Diverge.";
}

function runLoadingAction(button, complete) {
  if (button.disabled) return;
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = button.dataset.loadingText || "Processando…";
  window.setTimeout(() => {
    complete();
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }, 900);
}

const actionResetTimers = new WeakMap();

async function runButtonAction(button, { feedback, announcement, buttons, loadingText, loadingMessage, successMessage, errorMessage, afterSuccess, disableAfterSuccess = false }, action) {
  if (button.disabled) return;
  const label = button.querySelector("[data-action-label]");
  if (!label || !feedback || !announcement) {
    recordDiagnostic("Erro ao iniciar uma ação");
    console.error("Não foi possível exibir o estado da ação.");
    showToast("Não foi possível iniciar a ação. Tente novamente.", "error");
    return;
  }
  const originalText = button.dataset.originalLabel || label.textContent;
  button.dataset.originalLabel = originalText;
  window.clearTimeout(actionResetTimers.get(button));
  delete button.dataset.actionState;
  button.removeAttribute("aria-label");
  feedback.textContent = "";
  const disabledStates = buttons.map((item) => item.disabled);
  const hadFocus = document.activeElement === button;
  let succeeded = false;
  buttons.forEach((item) => { item.disabled = true; });
  button.setAttribute("aria-busy", "true");
  label.textContent = loadingText;
  announcement.textContent = loadingMessage;

  try {
    const outcome = await action();
    if (outcome && outcome.errorMessage) {
      recordDiagnostic("Ação não concluída");
      if (button.isConnected) {
        label.textContent = "Tentar de novo";
        button.setAttribute("aria-label", `Tentar de novo: ${originalText}`);
        announcement.textContent = "";
        feedback.textContent = outcome.errorMessage;
      } else {
        showToast(outcome.errorMessage, "error");
      }
    } else if (button.isConnected) {
      succeeded = true;
      button.removeAttribute("aria-busy");
      button.dataset.actionState = "success";
      label.textContent = "✓ Concluído";
      announcement.textContent = successMessage;
      if (afterSuccess) {
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
        if (button.isConnected) afterSuccess();
        else showToast(successMessage);
      } else {
        actionResetTimers.set(button, window.setTimeout(() => {
          delete button.dataset.actionState;
          label.textContent = originalText;
        }, 2500));
      }
    } else {
      showToast(successMessage);
    }
  } catch (error) {
    recordDiagnostic(error instanceof Error && error.message.startsWith("Falha simulada") ? "Erro simulado de ação" : "Erro ao executar uma ação");
    console.error("Falha ao executar a ação:", error);
    if (button.isConnected) {
      label.textContent = "Tentar de novo";
      button.setAttribute("aria-label", `Tentar de novo: ${originalText}`);
      announcement.textContent = "";
      feedback.textContent = errorMessage;
    } else {
      showToast(errorMessage, "error");
    }
  } finally {
    buttons.forEach((item, index) => { item.disabled = item === button && succeeded && disableAfterSuccess ? true : disabledStates[index]; });
    button.removeAttribute("aria-busy");
    if (hadFocus && button.isConnected && document.activeElement === document.body) button.focus();
  }
}

function simulateLogin(button) {
  const card = button.closest(".auth-card");
  if (!card) {
    console.error("Área de entrada não encontrada.");
    showToast("Não foi possível iniciar a ação. Tente novamente.", "error");
    return;
  }
  const feedback = card.querySelector(`#${button.getAttribute("aria-describedby")}`);
  const announcement = card.querySelector("#login-action-status");
  const buttons = [...card.querySelectorAll("[data-login-action]")];
  runButtonAction(button, {
    feedback,
    announcement,
    buttons,
    loadingText: "Entrando...",
    loadingMessage: "Simulando entrada. Nenhuma informação será enviada.",
    successMessage: "Simulação concluída. Nenhum login foi realizado.",
    errorMessage: "Falha na simulação. Tente novamente."
  }, () => new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "entrada") {
        reject(new Error("Falha simulada de entrada."));
      } else {
        resolve();
      }
    }, 900);
  }));
}

function updateToastPosition() {
  const mobileNavigation = document.querySelector("#mobile-navigation");
  if (mobileNavigation) {
    toastRegion.style.setProperty("--mobile-navigation-height", `${mobileNavigation.getBoundingClientRect().height}px`);
  }
}

function showToast(message, tone = "info") {
  updateToastPosition();
  toastRegion.textContent = "";
  toastRegion.setAttribute("role", tone === "error" ? "alert" : "status");
  toastRegion.textContent = message;
  toastRegion.classList.toggle("is-error", tone === "error");
  toastRegion.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastRegion.classList.remove("is-visible");
  }, 2800);
}

function setTheme() {
  const currentTheme = document.body.dataset.theme;
  document.body.dataset.theme = currentTheme === "light" ? "dark" : "light";
  showToast(`Tema ${document.body.dataset.theme === "light" ? "claro" : "escuro"} para visualização.`);
}

renderNavigation();
renderScreen(new URLSearchParams(window.location.search).has("convite") ? "register" : "login");
document.querySelector("#app-version").textContent = APP_VERSION;
document.querySelector("#diagnostics-version").textContent = `Versão do app: ${APP_VERSION}`;
cashPayments.filter((payment) => payment.source === "teacher" && payment.status === "confirmed" && payment.undoUntil > Date.now())
  .forEach(scheduleTeacherCashExpiry);
window.addEventListener("resize", updateToastPosition);
if (window.ResizeObserver) {
  new ResizeObserver(updateToastPosition).observe(document.querySelector("#mobile-navigation"));
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest("#app-version")) {
    versionClicks += 1;
    if (versionClicks >= 7) document.querySelector("#user-diagnostics").hidden = false;
    return;
  }

  const panelAction = target.closest("[data-panel-action]");
  if (panelAction instanceof HTMLButtonElement) {
    const action = panelAction.dataset.panelAction;
    const control = panelAction.closest(".user-panel-action");
    const isUpdate = action === "atualizar";
    runButtonAction(panelAction, {
      feedback: control.querySelector('[role="alert"]'),
      announcement: control.querySelector('[role="status"]'),
      buttons: [panelAction],
      loadingText: isUpdate ? "Verificando..." : "Sincronizando...",
      loadingMessage: isUpdate ? "Verificação simulada em andamento." : "Sincronização simulada em andamento.",
      successMessage: isUpdate ? "Verificação simulada concluída; nenhum download foi realizado." : "Simulação concluída; nenhum dado foi enviado.",
      errorMessage: isUpdate ? "Não foi possível verificar. Tente novamente." : "Não foi possível sincronizar. Tente novamente."
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === `painel-${action}`) {
        throw new Error("Falha simulada de ação do painel.");
      }
    });
    return;
  }

  const studentOption = target.closest("[data-teacher-cash-student-index]");
  if (studentOption) {
    const input = document.querySelector("#teacher-cash-student");
    if (input) chooseTeacherCashStudent(input, Number(studentOption.dataset.teacherCashStudentIndex));
    return;
  }
  const studentOptions = document.querySelector("#teacher-cash-students");
  const studentInput = document.querySelector("#teacher-cash-student");
  if (studentOptions && studentInput && target !== studentInput && !studentOptions.contains(target)) {
    studentOptions.hidden = true;
    studentInput.setAttribute("aria-expanded", "false");
    studentInput.removeAttribute("aria-activedescendant");
  }

  const googleLogin = target.closest('button[data-login-action][type="button"]');
  if (googleLogin instanceof HTMLButtonElement) {
    simulateLogin(googleLogin);
    return;
  }

  if (target.closest("[data-close-sidebar]")) {
    closeMobileMenu();
    return;
  }

  const demoLogin = target.closest("[data-demo-login]");
  if (demoLogin) {
    startDemoRole(demoLogin.dataset.demoLogin);
    return;
  }

  if (target.closest("[data-logout-role]")) {
    if (userPanel.open) closeUserPanel(endDemoRole);
    else endDemoRole();
    return;
  }

  if (target.closest("[data-open-tutorial]")) {
    if (userPanel.open) closeUserPanel(() => openTutorial(activeDemoAccount));
    else openTutorial(activeDemoAccount);
    return;
  }

  if (target.closest("[data-tutorial-skip]")) {
    closeTutorial();
    return;
  }

  if (target.closest("[data-tutorial-back]")) {
    tutorialStepIndex = Math.max(0, tutorialStepIndex - 1);
    renderTutorialStep();
    document.querySelector("[data-tutorial-back]").focus();
    return;
  }

  if (target.closest("[data-tutorial-next]")) {
    const steps = tutorialStepsByRole[demoProfiles[tutorialAccount].role];
    if (tutorialStepIndex >= steps.length - 1) {
      closeTutorial();
    } else {
      tutorialStepIndex += 1;
      renderTutorialStep();
      document.querySelector("[data-tutorial-next]").focus();
    }
    return;
  }

  const screenButton = target.closest("[data-screen-target]");
  if (screenButton) {
    const screenId = screenButton.dataset.screenTarget;
    if (screenButton.hasAttribute("data-roster-index")) {
      const student = demoRoster[Number(screenButton.dataset.rosterIndex)];
      if (!student || activeRole !== "professor" || student.teacherAccount !== activeDemoAccount) {
        showToast("Aluno indisponível. Confira sua turma.", "error");
        return;
      }
      selectedGradeStudent = student;
    }
    if (userPanel.open) closeUserPanel(() => renderScreen(screenId));
    else renderScreen(screenId);
    return;
  }

  if (target.closest("[data-open-user-panel]")) {
    updateUserPanelProfile();
    userPanel.showModal();
    return;
  }

  if (target.closest("[data-close-user-panel]")) {
    closeUserPanel();
    return;
  }

  if (target.closest("[data-open-privacy]")) {
    privacyDialog.showModal();
    return;
  }

  if (target.closest("[data-open-terms]")) {
    termsDialog.showModal();
    return;
  }

  if (target.closest("[data-close-dialog]")) {
    privacyDialog.close();
    termsDialog.close();
    return;
  }

  const tabButton = target.closest("[data-tab]");
  if (tabButton) {
    const activeTab = tabButton.dataset.tab;
    screenContent.querySelectorAll("[data-tab]").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab === tabButton));
    });
    screenContent.querySelectorAll("[data-tab-panel]").forEach((panelElement) => {
      panelElement.hidden = panelElement.dataset.tabPanel !== activeTab;
    });
    return;
  }

  if (target.closest("[data-theme-toggle]")) {
    setTheme();
    return;
  }

  const checkLinkCode = target.closest("[data-check-link-code]");
  if (checkLinkCode instanceof HTMLButtonElement) {
    const input = document.querySelector("#link-code");
    const result = document.querySelector("#link-code-result");
    const preview = document.querySelector("#link-preview");
    const previewDetails = document.querySelector("#link-preview-details");
    const code = input.value.trim().toUpperCase();
    runButtonAction(checkLinkCode, {
      feedback: result,
      announcement: screenContent.querySelector("#link-action-status"),
      buttons: [...screenContent.querySelectorAll("[data-link-action]")],
      loadingText: "Enviando...",
      loadingMessage: "Consultando código.",
      successMessage: "Código consultado. Confira a prévia do vínculo.",
      errorMessage: "Falha na simulação. Tente novamente."
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (["vinculo", "vinculo-consulta"].includes(new URLSearchParams(window.location.search).get("erro-simulado"))) {
        throw new Error("Falha simulada de vínculo.");
      }
      if (!checkLinkCode.isConnected) return { errorMessage: "Consulta cancelada. Tente novamente." };
      const valid = validateTeacherLinkCode(code, result, previewDetails);
      preview.hidden = !valid;
      if (!valid) return { errorMessage: result.textContent };
    });
    return;
  }

  const requestLink = target.closest("[data-request-link]");
  if (requestLink instanceof HTMLButtonElement) {
    const profile = demoProfiles[activeDemoAccount];
    const result = document.querySelector("#link-code-result");
    const preview = document.querySelector("#link-preview-details");
    const input = document.querySelector("#link-code");
    const account = activeDemoAccount;
    const code = input.value.trim().toUpperCase();
    runButtonAction(requestLink, {
      feedback: screenContent.querySelector("#request-link-error"),
      announcement: screenContent.querySelector("#link-action-status"),
      buttons: [...screenContent.querySelectorAll("[data-link-action]")],
      loadingText: "Enviando...",
      loadingMessage: "Enviando pedido de vínculo.",
      successMessage: "Pedido enviado; aguarde a aprovação do Professor.",
      errorMessage: "Falha na simulação. Tente novamente.",
      afterSuccess: () => {
        renderScreen("link-teacher");
        showToast("Pedido enviado; aguarde a aprovação do Professor.");
      }
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (["vinculo", "vinculo-solicitacao"].includes(new URLSearchParams(window.location.search).get("erro-simulado"))) {
        throw new Error("Falha simulada de vínculo.");
      }
      if (!requestLink.isConnected || activeDemoAccount !== account) return { errorMessage: "Pedido cancelado. Tente novamente." };
      if (!profile || !["student", "student-unregistered"].includes(activeRole) ||
          !validateTeacherLinkCode(code, result, preview)) {
        if (result && profile && !["student", "student-unregistered"].includes(activeRole)) {
          result.textContent = "Não foi possível validar este código. Confira e tente novamente.";
        }
        return { errorMessage: result.textContent || "Não foi possível solicitar o vínculo. Tente novamente." };
      }
      updateDemoData(() => linkRequests.push({
        id: `link-${Date.now()}`,
        account: activeDemoAccount,
        studentName: profile.name,
        professorAccount: currentTeacherLinkPreview,
        status: "pending"
      }), [[demoDataKeys.links, saveLinkRequests]]);
    });
    return;
  }

  const cancelLink = target.closest("[data-cancel-link]");
  if (cancelLink instanceof HTMLButtonElement && cancelLink.hasAttribute("data-link-action")) {
    const request = currentLinkRequest();
    runButtonAction(cancelLink, {
      feedback: screenContent.querySelector("#cancel-link-error"),
      announcement: screenContent.querySelector("#link-action-status"),
      buttons: [cancelLink],
      loadingText: "Enviando...",
      loadingMessage: "Cancelando pedido de vínculo.",
      successMessage: "Pedido de vínculo cancelado.",
      errorMessage: "Falha na simulação. Tente novamente.",
      afterSuccess: () => {
        renderScreen("link-teacher");
        showToast("Pedido de vínculo cancelado.");
      }
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (["vinculo", "vinculo-cancelamento"].includes(new URLSearchParams(window.location.search).get("erro-simulado"))) {
        throw new Error("Falha simulada de vínculo.");
      }
      if (!cancelLink.isConnected || currentLinkRequest() !== request) return { errorMessage: "Não foi possível cancelar o pedido. Tente novamente." };
      if (request) updateDemoData(() => { request.status = "cancelled"; }, [[demoDataKeys.links, saveLinkRequests]]);
    });
    return;
  }

  if (cancelLink) {
    const request = currentLinkRequest();
    if (request) updateDemoData(() => { request.status = "cancelled"; }, [[demoDataKeys.links, saveLinkRequests]]);
    renderScreen(currentTitle.textContent === "Meu vínculo" ? "student-link" : "link-teacher");
    showToast("Pedido de vínculo cancelado.");
    return;
  }

  const linkDecision = target.closest("[data-link-decision]");
  if (linkDecision) {
    const request = linkRequests.find((item) => item.id === linkDecision.dataset.requestId);
    if (!request || activeRole !== "professor" || request.professorAccount !== activeDemoAccount) {
      showToast("Este pedido não está disponível para sua conta.", "error");
      return;
    }
    updateDemoData(() => {
      request.status = linkDecision.dataset.linkDecision === "approve" ? "approved" : "rejected";
      if (request.status === "approved") {
        const studentProfile = demoProfiles[request.account];
        studentProfile.teacherAccount = activeDemoAccount;
        studentProfile.academyId = demoProfiles[activeDemoAccount].academyId;
        if (request.account === "student-unregistered") {
          studentProfile.role = "student";
          studentProfile.label = "Aluno registrado";
          studentProfile.start = "student-home";
        }
        const rosterStudent = demoRoster.find((student) => student.account === request.account);
        if (rosterStudent) {
          rosterStudent.teacherAccount = activeDemoAccount;
        } else {
          demoRoster.push({
            account: request.account,
            name: studentProfile.name,
            grade: studentProfile.grade,
            teacherAccount: activeDemoAccount
          });
        }
      }
    }, [[demoDataKeys.links, saveLinkRequests], [demoDataKeys.profiles, saveDemoProfiles], [demoDataKeys.roster, saveDemoRoster]]);
    renderScreen("teacher-code");
    showToast(request.status === "approved" ? "Vínculo aprovado." : "Pedido de vínculo recusado.");
    return;
  }

  if (target.closest("[data-change-teacher-code]")) {
    if (activeRole !== "professor" || !demoProfiles[activeDemoAccount].academyId) {
      showToast("Não foi possível trocar o código.", "error");
      return;
    }
    teacherLinkCodes.set(activeDemoAccount, createUniqueTeacherLinkCode(activeDemoAccount));
    renderScreen("teacher-code");
    showToast("Código de vínculo trocado.");
    return;
  }

  const roleTransition = target.closest("[data-role-transition]");
  if (roleTransition) {
    const account = roleTransition.dataset.account;
    const profile = demoProfiles[account];
    const targetRole = roleTransition.dataset.roleTransition;
    const allowed = targetRole === "professor"
      ? activeRole === "adm"
      : activeRole === "professor" && profile &&
        demoRoster.some((student) => student.account === account && student.teacherAccount === activeDemoAccount);
    if (!allowed) {
      showToast("Esta alteração de papel não está autorizada para sua conta.", "error");
      return;
    }
    const record = roleTransition.closest("[data-role-record]");
    const currentRole = record.querySelector("[data-current-role]");
    const previousRole = currentRole.textContent;
    const nextRole = targetRole === "professor" ? "Professor" : "Instrutor";
    updateDemoData(() => {
      profile.role = targetRole;
      profile.label = nextRole;
      profile.start = targetRole === "professor" ? "teacher-home" : "instructor-class";
      profile.academyId = targetRole === "instructor" ? demoProfiles[activeDemoAccount].academyId : null;
      profile.teacherAccount = targetRole === "instructor" ? activeDemoAccount : null;
      if (targetRole === "professor") authorizedInstructorNames.delete(profile.name);
      const rosterRecord = demoRoster.find((student) => student.account === account);
      if (rosterRecord && targetRole === "professor") rosterRecord.teacherAccount = null;
    }, [[demoDataKeys.profiles, saveDemoProfiles], [demoDataKeys.roster, saveDemoRoster]]);
    currentRole.textContent = nextRole;
    roleTransition.disabled = true;
    roleTransition.textContent = "Papel atualizado";
    const accountName = record.querySelector("strong").textContent;
    const historyText = `${accountName}: ${previousRole} → ${nextRole} · histórico mantido (simulação).`;
    simulatedRoleHistory.unshift(historyText);
    const history = document.querySelector("#role-history");
    const item = document.createElement("li");
    item.textContent = historyText;
    history.prepend(item);
    showToast("Papel atualizado; a próxima entrada usará a nova tela e as novas funcionalidades.");
    return;
  }

  if (target.closest("[data-bind-professor-academy]")) {
    if (activeRole !== "adm") {
      showToast("Somente o Adm pode vincular um Professor à academia.", "error");
      return;
    }
    const professorAccount = target.closest("[data-bind-professor-academy]").dataset.bindProfessorAcademy;
    const professor = demoProfiles[professorAccount];
    if (!professor || professor.role !== "professor") {
      showToast("Não foi possível vincular esta conta.", "error");
      return;
    }
    updateDemoData(() => {
      professor.academyId = demoAcademy.id;
      Object.values(demoProfiles).forEach((profile) => {
        if (profile.teacherAccount === professorAccount) profile.academyId = demoAcademy.id;
      });
    }, [[demoDataKeys.profiles, saveDemoProfiles]]);
    renderScreen("role-management");
    showToast("Professor vinculado à Academia Fictícia.");
    return;
  }

  const authorizeInstructor = target.closest("[data-authorize-instructor]");
  if (authorizeInstructor) {
    const instructorName = authorizeInstructor.dataset.authorizeInstructor;
    const instructorProfile = Object.values(demoProfiles).find((profile) => profile.name === instructorName);
    const ownsInstructor = instructorProfile && instructorProfile.teacherAccount === activeDemoAccount &&
      demoRoster.some((student) => student.account && student.account in demoProfiles &&
        demoProfiles[student.account] === instructorProfile && student.teacherAccount === activeDemoAccount);
    if (!instructorProfile || !["adm", "professor"].includes(activeRole) ||
        (activeRole === "professor" && !ownsInstructor)) {
      showToast("Esta autorização não está disponível para sua conta.", "error");
      return;
    }
    authorizedInstructorNames.add(instructorName);
    renderScreen("role-management");
    showToast("Instrutor autorizado nesta demonstração.");
    return;
  }

  if (target.closest("[data-delegate-class]")) {
    const select = screenContent.querySelector("#delegate-instructor");
    const mode = screenContent.querySelector("#delegate-mode");
    const plan = screenContent.querySelector("#delegate-plan");
    const instructorProfile = select
      ? Object.values(demoProfiles).find((profile) => profile.name === select.value && profile.role === "instructor")
      : null;
    if (activeRole !== "professor" || !select || !select.value || !mode || !plan ||
        !instructorProfile || instructorProfile.teacherAccount !== activeDemoAccount ||
        !authorizedInstructorNames.has(instructorProfile.name)) {
      showToast("Não foi possível delegar esta aula.", "error");
      return;
    }
    if (mode.value === "plan" && !plan.value.trim()) {
      showToast("Informe o plano que você decidiu compartilhar.", "error");
      plan.focus();
      return;
    }
    delegatedLessons[select.value] = {
      mode: mode.value,
      plan: mode.value === "plan" ? plan.value.trim() : "",
      teacherAccount: activeDemoAccount
    };
    showToast(mode.value === "free" ? "Aula delegada como treino livre." : "Plano decidido por você e aula delegada.");
    return;
  }

  const classFollowed = target.closest("[data-class-followed]");
  if (classFollowed) {
    const profile = demoProfiles[activeDemoAccount];
    const lesson = profile && delegatedLessons[profile.name];
    if (activeRole !== "instructor" || !profile || !authorizedInstructorNames.has(profile.name) || !lesson) {
      showToast("Não há aula autorizada para registrar.", "error");
      return;
    }
    lesson.followed = classFollowed.dataset.classFollowed;
    screenContent.querySelectorAll("[data-class-followed]").forEach((button) => {
      button.disabled = true;
    });
    screenContent.querySelector("#class-follow-result").textContent =
      `Registro: ${lesson.followed === "yes" ? "Segui" : "Não segui"}.`;
    showToast("Registro da aula atualizado.");
    return;
  }

  if (target.closest("[data-toggle-grade]")) {
    if (activeRole !== "professor" || !demoProfiles[activeDemoAccount].academyId) {
      showToast("Somente o Professor vinculado à academia pode publicar a grade.", "error");
      return;
    }
    const isPublished = publishedAcademyGrades.has(activeDemoAccount);
    if (isPublished) publishedAcademyGrades.delete(activeDemoAccount);
    else publishedAcademyGrades.add(activeDemoAccount);
    renderScreen("academy");
    showToast(isPublished ? "Grade voltou para rascunho." : "Grade publicada para usuários vinculados.");
    return;
  }

  const cashCorrection = target.closest("[data-teacher-cash-correction]");
  if (cashCorrection) {
    const row = cashCorrection.closest("[data-teacher-cash-entry]");
    const payment = cashPayments.find((item) => item.id === cashCorrection.dataset.cashId && item.source === "teacher");
    const isUndo = cashCorrection.dataset.teacherCashCorrection === "undo";
    const requestedAt = Date.now();
    const hadFocus = document.activeElement === cashCorrection;
    const successMessage = isUndo ? "Lançamento desfeito e mantido no histórico." : "Lançamento estornado e mantido no histórico.";
    runButtonAction(cashCorrection, {
      feedback: cashCorrection.parentElement.querySelector('[role="alert"]'),
      announcement: row.querySelector('[role="status"]'),
      buttons: Array.from(screenContent.querySelectorAll("[data-professor-payment-action]")),
      loadingText: "Salvando...",
      loadingMessage: "Registrando correção.",
      successMessage,
      errorMessage: "Não foi possível corrigir. Tente novamente.",
      afterSuccess: () => {
        refreshTeacherCashHistory();
        const updatedRow = document.querySelector(`[data-teacher-cash-entry="${payment.id}"]`);
        if (hadFocus && updatedRow) updatedRow.focus();
      }
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === `professor-pagamento-dinheiro-${isUndo ? "desfazer" : "estornar"}`) {
        throw new Error("Falha simulada de correção de pagamento.");
      }
      if (!payment || activeRole !== "professor" || payment.professorAccount !== activeDemoAccount || payment.status !== "confirmed") {
        return { errorMessage: "Lançamento indisponível. Confira sua conta." };
      }
      if (isUndo && requestedAt >= payment.undoUntil) {
        return { errorMessage: "Prazo encerrado. Use Estornar." };
      }
      if (!isUndo && requestedAt < payment.undoUntil) {
        return { errorMessage: "O prazo ainda está aberto. Use Desfazer." };
      }
      updateDemoPayments(() => { payment.status = isUndo ? "undone" : "reversed"; });
      if (!cashCorrection.isConnected) refreshTeacherCashHistory();
      showToast(successMessage);
    });
    return;
  }

  const paymentAction = target.closest("button[data-professor-payment-action]");
  if (paymentAction && paymentAction.type === "button" && paymentAction.closest(".payment-review-row")) {
    const row = paymentAction.closest(".payment-review-row");
    const action = paymentAction.dataset.professorPaymentAction;
    const isReceiptDecision = paymentAction.hasAttribute("data-confirm-payment") || paymentAction.hasAttribute("data-reject-payment");
    const isCashDecision = paymentAction.hasAttribute("data-cash-decision");
    const successMessage = isReceiptDecision
      ? (paymentAction.hasAttribute("data-confirm-payment") ? "Pagamento confirmado; somente valor e data ficam no histórico." : "Aviso recusado nesta demonstração.")
      : isCashDecision
        ? (paymentAction.dataset.cashDecision === "confirm" ? "Recebimento confirmado; valor e data ficaram no histórico." : "Aviso em dinheiro recusado.")
        : "Demonstração visual: nada foi gravado ou enviado.";
    runButtonAction(paymentAction, {
      feedback: paymentAction.parentElement.querySelector('[role="alert"]'),
      announcement: row.querySelector('[role="status"]'),
      buttons: Array.from(screenContent.querySelectorAll("[data-professor-payment-action]")),
      loadingText: "Salvando...",
      loadingMessage: "Processando ação de pagamento.",
      successMessage,
      errorMessage: "Não foi possível concluir. Tente novamente.",
      afterSuccess: isReceiptDecision || isCashDecision ? () => {
        renderScreen("payment-review");
        showToast(successMessage);
      } : undefined
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === `professor-pagamento-${action}`) {
        throw new Error("Falha simulada de pagamento do Professor.");
      }
      if (isReceiptDecision) {
        const receipt = receiptPayments.find((payment) => payment.id === row.dataset.receiptId);
        if (!receipt || receipt.status !== "pending" || activeRole !== "professor" || receipt.professorAccount !== activeDemoAccount) {
          return { errorMessage: "Comprovante indisponível. Confira sua conta." };
        }
        updateDemoPayments(() => {
          receipt.status = paymentAction.hasAttribute("data-confirm-payment") ? "confirmed" : "rejected";
          receipt.file = null;
        });
        if (receipt.fileInput) receipt.fileInput.value = "";
      } else if (isCashDecision) {
        const payment = cashPayments.find((item) => item.id === paymentAction.dataset.cashId && item.status === "pending");
        if (!payment || activeRole !== "professor" || payment.professorAccount !== activeDemoAccount) {
          return { errorMessage: "Aviso indisponível. Confira sua conta." };
        }
        updateDemoPayments(() => {
          payment.status = paymentAction.dataset.cashDecision === "confirm" ? "confirmed" : "rejected";
        });
      } else {
        showToast(successMessage);
      }
    });
    return;
  }

  const pixAction = target.closest("[data-confirm-pix], [data-review-pix]");
  if (pixAction) {
    const confirmed = pixAction.hasAttribute("data-confirm-pix");
    const message = confirmed ? "Correspondência confirmada pelo professor; nenhum pagamento foi processado." : "Confira manualmente a sugestão antes de confirmar.";
    runButtonAction(pixAction, {
      feedback: pixAction.parentElement.querySelector('[role="alert"]'),
      announcement: pixAction.closest("[data-pix-match]").querySelector('[role="status"]'),
      buttons: Array.from(screenContent.querySelectorAll("[data-professor-payment-action]")),
      loadingText: "Salvando...",
      loadingMessage: "Processando sugestão.",
      successMessage: message,
      errorMessage: "Não foi possível concluir. Tente novamente.",
      disableAfterSuccess: confirmed,
      afterSuccess: confirmed ? () => { pixAction.querySelector("[data-action-label]").textContent = "Correspondência confirmada"; } : undefined
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === `professor-pagamento-${pixAction.dataset.professorPaymentAction}`) {
        throw new Error("Falha simulada de sugestão Pix.");
      }
      showToast(message);
    });
    return;
  }

  const cashNotice = target.closest("[data-cash-notice]");
  if (cashNotice) {
    const profile = demoProfiles[activeDemoAccount];
    const amountInput = document.querySelector("#cash-amount");
    const dateInput = document.querySelector("#cash-date");
    const amountValue = Number(amountInput.value);
    let validationMessage = "";
    if (!profile || activeRole !== "student" || !profile.teacherAccount || !profile.academyId) {
      validationMessage = "Não foi possível enviar o aviso. Confira o vínculo com seu Professor.";
    } else if (!Number.isFinite(amountValue) || amountValue <= 0 || !dateInput.value) {
      validationMessage = "Informe um valor e uma data válidos.";
    } else if (cashPayments.some((payment) => payment.account === activeDemoAccount && payment.status === "pending")) {
      validationMessage = "Já existe um aviso em dinheiro aguardando confirmação.";
    }
    const result = document.querySelector("#cash-notice-result");
    const completeCashNotice = () => {
      updateDemoPayments(() => cashPayments.push({
        id: `cash-${Date.now()}`,
        account: activeDemoAccount,
        studentName: profile.name,
        professorAccount: profile.teacherAccount,
        amount: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountValue),
        date: dateInput.value,
        source: "student",
        status: "pending"
      }));
      result.textContent = "Pagamento em dinheiro lançado e PENDENTE até a confirmação do Professor.";
      if (cashNotice.isConnected) showToast("Aviso de pagamento em dinheiro ficou pendente.");
    };
    if (cashNotice instanceof HTMLButtonElement && cashNotice.hasAttribute("data-student-action")) {
      runButtonAction(cashNotice, {
        feedback: document.querySelector("#student-cash-error"),
        announcement: document.querySelector("#student-payment-status"),
        buttons: [cashNotice],
        loadingText: "Enviando...",
        loadingMessage: "Enviando aviso de pagamento.",
        successMessage: "Aviso de pagamento em dinheiro ficou pendente.",
        errorMessage: "Não foi possível enviar o aviso. Tente novamente."
      }, async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        if (new URLSearchParams(window.location.search).get("erro-simulado") === "aluno-dinheiro") {
          throw new Error("Falha simulada de aviso em dinheiro.");
        }
        if (validationMessage) return { errorMessage: validationMessage };
        completeCashNotice();
      });
      return;
    }
    if (validationMessage) {
      showToast(validationMessage, "error");
      return;
    }
    runLoadingAction(cashNotice, completeCashNotice);
    return;
  }

  const sendReceipt = target.closest("[data-send-receipt]");
  if (sendReceipt) {
    const fileInput = document.querySelector("[data-receipt-file]");
    const profile = demoProfiles[activeDemoAccount];
    const amountInput = document.querySelector("#receipt-amount");
    const dateInput = document.querySelector("#receipt-date");
    let validationMessage = "";
    if (receiptPayments.some((payment) => payment.account === activeDemoAccount)) {
      document.querySelector("#duplicate-receipt-warning").hidden = false;
      validationMessage = "Comprovante já enviado para esta cobrança fictícia.";
    } else if (!profile || activeRole !== "student" || !profile.teacherAccount || !profile.academyId) {
      validationMessage = "Não foi possível enviar o comprovante. Confira seu vínculo com o Professor.";
    } else if (!fileInput.files.length || !amountInput.value.trim() || !dateInput.value.trim()) {
      validationMessage = "Escolha uma imagem ou PDF fictício antes de enviar.";
    }
    const saveReceipt = () => {
      updateDemoPayments(() => receiptPayments.push({
        id: `receipt-${Date.now()}`,
        account: activeDemoAccount,
        studentName: profile.name,
        professorAccount: profile.teacherAccount,
        amount: amountInput.value.trim(),
        date: dateInput.value.trim(),
        file: fileInput.files[0],
        fileInput,
        status: "pending"
      }));
    };
    const showReceiptResult = () => {
      renderScreen("student-payments");
      showToast("Comprovante enviado para conferência.");
    };
    if (sendReceipt instanceof HTMLButtonElement && sendReceipt.hasAttribute("data-student-action")) {
      runButtonAction(sendReceipt, {
        feedback: document.querySelector("#student-receipt-error"),
        announcement: document.querySelector("#student-payment-status"),
        buttons: [sendReceipt],
        loadingText: "Enviando...",
        loadingMessage: "Enviando comprovante.",
        successMessage: "Comprovante enviado para conferência.",
        errorMessage: "Não foi possível enviar o comprovante. Tente novamente.",
        afterSuccess: showReceiptResult
      }, async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        if (new URLSearchParams(window.location.search).get("erro-simulado") === "aluno-comprovante") {
          throw new Error("Falha simulada de envio do comprovante.");
        }
        if (validationMessage) return { errorMessage: validationMessage };
        saveReceipt();
      });
      return;
    }
    if (validationMessage) {
      showToast(validationMessage, "error");
      return;
    }
    runLoadingAction(sendReceipt, () => {
      saveReceipt();
      showReceiptResult();
    });
    return;
  }

  const demoAction = target.closest("[data-demo-action]");
  if (demoAction) {
    if (demoAction instanceof HTMLButtonElement && demoAction.dataset.loadingText) {
      if (demoAction.disabled) return;
      const originalText = demoAction.textContent;
      demoAction.disabled = true;
      demoAction.textContent = demoAction.dataset.loadingText;
      window.setTimeout(() => {
        demoAction.disabled = false;
        demoAction.textContent = originalText;
        showToast("Demonstração visual: nada foi gravado ou enviado.");
      }, 1200);
    } else {
      showToast("Demonstração visual: nada foi gravado ou enviado.");
    }
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === "grade-belt") {
    const form = target.closest("[data-register-student-grade]");
    const degrees = form.querySelector("#grade-degree");
    const index = demoBelts.indexOf(target.value);
    const available = selectedGradeStudent
      ? beltDegrees(index).filter((degree) => isHigherGrade(selectedGradeStudent.grade, index, degree))
      : [];
    degrees.innerHTML = `<option value="">Selecione</option>${available.map((degree) => `<option value="${degree}">${degree} ${degree === 1 ? "grau" : "graus"}</option>`).join("")}`;
    degrees.disabled = available.length === 0;
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "student-belt") {
    const degrees = target.form.querySelector("#student-degree");
    const available = beltDegrees(demoBelts.indexOf(target.value));
    degrees.innerHTML = `<option value="">Selecione</option>${available.map((degree) => `<option value="${degree}">${degree} ${degree === 1 ? "grau" : "graus"}</option>`).join("")}`;
    degrees.disabled = available.length === 0;
    return;
  }
  if (!(target instanceof HTMLInputElement)) return;

  if (target.matches("[data-receipt-file]") && target.files.length) {
    const parsed = parseReceiptMock(target.files[0]);
    if (!parsed) {
      target.value = "";
      showToast("O comprovante deve ser uma imagem ou PDF.", "error");
      return;
    }
    document.querySelector("#receipt-editor").hidden = false;
    document.querySelector("#receipt-amount").value = `R$ ${parsed.amount}`;
    document.querySelector("#receipt-date").value = parsed.date;
    updateReceiptComparison();
  }

  if (target.matches("[data-pix-file]") && target.files.length) {
    const suggestions = parsePixStatementMock(target.files[0]);
    document.querySelector("#pix-suggestions").hidden = suggestions.length === 0;
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.id !== "teacher-cash-student") return;
  delete target.dataset.selectedStudent;
  document.querySelector("#teacher-cash-selection").textContent = "";
  updateTeacherCashOptions(target);
});

document.addEventListener("focusin", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.id === "teacher-cash-student" && !target.dataset.selectedStudent) {
    updateTeacherCashOptions(target);
  }
});

document.addEventListener("keydown", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.id !== "teacher-cash-student") return;
  const list = document.querySelector("#teacher-cash-students");
  if (event.key === "Escape") {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
  if (list.hidden && event.key !== "Enter") updateTeacherCashOptions(input);
  const options = Array.from(list.querySelectorAll('[role="option"]'));
  const current = options.findIndex((option) => option.id === input.getAttribute("aria-activedescendant"));
  if (event.key === "Enter") {
    if (current >= 0 && !list.hidden) {
      event.preventDefault();
      chooseTeacherCashStudent(input, Number(options[current].dataset.teacherCashStudentIndex));
    }
    return;
  }
  if (!options.length) return;
  event.preventDefault();
  const next = event.key === "ArrowDown" ? (current + 1) % options.length : (current <= 0 ? options.length - 1 : current - 1);
  options.forEach((option, index) => option.setAttribute("aria-selected", String(index === next)));
  input.setAttribute("aria-activedescendant", options[next].id);
  options[next].scrollIntoView({ block: "nearest" });
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === "grade-student") {
    const student = demoRoster[Number(target.value)];
    if (!student || activeRole !== "professor" || student.teacherAccount !== activeDemoAccount) {
      showToast("Aluno indisponível. Confira sua turma.", "error");
      return;
    }
    selectedGradeStudent = student;
    renderScreen("student-detail");
    screenContent.querySelector('[data-tab="grades"]').click();
    screenContent.querySelector("#grade-student").focus();
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "invite-link-type") {
    const recipient = screenContent.querySelector("#invite-link-recipient");
    if (recipient) recipient.innerHTML = renderDemoInviteRecipients(target.value);
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "delegate-mode") {
    const plan = screenContent.querySelector("#delegate-plan");
    if (plan) {
      plan.disabled = target.value === "free";
      if (plan.disabled) plan.value = "";
    }
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && ["receipt-amount", "receipt-date"].includes(target.id)) {
    updateReceiptComparison();
  }
  if (target instanceof HTMLInputElement && target.id === "link-code") {
    target.value = target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  }
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-accept-instructor-invite]")) return;
  event.preventDefault();
  const form = event.target;
  const result = form.querySelector("#invite-validation-result");
  const codeValue = form.querySelector("#instructor-code").value.trim();
  let token = codeValue;
  const queryString = codeValue.includes("?") ? codeValue.split("?")[1].split("#")[0] : "";
  const tokenFromUrl = new URLSearchParams(queryString).get("convite");
  if (tokenFromUrl) token = tokenFromUrl;
  const invite = demoInvites.find((item) => item.token === token && item.type === "instructor");
  if (!invite || invite.used || invite.expiresAt <= Date.now() || invite.academyId !== demoAcademy.id ||
      demoProfiles.instructor.role !== "instructor") {
    result.textContent = "Não foi possível validar este convite. Confira o link e tente novamente.";
    return;
  }
  const submitButton = form.querySelector('button[type="submit"][data-loading-text]');
  runLoadingAction(submitButton, () => {
    updateDemoData(() => {
      invite.used = true;
      demoProfiles.instructor.teacherAccount = invite.professorAccount;
      demoProfiles.instructor.academyId = invite.academyId;
    }, [[demoDataKeys.invites, saveDemoInvites], [demoDataKeys.profiles, saveDemoProfiles]]);
    result.textContent = "Convite validado para Instrutor. O acesso depende da autorização do Professor.";
    form.querySelector("#instructor-code").value = "";
    showToast("Convite de Instrutor validado.");
  });
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-create-invite]")) return;
  event.preventDefault();
  const form = event.target;
  const type = form.querySelector("#invite-link-type").value;
  const recipientId = form.querySelector("#invite-link-recipient").value;
  const professor = demoProfiles[activeDemoAccount];
  if (activeRole !== "professor" || !professor || !professor.academyId) {
    showToast("Não foi possível gerar o link. O Professor precisa estar vinculado a uma academia.", "error");
    return;
  }
  if (!demoInviteRecipients.some((recipient) => recipient.id === recipientId && recipient.type === type)) {
    showToast("Selecione uma pessoa pré-cadastrada válida.", "error");
    return;
  }
  const submitButton = form.querySelector('button[type="submit"][data-loading-text]');
  runLoadingAction(submitButton, () => {
    const token = createDemoInvite(type, recipientId);
    if (!token) {
      showToast("Não foi possível gerar o link para esta pessoa.", "error");
      return;
    }
    document.querySelector("#invite-result").innerHTML = renderDemoInvites();
    showToast("Link único gerado. Ele expira em três dias.");
  });
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-accept-demo-invite]")) return;
  event.preventDefault();
  const form = event.target;
  const result = form.querySelector("#invite-validation-result");
  const submitButton = form.querySelector("[data-register-action]");
  const email = form.querySelector("#register-email").value.trim();
  const token = form.querySelector("#invite-code").value.trim();
  const password = form.querySelector("#register-password").value;
  const passwordConfirmation = form.querySelector("#register-password-confirm").value;
  const invite = demoInvites.find((item) => item.token === token);
  const recipient = invite && demoInviteRecipients.find((item) => item.id === invite.recipientId && item.type === invite.type);
  const rosterStudent = invite && invite.type === "student"
    ? demoRoster.find((student) => student.name === invite.recipientName && !student.account)
    : null;
  const isAvailable = invite && !invite.used && invite.expiresAt > Date.now() && recipient &&
    demoProfiles[invite.professorAccount] && invite.academyId === demoAcademy.id;
  result.textContent = "";
  runButtonAction(submitButton, {
    feedback: form.querySelector("#register-action-error"),
    announcement: form.querySelector("#register-action-status"),
    buttons: [submitButton],
    loadingText: "Enviando...",
    loadingMessage: "Validando convite.",
    successMessage: "Convite validado; a conta fictícia foi preparada.",
    errorMessage: "Falha na simulação. Tente novamente."
  }, async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    if (new URLSearchParams(window.location.search).get("erro-simulado") === "cadastro") {
      throw new Error("Falha simulada de cadastro.");
    }
    if (!email || !token || !password || password !== passwordConfirmation) {
      return { errorMessage: password && password !== passwordConfirmation
        ? "As senhas não conferem."
        : "Preencha e-mail, convite e senha." };
    }
    if (!isAvailable || (invite.type === "student" && !rosterStudent) ||
        (invite.type === "instructor" && demoProfiles.instructor.role !== "instructor")) {
      return { errorMessage: "Não foi possível validar este convite. Confira o link e tente novamente." };
    }
    updateDemoData(() => {
      if (invite.type === "instructor") {
        demoProfiles.instructor.teacherAccount = invite.professorAccount;
        demoProfiles.instructor.academyId = demoProfiles[invite.professorAccount].academyId;
      } else {
        const account = `pre-registered-${invite.recipientId}`;
        demoProfiles[account] = {
          role: "student",
          label: "Aluno registrado",
          name: invite.recipientName,
          start: "student-home",
          teacherAccount: invite.professorAccount,
          academyId: invite.academyId,
          grade: rosterStudent.grade,
          gradeHistory: ["Graduação fictícia preservada"]
        };
        rosterStudent.account = account;
        rosterStudent.teacherAccount = invite.professorAccount;
      }
      invite.used = true;
      if (invite.type === "instructor") demoProfiles.instructor.academyId = invite.academyId;
    }, [[demoDataKeys.invites, saveDemoInvites], [demoDataKeys.profiles, saveDemoProfiles], [demoDataKeys.roster, saveDemoRoster], [demoDataKeys.grades, saveDemoGradeHistory]]);
    result.textContent = `Convite validado para ${recipient.name}. Conta preparada nesta demonstração; nenhum dado foi enviado.`;
    form.querySelector("#register-email").value = "";
    form.querySelector("#invite-code").value = "";
    form.querySelector("#register-password").value = "";
    form.querySelector("#register-password-confirm").value = "";
    showToast("Convite validado; a conta fictícia foi preparada.");
  });
});

document.addEventListener("reset", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-create-demo-student]")) return;
  const degree = event.target.querySelector("#student-degree");
  degree.innerHTML = '<option value="">Selecione a faixa</option>';
  degree.disabled = true;
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-create-demo-student]")) return;
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector("[data-student-create-action]");
  if (button.disabled) return;
  const account = activeDemoAccount;
  const name = form.querySelector("#student-name").value.trim();
  const belt = form.querySelector("#student-belt").value;
  const value = form.querySelector("#student-degree").value;
  const degree = value === "" ? -1 : Number(value);
  const valid = activeRole === "professor" && Boolean(demoProfiles[account]) && name &&
    beltDegrees(demoBelts.indexOf(belt)).includes(degree);
  runButtonAction(button, {
    feedback: button.parentElement.querySelector('[role="alert"]'),
    announcement: form.querySelector('[role="status"]'),
    buttons: Array.from(form.querySelectorAll("button, input, select")),
    loadingText: "Salvando...",
    loadingMessage: "Cadastrando aluno fictício.",
    successMessage: "Aluno fictício cadastrado neste navegador, sem login.",
    errorMessage: "Não foi possível cadastrar. Tente novamente.",
    afterSuccess: () => {
      renderScreen("student-create");
      showToast("Aluno fictício cadastrado neste navegador, sem login.");
    }
  }, async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    if (new URLSearchParams(window.location.search).get("erro-simulado") === "professor-cadastro-aluno") {
      throw new Error("Falha simulada de cadastro.");
    }
    if (!valid || !button.isConnected || activeRole !== "professor" || activeDemoAccount !== account) {
      return { errorMessage: "Confira o nome fictício, a faixa e o grau." };
    }
    updateDemoData(() => {
      demoRoster.push({ account: null, name, grade: gradeLabel(belt, degree), teacherAccount: account, demoCreated: true });
    }, [[demoDataKeys.roster, saveDemoRoster]]);
  });
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-register-student-grade]")) return;
  event.preventDefault();
  const form = event.target;
  const student = selectedGradeStudent;
  const professorAccount = activeDemoAccount;
  const professor = demoProfiles[professorAccount];
  const belt = form.querySelector("#grade-belt").value;
  const degreeValue = form.querySelector("#grade-degree").value;
  const degree = degreeValue === "" ? -1 : Number(degreeValue);
  const date = form.querySelector("#grade-date").value;
  const submitButton = form.querySelector("[data-grade-action]");
  if (submitButton.disabled) return;
  const requestedIndex = demoBelts.indexOf(belt);
  const valid = activeRole === "professor" && professor && student && student.teacherAccount === professorAccount &&
    isHigherGrade(student.grade, requestedIndex, degree) && date;
  if (valid && !window.confirm(`Graduar ${student.name} para ${gradeLabel(belt, degree)} em ${formatDemoDate(date)}?`)) return;
  runButtonAction(submitButton, {
    feedback: submitButton.parentElement.querySelector('[role="alert"]'),
    announcement: form.querySelector('[role="status"]'),
    buttons: [submitButton, form.querySelector("#grade-belt"), form.querySelector("#grade-degree"), form.querySelector("#grade-date"), screenContent.querySelector("#grade-student")],
    loadingText: "Salvando...",
    loadingMessage: "Registrando graduação.",
    successMessage: "Graduação registrada no histórico.",
    errorMessage: "Não foi possível registrar. Tente novamente.",
    afterSuccess: () => {
      renderScreen("student-detail");
      screenContent.querySelector('[data-tab="grades"]').click();
    }
  }, async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    if (new URLSearchParams(window.location.search).get("erro-simulado") === "professor-graduacao") {
      throw new Error("Falha simulada de graduação.");
    }
    if (!valid || !submitButton.isConnected || activeRole !== "professor" || activeDemoAccount !== professorAccount ||
        !demoRoster.includes(student) || selectedGradeStudent !== student || student.teacherAccount !== professorAccount ||
        !isHigherGrade(student.grade, requestedIndex, degree)) {
      return { errorMessage: "Confira o aluno, a graduação superior e a data." };
    }
    updateDemoData(() => {
      const history = demoGradeHistory.get(student) || [];
      history.push({ belt, degree, date, professor: professor.name });
      demoGradeHistory.set(student, history);
      student.grade = gradeLabel(belt, degree);
      if (student.account && demoProfiles[student.account]) demoProfiles[student.account].grade = student.grade;
    }, [[demoDataKeys.grades, saveDemoGradeHistory], [demoDataKeys.roster, saveDemoRoster], [demoDataKeys.profiles, saveDemoProfiles]]);
    showToast("Graduação registrada no histórico.");
  });
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-register-teacher-cash]")) return;
  event.preventDefault();
  const form = event.target;
  const studentField = form.querySelector("#teacher-cash-student");
  const studentInput = studentField.value;
  const amountValue = Number(form.querySelector("#teacher-cash-amount").value);
  const dateValue = form.querySelector("#teacher-cash-date").value;
  const typeValue = form.querySelector("#teacher-cash-type").value.trim();
  const referenceValue = form.querySelector("#teacher-cash-reference").value.trim();
  const search = normalizeTeacherCashSearch(studentInput);
  const students = demoRoster.filter((item) => item.teacherAccount === activeDemoAccount &&
    [item.name, teacherCashStudentLabel(item)].some((value) => normalizeTeacherCashSearch(value) === search));
  const selected = studentField.dataset.selectedStudent === undefined ? null : demoRoster[Number(studentField.dataset.selectedStudent)];
  const student = selected && selected.teacherAccount === activeDemoAccount && normalizeTeacherCashSearch(teacherCashStudentLabel(selected)) === search
    ? selected : students.length === 1 ? students[0] : null;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton.disabled) return;
  const valid = activeRole === "professor" && student && Number.isFinite(amountValue) && amountValue > 0 && dateValue && typeValue && referenceValue;
  const formattedAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountValue);
  if (valid && !window.confirm(`${formattedAmount} para ${student.name} (${student.grade}), ${typeValue} · ${referenceValue}?`)) return;
  runButtonAction(submitButton, {
    feedback: submitButton.parentElement.querySelector('[role="alert"]'),
    announcement: form.querySelector("#teacher-cash-result"),
    buttons: Array.from(screenContent.querySelectorAll("[data-professor-payment-action]")),
    loadingText: "Salvando...",
    loadingMessage: "Registrando recebimento.",
    successMessage: "Recebimento lançado. Desfaça em até 10 segundos no histórico.",
    errorMessage: "Não foi possível registrar. Tente novamente."
  }, async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    if (new URLSearchParams(window.location.search).get("erro-simulado") === "professor-pagamento-dinheiro-lancar") {
      throw new Error("Falha simulada de lançamento em dinheiro.");
    }
    if (!valid || activeRole !== "professor" || student.teacherAccount !== activeDemoAccount) {
      return { errorMessage: "Confira o aluno da lista, o valor, a data, o tipo e a referência." };
    }
    const payment = {
      id: `cash-${Date.now()}`,
      account: student.account,
      studentName: student.name,
      professorAccount: activeDemoAccount,
      amount: formattedAmount,
      date: dateValue,
      type: typeValue,
      reference: referenceValue,
      source: "teacher",
      status: "confirmed",
      undoUntil: Date.now() + 10000
    };
    updateDemoPayments(() => cashPayments.push(payment));
    refreshTeacherCashHistory();
    scheduleTeacherCashExpiry(payment);
    showToast("Recebimento lançado. Desfaça em até 10 segundos no histórico.");
  });
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-demo-form]")) return;
  event.preventDefault();
  const form = event.target;
  if (form.matches("[data-login-form]")) {
    const loginButton = form.querySelector('button[data-login-action][type="submit"]');
    if (loginButton instanceof HTMLButtonElement) simulateLogin(loginButton);
    else showToast("Não foi possível iniciar a ação. Tente novamente.", "error");
    return;
  }
  if (form.matches("[data-student-chat]")) {
    const chatButton = form.querySelector("[data-student-action]");
    if (!(chatButton instanceof HTMLButtonElement)) {
      showToast("Não foi possível iniciar o envio. Tente novamente.", "error");
      return;
    }
    runButtonAction(chatButton, {
      feedback: form.querySelector("#student-chat-error"),
      announcement: form.querySelector("#student-chat-status"),
      buttons: [chatButton],
      loadingText: "Enviando...",
      loadingMessage: "Enviando mensagem de demonstração.",
      successMessage: "Protótipo visual: nenhum dado foi gravado ou enviado.",
      errorMessage: "Não foi possível enviar a mensagem. Tente novamente."
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "aluno-mensagem") {
        throw new Error("Falha simulada de envio da mensagem.");
      }
      if (chatButton.isConnected) showToast("Protótipo visual: nenhum dado foi gravado ou enviado.");
    });
    return;
  }
  const submitButton = form.querySelector('button[type="submit"][data-loading-text]');
  if (submitButton) {
    if (submitButton.disabled) return;
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = submitButton.dataset.loadingText;
    window.setTimeout(() => {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      const pendingNotice = form.querySelector("#link-pending-notice");
      if (pendingNotice) pendingNotice.hidden = false;
      showToast("Protótipo visual: nenhum dado foi gravado ou enviado.");
    }, 1200);
  } else {
    showToast("Protótipo visual: nenhum dado foi gravado ou enviado.");
  }
});

menuButton.addEventListener("click", () => {
  if (sidebar.classList.contains("is-open")) {
    closeMobileMenu();
    return;
  }
  sidebar.classList.add("is-open");
  sidebarBackdrop.classList.add("is-visible");
  sidebar.setAttribute("role", "dialog");
  sidebar.setAttribute("aria-modal", "true");
  menuButton.setAttribute("aria-expanded", "true");
  sidebar.querySelector("a, button").focus();
  document.querySelectorAll(".prototype-banner, .app-main, #mobile-navigation").forEach((element) => { element.inert = true; });
});

sidebarBackdrop.addEventListener("click", closeMobileMenu);

document.addEventListener("keydown", (event) => {
  if (!sidebar.classList.contains("is-open")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeMobileMenu();
    menuButton.focus();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener("resize", () => {
  if (!window.matchMedia("(max-width: 860px), (max-width: 1024px) and (max-height: 500px) and (pointer: coarse)").matches) closeMobileMenu();
});

function closeOnSwipe(element, direction, close) {
  let start = null;
  element.addEventListener("touchstart", (event) => {
    start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  element.addEventListener("touchend", (event) => {
    if (!start || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    start = null;
    if (dx * direction > 70 && Math.abs(dx) > Math.abs(dy) * 1.25) close();
  }, { passive: true });
  element.addEventListener("touchcancel", () => { start = null; }, { passive: true });
}

closeOnSwipe(sidebar, -1, closeMobileMenu);
closeOnSwipe(userPanel, 1, closeUserPanel);

privacyDialog.addEventListener("click", (event) => {
  if (event.target === privacyDialog) privacyDialog.close();
});

termsDialog.addEventListener("click", (event) => {
  if (event.target === termsDialog) termsDialog.close();
});

userPanel.addEventListener("click", (event) => {
  if (event.target !== userPanel) return;
  const rect = userPanel.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeUserPanel();
});

userPanel.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeUserPanel();
});

userPanel.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeUserPanel();
  }
});

tutorialDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeTutorial();
});

tutorialDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeTutorial();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = [...tutorialDialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
