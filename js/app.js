"use strict";

const isDemoMode = new URLSearchParams(window.location.search).get("demo") === "1";
const APP_VERSION = "5.15";
document.body.dataset.appMode = isDemoMode ? "demo" : "real";
const CONSENT_TERM_VERSION = "rascunho-1";
const realSignupNameSessionKey = "tatame-real-signup-name";
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
    items: [
      ["instructor-class", "Treino compartilhado", "▣"],
      ["instructor-students", "Alunos vinculados", "♧"]
    ]
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
      ["monthly-charges", "Cobranças mensais", "¤"],
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
    title: "Alunos",
    roles: ["adm"],
    items: [["admin-students", "Alunos", "♧"]]
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
screenInfo["real-account"] = { title: "Conta", group: "Conta" };
screenInfo["create-account"] = { title: "Criar conta", group: "Acesso" };
screenInfo["forgot-password"] = { title: "Esqueci a senha", group: "Acesso" };
screenInfo["password-recovery"] = { title: "Definir nova senha", group: "Acesso" };
const roleScreens = {
  adm: ["admin-home", "teacher-invites", "role-management", "academy", "user-settings", "privacy"],
  professor: ["teacher-home", "students", "student-detail", "student-create", "teacher-code", "role-management", "pix-import", "payment-review", "monthly-charges", "overdue", "quick-actions", "teacher-chat", "academy", "user-settings", "privacy"],
  instructor: ["student-home", "student-payments", "student-grades", "instructor-class", "instructor-chat", "academy", "user-settings", "privacy"],
  student: ["student-home", "student-link", "student-payments", "student-grades", "student-chat", "link-teacher", "academy", "user-settings", "privacy"],
  "student-unregistered": ["link-teacher"]
};
const demoProfiles = isDemoMode ? {
  adm: { role: "adm", label: "Adm", name: "ADM FICTÍCIO", start: "admin-home" },
  professor: { role: "professor", label: "Professor", name: "PROFESSOR FICTÍCIO 01", start: "teacher-home", academyId: null },
  instructor: { role: "instructor", label: "Instrutor", name: "INSTRUTOR FICTÍCIO 01", start: "instructor-class", teacherAccount: "professor", academyId: null, grade: "Faixa azul · 1 grau", gradeHistory: ["Graduação fictícia preservada"] },
  student: { role: "student", label: "Aluno registrado", name: "ALUNO FICTÍCIO 01", start: "student-home", teacherAccount: null, academyId: null, grade: "Faixa azul · 2 graus", gradeHistory: ["Graduação fictícia preservada"] },
  "student-unregistered": { role: "student-unregistered", label: "Aluno sem registro", name: "ALUNO FICTÍCIO 04", start: "link-teacher", grade: "Faixa branca", gradeHistory: ["Histórico fictício preservado"] }
} : {};
const deletedDemoAccounts = new Set();
const demoAcademy = isDemoMode
  ? { id: "academia-ficticia-01", name: "Academia Fictícia", phone: "", email: "", photo: "initials" }
  : { id: "", name: "", phone: "", email: "", photo: "initials" };
const defaultProfessorSchedule = [
  ["Segunda e quarta", "19h às 20h30"],
  ["Terça e quinta", "6h30 às 8h"]
];
const publishedAcademyGrades = new Set();
const demoRoster = isDemoMode ? [
  { account: "student", name: "ALUNO FICTÍCIO 01", grade: "Faixa azul · 2 graus", teacherAccount: "professor" },
  { account: "instructor", name: "INSTRUTOR FICTÍCIO 01", grade: "Faixa azul · 1 grau", teacherAccount: "professor" },
  { account: null, name: "ALUNO FICTÍCIO 02", grade: "Faixa branca", teacherAccount: "professor" },
  { account: null, name: "ALUNO FICTÍCIO 03", grade: "Faixa roxa · 1 grau", teacherAccount: "professor", status: "locked" }
] : [];
const photoProfiles = new Map();
const replacedPhotoUrls = [];
let onboardingAccount = null;
let onboardingFromSettings = false;
let photoEditorAccount = null;
let photoEditorUrl = "";
let photoEditorFile = null;
const demoBelts = ["Branca", "Azul", "Roxa", "Marrom", "Preta", "Coral vermelha e preta", "Coral vermelha e branca", "Vermelha"];
const demoGradeHistory = new Map();
let selectedGradeStudent = null;
const demoPrivateNotes = [];
const demoInviteRecipients = isDemoMode ? [
  { id: "instructor", type: "instructor", name: demoProfiles.instructor.name },
  { id: "student-02", type: "student", name: demoRoster[2].name },
  { id: "student-03", type: "student", name: demoRoster[3].name }
 ] : [];
const simulatedRoleHistory = [];
const authorizedInstructorNames = new Set();
const delegatedLessons = {};
const linkRequests = [];
const cashPayments = [];
const receiptPayments = [];
const monthlyCharges = [];
const billingSettings = [];
const billingGraceDaysByProfessor = new Map();
let billingSelectedMonth = currentDemoMonth();
let dashboardSelectedMonth = currentDemoMonth();
let selectedStudentChargeId = null;
const demoConversations = [];
let selectedTeacherChatPartner = null;

function loadDemoPayments() {
  if (!isDemoMode) return;
  try {
    const stored = localStorage.getItem("tatame-demo-payments");
    if (!stored) return;
    const data = JSON.parse(stored);
    const storedCharges = data && data.charges === undefined ? [] : data && data.charges;
    const storedBillingSettings = data && data.billingSettings === undefined ? [] : data && data.billingSettings;
    const storedGraceDays = data && data.graceDaysByProfessor === undefined ? {} : data && data.graceDaysByProfessor;
    const validMonth = (month) => typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
    const validPayment = (payment) => payment && typeof payment.id === "string" &&
      typeof payment.studentName === "string" && typeof payment.professorAccount === "string" &&
      typeof payment.amount === "string" && typeof payment.date === "string" &&
      ["pending", "confirmed", "rejected", "undone", "reversed"].includes(payment.status) &&
      (typeof payment.account === "string" || payment.account === null) &&
      (payment.chargeId === undefined || typeof payment.chargeId === "string" || payment.chargeId === null);
    const validCharge = (charge) => charge && typeof charge.id === "string" &&
      typeof charge.studentKey === "string" && typeof charge.studentName === "string" &&
      (typeof charge.studentAccount === "string" || charge.studentAccount === null) &&
      typeof charge.professorAccount === "string" && validMonth(charge.month) &&
      typeof charge.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(charge.dueDate) &&
      charge.dueDate.startsWith(`${charge.month}-`) &&
      (charge.sentOn === undefined || (typeof charge.sentOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(charge.sentOn))) &&
      (charge.resentOn === undefined || (typeof charge.resentOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(charge.resentOn) && typeof charge.sentOn === "string")) &&
      ["aberta", "paga", "isenta", "cancelada"].includes(charge.status) &&
      ["none", "fixed", "percent", "exempt"].includes(charge.discountType) &&
      ["this-month", "months", "until-removed"].includes(charge.duration) &&
      Number.isInteger(charge.baseAmountCents) && charge.baseAmountCents >= 0 &&
      Number.isInteger(charge.discountAmountCents) && charge.discountAmountCents >= 0 &&
      Number.isInteger(charge.finalAmountCents) && charge.finalAmountCents >= 0 &&
      charge.discountAmountCents <= charge.baseAmountCents &&
      charge.finalAmountCents === Math.max(0, charge.baseAmountCents - charge.discountAmountCents) &&
      typeof charge.discountValue === "number" && Number.isFinite(charge.discountValue) &&
      (charge.discountType === "percent" ? charge.discountValue >= 0 && charge.discountValue <= 100
        : ["none", "exempt"].includes(charge.discountType) ? charge.discountValue === 0 : charge.discountValue > 0) &&
      (charge.status !== "isenta" || charge.finalAmountCents === 0) &&
      (charge.durationMonths === null || (Number.isInteger(charge.durationMonths) && charge.durationMonths > 0)) &&
      (charge.duration !== "months" || Number.isInteger(charge.durationMonths)) &&
      typeof charge.exemptionReason === "string";
    const validSetting = (setting) => setting && typeof setting.studentKey === "string" &&
      typeof setting.professorAccount === "string" &&
      Number.isInteger(setting.baseAmountCents) && setting.baseAmountCents > 0 &&
      Number.isInteger(setting.dueDay) && setting.dueDay >= 1 && setting.dueDay <= 28 &&
      ["none", "fixed", "percent", "exempt"].includes(setting.discountType) &&
      ["this-month", "months", "until-removed"].includes(setting.duration) &&
      typeof setting.discountValue === "number" && Number.isFinite(setting.discountValue) && setting.discountValue >= 0 &&
      (setting.discountType === "percent" ? setting.discountValue > 0 && setting.discountValue <= 100
        : ["none", "exempt"].includes(setting.discountType) ? setting.discountValue === 0 : setting.discountValue > 0) &&
      validMonth(setting.startMonth) &&
      (setting.durationMonths === null || (Number.isInteger(setting.durationMonths) && setting.durationMonths > 0)) &&
      (setting.duration !== "months" || Number.isInteger(setting.durationMonths)) &&
      typeof setting.exemptionReason === "string";
    if (!data || !Array.isArray(data.cash) || !Array.isArray(data.receipts) ||
        !data.cash.every((payment) => validPayment(payment) && ["student", "teacher"].includes(payment.source) &&
          (payment.source !== "teacher" || (Number.isFinite(payment.undoUntil) &&
            typeof payment.type === "string" && typeof payment.reference === "string"))) ||
        !data.receipts.every((payment) => validPayment(payment) &&
          ["pending", "confirmed", "rejected"].includes(payment.status)) ||
        !Array.isArray(storedCharges) || !storedCharges.every(validCharge) ||
        !Array.isArray(storedBillingSettings) || !storedBillingSettings.every(validSetting) ||
        !storedGraceDays || typeof storedGraceDays !== "object" || Array.isArray(storedGraceDays) ||
        Object.entries(storedGraceDays).some(([account, days]) =>
          !account || !Number.isInteger(days) || days < 0 || days > 30
        )) {
      throw new TypeError("Dados fictícios de pagamentos inválidos.");
    }
    cashPayments.push(...data.cash);
    receiptPayments.push(...data.receipts);
    monthlyCharges.push(...storedCharges);
    billingSettings.push(...storedBillingSettings);
    Object.entries(storedGraceDays).forEach(([account, days]) => billingGraceDaysByProfessor.set(account, days));
  } catch (error) {
    console.error("Não foi possível carregar os pagamentos fictícios:", error);
    window.setTimeout(() => showToast("Não foi possível carregar os pagamentos fictícios; a lista inicial está vazia.", "error"), 0);
  }
}

function saveDemoPayments() {
  if (!isDemoMode) throw new Error("Os pagamentos fictícios só podem ser salvos na demonstração.");
  try {
    const receipts = receiptPayments.map(({ file, fileInput, ...payment }) => payment);
    localStorage.setItem("tatame-demo-payments", JSON.stringify({
      cash: cashPayments,
      receipts,
      charges: monthlyCharges,
      billingSettings,
      graceDaysByProfessor: Object.fromEntries(billingGraceDaysByProfessor)
    }));
  } catch (error) {
    console.error("Não foi possível salvar os pagamentos fictícios:", error);
    showToast("Não foi possível salvar os pagamentos fictícios.", "error");
    throw error;
  }
}

function updateDemoPayments(update) {
  if (!isDemoMode) throw new Error("Os pagamentos fictícios só podem ser alterados na demonstração.");
  const previousCash = cashPayments.map((payment) => ({ ...payment }));
  const previousReceipts = receiptPayments.map((payment) => ({ ...payment }));
  const previousCharges = monthlyCharges.map((charge) => ({ ...charge }));
  const previousBillingSettings = billingSettings.map((setting) => ({ ...setting }));
  const previousGraceDays = Array.from(billingGraceDaysByProfessor);
  update();
  try {
    saveDemoPayments();
  } catch (error) {
    cashPayments.splice(0, cashPayments.length, ...previousCash);
    receiptPayments.splice(0, receiptPayments.length, ...previousReceipts);
    monthlyCharges.splice(0, monthlyCharges.length, ...previousCharges);
    billingSettings.splice(0, billingSettings.length, ...previousBillingSettings);
    billingGraceDaysByProfessor.clear();
    previousGraceDays.forEach(([account, days]) => billingGraceDaysByProfessor.set(account, days));
    throw error;
  }
}

loadDemoPayments();
function loadDemoInvites() {
  if (!isDemoMode) return [];
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
const DEMO_DATA_VERSION = 3;
const demoDataKeys = {
  profiles: "tatame-demo-profiles",
  roster: "tatame-demo-roster",
  links: "tatame-demo-links",
  grades: "tatame-demo-grades",
  privateNotes: "tatame-demo-private-notes",
  invites: "tatame-demo-invites",
  academy: "tatame-demo-academy",
  deletedAccounts: "tatame-demo-deleted-accounts",
  conversations: "tatame-demo-conversations"
};

function readDemoData(key, validate) {
  if (!isDemoMode) return null;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return null;
    const record = JSON.parse(stored);
    const supportedPreviousVersion = record && (record.version === 2 ||
      (record.version === 1 && key !== demoDataKeys.academy));
    if (!record || (record.version !== DEMO_DATA_VERSION && !supportedPreviousVersion) || !validate(record.data)) {
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
  if (!isDemoMode) throw new Error("Os dados fictícios só podem ser salvos na demonstração.");
  try {
    localStorage.setItem(key, JSON.stringify({ version: DEMO_DATA_VERSION, data }));
  } catch (error) {
    console.error(`Não foi possível salvar ${key}:`, error);
    throw error;
  }
}

function saveDemoProfiles() { writeDemoData(demoDataKeys.profiles, demoProfiles); }
function saveDemoAcademy(academy) { writeDemoData(demoDataKeys.academy, academy); }
function saveDemoRoster() { writeDemoData(demoDataKeys.roster, demoRoster); }
function saveLinkRequests() { writeDemoData(demoDataKeys.links, linkRequests); }
function saveDeletedDemoAccounts() { writeDemoData(demoDataKeys.deletedAccounts, Array.from(deletedDemoAccounts)); }
function saveDemoConversations() { writeDemoData(demoDataKeys.conversations, demoConversations); }
function saveDemoGradeHistory() {
  writeDemoData(demoDataKeys.grades, Array.from(demoGradeHistory, ([student, entries]) => ({
    index: demoRoster.indexOf(student), name: student.name, account: student.account, entries
  })));
}
function saveDemoPrivateNotes() { writeDemoData(demoDataKeys.privateNotes, demoPrivateNotes); }

const isStringOrNull = (value) => value === null || typeof value === "string";
const storedAcademy = readDemoData(demoDataKeys.academy, (value) =>
  value && value.id === demoAcademy.id && typeof value.name === "string" && value.name.trim() &&
  typeof value.phone === "string" && typeof value.email === "string" && ["initials", "icon"].includes(value.photo)
);
if (storedAcademy) Object.assign(demoAcademy, storedAcademy);
const storedProfiles = readDemoData(demoDataKeys.profiles, (value) =>
  value && typeof value === "object" && !Array.isArray(value) &&
  Object.entries(value).every(([key, profile]) => /^[a-z0-9-]+$/.test(key) && profile &&
    typeof profile.name === "string" && typeof profile.label === "string" &&
    Object.hasOwn(roleScreens, profile.role) && typeof profile.start === "string" &&
    (profile.teacherAccount === undefined || isStringOrNull(profile.teacherAccount)) &&
    (profile.academyId === undefined || isStringOrNull(profile.academyId)) &&
    (profile.grade === undefined || typeof profile.grade === "string"))
);
if (storedProfiles) Object.assign(demoProfiles, storedProfiles);
const storedDeletedDemoAccounts = readDemoData(demoDataKeys.deletedAccounts, (value) =>
  Array.isArray(value) && value.every((account) => typeof account === "string" && /^[a-z0-9-]+$/.test(account))
);
if (storedDeletedDemoAccounts) storedDeletedDemoAccounts.forEach((account) => deletedDemoAccounts.add(account));
deletedDemoAccounts.forEach((account) => delete demoProfiles[account]);
for (const payment of [...cashPayments, ...receiptPayments]) {
  if (deletedDemoAccounts.has(payment.account)) {
    payment.studentName = "Conta excluída";
    payment.account = null;
  }
}

const storedRoster = readDemoData(demoDataKeys.roster, (value) =>
  Array.isArray(value) && value.every((student) => student && typeof student.name === "string" &&
    typeof student.grade === "string" && isStringOrNull(student.account) && isStringOrNull(student.teacherAccount) &&
    (student.status === undefined || student.status === "locked") &&
    (student.deletedRole === undefined || ["student", "instructor"].includes(student.deletedRole)))
);
if (storedRoster) demoRoster.splice(0, demoRoster.length, ...storedRoster);
const lockedDemoStudent = demoRoster.find((student) =>
  student.account === null && student.name === "ALUNO FICTÍCIO 03" &&
  student.teacherAccount === "professor" && student.grade === "Faixa roxa · 1 grau"
);
if (lockedDemoStudent && lockedDemoStudent.status === undefined) lockedDemoStudent.status = "locked";
deletedDemoAccounts.forEach((account) => {
  const student = demoRoster.find((item) => item.account === account);
  if (!student) return;
  student.deletedRole = account === "instructor" ? "instructor" : "student";
  student.name = "Conta excluída";
  student.account = null;
});
const storedPrivateNotes = readDemoData(demoDataKeys.privateNotes, (value) =>
  Array.isArray(value) && value.every((note) => note && typeof note.id === "string" &&
    Number.isInteger(note.studentIndex) && note.studentIndex >= 0 &&
    typeof note.studentName === "string" && isStringOrNull(note.studentAccount) &&
    typeof note.professorAccount === "string" && typeof note.text === "string" &&
    note.text.trim().length > 0 && note.text.length <= 500 &&
    typeof note.createdAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(note.createdAt))
);
if (storedPrivateNotes) demoPrivateNotes.push(...storedPrivateNotes);
if (isDemoMode) {
  simulatedRoleHistory.push(
    `${demoRoster[3].name}: aluno registrado → instrutor · histórico mantido.`,
    "INSTRUTOR FICTÍCIO 03: instrutor → professor · histórico mantido."
  );
}

const storedLinks = readDemoData(demoDataKeys.links, (value) =>
  Array.isArray(value) && value.every((request) => request && typeof request.id === "string" &&
    typeof request.account === "string" && typeof request.studentName === "string" &&
    typeof request.professorAccount === "string" && ["pending", "approved", "rejected", "cancelled"].includes(request.status))
);
if (storedLinks) linkRequests.push(...storedLinks);
deletedDemoAccounts.forEach((account) => {
  const associatedRecipientId = account.startsWith("pre-registered-")
    ? account.slice("pre-registered-".length)
    : account;
  linkRequests.forEach((request) => {
    if (request.account === account) request.studentName = "Conta excluída";
  });
  demoInvites.forEach((invite) => {
    if (invite.recipientId === associatedRecipientId) invite.recipientName = "Conta excluída";
    if (invite.recipientId === associatedRecipientId || invite.professorAccount === account) {
      invite.used = true;
      invite.token = "";
    }
  });
});

const storedGrades = readDemoData(demoDataKeys.grades, (value) =>
  Array.isArray(value) && value.every((item) => item && Number.isInteger(item.index) && item.index >= 0 &&
    item.index < demoRoster.length && demoRoster[item.index].name === item.name &&
    demoRoster[item.index].account === item.account && Array.isArray(item.entries) &&
    item.entries.every((entry) => entry && typeof entry.belt === "string" && Number.isInteger(entry.degree) &&
      typeof entry.date === "string" && typeof entry.professor === "string"))
);
if (storedGrades) storedGrades.forEach((item) => demoGradeHistory.set(demoRoster[item.index], item.entries));
const storedConversations = readDemoData(demoDataKeys.conversations, (value) =>
  Array.isArray(value) && value.every((conversation) => conversation &&
    typeof conversation.id === "string" && Array.isArray(conversation.participants) &&
    conversation.participants.length === 2 && conversation.participants.every((account) => typeof account === "string") &&
    Array.isArray(conversation.messages) && conversation.messages.every((message) => message &&
      conversation.participants.includes(message.senderAccount) && typeof message.text === "string" &&
      typeof message.sentAt === "string"))
);
if (storedConversations) {
  demoConversations.push(...storedConversations.filter((conversation) =>
    !conversation.participants.some((account) => deletedDemoAccounts.has(account))
  ));
}

function updateDemoData(update, saves) {
  if (!isDemoMode) throw new Error("Os dados fictícios só podem ser alterados na demonstração.");
  const previous = {
    profiles: structuredClone(demoProfiles),
    roster: structuredClone(demoRoster),
    links: structuredClone(linkRequests),
    invites: structuredClone(demoInvites),
    grades: Array.from(demoGradeHistory, ([student, entries]) => [demoRoster.indexOf(student), structuredClone(entries)]),
    privateNotes: structuredClone(demoPrivateNotes),
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
    demoPrivateNotes.splice(0, demoPrivateNotes.length, ...previous.privateNotes);
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

function updateDemoConversations(update) {
  if (!isDemoMode) throw new Error("As conversas fictícias só podem ser alteradas na demonstração.");
  const previous = structuredClone(demoConversations);
  update();
  try {
    saveDemoConversations();
  } catch (error) {
    demoConversations.splice(0, demoConversations.length, ...previous);
    throw error;
  }
}

function deleteDemoAccountData(account) {
  if (!isDemoMode) return { errorMessage: "A exclusão demonstrativa só está disponível no modo demonstração." };
  const profile = demoProfiles[account];
  if (!profile || activeDemoAccount !== account || deletedDemoAccounts.has(account)) {
    return { errorMessage: "Esta conta demonstrativa não está disponível. Atualize a tela e tente novamente." };
  }

  const associatedRecipientId = account.startsWith("pre-registered-")
    ? account.slice("pre-registered-".length)
    : account;
  const storageKeys = [...Object.values(demoDataKeys), "tatame-demo-payments", professorConsentStorageKey(account)];
  const previousStorage = new Map();
  try {
    storageKeys.forEach((key) => previousStorage.set(key, localStorage.getItem(key)));
  } catch (error) {
    console.error("Não foi possível verificar o armazenamento antes da exclusão fictícia:", error);
    return { errorMessage: "Não foi possível acessar o armazenamento local. Nenhum dado foi alterado; verifique as configurações e tente novamente." };
  }

  const previous = {
    profiles: structuredClone(demoProfiles),
    roster: structuredClone(demoRoster),
    links: structuredClone(linkRequests),
    invites: structuredClone(demoInvites),
    grades: Array.from(demoGradeHistory, ([student, entries]) =>
      [demoRoster.indexOf(student), structuredClone(entries)]),
    conversations: structuredClone(demoConversations),
    deletedAccounts: Array.from(deletedDemoAccounts),
    cashPayments: cashPayments.map((payment) => ({ ...payment })),
    receiptPayments: receiptPayments.map((payment) => ({ ...payment })),
    monthlyCharges: monthlyCharges.map((charge) => ({ ...charge })),
    billingSettings: billingSettings.map((setting) => ({ ...setting })),
    billingGraceDaysByProfessor: Array.from(billingGraceDaysByProfessor),
    recipients: structuredClone(demoInviteRecipients),
    authorized: Array.from(authorizedInstructorNames),
    delegatedLessons: structuredClone(delegatedLessons),
    publishedGrades: Array.from(publishedAcademyGrades),
    teacherLinkCodes: Array.from(teacherLinkCodes),
    roleHistory: [...simulatedRoleHistory],
    selectedIndex: demoRoster.indexOf(selectedGradeStudent),
    selectedTeacherChatPartner
  };
  const deletedName = profile.name;
  const deletedRosterRecord = demoRoster.find((student) => student.account === account);
  const deletedStudentKey = deletedRosterRecord ? studentBillingKey(deletedRosterRecord) : null;

  try {
    const rosterRecord = deletedRosterRecord;
    if (rosterRecord) {
      rosterRecord.name = "Conta excluída";
      rosterRecord.deletedRole = profile.role === "instructor" ? "instructor" : "student";
      rosterRecord.account = null;
    }

    for (const request of linkRequests) {
      if (request.account === account || request.studentName === deletedName) {
        request.studentName = "Conta excluída";
      }
    }

    for (const invite of demoInvites) {
      const deletedRecipient = invite.recipientId === associatedRecipientId || invite.recipientName === deletedName;
      if (deletedRecipient) invite.recipientName = "Conta excluída";
      if (deletedRecipient || invite.professorAccount === account) {
        invite.used = true;
        invite.token = "";
      }
    }

    for (const payment of [...cashPayments, ...receiptPayments]) {
      if (payment.account === account || payment.studentName === deletedName) {
        payment.studentName = "Conta excluída";
        payment.account = null;
      }
    }
    for (const charge of monthlyCharges) {
      if (charge.studentAccount === account || charge.studentName === deletedName) {
        charge.studentName = "Conta excluída";
        charge.studentAccount = null;
      }
    }
    if (deletedStudentKey !== null) {
      for (let index = billingSettings.length - 1; index >= 0; index -= 1) {
        if (billingSettings[index].studentKey === deletedStudentKey) billingSettings.splice(index, 1);
      }
    }

    for (const entries of demoGradeHistory.values()) {
      entries.forEach((entry) => {
        if (entry.professor === deletedName) entry.professor = "Conta excluída";
      });
    }
    for (let index = 0; index < simulatedRoleHistory.length; index += 1) {
      simulatedRoleHistory[index] = simulatedRoleHistory[index].replaceAll(deletedName, "Conta excluída");
    }

    for (let index = demoConversations.length - 1; index >= 0; index -= 1) {
      if (demoConversations[index].participants.includes(account)) demoConversations.splice(index, 1);
    }

    demoInviteRecipients.splice(0, demoInviteRecipients.length, ...demoInviteRecipients.filter((recipient) =>
      recipient.id !== associatedRecipientId && recipient.name !== deletedName
    ));
    authorizedInstructorNames.delete(deletedName);
    publishedAcademyGrades.delete(account);
    teacherLinkCodes.delete(account);
    if (selectedTeacherChatPartner === account) selectedTeacherChatPartner = null;
    for (const [instructorName, lesson] of Object.entries(delegatedLessons)) {
      if (instructorName === deletedName || lesson.teacherAccount === account) delete delegatedLessons[instructorName];
    }

    deletedDemoAccounts.add(account);
    delete demoProfiles[account];

    saveDemoProfiles();
    saveDeletedDemoAccounts();
    saveDemoRoster();
    saveLinkRequests();
    saveDemoInvites();
    saveDemoGradeHistory();
    saveDemoConversations();
    saveDemoPayments();

    const photoUrl = photoProfiles.get(account);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoProfiles.delete(account);
    revokeReplacedPhotoUrls();
    return {};
  } catch (error) {
    for (const key of Object.keys(demoProfiles)) delete demoProfiles[key];
    Object.assign(demoProfiles, previous.profiles);
    demoRoster.splice(0, demoRoster.length, ...previous.roster);
    linkRequests.splice(0, linkRequests.length, ...previous.links);
    demoInvites.splice(0, demoInvites.length, ...previous.invites);
    demoGradeHistory.clear();
    previous.grades.forEach(([index, entries]) => demoGradeHistory.set(demoRoster[index], entries));
    demoConversations.splice(0, demoConversations.length, ...previous.conversations);
    deletedDemoAccounts.clear();
    previous.deletedAccounts.forEach((item) => deletedDemoAccounts.add(item));
    cashPayments.splice(0, cashPayments.length, ...previous.cashPayments);
    receiptPayments.splice(0, receiptPayments.length, ...previous.receiptPayments);
    monthlyCharges.splice(0, monthlyCharges.length, ...previous.monthlyCharges);
    billingSettings.splice(0, billingSettings.length, ...previous.billingSettings);
    billingGraceDaysByProfessor.clear();
    previous.billingGraceDaysByProfessor.forEach(([professorAccount, days]) =>
      billingGraceDaysByProfessor.set(professorAccount, days)
    );
    demoInviteRecipients.splice(0, demoInviteRecipients.length, ...previous.recipients);
    authorizedInstructorNames.clear();
    previous.authorized.forEach((name) => authorizedInstructorNames.add(name));
    Object.keys(delegatedLessons).forEach((key) => delete delegatedLessons[key]);
    Object.assign(delegatedLessons, previous.delegatedLessons);
    publishedAcademyGrades.clear();
    previous.publishedGrades.forEach((item) => publishedAcademyGrades.add(item));
    teacherLinkCodes.clear();
    previous.teacherLinkCodes.forEach(([key, value]) => teacherLinkCodes.set(key, value));
    simulatedRoleHistory.splice(0, simulatedRoleHistory.length, ...previous.roleHistory);
    selectedGradeStudent = previous.selectedIndex < 0 ? null : demoRoster[previous.selectedIndex];
    selectedTeacherChatPartner = previous.selectedTeacherChatPartner;

    const restoreFailures = [];
    for (const [key, value] of previousStorage) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch (restoreError) {
        restoreFailures.push(key);
        console.error(`Não foi possível restaurar ${key} após a exclusão fictícia:`, restoreError);
      }
    }
    console.error("Não foi possível concluir a exclusão fictícia:", error);
    return {
      errorMessage: restoreFailures.length
        ? "Não foi possível concluir nem restaurar todos os dados locais. Atualize a página e confira os dados antes de tentar novamente."
        : "Não foi possível concluir. Os dados anteriores foram restaurados; verifique o armazenamento e tente novamente."
    };
  }
}

const teacherLinkCodes = new Map([["professor", "K7M4PX"]]);
const linkCodeAttempts = new Map();
let currentTeacherLinkPreview = null;
const tutorialStepsByRole = {
  adm: [
    ["admin-home", "Painel do Adm", "Acompanhe os dados administrativos fictícios e os avisos gerais. No celular, use a barra inferior ou o menu para navegar; abra a conta para tutorial e saída."],
    ["teacher-invites", "Professores convidados", "Convide professores. Só o Adm define quem será Professor."],
    ["role-management", "Papéis e academia", "Na conta real do Adm, vincule-se a um Professor ativo, consulte Professores e Instrutores e troque, desative ou reative Professores. Na demonstração, as operações continuam simuladas."],
    ["academy", "Academia", "Cadastre ou altere nome, telefone e e-mail fictícios; a foto é apenas um símbolo simulado, sem arquivo. Consulte equipe e horários e vincule Professores na tela de papéis."],
    ["user-settings", "Fotos e privacidade", "O Adm pode ver fotos de Professores, nunca de alunos. A idade é declarada sem data de nascimento; menores usam somente avatar. Consentimento e fotos são simulados e não persistem."],
    ["user-settings", "Preferências", "Confira tema e opções demonstrativas da conta."],
    ["privacy", "Privacidade", "Consulte os avisos de privacidade e o estado do conteúdo pendente."]
  ],
  professor: [
    ["teacher-home", "Painel do Professor", "Veja os indicadores, avisos e atalhos da sua turma. No celular, use a barra inferior ou o menu para navegar; abra a conta para tutorial e saída."],
    ["students", "Alunos", "Consulte somente os alunos da sua turma."],
    ["student-detail", "Ficha do aluno", "Veja perfil, pagamentos, graduações e notas privadas. Em Graduações, escolha um aluno da sua turma, faixa e grau superiores e a data; confirme para registrar. Notas privadas não são compartilhadas com o Instrutor."],
    ["student-create", "Novo aluno", "Cadastre um aluno fictício com sua faixa e grau atuais. Nome e graduação ficam neste navegador; os demais campos não são salvos e nenhum login ou convite é criado."],
    ["student-detail", "Idade e foto do aluno", "Para aluno sem registro, marque a faixa etária declarada sem pedir data de nascimento. Menores usam avatar; fotos de alunos adultos ficam visíveis somente ao Professor responsável."],
    ["teacher-code", "Código e convites", "Na conta real, o Professor ativo vinculado à academia vê e decide pedidos de vínculo, cadastra alunos sem conta e gera links únicos para Instrutores adultos; também pode revogar convites pendentes. A demonstração continua simulada."],
    ["role-management", "Papéis e aula delegada", "Promova somente seus alunos a Instrutor, autorize-o e decida se compartilha o plano ou deixa o treino livre. O Instrutor é um aluno com função de apoio: vê nome e graduação da turma, nunca pagamentos alheios, notas privadas ou conversas de terceiros; você decide o conteúdo."],
    ["pix-import", "Importar extrato Pix", "Importe um extrato para sugerir correspondências. Nada é pago ou confirmado automaticamente."],
    ["payment-review", "Pagamentos a confirmar", "Na conta real, confirme ou rejeite avisos do Aluno, lance dinheiro com tipo e referência e use Desfazer por até 120 segundos ou Estornar depois. Na demonstração, os registros fictícios ficam neste navegador."],
    ["monthly-charges", "Cobranças mensais", "Defina valor-base, vencimento, desconto ou isenção e gere até 24 cobranças. Envie ou reenvie uma cobrança aberta ao aluno nesta demonstração e copie a mensagem se desejar. Na conta real, você também pode preparar e copiar uma mensagem local para aluno sem conta, sem salvar cobrança ou mensagem. O app não envia mensagens fora dele. Cancele somente cobranças abertas sem pagamentos ativos."],
    ["overdue", "Atrasados", "Consulte atrasos calculados pelo vencimento e carência; o estado não é gravado."],
    ["quick-actions", "Ações rápidas", "Use os atalhos e limite lotes de mensalidades a 24 cobranças."],
    ["teacher-chat", "Conversas", "Converse somente com seus alunos e Instrutores vinculados. As mensagens fictícias ficam salvas neste navegador e são removidas ao excluir a conta demonstrativa."],
    ["academy", "Academia", "Se estiver vinculado, altere nome, telefone e e-mail fictícios e simule a troca da foto sem arquivo. Consulte equipe e horários; publique ou retorne sua grade para rascunho."],
    ["user-settings", "Preferências", "Confira tema, atualização e acesso à privacidade."],
    ["user-settings", "Sua foto", "Escolha uma foto, ajuste zoom e enquadramento e salve a prévia local. Consentimento para a foto do Google pode ser recusado; menores usam somente avatar. Nada é enviado ou guardado após esta sessão."],
    ["user-settings", "Nome do perfil real", "Na conta Google real, um Professor ativo vinculado a uma academia pode definir o próprio nome na tela Conta Google. A demonstração continua simulada e separada."],
    ["privacy", "Privacidade", "Leia os avisos de privacidade. O aceite do Professor é registrado com a versão e a data; o conteúdo segue em rascunho e depende de revisão."]
  ],
  instructor: [
    ["student-home", "Início pessoal", "Consulte seu perfil e seus próprios avisos, separados das informações dos alunos da turma. No celular, use a barra inferior ou o menu para navegar; abra a conta para tutorial e saída."],
    ["student-payments", "Meus pagamentos", "Cobranças e valores não são exibidos para Instrutores."],
    ["student-grades", "Minhas graduações", "Acompanhe sua própria faixa e seu histórico de graduações."],
    ["instructor-class", "Aula delegada", "Veja nome e graduação atual da turma e a aula que o Professor decidiu compartilhar, ou “Treino livre”. Registre “Segui” ou “Não segui”; pagamentos de outros alunos e notas privadas não aparecem."],
    ["instructor-students", "Alunos vinculados", "Na conta real, a lista mostra somente nomes de alunos vinculados ao seu Professor quando a função de consulta estiver disponível."],
    ["instructor-chat", "Conversa com o Professor", "Converse somente com o Professor vinculado. As mensagens fictícias ficam salvas neste navegador e são removidas ao excluir a conta demonstrativa."],
    ["academy", "Academia", "Consulte o quadro e os horários publicados da academia."],
    ["user-settings", "Preferências", "Confira tema e opções demonstrativas da conta."],
    ["user-settings", "Sua foto", "A cópia simulada da foto do Google só aparece após consentimento. Menores usam somente avatar; a foto escolhida fica apenas nesta sessão do navegador."],
    ["privacy", "Privacidade", "Consulte os avisos de privacidade. Se entrar por convite, o aceite é registrado após o convite ser consumido; o conteúdo segue em rascunho e depende de revisão."]
  ],
  student: [
    ["student-home", "Início", "Consulte seu perfil, o status da mensalidade e atalhos pessoais. No celular, use a barra inferior ou o menu para navegar; abra a conta para tutorial e saída."],
    ["student-link", "Meu vínculo", "Na conta Google real, o Aluno ativo acompanha o estado do pedido de vínculo. Na demonstração, Professor, academia e pedidos continuam simulados."],
    ["student-payments", "Meus pagamentos", "Na conta real, consulte cobranças enviadas e avise um pagamento com tipo e valor; nenhum arquivo de comprovante é enviado. Na demonstração, comprovantes e pagamentos são fictícios e aguardam confirmação do Professor."],
    ["student-grades", "Minhas graduações", "Acompanhe sua faixa e seu histórico de graduações."],
    ["student-chat", "Conversa com o Professor", "Envie mensagens somente ao seu Professor. As mensagens fictícias ficam salvas neste navegador e são removidas ao excluir a conta demonstrativa."],
    ["link-teacher", "Vincular a um Professor", "Na conta Google real do Aluno ativo, digite o código de seis caracteres para enviar o pedido e acompanhe se está pendente, aprovado ou recusado. Na demonstração, confira a prévia fictícia antes de pedir vínculo."],
    ["academy", "Academia", "Veja professores, Instrutores e horários publicados da sua academia."],
    ["user-settings", "Preferências", "Confira tema e opções demonstrativas da conta."],
    ["user-settings", "Sua foto", "A cópia simulada da foto do Google só aparece após consentimento. Menores usam somente avatar; a foto escolhida fica apenas nesta sessão do navegador."],
    ["privacy", "Privacidade", "Na conta Google real, o primeiro acesso sem perfil pede nome, idade declarada e aceite para criar o perfil de Aluno e registrar a versão do termo e a data e hora. A demonstração continua simulada."]
  ],
  "student-unregistered": [
    ["link-teacher", "Vincular a um Professor", "Informe o código de seis caracteres, confira somente o nome do Professor e da academia e envie o pedido. O vínculo depende da aprovação. Abra a conta para rever o tutorial ou sair."],
    ["link-teacher", "Idade e avatar", "Como aluno sem registro, a faixa etária é marcada pelo Professor, sem data de nascimento. Até essa marcação, você usa somente o avatar."]
  ]
};
Object.entries(tutorialStepsByRole).forEach(([role, steps]) => {
  steps.push([
    role === "student-unregistered" ? "link-teacher" : "user-settings",
    "Sessão Google",
    "O login Google real é separado desta demonstração. Quando conectado, veja o e-mail e saia da conta Google pelo painel; sair da demonstração não encerra a sessão Google."
  ]);
  steps.push([
    role === "student-unregistered" ? "link-teacher" : "user-settings",
    "Área de risco",
    "No painel da conta, abra Área de risco e digite EXCLUIR para apagar os dados pessoais fictícios desta conta, anonimizar registros compartilhados e encerrar a sessão. A exclusão real ainda está em construção."
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
const publicScreens = ["login", "register", "link-teacher", "no-access", "instructor-invite", "real-account"];
let activeRole = null;
let activeDemoAccount = null;
let realUser = null;
let realProfile = null;
let realProfileState = "checking";
let realProfileNotice = "";
let realInstructorLink = null;
let realInstructorLinkState = "idle";
let realInstructorLinkNotice = "";
let realInstructorLinkRequestSequence = 0;
let realOnboardingHandledSessionUserId = null;
let realOnboardingStage = null;
let realOnboardingAge = null;
let realOnboardingName = "";
let realProfessorActivated = false;
let professorActivationSessionUserId = null;
let professorActivationPromise = null;
let realTeacherCode = null;
let realTeacherCodeState = "idle";
let realTeacherCodeNotice = "";
let realTeacherCodeRequestSequence = 0;
let realInstructorInvites = [];
let realInstructorInvitesState = "idle";
let realInstructorInvitesNotice = "";
let realInstructorInvitesSequence = 0;
let realInstructorInviteToken = new URLSearchParams(window.location.search).get("convite_instrutor") || "";
let realInstructorInviteUrl = "";
let realInstructorConsentPending = false;
let realStudentLinkState = "idle";
let realStudentLinkRequest = null;
let realStudentLinkNotice = "";
let realStudentLinkRequestSequence = 0;
let realTeacherLinkRequests = [];
let realTeacherLinkRequestsState = "idle";
let realTeacherLinkRequestsNotice = "";
let realTeacherLinkRequestsSequence = 0;
let realUnregisteredStudents = [];
let realUnregisteredStudentsState = "idle";
let realUnregisteredStudentsNotice = "";
let realUnregisteredStudentsSequence = 0;
let realBillingRules = [];
let realBillingCharges = [];
let realBillingPayments = [];
let realBillingStudentNames = new Map();
let realBillingStudentsState = "idle";
let realBillingStudentsNotice = "";
let realBillingStudentsRequestSequence = 0;
let realBillingUnregisteredStudents = [];
let realBillingUnregisteredStudentsState = "idle";
let realBillingUnregisteredStudentsNotice = "";
let realBillingUnregisteredStudentsRequestSequence = 0;
let realInstructorStudents = [];
let realInstructorStudentsState = "idle";
let realInstructorStudentsNotice = "";
let realInstructorStudentsRequestSequence = 0;
let realBillingGraceDays = null;
let realBillingState = "idle";
let realBillingNotice = "";
let realBillingRequestSequence = 0;
let realBillingSelectedMonth = currentDemoMonth();
let realStudentPayments = [];
let realStudentCharges = [];
let realStudentPaymentsState = "idle";
let realStudentPaymentsNotice = "";
let realStudentPaymentsRequestSequence = 0;
let realProfessorPayments = [];
let realProfessorCharges = [];
let realProfessorPaymentsState = "idle";
let realProfessorPaymentsNotice = "";
let realProfessorPaymentsRequestSequence = 0;
let realProfessorGraduationStudents = [];
let realProfessorGraduations = [];
let realProfessorGraduationsState = "idle";
let realProfessorGraduationsNotice = "";
let realProfessorGraduationsRequestSequence = 0;
let realSelectedGraduationStudentId = "";
let realStudentGraduations = [];
let realStudentGraduationsState = "idle";
let realStudentGraduationsNotice = "";
let realStudentGraduationsRequestSequence = 0;
let realPaymentUndoTimer = null;
let realCreatedAcademyId = null;
let realCreatedAcademy = null;
let realAdminAcademies = [];
let realAdminStudents = [];
let realAdminStudentsState = "idle";
let realAdminStudentsNotice = "";
let realAdminStudentsRequestSequence = 0;
let authClient = null;
let authCheckSequence = 0;
let loginNotice = "";
let realSignoutInProgress = false;
let realPasswordRecoveryPending = false;
let realEmailAuthRequestInProgress = false;
let currentScreen = "";

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
const profileOnboardingDialog = document.querySelector("#profile-onboarding");
const photoEditorDialog = document.querySelector("#photo-editor");
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
  "pix-import": "upload", "payment-review": "payment", "monthly-charges": "payment", overdue: "clock",
  "quick-actions": "actions", "teacher-chat": "message", "instructor-class": "lesson",
  "instructor-students": "people",
  "instructor-chat": "message", "admin-home": "home", "teacher-invites": "people",
  "admin-students": "people",
  academy: "academy", "user-settings": "settings", privacy: "shield"
};
const mobileNavigationLabels = {
  login: "Entrar", register: "Cadastro", "link-teacher": "Vincular",
  "student-home": "Início", "student-link": "Vínculo", "student-payments": "Pagamentos",
  "student-grades": "Graduações", "teacher-home": "Início", students: "Alunos",
  "student-detail": "Ficha", "student-create": "Novo aluno", "teacher-code": "Código", "instructor-class": "Aula",
  "instructor-students": "Alunos",
  "admin-home": "Início", "admin-students": "Alunos", "teacher-invites": "Convites", "role-management": "Papéis",
  academy: "Academia"
};

function navigationIcon(id) {
  const path = navigationIconPaths[navigationIconByScreen[id]];
  if (!path) throw new Error(`Ícone de navegação ausente: ${id}`);
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function renderNavigation() {
  const isRealStudentInstructor = isRealActiveStudent() && isRealActiveInstructor();
  const visibleGroups = isRealAdmSession()
    ? navigationGroups.filter((group) => group.roles.includes("adm"))
    : isRealProfessorProfile()
      ? navigationGroups.filter((group) => group.roles.includes("professor"))
    : isRealStudentInstructor
      ? navigationGroups.filter((group) =>
        group.roles.includes("student") || group.roles.includes("student-unregistered") || group.roles.includes("instructor"))
    : isRealActiveStudent()
      ? navigationGroups.filter((group) => group.roles.includes("student") || group.roles.includes("student-unregistered"))
    : isRealActiveInstructor()
      ? navigationGroups.filter((group) => group.roles.includes("instructor"))
    : activeRole
      ? navigationGroups.filter((group) => group.roles.includes(activeRole))
      : navigationGroups.filter((group) => group.roles.includes("public"));
  navigation.innerHTML = visibleGroups.map((group) => ({
    ...group,
    items: group.items.filter(([id]) => canViewScreen(id))
  })).filter((group) => group.items.length > 0).map((group) => `
    <section class="nav-group" aria-label="${group.title}">
      <h2 class="nav-group-title">${isRealStudentInstructor && group.title === "Treino" ? "Instrutor" : group.title}</h2>
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
  const isRealStudentInstructor = isRealActiveStudent() && isRealActiveInstructor();
  const items = isRealAdmSession()
    ? ["admin-students", "teacher-invites", "role-management", "academy"].filter(canViewScreen)
    : isRealProfessorProfile()
      ? ["teacher-code", "student-detail", "payment-review", "monthly-charges"].filter(canViewScreen)
      : isRealStudentInstructor
        ? ["link-teacher", "student-payments", "student-grades", "instructor-students"].filter(canViewScreen)
      : isRealActiveStudent()
        ? ["link-teacher", "student-payments", "student-grades"].filter(canViewScreen)
      : isRealActiveInstructor()
        ? ["instructor-students"].filter(canViewScreen)
      : activeRole
        ? (roleScreens[activeRole] || []).filter((id) => canViewScreen(id)).slice(0, 4)
        : ["login", "register", "link-teacher", "instructor-invite"].filter(canViewScreen);
  mobileNavigation.style.setProperty("--mobile-nav-items", items.length);
  mobileNavigation.innerHTML = items.map((id) => {
    const info = screenInfo[id] || { title: id, group: "" };
    const label = id === "instructor-students" && isRealStudentInstructor
      ? "Instrutor"
      : mobileNavigationLabels[id] || info.title;
    return `<button type="button" data-screen-target="${id}" aria-label="${info.title}"><span class="mobile-nav-icon">${navigationIcon(id)}</span><span class="mobile-nav-label">${label}</span></button>`;
  }).join("");
  updateToastPosition();
}

function canViewScreen(id) {
  if (isDemoMode) {
    if (id === "real-account" || realUser) return false;
    if (activeRole === null) return ["login", "register", "link-teacher", "no-access"].includes(id);
    if (id === "academy" && activeRole !== "adm" && !demoProfiles[activeDemoAccount].academyId) return false;
    if (activeRole === "instructor") {
      const profile = demoProfiles[activeDemoAccount];
      if (!profile || !authorizedInstructorNames.has(profile.name)) {
        return ["student-home", "student-payments", "student-grades", "instructor-class", "user-settings", "privacy"].includes(id);
      }
    }
    return (roleScreens[activeRole] || []).includes(id);
  }
  if (realPasswordRecoveryPending) return id === "password-recovery";
  if (activeRole !== null) return false;
  if (id === "real-account") return Boolean(realUser);
  if (!realUser) {
    return id === "login" ||
      id === "create-account" ||
      id === "forgot-password" ||
      (id === "instructor-invite" && Boolean(realInstructorInviteToken));
  }
  return (id === "link-teacher" && isRealActiveStudent()) ||
    ["no-access", "instructor-invite"].includes(id) ||
    (isRealAdmSession() && ["academy", "teacher-invites", "role-management", "admin-students"].includes(id)) ||
    (isRealProfessorProfile() && id === "teacher-code") ||
    (isRealActiveProfessor() && ["monthly-charges", "payment-review", "student-detail"].includes(id)) ||
    (isRealActiveStudent() && ["student-payments", "student-grades"].includes(id)) ||
    (isRealActiveInstructor() && id === "instructor-students");
}

function updatePhotoProfile(key, changes) {
  const previous = getPhotoProfile(key);
  const next = { ...previous, ...changes };
  if (changes.photo !== undefined && previous.photo && previous.photo.kind === "upload" &&
      previous.photo.url.startsWith("blob:") && (!next.photo || previous.photo.url !== next.photo.url)) {
    replacedPhotoUrls.push(previous.photo.url);
  }
  photoProfiles.set(key, next);
  if (key === activeDemoAccount) updateProfileAvatars(key, activeRole);
  return next;
}

function revokeReplacedPhotoUrls() {
  const activeUrls = new Set(Array.from(photoProfiles.values(), (profile) => profile.photo && profile.photo.url).filter(Boolean));
  const displayedUrls = new Set(Array.from(document.images, (image) => image.src));
  for (let index = replacedPhotoUrls.length - 1; index >= 0; index -= 1) {
    const url = replacedPhotoUrls[index];
    if (activeUrls.has(url) || displayedUrls.has(url)) continue;
    URL.revokeObjectURL(url);
    replacedPhotoUrls.splice(index, 1);
  }
}

function profilePhotoIsVisible(key) {
  const profile = getPhotoProfile(key);
  return profile.age === "adult" && profile.photo &&
    (profile.photo.kind !== "google" || profile.googleConsent);
}

function updateProfileAvatars(account, role) {
  const profile = getPhotoProfile(account);
  const photo = profilePhotoIsVisible(account) ? profile.photo : null;
  const avatarImage = demoAvatarImage(account);
  const defaultIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>';
  ["#profile-button-avatar", "#user-panel-avatar"].forEach((selector) => {
    const element = document.querySelector(selector);
    if (!element) return;
    if (!photo) {
      element.innerHTML = avatarImage
        ? `<img src="assets/avatars/${avatarImage}" alt="">`
        : defaultIcon;
      return;
    }
    element.innerHTML = `<img src="${escapeHtml(photo.url)}" alt="" style="object-position:${photo.x}% ${photo.y}%;transform:scale(${photo.zoom})">`;
  });
  const panelRole = document.querySelector("#user-panel-profile-role");
  if (panelRole && account && role) panelRole.textContent = demoProfiles[account].label;
}

function demoAvatarImage(account) {
  const profile = demoProfiles[account];
  return profile && ["avatar-masculino.jpg", "avatar-feminino.jpg"].includes(profile.avatarImage)
    ? profile.avatarImage
    : null;
}

function renderProfileOnboarding(stage) {
  const content = document.querySelector("#profile-onboarding-content");
  document.querySelector("#profile-onboarding .eyebrow").textContent = "PERFIL DE DEMONSTRAÇÃO";
  document.querySelector("#profile-onboarding-title").textContent = stage === "consent" ? "Consentimento" : "Foto e idade";
  const commonAction = (label, action) => `
    <div class="student-action-control">
      <button class="button button--primary button--action" type="button" ${action}><span data-action-label>${label}</span></button>
      <p class="login-action-error" id="profile-onboarding-error" role="alert"></p>
      <p class="field-help" id="profile-onboarding-status" role="status" aria-live="polite"></p>
    </div>
  `;
  if (stage === "age") {
    content.innerHTML = `
      <p id="profile-onboarding-copy" class="profile-onboarding-copy">No primeiro acesso desta demonstração, informe somente se tem 18 anos ou mais. Não pedimos data de nascimento.</p>
      <fieldset class="profile-onboarding-options">
        <legend class="field-label">Declaração de idade</legend>
        <label class="profile-onboarding-option"><input type="radio" name="profile-age" value="adult"><span>Tenho 18 anos ou mais</span></label>
        <label class="profile-onboarding-option"><input type="radio" name="profile-age" value="minor"><span>Sou menor de 18 anos</span></label>
      </fieldset>
      ${commonAction("Continuar", "data-confirm-profile-age")}
    `;
  } else if (stage === "consent") {
    content.innerHTML = `
      <p id="profile-onboarding-copy" class="profile-onboarding-copy"><strong>TEXTO PROVISÓRIO, pendente de revisão jurídica.</strong> Esta demonstração não baixa nem envia uma foto do Google. Se aceitar, exibiremos um avatar local como cópia simulada; se recusar, seu perfil usa o avatar padrão. Você pode recusar sem perder acesso.</p>
      <div class="profile-onboarding-actions">
        <button class="button button--primary button--action" type="button" data-consent-google="accept"><span data-action-label>Aceitar cópia simulada</span></button>
        <button class="button button--quiet button--action" type="button" data-consent-google="decline"><span data-action-label>Recusar e usar avatar</span></button>
        <p class="login-action-error" id="profile-onboarding-error" role="alert"></p>
        <p class="field-help" id="profile-onboarding-status" role="status" aria-live="polite"></p>
      </div>
    `;
  } else {
    content.innerHTML = `
      <p id="profile-onboarding-copy" class="profile-onboarding-copy">Este perfil não tem registro. O Professor informa se o aluno tem 18 anos ou mais ou é menor de 18, sem pedir data de nascimento. Até essa marcação, só aparece o avatar.</p>
      ${commonAction("Continuar com avatar", "data-continue-unregistered")}
    `;
  }
  profileOnboardingDialog.showModal();
  const firstControl = content.querySelector('input, button');
  if (firstControl) firstControl.focus();
}

function beginProfileOnboarding(account) {
  if (!isDemoMode) return;
  onboardingAccount = account;
  const profile = getPhotoProfile(account);
  const role = demoProfiles[account].role;
  const isUnregistered = account === "student-unregistered";
  if (role === "adm") {
    onboardingAccount = null;
  } else if (role === "professor") {
    try {
      const consentChoice = localStorage.getItem(professorConsentStorageKey(account));
      if (consentChoice === "accepted" || consentChoice === "declined") {
        onboardingAccount = null;
        return;
      }
    } catch (error) {
      console.error("Não foi possível consultar o consentimento demonstrativo do Professor:", error);
      showToast("Não foi possível consultar o consentimento salvo neste navegador.", "error");
    }
    renderProfileOnboarding("consent");
  } else if (isUnregistered) renderProfileOnboarding("unregistered");
  else if (profile.onboardingComplete) maybeOpenFirstTutorial(account);
  else if (profile.age === "adult") renderProfileOnboarding("consent");
  else if (profile.age === "minor") {
    updatePhotoProfile(account, { photo: null, googleConsent: false, onboardingComplete: true });
    maybeOpenFirstTutorial(account);
  } else renderProfileOnboarding("age");
}

function isRealStudentProfileCreationFlow() {
  return Boolean(realUser) && !activeRole && realProfileState === "missing" &&
    !realInstructorInviteToken && currentScreen !== "instructor-invite";
}

function renderRealProfileOnboarding(stage) {
  const content = document.querySelector("#profile-onboarding-content");
  const isStudentProfileFlow = isRealStudentProfileCreationFlow();
  document.querySelector("#profile-onboarding .eyebrow").textContent = "PRIMEIRO ACESSO";
  document.querySelector("#profile-onboarding-title").textContent =
    stage === "age"
      ? (isStudentProfileFlow ? "Nome e idade declarada" : "Idade declarada")
      : "Consentimento e privacidade";
  realOnboardingStage = stage;
  if (stage === "age") {
    const ageCopy = isStudentProfileFlow
      ? "Informe seu nome e declare se tem 18 anos ou mais. Nome e idade ficam nesta sessão até você aceitar o termo."
      : "Para continuar, declare se tem 18 anos ou mais. A resposta vale somente nesta sessão e não é enviada ao banco.";
    content.innerHTML = `
      <p id="profile-onboarding-copy" class="profile-onboarding-copy">${ageCopy}</p>
      ${isStudentProfileFlow ? `
        <div class="field">
          <label for="real-profile-onboarding-name">Nome</label>
          <input id="real-profile-onboarding-name" name="nome" type="text" autocomplete="off" required value="${escapeHtml(realOnboardingName)}">
        </div>
      ` : ""}
      <fieldset class="profile-onboarding-options">
        <legend class="field-label">Declaração de idade</legend>
        <label class="profile-onboarding-option"><input type="radio" name="profile-age" value="adult"><span>Tenho 18 anos ou mais</span></label>
        <label class="profile-onboarding-option"><input type="radio" name="profile-age" value="minor"><span>Sou menor de 18 anos</span></label>
      </fieldset>
      <div class="student-action-control">
        <button class="button button--primary button--action" type="button" data-real-onboarding-action="age"><span data-action-label>Continuar</span></button>
        <p class="login-action-error" id="profile-onboarding-error" role="alert"></p>
        <p class="field-help" id="profile-onboarding-status" role="status" aria-live="polite"></p>
      </div>
    `;
  } else {
    const role = realProfileState === "found" && realProfile ? realProfile.papel : null;
    const consentCopy = role === "professor"
      ? "Rascunho feito sem revisão jurídica; não declara conformidade legal. Ao continuar, seu consentimento será registrado no banco, associado à versão deste termo e à data e hora do aceite. Finalidades, bases legais e retenção ainda precisam ser confirmadas. Consulte a página de privacidade antes de continuar."
      : isStudentProfileFlow
        ? "Rascunho feito sem revisão jurídica; não declara conformidade legal. Ao aceitar, será criado seu perfil de Aluno e registrado o consentimento com o identificador do perfil, a versão deste termo e a data e hora do aceite. Finalidades, bases legais e retenção ainda precisam ser confirmadas. Consulte a página de privacidade antes de continuar."
        : role === "aluno"
          ? "Rascunho feito sem revisão jurídica; não declara conformidade legal. Para este perfil já existente, esta tela não registra uma nova resposta. Finalidades, bases legais e retenção ainda precisam ser confirmadas. Consulte a página de privacidade antes de continuar."
        : "Rascunho feito sem revisão jurídica; não declara conformidade legal. Se você aceitar um convite de Instrutor, o registro ocorrerá após o convite ser consumido. Finalidades, bases legais e retenção ainda precisam ser confirmadas. Consulte a página de privacidade antes de continuar.";
    content.innerHTML = `
      <p id="profile-onboarding-copy" class="profile-onboarding-copy">${consentCopy}</p>
      <div class="profile-onboarding-actions">
        <button class="button button--primary button--action" type="button" data-real-onboarding-action="continue"><span data-action-label>Aceitar e continuar</span></button>
        <p class="login-action-error" id="profile-onboarding-error" role="alert"></p>
        <p class="field-help" id="profile-onboarding-status" role="status" aria-live="polite"></p>
      </div>
    `;
  }
  profileOnboardingDialog.showModal();
  const firstControl = content.querySelector('input, button');
  if (firstControl) firstControl.focus();
}

function maybeOpenRealProfileOnboarding() {
  if (activeRole || !realUser) return;
  const role = realProfileState === "found" && realProfile ? realProfile.papel : null;
  if (role === "adm") {
    if (realOnboardingStage && profileOnboardingDialog.open) profileOnboardingDialog.close();
    realOnboardingHandledSessionUserId = realUser.id;
    realOnboardingStage = null;
    realOnboardingAge = null;
    realOnboardingName = "";
    return;
  }
  if (realOnboardingHandledSessionUserId === realUser.id) {
    if (role === "professor" && realOnboardingStage === "age") {
      realOnboardingAge = null;
      renderRealProfileOnboarding("consent");
    }
    return;
  }
  realOnboardingHandledSessionUserId = realUser.id;
  realOnboardingAge = null;
  realOnboardingName = getPendingRealSignupName();
  renderRealProfileOnboarding(role === "professor" ? "consent" : "age");
}

async function registerRealConsent() {
  if (!authClient || !realUser) {
    recordDiagnostic("Erro ao registrar consentimento");
    return "erro";
  }
  try {
    const { data, error } = await authClient.rpc("registrar_consentimento", {
      p_versao: CONSENT_TERM_VERSION
    });
    if (error) {
      recordDiagnostic("Erro ao registrar consentimento");
      return "erro";
    }
    if (data === "ok" || data === "nao_autenticado") return data;
    recordDiagnostic("Resposta inesperada ao registrar consentimento");
    return "erro";
  } catch {
    recordDiagnostic("Erro ao registrar consentimento");
    return "erro";
  }
}

async function createRealStudentProfileAndConsent(name, age) {
  if (!authClient || !realUser) return "erro";
  const userId = realUser.id;
  try {
    const { data, error } = await authClient.rpc("criar_perfil_aluno", {
      p_nome: name,
      p_idade_declarada: age,
      p_versao: CONSENT_TERM_VERSION
    });
    if (error) {
      recordDiagnostic("Erro ao criar perfil de Aluno");
      return "erro";
    }
    if (data !== "ok" && data !== "perfil_ja_existe") {
      if (["nao_autenticado", "email_nao_confirmado", "email_convidado_professor", "nome_invalido"].includes(data)) {
        return data;
      }
      recordDiagnostic("Resposta inesperada ao criar perfil de Aluno");
      return "erro";
    }
    if (!realUser || realUser.id !== userId || activeRole) return "erro";

    const { data: profile, error: profileError } = await authClient.from("perfis")
      .select("id,papel,nome,academia_id,ativo,idade_declarada")
      .eq("id", userId)
      .maybeSingle();
    if (profileError || !profile) {
      recordDiagnostic("Erro ao consultar perfil de Aluno");
      return "erro";
    }
    realProfile = profile;
    realProfileState = "found";
    realProfileNotice = "";
    clearPendingRealSignupName();
    renderNavigation();
    return data;
  } catch {
    recordDiagnostic("Erro ao criar perfil de Aluno");
    return "erro";
  }
}

function finishRealProfileOnboarding() {
  if (profileOnboardingDialog.open) profileOnboardingDialog.close();
  realOnboardingHandledSessionUserId = realUser ? realUser.id : null;
  realOnboardingStage = null;
  realOnboardingAge = null;
  realOnboardingName = "";
}

function finishProfileOnboarding() {
  const account = onboardingAccount;
  const openedFromSettings = onboardingFromSettings;
  onboardingAccount = null;
  onboardingFromSettings = false;
  if (profileOnboardingDialog.open) profileOnboardingDialog.close();
  if (account) updateProfileAvatars(account, activeRole);
  if (openedFromSettings) {
    if (activeDemoAccount === account && currentScreen === "user-settings") renderScreen("user-settings");
  } else if (account && demoProfiles[account].role !== "adm" && demoProfiles[account].role !== "professor") {
    if (currentScreen) renderScreen(currentScreen);
    maybeOpenFirstTutorial(account);
  } else if (account && currentScreen) {
    renderScreen(currentScreen);
  }
  revokeReplacedPhotoUrls();
}

function startDemoRole(account) {
  if (!isDemoMode) return;
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
  syncRealSessionPanel();
  updateProfileAvatars(account, activeRole);
  renderNavigation();
  renderScreen(profile.start);
  beginProfileOnboarding(account);
}

function endDemoRole() {
  activeRole = null;
  activeDemoAccount = null;
  const profileName = document.querySelector("#user-panel-profile-name");
  const profileRole = document.querySelector("#user-panel-profile-role");
  const roleBadge = document.querySelector(".profile-button-copy");
  if (profileName) profileName.textContent = "Sem sessão ativa";
  if (profileRole) profileRole.textContent = "Perfil demonstrativo";
  updateProfileAvatars(null, null);
  if (roleBadge) roleBadge.innerHTML = "<strong>Entrar</strong><small>Sem sessão ativa</small>";
  document.querySelector("#profile-button").hidden = !realUser;
  document.querySelectorAll(".user-panel-link").forEach((link) => {
    link.hidden = false;
  });
  document.querySelector(".user-panel-links[aria-label='Navegação da conta']").hidden = false;
  syncRealSessionPanel();
  userPanel.close();
  renderNavigation();
  renderScreen(realUser ? "real-account" : "login");
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

function getPhotoProfile(key) {
  return key ? photoProfiles.get(key) || { age: "unknown", googleConsent: false, photo: null } : { age: "unknown", googleConsent: false, photo: null };
}

function avatar(image = "avatar-masculino.jpg", alt = "Avatar genérico de demonstração", photoKey = null, personKind = "student", className = "") {
  const profile = getPhotoProfile(photoKey);
  const photoIsVisible = !(activeRole === "adm" && personKind === "student") &&
    profile.age === "adult" && profile.photo &&
    (profile.photo.kind !== "google" || profile.googleConsent);
  const avatarImage = demoAvatarImage(photoKey);
  const source = photoIsVisible ? profile.photo.url : `assets/avatars/${avatarImage || image}`;
  const photoStyle = photoIsVisible
    ? ` style="object-position:${profile.photo.x}% ${profile.photo.y}%;transform:scale(${profile.photo.zoom})"`
    : "";
  return `<span class="avatar ${className}"><img src="${escapeHtml(source)}" alt="${escapeHtml(photoIsVisible ? "Foto de perfil demonstrativa" : alt)}"${photoStyle}></span>`;
}

function personRow(name, detail, image = "avatar-masculino.jpg", badge = "", photoKey = null, personKind = "student") {
  return `
    <div class="person-row">
      ${avatar(image, "Avatar genérico de demonstração", photoKey, personKind)}
      <span class="person-copy"><strong>${name}</strong><small>${detail}</small></span>
      ${badge}
    </div>
  `;
}

function studentAcademyDetails(account, student = null) {
  const profile = demoProfiles[account];
  const rosterProfile = student || demoRoster.find((item) => item.account === account);
  const teacherAccount = profile && profile.teacherAccount || rosterProfile && rosterProfile.teacherAccount;
  const teacher = teacherAccount && demoProfiles[teacherAccount];
  return `
    <div class="student-academy-details">
      ${listRow("Academia", teacher ? escapeHtml(demoAcademy.name) : "Sem academia vinculada")}
      ${listRow("Professor", teacher ? escapeHtml(teacher.name) : deletedDemoAccounts.has(teacherAccount) ? "Conta excluída" : "Sem Professor vinculado")}
    </div>
  `;
}

function profilePhotoCard(account, role) {
  const photoProfile = getPhotoProfile(account);
  const defaultAvatar = role === "instructor" ? "avatar-feminino.jpg" : "avatar-masculino.jpg";
  const selectedAvatar = demoAvatarImage(account) || defaultAvatar;
  const photoDescription = photoProfile.photo
    ? photoProfile.photo.kind === "google" ? "Foto Google simulada, sem imagem externa." : "Foto própria temporária, somente nesta sessão."
    : "Avatar de demonstração.";
  return panel("Foto e idade", `
    <div class="profile-photo-card">
      ${avatar(defaultAvatar, "Avatar do perfil", account, "self", "avatar--large")}
      <div class="profile-photo-copy">
        <strong>${photoProfile.age === "adult" ? "Declaração: 18 anos ou mais" : photoProfile.age === "minor" ? "Declaração: menor de 18 anos" : "Idade ainda não informada"}</strong>
        <small>${photoDescription}</small>
      </div>
    </div>
    <div class="field profile-avatar-choice">
      <label for="profile-avatar-choice">Escolha do avatar</label>
      <select id="profile-avatar-choice" data-demo-avatar-choice aria-describedby="profile-avatar-choice-help profile-avatar-choice-error profile-avatar-choice-status">
        <option value="avatar-masculino.jpg" ${selectedAvatar === "avatar-masculino.jpg" ? "selected" : ""}>Masculino</option>
        <option value="avatar-feminino.jpg" ${selectedAvatar === "avatar-feminino.jpg" ? "selected" : ""}>Feminino</option>
      </select>
      <small class="field-help" id="profile-avatar-choice-help">É somente a escolha de uma imagem; menores continuam usando apenas avatar.</small>
      <p class="login-action-error" id="profile-avatar-choice-error" role="alert"></p>
      <p class="field-help" id="profile-avatar-choice-status" role="status" aria-live="polite"></p>
    </div>
    ${photoProfile.age === "adult" ? `
      <div class="profile-photo-actions">
        <div class="profile-photo-control">
          <input id="profile-photo-file" class="visually-hidden" type="file" accept="image/*" aria-label="Escolher foto própria" aria-describedby="profile-photo-select-error profile-photo-select-status">
          <button class="button button--primary button--action" type="button" data-open-photo-file><span data-action-label>Escolher foto própria</span></button>
          <p class="login-action-error" id="profile-photo-select-error" role="alert"></p>
          <p class="field-help" id="profile-photo-select-status" role="status" aria-live="polite"></p>
        </div>
        <div class="profile-photo-control">
          <button class="button button--quiet button--action" type="button" data-review-photo-consent><span data-action-label>Rever consentimento Google</span></button>
          <p class="login-action-error" id="profile-photo-consent-error" role="alert"></p>
          <p class="field-help" id="profile-photo-consent-status" role="status" aria-live="polite"></p>
        </div>
        <div class="profile-photo-control">
          <button class="button button--quiet button--action" type="button" data-remove-profile-photo ${photoProfile.photo ? "" : "disabled"}><span data-action-label>Remover foto</span></button>
          <p class="login-action-error" id="profile-photo-remove-error" role="alert"></p>
          <p class="field-help" id="profile-photo-remove-status" role="status" aria-live="polite"></p>
        </div>
      </div>
      <p class="field-help">A foto escolhida fica só na memória desta sessão, sem envio ou armazenamento permanente.</p>
    ` : `<div class="notice notice--info profile-photo-restriction">${photoProfile.age === "minor" ? "Menores de 18 anos usam somente avatar; não há envio nem cópia de foto." : "Sem data de nascimento. Alunos sem registro têm a idade marcada pelo Professor."}</div>`}
    <p class="field-help">A declaração de idade e o consentimento são demonstrativos e não ficam salvos após esta sessão.</p>
  `);
}

function updatePhotoCropPreview() {
  const image = document.querySelector("#photo-editor-image");
  const zoomInput = document.querySelector("#photo-editor-zoom");
  const xInput = document.querySelector("#photo-editor-x");
  const yInput = document.querySelector("#photo-editor-y");
  if (!image || !zoomInput || !xInput || !yInput) return;
  image.style.objectPosition = `${xInput.value}% ${yInput.value}%`;
  image.style.transform = `scale(${zoomInput.value})`;
  zoomInput.setAttribute("aria-valuetext", `Zoom ${Number(zoomInput.value).toFixed(2)}x`);
}

function openPhotoEditor(file) {
  if (photoEditorUrl) URL.revokeObjectURL(photoEditorUrl);
  photoEditorUrl = URL.createObjectURL(file);
  photoEditorFile = file;
  photoEditorAccount = activeDemoAccount;
  document.querySelector("#photo-editor-image").src = photoEditorUrl;
  document.querySelector("#photo-editor-zoom").value = "1";
  document.querySelector("#photo-editor-x").value = "50";
  document.querySelector("#photo-editor-y").value = "50";
  document.querySelector("#photo-editor-error").textContent = "";
  document.querySelector("#photo-editor-status").textContent = "";
  updatePhotoCropPreview();
  photoEditorDialog.showModal();
  document.querySelector("#photo-editor-zoom").focus();
}

function closePhotoEditor() {
  if (photoEditorDialog.open) photoEditorDialog.close();
  if (photoEditorUrl) URL.revokeObjectURL(photoEditorUrl);
  photoEditorUrl = "";
  photoEditorFile = null;
  photoEditorAccount = null;
}

function chooseImageFile(input) {
  input.value = "";
  return new Promise((resolve) => {
    let settled = false;
    let focusTimer = 0;
    const finish = (file) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(focusTimer);
      window.removeEventListener("focus", onFocus);
      input.removeEventListener("change", onChange);
      input.removeEventListener("cancel", onCancel);
      resolve(file);
    };
    const onChange = () => finish(input.files && input.files[0] || null);
    const onCancel = () => finish(null);
    const onFocus = () => {
      focusTimer = window.setTimeout(() => {
        if (!input.files || !input.files.length) finish(null);
      }, 250);
    };
    input.addEventListener("change", onChange, { once: true });
    input.addEventListener("cancel", onCancel, { once: true });
    window.addEventListener("focus", onFocus, { once: true });
    input.click();
  });
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
  const student = demoRoster[rosterIndex] || null;
  const filterStatus = student && student.status === "locked" ? "locked" : student && student.account ? "active" : "no-access";
  return `
    <div class="student-entry" data-student-entry data-student-name="${escapeHtml(name.toLocaleLowerCase("pt-BR"))}" data-student-status="${filterStatus}">
      ${personRow(escapeHtml(name), "Perfil fictício", image, `<span class="badge ${status}">${detail}</span>`, student, "student")}
      <span class="student-entry-note">Mensalidade e vencimento: —</span>
      <button class="button button--small button--quiet" type="button" data-screen-target="student-detail" data-roster-index="${rosterIndex}"><span>Abrir ficha</span></button>
    </div>
  `;
}

function filterDemoStudentEntries() {
  const search = screenContent.querySelector("[data-student-search]");
  const selectedFilter = screenContent.querySelector('[data-student-filter][aria-pressed="true"]');
  if (!search || !selectedFilter) return;
  const query = search.value.trim().toLocaleLowerCase("pt-BR");
  const status = selectedFilter.dataset.studentFilter;
  screenContent.querySelectorAll("[data-student-entry]").forEach((entry) => {
    const matchesName = entry.dataset.studentName.includes(query);
    const matchesStatus = status === "all" || entry.dataset.studentStatus === status;
    entry.hidden = !matchesName || !matchesStatus;
  });
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
      ${type === "email" ? '<span class="email-preview" aria-hidden="true" hidden></span>' : ""}
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

function privateNotesForStudent(student) {
  const studentIndex = demoRoster.indexOf(student);
  return demoPrivateNotes
    .filter((note) => note.professorAccount === activeDemoAccount &&
      note.studentIndex === studentIndex && note.studentName === student.name &&
      note.studentAccount === student.account)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt) || second.id.localeCompare(first.id));
}

function renderDemoPrivateNotes(student) {
  const notes = student ? privateNotesForStudent(student) : [];
  return `
    <div class="private-notes">
      <p class="notice notice--info">Só o Professor responsável vê estas notas. Elas ficam salvas apenas nesta demonstração, neste navegador.</p>
      ${student ? `
        <form class="private-note-form" data-demo-private-note-form novalidate>
          <div class="field">
            <label for="demo-private-note">Nova nota privada</label>
            <textarea id="demo-private-note" data-private-note-input maxlength="500" aria-describedby="demo-private-note-counter"></textarea>
            <small class="field-help private-note-counter" id="demo-private-note-counter" data-private-note-counter aria-live="polite">0/500 caracteres</small>
          </div>
          <div class="student-action-control">
            <button class="button button--primary button--action" type="submit" data-save-demo-private-note aria-describedby="demo-private-note-error demo-private-note-status">
              <span data-action-label>Salvar nota</span>
            </button>
            <p class="login-action-error student-action-error" id="demo-private-note-error" data-private-note-error role="alert"></p>
            <p class="field-help" id="demo-private-note-status" data-private-note-status role="status" aria-live="polite"></p>
          </div>
        </form>
        ${notes.length
          ? `<ol class="private-note-list" aria-label="Notas privadas salvas">${notes.map((note) => `
            <li class="private-note-entry">
              <div>
                <time datetime="${escapeHtml(note.createdAt)}">${escapeHtml(formatDemoDate(note.createdAt))}</time>
                <p class="private-note-text">${escapeHtml(note.text)}</p>
              </div>
              <div class="student-action-control private-note-actions">
                <button class="button button--quiet button--action" type="button" data-delete-private-note="${escapeHtml(note.id)}" aria-describedby="private-note-error-${escapeHtml(note.id)} private-note-status-${escapeHtml(note.id)}">
                  <span data-action-label>Excluir</span>
                </button>
                <p class="login-action-error student-action-error" id="private-note-error-${escapeHtml(note.id)}" data-private-note-error role="alert"></p>
                <p class="field-help" id="private-note-status-${escapeHtml(note.id)}" data-private-note-status role="status" aria-live="polite"></p>
              </div>
            </li>
          `).join("")}</ol>`
          : '<div class="empty-state"><div><strong>Nenhuma nota salva</strong><p>As notas adicionadas para este aluno aparecerão aqui.</p></div></div>'}
      ` : '<div class="empty-state"><div><strong>Nenhum aluno da turma</strong><p>Selecione um aluno vinculado para registrar uma nota.</p></div></div>'}
    </div>
  `;
}

function formatDemoDate(value) {
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function demoAccountDisplayName(account) {
  if (deletedDemoAccounts.has(account)) return "Conta excluída";
  const profile = demoProfiles[account];
  return profile ? profile.name : "Conta indisponível";
}

function demoTeacherAccountFor(account, profile) {
  if (profile.role === "instructor") return profile.teacherAccount;
  const rosterStudent = demoRoster.find((student) => student.account === account);
  return rosterStudent && rosterStudent.teacherAccount || profile.teacherAccount;
}

function demoChatPartners(account) {
  const profile = demoProfiles[account];
  if (!profile) return [];
  if (profile.role === "professor") {
    return Object.entries(demoProfiles)
      .filter(([candidate, candidateProfile]) =>
        candidate !== account && ["student", "instructor"].includes(candidateProfile.role) &&
        demoTeacherAccountFor(candidate, candidateProfile) === account
      )
      .map(([candidate]) => candidate);
  }
  if (!["student", "instructor"].includes(profile.role)) return [];
  const teacherAccount = demoTeacherAccountFor(account, profile);
  return teacherAccount && demoProfiles[teacherAccount] && demoProfiles[teacherAccount].role === "professor"
    ? [teacherAccount]
    : [];
}

function demoConversationFor(firstAccount, secondAccount) {
  const participants = [firstAccount, secondAccount].sort();
  const id = participants.join("::");
  return demoConversations.find((conversation) => conversation.id === id);
}

function renderDemoConversation(firstAccount, secondAccount) {
  const conversation = demoConversationFor(firstAccount, secondAccount);
  if (!conversation || !conversation.messages.length) {
    return '<div class="empty-state"><div><strong>Nenhuma mensagem ainda</strong><p>As mensagens enviadas ficam salvas somente neste navegador.</p></div></div>';
  }
  return `<div class="chat-thread" role="log" aria-live="polite" aria-label="Mensagens da conversa">
    ${conversation.messages.map((message) => {
      const ownMessage = message.senderAccount === activeDemoAccount;
      return `<div class="chat-bubble chat-bubble--${ownMessage ? "out" : "in"}"><strong>${escapeHtml(ownMessage ? "Você" : demoAccountDisplayName(message.senderAccount))}</strong><p>${escapeHtml(message.text)}</p></div>`;
    }).join("")}
  </div>`;
}

function renderDemoConversationForm(partnerAccount) {
  const partnerName = demoAccountDisplayName(partnerAccount);
  return `
    <form data-demo-form data-conversation-form data-chat-partner="${escapeHtml(partnerAccount)}" class="chat-form">
      <input class="search-input" type="text" required data-chat-message placeholder="Escreva uma mensagem" aria-label="Mensagem para ${escapeHtml(partnerName)}">
      <div class="student-action-control">
        <button class="button button--primary button--action" type="submit" data-conversation-send aria-describedby="demo-chat-error demo-chat-status"><span data-action-label>Enviar</span></button>
        <div class="login-action-error student-action-error" id="demo-chat-error" role="alert" aria-atomic="true"></div>
      </div>
      <div class="visually-hidden" id="demo-chat-status" role="status" aria-live="polite" aria-atomic="true"></div>
    </form>
  `;
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
      if (type === "instructor") return demoProfiles[recipient.id] && demoProfiles[recipient.id].role === "instructor";
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
  if (!isDemoMode) throw new Error("Os convites fictícios só podem ser salvos na demonstração.");
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
  const charge = monthlyCharges.find((item) => item.id === payment.chargeId);
  const amountCents = parseDemoPaymentCents(payment.amount);
  const outstandingCents = charge
    ? Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge))
    : null;
  const matches = charge
    ? amountCents !== null && amountCents > 0 && amountCents <= outstandingCents
    : amountCents === 15000 && payment.date === "01/11/2026";
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
        <div><span class="eyebrow">COBRANÇA</span><strong>${charge ? `Saldo: ${formatDemoCents(outstandingCents)}` : "Valor: R$ 150,00"}</strong><small>Vencimento: ${charge ? escapeHtml(formatDemoDate(charge.dueDate)) : "01/11/2026"}</small></div>
        <span class="badge ${matches ? "badge--green" : "badge--red"}">${matches ? "CONFERE" : "DIVERGE"}</span>
      </div>
      ${pending ? `<p class="payment-proof" data-proof>Comprovante temporário recebido; será apagado após a confirmação.</p>
        <div class="row-actions">
          ${teacherPaymentButton("Confirmar", "comprovante-confirmar", "button button--small button--primary", "data-confirm-payment")}
          ${teacherPaymentButton("Recusar", "comprovante-recusar", "button button--small button--danger", "data-reject-payment")}
        </div>
        ${matches ? "" : '<p class="field-help">O valor informado não corresponde ao saldo disponível desta cobrança; confira manualmente antes de decidir.</p>'}
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

function parseDemoPaymentCents(amount) {
  let value;
  if (typeof amount === "number") {
    value = String(amount);
  } else if (typeof amount === "string") {
    value = amount.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  } else {
    return null;
  }
  if (value.includes(",")) value = value.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function currentDemoMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDemoCents(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function demoTodayIsoDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDemoDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function demoMonthDistance(startMonth, targetMonth) {
  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  const [targetYear, targetMonthNumber] = targetMonth.split("-").map(Number);
  return (targetYear - startYear) * 12 + targetMonthNumber - startMonthNumber;
}

function billingSettingFor(studentKey, professorAccount = activeDemoAccount) {
  return billingSettings.find((setting) =>
    setting.studentKey === studentKey && setting.professorAccount === professorAccount
  ) || null;
}

function billingGraceDaysFor(professorAccount = activeDemoAccount) {
  return billingGraceDaysByProfessor.has(professorAccount)
    ? billingGraceDaysByProfessor.get(professorAccount)
    : 5;
}

function billingSettingApplies(setting, month) {
  if (!setting || setting.discountType === "none") return false;
  const distance = demoMonthDistance(setting.startMonth, month);
  if (distance < 0) return false;
  if (setting.duration === "this-month") return distance === 0;
  if (setting.duration === "months") return distance < setting.durationMonths;
  return setting.duration === "until-removed";
}

function billingAmountsFor(setting, month) {
  if (!setting) return null;
  const applies = billingSettingApplies(setting, month);
  let discountAmountCents = 0;
  let status = "aberta";
  if (applies && setting.discountType === "exempt") {
    discountAmountCents = setting.baseAmountCents;
    status = "isenta";
  } else if (applies && setting.discountType === "fixed") {
    discountAmountCents = Math.min(setting.baseAmountCents, setting.discountValue);
  } else if (applies && setting.discountType === "percent") {
    discountAmountCents = Math.min(setting.baseAmountCents, Math.round(setting.baseAmountCents * setting.discountValue / 100));
  }
  if (discountAmountCents >= setting.baseAmountCents && setting.baseAmountCents > 0) status = "isenta";
  return {
    baseAmountCents: setting.baseAmountCents,
    discountAmountCents,
    finalAmountCents: Math.max(0, setting.baseAmountCents - discountAmountCents),
    status,
    discountType: applies ? setting.discountType : "none",
    discountValue: applies ? setting.discountValue : 0,
    duration: setting.duration,
    durationMonths: setting.durationMonths,
    exemptionReason: applies && setting.discountType === "exempt" ? setting.exemptionReason : ""
  };
}

function chargePaymentsFor(chargeId) {
  return [...cashPayments, ...receiptPayments].filter((payment) => payment.chargeId === chargeId);
}

function chargeConfirmedCents(charge) {
  return chargePaymentsFor(charge.id)
    .filter((payment) => payment.status === "confirmed")
    .reduce((total, payment) => total + (parseDemoPaymentCents(payment.amount) || 0), 0);
}

function chargePendingCents(charge) {
  return chargePaymentsFor(charge.id)
    .filter((payment) => payment.status === "pending")
    .reduce((total, payment) => total + (parseDemoPaymentCents(payment.amount) || 0), 0);
}

function chargeHasPendingPayment(chargeId) {
  return chargePaymentsFor(chargeId).some((payment) => payment.status === "pending");
}

function chargeHasActivePayment(chargeId) {
  return chargePaymentsFor(chargeId).some((payment) =>
    ["pending", "confirmed"].includes(payment.status)
  );
}

function refreshMonthlyChargeStatus(charge) {
  if (charge.status === "cancelada" || charge.status === "isenta") return;
  charge.status = charge.finalAmountCents > 0 && chargeConfirmedCents(charge) >= charge.finalAmountCents
    ? "paga"
    : "aberta";
}

function monthlyChargeIsLate(charge, today = demoTodayIsoDate()) {
  return charge.status === "aberta" &&
    today > addDemoDays(charge.dueDate, billingGraceDaysFor(charge.professorAccount));
}

function studentCanSeeCharge(charge, account) {
  return charge.studentAccount === account && Boolean(charge.sentOn) && charge.status !== "cancelada";
}

function monthlyChargeMessage(charge) {
  return `Olá, ${charge.studentName}! Sua mensalidade é ${formatDemoCents(charge.finalAmountCents)}, com vencimento em ${formatDemoDate(charge.dueDate)}.`;
}

function studentBillingKey(student) {
  return String(demoRoster.indexOf(student));
}

function formatDemoPaymentTotal(payments) {
  const amounts = payments.map((payment) => parseDemoPaymentCents(payment.amount));
  if (amounts.some((amount) => amount === null)) return "R$ —";
  const cents = amounts.reduce((total, amount) => total + amount, 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function billingStudentsForTeacher(teacherAccount) {
  return demoRoster.filter((student) =>
    student.teacherAccount === teacherAccount && student.status !== "locked" &&
    student.name !== "Conta excluída"
  );
}

function chargesForTeacherMonth(teacherAccount, month) {
  return monthlyCharges.filter((charge) =>
    charge.professorAccount === teacherAccount && charge.month === month
  );
}

function monthlyBillingSummary(teacherAccount, month) {
  const charges = chargesForTeacherMonth(teacherAccount, month);
  const eligible = charges.filter((charge) => charge.status !== "cancelada");
  const open = eligible.filter((charge) => charge.status === "aberta" && !monthlyChargeIsLate(charge));
  const late = eligible.filter((charge) => monthlyChargeIsLate(charge));
  const exempt = eligible.filter((charge) => charge.status === "isenta");
  return {
    expectedCents: eligible.reduce((total, charge) => total + charge.finalAmountCents, 0),
    confirmedCents: eligible.reduce((total, charge) => total + chargeConfirmedCents(charge), 0),
    pendingCents: eligible.reduce((total, charge) => total + chargePendingCents(charge), 0),
    openCents: open.reduce((total, charge) => total + Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge)), 0),
    lateCents: late.reduce((total, charge) => total + Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge)), 0),
    exemptCents: exempt.reduce((total, charge) => total + charge.baseAmountCents, 0),
    exemptCount: exempt.length
  };
}

function renderBillingMetrics(summary) {
  return `
    ${metric("PREVISTO", formatDemoCents(summary.expectedCents), "Cobranças do mês, sem canceladas", "gold")}
    ${metric("CONFIRMADO", formatDemoCents(summary.confirmedCents), "Pagamentos confirmados pelo Professor", "green")}
    ${metric("AGUARDANDO CONFIRMAÇÃO", formatDemoCents(summary.pendingCents), "Avisos vinculados a cobranças", "amber")}
    ${metric("EM ABERTO", formatDemoCents(summary.openCents), "Saldo dentro do prazo", "gold")}
    ${metric("ATRASADO", formatDemoCents(summary.lateCents), "Saldo após vencimento e carência", "red")}
    ${metric("ISENTO", formatDemoCents(summary.exemptCents), `${summary.exemptCount} cobrança(s) isenta(s)`, "amber")}
  `;
}

function renderBillingConfigRow(student, month) {
  const studentKey = studentBillingKey(student);
  const setting = billingSettingFor(studentKey, activeDemoAccount);
  const existingCharge = monthlyCharges.some((charge) =>
    charge.studentKey === studentKey && charge.professorAccount === activeDemoAccount && charge.month === month
  );
  const fixedDiscount = setting && setting.discountType === "fixed"
    ? (setting.discountValue / 100).toFixed(2)
    : "";
  const discountValue = setting && setting.discountType === "percent"
    ? String(setting.discountValue)
    : fixedDiscount;
  const canGenerate = Boolean(setting && !existingCharge);
  const fieldPrefix = `billing-${studentKey}`;
  return `
    <fieldset class="billing-student-row" data-billing-student="${escapeHtml(studentKey)}">
      <legend>${escapeHtml(student.name)}</legend>
      <label class="billing-student-select">
        <input type="checkbox" data-billing-select ${canGenerate ? "checked" : ""} ${existingCharge || student.status === "locked" ? "disabled" : ""}>
        <span>${existingCharge ? "Cobrança já gerada para este mês" : "Incluir no lote deste mês"}</span>
      </label>
      <div class="form-grid">
        <div class="field"><label for="${fieldPrefix}-base">Valor-base mensal (R$)</label><input id="${fieldPrefix}-base" type="number" min="0.01" step="0.01" data-billing-base value="${setting ? (setting.baseAmountCents / 100).toFixed(2) : ""}"></div>
        <div class="field"><label for="${fieldPrefix}-due-day">Dia de vencimento (1 a 28)</label><input id="${fieldPrefix}-due-day" type="number" min="1" max="28" step="1" data-billing-due-day value="${setting ? setting.dueDay : ""}"></div>
        <div class="field"><label for="${fieldPrefix}-discount-type">Desconto ou isenção</label><select id="${fieldPrefix}-discount-type" data-billing-discount-type>
          <option value="none" ${!setting || setting.discountType === "none" ? "selected" : ""}>Sem desconto</option>
          <option value="fixed" ${setting && setting.discountType === "fixed" ? "selected" : ""}>Desconto em R$</option>
          <option value="percent" ${setting && setting.discountType === "percent" ? "selected" : ""}>Desconto em %</option>
          <option value="exempt" ${setting && setting.discountType === "exempt" ? "selected" : ""}>Isenção</option>
        </select></div>
        <div class="field"><label for="${fieldPrefix}-discount-value">Valor do desconto</label><input id="${fieldPrefix}-discount-value" type="number" min="0" step="0.01" data-billing-discount-value value="${discountValue}" aria-describedby="billing-discount-help"></div>
        <div class="field"><label for="${fieldPrefix}-duration">Duração</label><select id="${fieldPrefix}-duration" data-billing-duration>
          <option value="this-month" ${!setting || setting.duration === "this-month" ? "selected" : ""}>Só este mês</option>
          <option value="months" ${setting && setting.duration === "months" ? "selected" : ""}>N meses</option>
          <option value="until-removed" ${setting && setting.duration === "until-removed" ? "selected" : ""}>Até remover</option>
        </select></div>
        <div class="field"><label for="${fieldPrefix}-duration-months">Número de meses</label><input id="${fieldPrefix}-duration-months" type="number" min="1" step="1" data-billing-duration-months value="${setting && setting.durationMonths ? setting.durationMonths : ""}" aria-describedby="billing-duration-help"></div>
      </div>
      <div class="field"><label for="${fieldPrefix}-reason">Motivo opcional da isenção</label><textarea id="${fieldPrefix}-reason" data-billing-exemption-reason maxlength="300" aria-describedby="billing-sensitive-warning">${setting ? escapeHtml(setting.exemptionReason) : ""}</textarea></div>
    </fieldset>
  `;
}

function renderMonthlyChargeRow(charge, canCancel = false) {
  const late = monthlyChargeIsLate(charge);
  const statusLabel = charge.status === "paga"
    ? "PAGA"
    : charge.status === "isenta"
      ? "ISENTA"
      : charge.status === "cancelada"
        ? "CANCELADA"
        : late ? "ATRASADA" : "EM ABERTO";
  const statusClass = charge.status === "paga" ? "badge--green"
    : charge.status === "isenta" ? "badge--amber"
      : charge.status === "cancelada" ? "badge--red"
        : late ? "badge--red" : "badge--pending";
  const discountLabel = charge.discountAmountCents
    ? `${formatDemoCents(charge.discountAmountCents)}${charge.discountType === "percent" ? ` (${charge.discountValue}%)` : ""}`
    : formatDemoCents(0);
  return `
    <article class="monthly-charge-row" data-monthly-charge="${escapeHtml(charge.id)}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(charge.studentName)}</strong><small>Vencimento: ${escapeHtml(formatDemoDate(charge.dueDate))}</small></span>
        <span class="badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="monthly-charge-values">
        ${listRow("Valor-base", "", formatDemoCents(charge.baseAmountCents))}
        ${listRow(charge.status === "isenta" ? "Isenção" : "Desconto", "", `− ${discountLabel}`)}
        ${listRow("Valor final", "", formatDemoCents(charge.finalAmountCents))}
        ${listRow("Confirmado", "", formatDemoCents(chargeConfirmedCents(charge)))}
        ${listRow("Aguardando confirmação", "", formatDemoCents(chargePendingCents(charge)))}
        ${charge.status === "isenta" && charge.exemptionReason
          ? `<p class="field-help">Motivo informado: ${escapeHtml(charge.exemptionReason)}</p>`
          : ""}
      </div>
      ${canCancel && charge.sentOn ? `<p class="field-help">Enviada em ${escapeHtml(formatDemoDate(charge.sentOn))}${charge.resentOn ? ` · Reenviada em ${escapeHtml(formatDemoDate(charge.resentOn))}` : ""}</p>` : ""}
      ${canCancel && charge.status === "aberta" ? `
        <p class="field-help">${escapeHtml(monthlyChargeMessage(charge))}</p>
        <div class="student-action-control monthly-charge-actions">
          <button class="button button--primary button--action" type="button" data-send-monthly-charge="${escapeHtml(charge.id)}"${charge.studentAccount ? "" : ` disabled aria-describedby="send-charge-disabled-${escapeHtml(charge.id)}"`}><span data-action-label>${charge.sentOn ? "Reenviar ao aluno" : "Enviar ao aluno"}</span></button>
          <p class="login-action-error student-action-error" role="alert" data-send-charge-error></p>
          <p class="field-help" role="status" aria-live="polite" data-send-charge-status></p>
          ${charge.studentAccount ? "" : `<p class="field-help" id="send-charge-disabled-${escapeHtml(charge.id)}">aluno sem conta no app</p>`}
        </div>
        <div class="student-action-control monthly-charge-actions">
          <button class="button button--quiet button--action" type="button" data-copy-monthly-charge="${escapeHtml(charge.id)}"><span data-action-label>Copiar mensagem</span></button>
          <p class="login-action-error student-action-error" role="alert" data-copy-charge-error></p>
          <p class="field-help" role="status" aria-live="polite" data-copy-charge-status></p>
        </div>
        <div class="student-action-control monthly-charge-actions">
          <button class="button button--danger button--action" type="button" data-cancel-monthly-charge="${escapeHtml(charge.id)}" aria-label="Cancelar cobrança de ${escapeHtml(charge.studentName)}">
            <span data-action-label>Cancelar cobrança</span>
          </button>
          <p class="login-action-error student-action-error" role="alert" data-cancel-charge-error></p>
          <p class="field-help" role="status" aria-live="polite" data-cancel-charge-status></p>
        </div>
      ` : ""}
    </article>
  `;
}

function parseRealBillingCents(value) {
  const match = /^(\d+)(?:[,.](\d{1,2}))?$/.exec(String(value).trim());
  if (!match) return null;
  const whole = Number(match[1]);
  if (!Number.isSafeInteger(whole)) return null;
  const cents = whole * 100 + Number((match[2] || "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

function realBillingIntegerCents(value) {
  const text = String(value);
  if (!/^\d+$/.test(text)) throw new TypeError("Valor de cobrança inválido.");
  return BigInt(text);
}

function formatRealBillingCents(value) {
  const cents = realBillingIntegerCents(value);
  const whole = new Intl.NumberFormat("pt-BR").format(cents / 100n);
  const fraction = String(cents % 100n).padStart(2, "0");
  return `R$ ${whole},${fraction}`;
}

function realBillingCentsInput(value) {
  const cents = realBillingIntegerCents(value);
  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

function realBillingDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return "Data indisponível";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function realBillingTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function realBillingIsLate(charge) {
  if (charge.status !== "aberta") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(charge.vencimento);
  if (!match) throw new TypeError("Vencimento de cobrança inválido.");
  const due = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  due.setDate(due.getDate() + realBillingGraceDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > due;
}

function renderRealBillingRuleRow(rule) {
  const studentName = realBillingStudentNames.get(rule.aluno_id) || "Aluno sem nome";
  const canEdit = realBillingStudentNames.has(rule.aluno_id);
  const discount = rule.tipo_desconto === "valor_fixo"
    ? formatRealBillingCents(rule.desconto_centavos)
    : rule.tipo_desconto === "percentual"
      ? `${rule.desconto_percentual}%`
      : rule.tipo_desconto === "isencao" ? "Isenção" : "Sem desconto";
  const duration = rule.duracao_tipo === "este_mes"
    ? "Só este mês"
    : rule.duracao_tipo === "n_meses" ? `${rule.duracao_meses} mês(es)` : "Até remover";
  return `
    <article class="monthly-charge-row" data-real-billing-rule="${escapeHtml(rule.id)}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(studentName)}</strong><small>Base ${formatRealBillingCents(rule.valor_base_centavos)} · vence dia ${escapeHtml(rule.dia_vencimento)}</small></span>
        <span class="badge badge--pending">${escapeHtml(discount)}</span>
      </div>
      <p class="field-help">${escapeHtml(duration)} · início ${realBillingDate(rule.mes_inicio)}</p>
      <div class="row-actions">
        <button class="button button--small button--quiet" type="button" data-real-billing-edit-rule="${escapeHtml(rule.id)}"${canEdit ? "" : ` disabled aria-describedby="real-rule-student-unavailable-${escapeHtml(rule.id)}"`}>Editar</button>
        <button class="button button--small button--danger button--action" type="button" data-real-billing-remove-rule="${escapeHtml(rule.id)}" aria-describedby="real-rule-error-${escapeHtml(rule.id)} real-rule-status-${escapeHtml(rule.id)}"><span data-action-label>Remover regra</span></button>
      </div>
      ${canEdit ? "" : `<p class="field-help" id="real-rule-student-unavailable-${escapeHtml(rule.id)}">Edição indisponível: aluno sem vínculo ativo.</p>`}
      <p class="login-action-error student-action-error" id="real-rule-error-${escapeHtml(rule.id)}" role="alert"></p>
      <p class="field-help" id="real-rule-status-${escapeHtml(rule.id)}" role="status" aria-live="polite"></p>
    </article>
  `;
}

function renderRealMonthlyChargeRow(charge) {
  const studentName = realBillingStudentNames.get(charge.aluno_id) || "Aluno sem nome";
  const late = realBillingIsLate(charge);
  const statusLabel = charge.status === "paga"
    ? "PAGA"
    : charge.status === "isenta"
      ? "ISENTA"
      : charge.status === "cancelada"
        ? "CANCELADA"
        : late ? "ATRASADA" : "EM ABERTO";
  const statusClass = charge.status === "paga" ? "badge--green"
    : charge.status === "isenta" ? "badge--amber"
      : charge.status === "cancelada" ? "badge--red"
        : late ? "badge--red" : "badge--pending";
  return `
    <article class="monthly-charge-row" data-real-monthly-charge="${escapeHtml(charge.id)}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(studentName)}</strong><small>Vencimento: ${realBillingDate(charge.vencimento)}</small></span>
        <span class="badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="monthly-charge-values">
        ${listRow("Valor-base", "", formatRealBillingCents(charge.valor_base_centavos))}
        ${listRow(charge.status === "isenta" ? "Isenção" : "Desconto", "", formatRealBillingCents(charge.desconto_centavos))}
        ${listRow("Valor final", "", formatRealBillingCents(charge.valor_final_centavos))}
        ${listRow("Confirmado", "", formatRealBillingCents(realPaymentTotalForCharge(charge.id, "confirmado", realBillingPayments)))}
        ${listRow("Aguardando confirmação", "", formatRealBillingCents(realPaymentTotalForCharge(charge.id, "pendente", realBillingPayments)))}
        ${listRow("Saldo", "", formatRealBillingCents(realBillingBalance(charge, realBillingPayments)))}
      </div>
      ${charge.enviada_em ? `<p class="field-help">Enviada em ${realBillingTimestamp(charge.enviada_em)}${charge.reenviada_em ? ` · Reenviada em ${realBillingTimestamp(charge.reenviada_em)}` : ""}</p>` : ""}
      ${charge.status === "aberta" ? `
        <div class="student-action-control monthly-charge-actions">
          <button class="button button--primary button--action" type="button" data-real-billing-send="${escapeHtml(charge.id)}" aria-describedby="real-send-error-${escapeHtml(charge.id)} real-send-status-${escapeHtml(charge.id)}"><span data-action-label>${charge.enviada_em ? "Reenviar ao aluno" : "Enviar ao aluno"}</span></button>
          <p class="login-action-error student-action-error" id="real-send-error-${escapeHtml(charge.id)}" role="alert"></p>
          <p class="field-help" id="real-send-status-${escapeHtml(charge.id)}" role="status" aria-live="polite"></p>
        </div>
        <div class="student-action-control monthly-charge-actions">
          <button class="button button--danger button--action" type="button" data-real-billing-cancel="${escapeHtml(charge.id)}" aria-describedby="real-cancel-error-${escapeHtml(charge.id)} real-cancel-status-${escapeHtml(charge.id)}"><span data-action-label>Cancelar cobrança</span></button>
          <p class="login-action-error student-action-error" id="real-cancel-error-${escapeHtml(charge.id)}" role="alert"></p>
          <p class="field-help" id="real-cancel-status-${escapeHtml(charge.id)}" role="status" aria-live="polite"></p>
        </div>
      ` : ""}
    </article>
  `;
}

function realPaymentTotalForCharge(chargeId, status, payments) {
  return payments
    .filter((payment) => payment.cobranca_id === chargeId && payment.status === status)
    .reduce((total, payment) => total + realBillingIntegerCents(payment.valor_centavos), 0n);
}

function realBillingBalance(charge, payments) {
  return realBillingIntegerCents(charge.valor_final_centavos) -
    realPaymentTotalForCharge(charge.id, "confirmado", payments);
}

function realBillingSummary() {
  const sum = (charges, predicate, field = "valor_final_centavos") => charges
    .filter(predicate)
    .reduce((total, charge) => total + realBillingIntegerCents(charge[field]), 0n);
  const balanceSum = (predicate) => realBillingCharges
    .filter(predicate)
    .reduce((total, charge) => total + realBillingBalance(charge, realBillingPayments), 0n);
  return {
    expected: sum(realBillingCharges, (charge) => charge.status !== "cancelada"),
    confirmed: realBillingPayments
      .filter((payment) => payment.status === "confirmado")
      .reduce((total, payment) => total + realBillingIntegerCents(payment.valor_centavos), 0n),
    pending: realBillingPayments
      .filter((payment) => payment.status === "pendente")
      .reduce((total, payment) => total + realBillingIntegerCents(payment.valor_centavos), 0n),
    open: balanceSum((charge) => charge.status === "aberta" && !realBillingIsLate(charge)),
    late: balanceSum((charge) => charge.status === "aberta" && realBillingIsLate(charge)),
    exempt: sum(realBillingCharges, (charge) => charge.status === "isenta", "valor_base_centavos"),
    exemptCount: realBillingCharges.filter((charge) => charge.status === "isenta").length
  };
}

function renderRealBillingUnregisteredStudentsPanel() {
  const unregisteredOptions = realBillingUnregisteredStudents.map((student) =>
    `<option value="${escapeHtml(student.id)}">${escapeHtml(student.nome)}</option>`
  ).join("");
  const content = realBillingUnregisteredStudentsState === "checking"
    ? '<p class="field-help" role="status" aria-live="polite">Carregando alunos sem conta...</p>'
    : realBillingUnregisteredStudentsState === "error"
      ? `<p class="login-action-error" role="alert">${escapeHtml(realBillingUnregisteredStudentsNotice)}</p>`
      : unregisteredOptions
        ? `
          <form data-real-unregistered-message-form novalidate>
            <div class="form-grid">
              <div class="field"><label for="real-unregistered-student">Aluno sem conta no app</label><select id="real-unregistered-student" required>
                <option value="" disabled selected>Selecione um aluno</option>${unregisteredOptions}
              </select></div>
              <div class="field"><label for="real-unregistered-amount">Valor (R$)</label><input id="real-unregistered-amount" type="text" inputmode="decimal" required></div>
              <div class="field"><label for="real-unregistered-due-date">Vencimento</label><input id="real-unregistered-due-date" type="date" required></div>
            </div>
            <div class="student-action-control">
              <button class="button button--quiet button--action" type="submit" data-real-unregistered-copy aria-describedby="real-unregistered-copy-error real-unregistered-copy-status"><span data-action-label>Copiar mensagem</span></button>
              <p class="login-action-error student-action-error" id="real-unregistered-copy-error" role="alert"></p>
              <p class="field-help" id="real-unregistered-copy-status" role="status" aria-live="polite"></p>
            </div>
          </form>
        `
        : emptyState("Nenhum aluno sem conta cadastrado", "Cadastre um aluno sem conta para preparar uma mensagem.");
  return panel("Copiar mensagem para aluno sem conta", `
    <p class="field-help">Esta cobrança não é salva no app.</p>
    ${content}
  `);
}

function renderRealBillingScreen() {
  const ready = realBillingState === "found" && realBillingStudentsState === "found";
  const loading = realBillingState === "checking" || realBillingStudentsState === "checking";
  const disabled = ready ? "" : " disabled";
  const ruleSubmitDisabled = !ready || realBillingStudentNames.size === 0;
  const summary = ready ? realBillingSummary() : null;
  const studentOptions = Array.from(realBillingStudentNames, ([studentId, studentName]) =>
    `<option value="${escapeHtml(studentId)}">${escapeHtml(studentName)}</option>`
  ).join("");
  const ruleRows = ready && realBillingRules.length
    ? realBillingRules.map(renderRealBillingRuleRow).join("")
    : ready ? emptyState("Nenhuma regra ativa", "Configure uma regra para um aluno vinculado.")
      : loading
        ? '<p class="field-help" role="status" aria-live="polite">Consultando cobranças e alunos vinculados...</p>'
        : "";
  const chargeRows = ready && realBillingCharges.length
    ? realBillingCharges.map(renderRealMonthlyChargeRow).join("")
    : ready ? emptyState("Nenhuma cobrança neste mês", "Salve as regras e gere as cobranças do mês.")
      : loading
        ? '<p class="field-help" role="status" aria-live="polite">Consultando cobranças e alunos vinculados...</p>'
        : "";
  return `
    ${heading("VISÃO DO PROFESSOR", "Cobranças mensais", "Configure regras, gere cobranças e acompanhe o mês na sua conta real.")}
    <div class="notice notice--info">O app só controla pagamentos; não há gateway nem envio de mensagens fora do app. Alunos sem conta não entram nas cobranças do banco real; a mensagem copiada no painel não salva cobrança ou texto.</div>
    ${realBillingNotice ? `<p class="login-action-error" role="alert">${escapeHtml(realBillingNotice)}</p>` : ""}
    ${realBillingStudentsNotice ? `<p class="login-action-error" role="alert">${escapeHtml(realBillingStudentsNotice)}</p>` : ""}
    ${summary ? `
      <div class="summary-grid">
        ${metric("PREVISTO", formatRealBillingCents(summary.expected), "Cobranças do mês, sem canceladas", "gold")}
        ${metric("CONFIRMADO", formatRealBillingCents(summary.confirmed), "Pagamentos confirmados", "green")}
        ${metric("AGUARDANDO CONFIRMAÇÃO", formatRealBillingCents(summary.pending), "Avisos de pagamento pendentes", "amber")}
        ${metric("EM ABERTO", formatRealBillingCents(summary.open), "Saldo dentro do prazo", "gold")}
        ${metric("ATRASADO", formatRealBillingCents(summary.late), "Saldo após vencimento e carência", "red")}
        ${metric("ISENTO", formatRealBillingCents(summary.exempt), `${summary.exemptCount} cobrança(s) isenta(s)`, "amber")}
      </div>
      <p class="field-help">Saldo calculado pelo valor final menos pagamentos confirmados. O atraso é calculado no app.</p>
    ` : ""}
    <div class="content-grid">
      <div class="stack">
        ${panel("Carência", `
          <form data-real-billing-grace-form novalidate>
            <div class="form-grid">
              <div class="field"><label for="real-billing-grace-days">Dias após vencimento (0 a 30)</label><input id="real-billing-grace-days" type="number" min="0" max="30" step="1" value="${ready ? escapeHtml(realBillingGraceDays) : ""}" required${disabled}></div>
            </div>
            <div class="student-action-control">
              <button class="button button--primary button--action" type="submit" data-real-billing-save-grace aria-describedby="real-billing-grace-error real-billing-grace-status"${disabled}><span data-action-label>Salvar carência</span></button>
              <p class="login-action-error student-action-error" id="real-billing-grace-error" role="alert"></p>
              <p class="field-help" id="real-billing-grace-status" role="status" aria-live="polite"></p>
            </div>
          </form>
        `)}
        ${panel("Regra de cobrança", `
          <form data-real-billing-rule-form novalidate>
            <div class="form-grid">
              <div class="field"><label for="real-billing-student-id">Aluno vinculado</label><select id="real-billing-student-id" required${disabled}>
                ${studentOptions ? `<option value="" disabled selected>Selecione um aluno</option>${studentOptions}` : '<option value="" disabled selected>Nenhum aluno vinculado ainda</option>'}
              </select></div>
              <div class="field"><label for="real-billing-start-month">Início da regra</label><input id="real-billing-start-month" type="month" value="${escapeHtml(realBillingSelectedMonth)}" required${disabled}></div>
              <div class="field"><label for="real-billing-base">Valor-base (R$)</label><input id="real-billing-base" type="text" inputmode="decimal" required${disabled}></div>
              <div class="field"><label for="real-billing-due-day">Dia de vencimento (1 a 28)</label><input id="real-billing-due-day" type="number" min="1" max="28" step="1" required${disabled}></div>
              <div class="field"><label for="real-billing-discount-type">Desconto ou isenção</label><select id="real-billing-discount-type" required${disabled}>
                <option value="nenhum">Sem desconto</option>
                <option value="valor_fixo">Desconto em R$</option>
                <option value="percentual">Desconto em %</option>
                <option value="isencao">Isenção</option>
              </select></div>
              <div class="field"><label for="real-billing-discount-value">Desconto em R$</label><input id="real-billing-discount-value" type="text" inputmode="decimal"${disabled}></div>
              <div class="field"><label for="real-billing-discount-percent">Desconto em %</label><input id="real-billing-discount-percent" type="text" inputmode="decimal"${disabled}></div>
              <div class="field"><label for="real-billing-duration">Duração</label><select id="real-billing-duration" required${disabled}>
                <option value="este_mes">Só este mês</option>
                <option value="n_meses">N meses</option>
                <option value="ate_remover">Até remover</option>
              </select></div>
              <div class="field"><label for="real-billing-duration-months">Número de meses</label><input id="real-billing-duration-months" type="number" min="1" step="1"${disabled}></div>
            </div>
            <div class="field"><label for="real-billing-reason">Motivo opcional da isenção</label><textarea id="real-billing-reason" maxlength="400"${disabled}></textarea></div>
            <div class="student-action-control">
              <button class="button button--primary button--action" type="submit" data-real-billing-save-rule aria-describedby="real-billing-rule-error real-billing-rule-status"${ruleSubmitDisabled ? " disabled" : ""}><span data-action-label>Salvar regra</span></button>
              <p class="login-action-error student-action-error" id="real-billing-rule-error" role="alert"></p>
              <p class="field-help" id="real-billing-rule-status" role="status" aria-live="polite"></p>
            </div>
          </form>
        `)}
        ${panel("Regras ativas", ruleRows)}
      </div>
      <div class="stack">
        ${panel("Cobranças do mês", `
          <div class="field"><label for="real-billing-month">Mês das cobranças</label><input id="real-billing-month" type="month" value="${escapeHtml(realBillingSelectedMonth)}" data-real-billing-month required${disabled}></div>
          <div class="student-action-control">
            <button class="button button--quiet button--action" type="button" data-real-billing-generate aria-describedby="real-billing-generate-error real-billing-generate-status"${disabled}><span data-action-label>Gerar cobranças do mês</span></button>
            <p class="login-action-error student-action-error" id="real-billing-generate-error" role="alert"></p>
            <p class="field-help" id="real-billing-generate-status" role="status" aria-live="polite"></p>
          </div>
          <div id="real-monthly-charge-list">${chargeRows}</div>
        `)}
        <div id="real-billing-unregistered-panel">${renderRealBillingUnregisteredStudentsPanel()}</div>
      </div>
    </div>
  `;
}

function realBillingErrorMessage(error) {
  if (!authClient || !realUser) return "Sua sessão real não está ativa. Entre novamente.";
  if (navigator.onLine === false || error instanceof TypeError) return "Falha de rede. Verifique sua conexão e tente novamente.";
  return "Não foi possível carregar cobranças e pagamentos. Confira sua permissão e tente novamente.";
}

function renderRealProfessorScreen(screenId) {
  return screenId === "monthly-charges"
    ? renderRealBillingScreen()
    : renderRealProfessorPaymentsScreen();
}

async function loadRealInstructorStudents() {
  const sequence = ++realInstructorStudentsRequestSequence;
  const screenId = "instructor-students";
  const userId = realUser && realUser.id;
  if (!authClient || !userId || !isRealActiveInstructor()) {
    realInstructorStudentsState = "error";
    realInstructorStudentsNotice = "Esta lista ainda não está disponível.";
  } else {
    try {
      const { data, error } = await authClient.rpc("listar_alunos_do_instrutor");
      if (error) throw error;
      if (!Array.isArray(data)) throw new TypeError("Lista indisponível.");
      if (sequence !== realInstructorStudentsRequestSequence || currentScreen !== screenId) return;
      realInstructorStudents = data
        .map((student) => {
          if (!student || typeof student.aluno_id !== "string" || typeof student.nome !== "string") {
            throw new TypeError("Dados da lista indisponíveis.");
          }
          const hasNoGraduation = student.faixa === null && student.grau === null;
          const hasGraduation = typeof student.faixa === "string" && student.faixa.trim().length > 0 &&
            Number.isInteger(student.grau) && student.grau >= 0;
          if (!hasNoGraduation && !hasGraduation) {
            throw new TypeError("Graduação atual indisponível.");
          }
          return {
            id: student.aluno_id,
            nome: student.nome.trim(),
            faixa: hasGraduation ? student.faixa.trim() : null,
            grau: hasGraduation ? student.grau : null
          };
        })
        .filter((student) => student.nome);
      realInstructorStudentsState = "found";
      realInstructorStudentsNotice = "";
    } catch (error) {
      if (sequence !== realInstructorStudentsRequestSequence || currentScreen !== screenId) return;
      logRealProfileSupabaseError("consultar alunos vinculados do Instrutor", error);
      realInstructorStudentsState = "error";
      realInstructorStudentsNotice = "Esta lista ainda não está disponível.";
    }
  }
  if (sequence === realInstructorStudentsRequestSequence && currentScreen === screenId) {
    screenContent.innerHTML = screens[screenId]();
  }
}

async function loadRealAdminStudents(renderScreen = true) {
  const sequence = ++realAdminStudentsRequestSequence;
  const screenId = "admin-students";
  const userId = realUser && realUser.id;
  realAdminStudents = [];
  realAdminStudentsState = "checking";
  realAdminStudentsNotice = "";
  if (!authClient || !userId || !isRealAdmSession()) {
    realAdminStudentsState = "error";
    realAdminStudentsNotice = "Esta lista exige uma conta real de Adm ativa.";
  } else {
    try {
      const { data, error } = await authClient.rpc("listar_alunos_para_adm");
      if (error) throw error;
      if (!Array.isArray(data)) throw new TypeError("Lista indisponível.");
      if (sequence !== realAdminStudentsRequestSequence || currentScreen !== screenId || !isRealAdmSession()) return;
      realAdminStudents = data
        .map((student) => {
          if (!student || typeof student.aluno_id !== "string" || typeof student.nome !== "string") {
            throw new TypeError("Dados da lista indisponíveis.");
          }
          const hasNoGraduation = student.faixa === null && student.grau === null;
          const hasGraduation = typeof student.faixa === "string" && student.faixa.trim().length > 0 &&
            Number.isInteger(student.grau) && student.grau >= 0;
          if (!hasNoGraduation && !hasGraduation) {
            throw new TypeError("Graduação atual indisponível.");
          }
          return {
            id: student.aluno_id,
            nome: student.nome.trim(),
            faixa: hasGraduation ? student.faixa.trim() : null,
            grau: hasGraduation ? student.grau : null
          };
        })
        .filter((student) => student.nome);
      realAdminStudentsState = "found";
      realAdminStudentsNotice = "";
    } catch (error) {
      if (sequence !== realAdminStudentsRequestSequence || currentScreen !== screenId || !isRealAdmSession()) return;
      logRealProfileSupabaseError("consultar alunos atuais para Adm", error);
      realAdminStudentsState = "error";
      realAdminStudentsNotice = navigator.onLine === false
        ? "Falha de rede ao carregar os alunos. Verifique a conexão e tente novamente."
        : "Não foi possível carregar os alunos. Confira sua permissão e tente novamente.";
    }
  }
  if (renderScreen && sequence === realAdminStudentsRequestSequence && currentScreen === screenId) {
    screenContent.innerHTML = renderRealAdminStudentsScreen();
  }
}

async function loadRealBillingUnregisteredStudents() {
  const sequence = ++realBillingUnregisteredStudentsRequestSequence;
  const screenId = "monthly-charges";
  const userId = realUser && realUser.id;
  realBillingUnregisteredStudentsState = "checking";
  realBillingUnregisteredStudentsNotice = "";
  if (!authClient || !userId || !isRealActiveProfessor()) {
    realBillingUnregisteredStudentsState = "error";
    realBillingUnregisteredStudentsNotice = "Não foi possível carregar os alunos sem conta. Atualize a tela e tente novamente.";
  } else {
    try {
      const { data, error } = await authClient.from("alunos_sem_conta")
        .select("id,nome")
        .eq("professor_id", userId)
        .order("nome", { ascending: true });
      if (error) throw error;
      if (!Array.isArray(data)) throw new TypeError("Lista indisponível.");
      if (sequence !== realBillingUnregisteredStudentsRequestSequence || currentScreen !== screenId) return;
      realBillingUnregisteredStudents = data
        .filter((student) => student && typeof student.id === "string" && typeof student.nome === "string")
        .map((student) => ({ id: student.id, nome: student.nome.trim() || "Aluno sem nome" }));
      realBillingUnregisteredStudentsState = "found";
    } catch (error) {
      if (sequence !== realBillingUnregisteredStudentsRequestSequence || currentScreen !== screenId) return;
      logRealProfileSupabaseError("consultar alunos sem conta para mensagem local", error);
      realBillingUnregisteredStudentsState = "error";
      realBillingUnregisteredStudentsNotice = "Não foi possível carregar os alunos sem conta. Atualize a tela e tente novamente.";
    }
  }
  if (sequence === realBillingUnregisteredStudentsRequestSequence && currentScreen === screenId) {
    const panelContainer = screenContent.querySelector("#real-billing-unregistered-panel");
    if (panelContainer) panelContainer.innerHTML = renderRealBillingUnregisteredStudentsPanel();
  }
}

async function loadRealBillingStudents(screenId = "monthly-charges", renderScreen = true) {
  const sequence = ++realBillingStudentsRequestSequence;
  realBillingStudentsState = "checking";
  realBillingStudentsNotice = "";
  const userId = realUser && realUser.id;
  if (!authClient || !userId || !isRealActiveProfessor()) {
    realBillingStudentsState = "error";
    realBillingStudentsNotice = "Esta leitura exige uma conta Google de Professor ativa.";
    if (renderScreen && currentScreen === screenId) screenContent.innerHTML = renderRealProfessorScreen(screenId);
    return;
  }

  try {
    const { data: links, error: linksError } = await authClient.from("vinculos")
      .select("aluno_id")
      .eq("professor_id", userId);
    if (linksError) throw linksError;
    if (!Array.isArray(links)) throw new Error("Lista de vínculos indisponível.");
    if (sequence !== realBillingStudentsRequestSequence || currentScreen !== screenId) return;

    const studentIds = [...new Set(links.map((link) => link.aluno_id).filter((id) => typeof id === "string"))];
    const names = new Map(studentIds.map((id) => [id, "Aluno sem nome"]));
    if (studentIds.length) {
      const { data: profiles, error: profilesError } = await authClient.from("perfis")
        .select("id,nome")
        .in("id", studentIds);
      if (profilesError) throw profilesError;
      if (!Array.isArray(profiles)) throw new Error("Nomes dos alunos indisponíveis.");
      if (sequence !== realBillingStudentsRequestSequence || currentScreen !== screenId) return;
      for (const profile of profiles) {
        if (names.has(profile.id) && typeof profile.nome === "string" && profile.nome.trim()) {
          names.set(profile.id, profile.nome.trim());
        }
      }
    }

    if (sequence !== realBillingStudentsRequestSequence || currentScreen !== screenId) return;
    realBillingStudentNames = names;
    realBillingStudentsState = "found";
  } catch (error) {
    if (sequence !== realBillingStudentsRequestSequence || currentScreen !== screenId) return;
    logRealProfileSupabaseError("consultar alunos vinculados do Professor", error);
    realBillingStudentsState = "error";
    realBillingStudentsNotice = navigator.onLine === false
      ? "Falha de rede ao carregar os alunos vinculados. Verifique a conexão e tente novamente."
      : "Não foi possível carregar os alunos vinculados. Confira sua permissão e tente novamente.";
  }

  if (renderScreen && sequence === realBillingStudentsRequestSequence && currentScreen === screenId) {
    screenContent.innerHTML = renderRealProfessorScreen(screenId);
  }
}

async function loadRealBillingData() {
  const sequence = ++realBillingRequestSequence;
  realBillingState = "checking";
  realBillingNotice = "";
  realBillingPayments = [];
  if (!authClient || !realUser || !isRealActiveProfessor()) {
    realBillingState = "error";
    realBillingNotice = "Esta tela exige uma conta Google de Professor ativa.";
    if (currentScreen === "monthly-charges") screenContent.innerHTML = renderRealBillingScreen();
    return;
  }
  if (currentScreen === "monthly-charges") screenContent.innerHTML = renderRealBillingScreen();

  try {
    const month = `${realBillingSelectedMonth}-01`;
    const [rulesResult, chargesResult, academyResult] = await Promise.all([
      authClient.from("regras_cobranca")
        .select("id,aluno_id,valor_base_centavos,dia_vencimento,tipo_desconto,desconto_centavos,desconto_percentual,motivo_isencao,duracao_tipo,mes_inicio,duracao_meses,ativa")
        .eq("academia_id", realProfile.academia_id)
        .eq("professor_id", realUser.id)
        .eq("ativa", true)
        .order("aluno_id"),
      authClient.from("cobrancas_mensais")
        .select("id,aluno_id,mes,vencimento,valor_base_centavos,desconto_centavos,valor_final_centavos,status,enviada_em,reenviada_em")
        .eq("academia_id", realProfile.academia_id)
        .eq("professor_id", realUser.id)
        .eq("mes", month)
        .order("vencimento"),
      authClient.from("academias")
        .select("dias_carencia")
        .eq("id", realProfile.academia_id)
        .maybeSingle()
    ]);
    if (sequence !== realBillingRequestSequence || currentScreen !== "monthly-charges") return;
    for (const result of [rulesResult, chargesResult, academyResult]) {
      if (result.error) throw result.error;
    }
    if (!Array.isArray(rulesResult.data) || !Array.isArray(chargesResult.data) ||
        !academyResult.data || !Number.isInteger(academyResult.data.dias_carencia) ||
        academyResult.data.dias_carencia < 0 || academyResult.data.dias_carencia > 30) {
      throw new Error("Dados de cobrança indisponíveis.");
    }
    let payments = [];
    const chargeIds = chargesResult.data.map((charge) => charge.id);
    if (chargeIds.length) {
      const { data: paymentRows, error: paymentError } = await authClient.from("pagamentos")
        .select("cobranca_id,valor_centavos,status")
        .in("cobranca_id", chargeIds);
      if (paymentError) throw paymentError;
      if (!Array.isArray(paymentRows)) throw new Error("Pagamentos indisponíveis.");
      payments = paymentRows;
    }
    if (sequence !== realBillingRequestSequence || currentScreen !== "monthly-charges") return;
    realBillingRules = rulesResult.data;
    realBillingCharges = chargesResult.data;
    realBillingPayments = payments;
    realBillingGraceDays = academyResult.data.dias_carencia;
    realBillingState = "found";
  } catch (error) {
    if (sequence !== realBillingRequestSequence || currentScreen !== "monthly-charges") return;
    logRealProfileSupabaseError("consultar cobranças do Professor", error);
    realBillingState = "error";
    realBillingNotice = realBillingErrorMessage(error);
  }

  if (sequence === realBillingRequestSequence && currentScreen === "monthly-charges") {
    screenContent.innerHTML = renderRealBillingScreen();
  }
}

function realPaymentStatusLabel(status) {
  return ({
    pendente: "Pendente",
    confirmado: "Confirmado",
    rejeitado: "Rejeitado",
    estornado: "Estornado",
    desfeito: "Desfeito"
  })[status] || "Indisponível";
}

function realPaymentUndoDeadline(payment) {
  if (payment.origem !== "professor" || payment.status !== "confirmado" || !payment.confirmado_em) return 0;
  const confirmedAt = new Date(payment.confirmado_em).getTime();
  return Number.isNaN(confirmedAt) ? 0 : confirmedAt + 120000;
}

function scheduleRealPaymentUndoRefresh() {
  window.clearTimeout(realPaymentUndoTimer);
  if (currentScreen !== "payment-review" || realProfessorPaymentsState !== "found") return;
  const nextDeadline = realProfessorPayments
    .map(realPaymentUndoDeadline)
    .filter((deadline) => deadline > Date.now())
    .sort((left, right) => left - right)[0];
  if (!nextDeadline) return;
  realPaymentUndoTimer = window.setTimeout(() => {
    if (currentScreen === "payment-review") {
      screenContent.innerHTML = renderRealProfessorPaymentsScreen();
    }
  }, Math.max(0, nextDeadline - Date.now() + 10));
}

function renderRealStudentPaymentRow(charge) {
  const payments = realStudentPayments.filter((payment) => payment.cobranca_id === charge.id);
  const statusLabel = charge.status === "aberta" && realBillingIsLate(charge)
    ? "Atrasada"
    : ({ aberta: "Em aberto", paga: "Paga", isenta: "Isenta" })[charge.status] || "Indisponível";
  const balance = realBillingBalance(charge, realStudentPayments);
  const pending = payments.some((payment) => payment.status === "pendente");
  return `
    <article class="monthly-charge-row" data-real-student-charge="${escapeHtml(charge.id)}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(realBillingDate(charge.mes).slice(3))}</strong><small>Vencimento: ${realBillingDate(charge.vencimento)}</small></span>
        <span class="badge ${charge.status === "paga" ? "badge--green" : statusLabel === "Atrasada" ? "badge--red" : "badge--pending"}">${statusLabel}</span>
      </div>
      <div class="monthly-charge-values">
        ${listRow("Valor final", "", formatRealBillingCents(charge.valor_final_centavos))}
        ${listRow("Saldo", "", formatRealBillingCents(balance))}
      </div>
      ${payments.length ? `
        <div class="stack">
          ${payments.map((payment) => `
            <p class="field-help">${escapeHtml(realPaymentStatusLabel(payment.status))} · ${escapeHtml(payment.tipo)} · ${formatRealBillingCents(payment.valor_centavos)} · ${realBillingTimestamp(payment.criado_em)}</p>
          `).join("")}
        </div>
      ` : ""}
      ${pending ? '<p class="notice notice--pending">Há um aviso de pagamento aguardando confirmação do Professor.</p>' : ""}
    </article>
  `;
}

function realGraduationToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function isValidRealGraduationDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 &&
    date.getDate() === day && value <= realGraduationToday();
}

function isValidRealGraduationRecord(record) {
  const beltIndex = record && typeof record.faixa === "string" ? demoBelts.indexOf(record.faixa) : -1;
  return Boolean(record) &&
    typeof record.aluno_id === "string" &&
    beltDegrees(beltIndex).includes(record.grau) &&
    typeof record.data_graduacao === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.data_graduacao) &&
    typeof record.criado_em === "string" &&
    (record.observacao === null || typeof record.observacao === "string");
}

function renderRealGraduationCurrent(graduations) {
  const latest = graduations[0];
  if (!latest) return '<div class="notice notice--info">Sem graduação registrada</div>';
  const grade = gradeLabel(latest.faixa, latest.grau);
  return `
    <div class="belt-display belt-display--rank real-graduation-current">
      ${gradeVisual(grade)}
      <span class="belt-copy"><strong>${escapeHtml(grade)}</strong><small>Data: ${escapeHtml(formatDemoDate(latest.data_graduacao))}</small></span>
    </div>
  `;
}

function renderRealGraduationHistory(graduations) {
  if (!graduations.length) return emptyState("Histórico vazio", "As graduações registradas aparecerão aqui.");
  return `
    <div class="timeline real-graduation-history">
      ${graduations.map((graduation) => {
        const grade = gradeLabel(graduation.faixa, graduation.grau);
        return `
          <div class="timeline-item">
            <span class="timeline-dot"></span>
            <div>
              <strong>${escapeHtml(grade)}</strong>
              ${gradeVisual(grade)}
              <small>Data: ${escapeHtml(formatDemoDate(graduation.data_graduacao))}</small>
              ${graduation.observacao ? `<small>Observação: ${escapeHtml(graduation.observacao)}</small>` : ""}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderRealProfessorGraduationsScreen() {
  if (realProfessorGraduationsState === "checking") {
    return `${heading("VISÃO DO PROFESSOR", "Ficha do aluno", "Carregando graduações dos alunos vinculados.")}<div class="notice notice--info" role="status">Carregando...</div>`;
  }
  if (realProfessorGraduationsState === "error") {
    return `${heading("VISÃO DO PROFESSOR", "Ficha do aluno", "Consulte e registre graduações dos alunos vinculados.")}<div class="notice notice--pending" role="alert">${escapeHtml(realProfessorGraduationsNotice)}</div><div class="student-action-control"><button class="button button--primary button--action" type="button" data-real-professor-graduations-retry aria-describedby="real-professor-graduations-retry-error real-professor-graduations-retry-status"><span data-action-label>Tentar novamente</span></button><p class="login-action-error student-action-error" id="real-professor-graduations-retry-error" role="alert"></p><p class="field-help" id="real-professor-graduations-retry-status" role="status" aria-live="polite"></p></div>`;
  }
  if (!realProfessorGraduationStudents.length) {
    return `${heading("VISÃO DO PROFESSOR", "Ficha do aluno", "Consulte e registre graduações dos alunos vinculados.")}<div class="notice notice--info">Nenhum aluno vinculado ainda.</div>`;
  }

  const selectedStudent = realProfessorGraduationStudents.find((student) => student.id === realSelectedGraduationStudentId);
  if (!selectedStudent) {
    return `${heading("VISÃO DO PROFESSOR", "Ficha do aluno", "Selecione um aluno vinculado para consultar graduações.")}<div class="notice notice--info">Selecione um aluno vinculado.</div>`;
  }
  const graduations = realProfessorGraduations.filter((graduation) => graduation.aluno_id === selectedStudent.id);
  const today = realGraduationToday();
  return `
    ${heading("VISÃO DO PROFESSOR", "Ficha do aluno", "Consulte a faixa atual e o histórico; novas graduações ficam registradas sem alterar as anteriores.")}
    <div class="content-grid">
      ${panel("Aluno vinculado", `
        <div class="field">
          <label for="real-graduation-student">Aluno</label>
          <select id="real-graduation-student">
            ${realProfessorGraduationStudents.map((student) => `<option value="${escapeHtml(student.id)}"${student.id === selectedStudent.id ? " selected" : ""}>${escapeHtml(student.nome)}</option>`).join("")}
          </select>
        </div>
      `)}
      ${panel("Graduação atual", renderRealGraduationCurrent(graduations), "panel-card--highlight")}
      ${panel("Histórico de graduações", renderRealGraduationHistory(graduations))}
      ${panel("Atribuir graduação", `
        <form class="real-graduation-form" data-real-graduation-form novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="real-graduation-belt">Faixa</label>
              <select id="real-graduation-belt" required>
                <option value="">Selecione</option>
                ${demoBelts.map((belt) => `<option value="${escapeHtml(belt)}">${escapeHtml(belt)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="real-graduation-degree">Grau</label>
              <select id="real-graduation-degree" required disabled>
                <option value="">Selecione a faixa</option>
              </select>
            </div>
            <div class="field">
              <label for="real-graduation-date">Data da graduação</label>
              <input id="real-graduation-date" type="date" max="${today}" required>
            </div>
            <div class="field field--wide">
              <label for="real-graduation-observation">Observação (opcional)</label>
              <textarea id="real-graduation-observation" maxlength="200" rows="3"></textarea>
              <small class="field-help">Até 200 caracteres.</small>
            </div>
          </div>
          <div class="student-action-control">
            <button class="button button--primary button--action" type="submit" data-real-graduation-submit aria-describedby="real-graduation-error real-graduation-status"><span data-action-label>Atribuir graduação</span></button>
            <p class="login-action-error student-action-error" id="real-graduation-error" role="alert"></p>
            <p class="field-help" id="real-graduation-status" role="status" aria-live="polite"></p>
          </div>
        </form>
      `)}
    </div>
  `;
}

function renderRealStudentGraduationsScreen() {
  if (realStudentGraduationsState === "checking") {
    return `${heading("VISÃO DO ALUNO", "Minhas graduações", "Carregando sua graduação e histórico.")}<div class="notice notice--info" role="status">Carregando...</div>`;
  }
  if (realStudentGraduationsState === "error") {
    return `${heading("VISÃO DO ALUNO", "Minhas graduações", "Consulte sua faixa atual e seu histórico.")}<div class="notice notice--pending" role="alert">${escapeHtml(realStudentGraduationsNotice)}</div><div class="student-action-control"><button class="button button--primary button--action" type="button" data-real-student-graduations-retry aria-describedby="real-student-graduations-retry-error real-student-graduations-retry-status"><span data-action-label>Tentar novamente</span></button><p class="login-action-error student-action-error" id="real-student-graduations-retry-error" role="alert"></p><p class="field-help" id="real-student-graduations-retry-status" role="status" aria-live="polite"></p></div>`;
  }
  return `
    ${heading("VISÃO DO ALUNO", "Minhas graduações", "Consulte sua faixa atual e o histórico registrado pelo Professor.")}
    <div class="content-grid">
      ${panel("Graduação atual", renderRealGraduationCurrent(realStudentGraduations), "panel-card--highlight")}
      ${panel("Histórico de graduações", renderRealGraduationHistory(realStudentGraduations))}
    </div>
  `;
}

async function loadRealProfessorGraduations(renderScreen = true) {
  const sequence = ++realProfessorGraduationsRequestSequence;
  const screenId = "student-detail";
  const userId = realUser && realUser.id;
  realProfessorGraduationsState = "checking";
  realProfessorGraduationsNotice = "";
  if (!authClient || !userId || !isRealActiveProfessor()) {
    realProfessorGraduationsState = "error";
    realProfessorGraduationsNotice = "Esta tela exige uma conta Google de Professor ativa.";
    if (renderScreen && currentScreen === screenId) screenContent.innerHTML = renderRealProfessorGraduationsScreen();
    return;
  }
  if (renderScreen && currentScreen === screenId) screenContent.innerHTML = renderRealProfessorGraduationsScreen();

  try {
    const { data: links, error: linksError } = await authClient.from("vinculos")
      .select("aluno_id")
      .eq("professor_id", userId);
    if (linksError) throw linksError;
    if (!Array.isArray(links) || links.some((link) => !link || typeof link.aluno_id !== "string")) {
      throw new TypeError("Vínculos indisponíveis.");
    }
    if (sequence !== realProfessorGraduationsRequestSequence || currentScreen !== screenId) return;

    const studentIds = [...new Set(links.map((link) => link.aluno_id))];
    let students = [];
    let graduations = [];
    if (studentIds.length) {
      const { data: profiles, error: profilesError } = await authClient.from("perfis")
        .select("id,nome")
        .in("id", studentIds);
      if (profilesError) throw profilesError;
      if (!Array.isArray(profiles)) throw new TypeError("Nomes dos alunos indisponíveis.");
      if (sequence !== realProfessorGraduationsRequestSequence || currentScreen !== screenId) return;

      const names = new Map();
      for (const profile of profiles) {
        if (profile && typeof profile.id === "string" && typeof profile.nome === "string" && profile.nome.trim()) {
          names.set(profile.id, profile.nome.trim());
        }
      }
      students = studentIds.map((id) => ({ id, nome: names.get(id) || "Aluno sem nome" }))
        .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));

      const result = await authClient.from("graduacoes")
        .select("aluno_id,faixa,grau,data_graduacao,observacao,criado_em")
        .in("aluno_id", studentIds)
        .order("data_graduacao", { ascending: false })
        .order("criado_em", { ascending: false });
      if (result.error) throw result.error;
      if (!Array.isArray(result.data) || !result.data.every(isValidRealGraduationRecord)) {
        throw new TypeError("Histórico de graduações indisponível.");
      }
      graduations = result.data;
    }
    if (sequence !== realProfessorGraduationsRequestSequence || currentScreen !== screenId) return;

    realProfessorGraduationStudents = students;
    realProfessorGraduations = graduations;
    if (!students.some((student) => student.id === realSelectedGraduationStudentId)) {
      realSelectedGraduationStudentId = students[0] ? students[0].id : "";
    }
    realProfessorGraduationsState = "found";
  } catch (error) {
    if (sequence !== realProfessorGraduationsRequestSequence || currentScreen !== screenId) return;
    logRealProfileSupabaseError("consultar graduações dos alunos", error);
    realProfessorGraduationsState = "error";
    realProfessorGraduationsNotice = navigator.onLine === false
      ? "Falha de rede ao carregar graduações. Verifique a conexão e tente novamente."
      : "Não foi possível carregar graduações. Confira sua permissão e tente novamente.";
  }

  if (renderScreen && sequence === realProfessorGraduationsRequestSequence && currentScreen === screenId) {
    screenContent.innerHTML = renderRealProfessorGraduationsScreen();
  }
}

async function loadRealStudentGraduations(renderScreen = true) {
  const sequence = ++realStudentGraduationsRequestSequence;
  const screenId = "student-grades";
  const userId = realUser && realUser.id;
  realStudentGraduationsState = "checking";
  realStudentGraduationsNotice = "";
  if (!authClient || !userId || !isRealActiveStudent()) {
    realStudentGraduationsState = "error";
    realStudentGraduationsNotice = "Esta tela exige uma conta real de Aluno ativa.";
    if (renderScreen && currentScreen === screenId) screenContent.innerHTML = renderRealStudentGraduationsScreen();
    return;
  }
  if (renderScreen && currentScreen === screenId) screenContent.innerHTML = renderRealStudentGraduationsScreen();

  try {
    const { data, error } = await authClient.from("graduacoes")
      .select("aluno_id,faixa,grau,data_graduacao,observacao,criado_em")
      .eq("aluno_id", userId)
      .order("data_graduacao", { ascending: false })
      .order("criado_em", { ascending: false });
    if (error) throw error;
    if (!Array.isArray(data) || !data.every(isValidRealGraduationRecord)) {
      throw new TypeError("Histórico de graduações indisponível.");
    }
    if (sequence !== realStudentGraduationsRequestSequence || currentScreen !== screenId) return;
    realStudentGraduations = data;
    realStudentGraduationsState = "found";
  } catch (error) {
    if (sequence !== realStudentGraduationsRequestSequence || currentScreen !== screenId) return;
    logRealProfileSupabaseError("consultar graduações do Aluno", error);
    realStudentGraduationsState = "error";
    realStudentGraduationsNotice = navigator.onLine === false
      ? "Falha de rede ao carregar suas graduações. Verifique a conexão e tente novamente."
      : "Não foi possível carregar suas graduações. Confira sua permissão e tente novamente.";
  }

  if (renderScreen && sequence === realStudentGraduationsRequestSequence && currentScreen === screenId) {
    screenContent.innerHTML = renderRealStudentGraduationsScreen();
  }
}

function renderRealStudentPaymentsScreen() {
  const charges = realStudentCharges;
  const openCharges = charges.filter((charge) =>
    charge.status === "aberta" &&
    realBillingBalance(charge, realStudentPayments) > 0n &&
    !realStudentPayments.some((payment) => payment.cobranca_id === charge.id && payment.status === "pendente")
  );
  const defaultCharge = openCharges[0] || null;
  if (realStudentPaymentsState === "checking") {
    return `${heading("VISÃO DO ALUNO", "Meus pagamentos", "Carregando suas cobranças e pagamentos.")}<div class="notice notice--info">Carregando...</div>`;
  }
  if (realStudentPaymentsState === "error") {
    return `${heading("VISÃO DO ALUNO", "Meus pagamentos", "Consulte somente suas cobranças enviadas pelo Professor.")}<div class="notice notice--pending" role="alert">${escapeHtml(realStudentPaymentsNotice)}</div><div class="student-action-control"><button class="button button--primary button--action" type="button" data-real-student-payments-retry aria-describedby="real-student-retry-error real-student-retry-status"><span data-action-label>Tentar novamente</span></button><p class="login-action-error student-action-error" id="real-student-retry-error" role="alert"></p><p class="field-help" id="real-student-retry-status" role="status" aria-live="polite"></p></div>`;
  }
  return `
    ${heading("VISÃO DO ALUNO", "Meus pagamentos", "Consulte suas cobranças enviadas pelo Professor e avise quando realizar um pagamento.")}
    <div class="content-grid">
      <div class="stack">
        ${panel("Minhas cobranças", charges.length
          ? charges.map(renderRealStudentPaymentRow).join("")
          : emptyState("Nenhuma cobrança enviada", "Quando o Professor enviar uma cobrança, ela aparecerá aqui."))}
      </div>
      ${panel("Avisar pagamento", defaultCharge ? `
        <form data-real-student-payment-form novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="real-student-charge">Cobrança aberta</label>
              <select id="real-student-charge" required>
                ${openCharges.map((charge) => `<option value="${escapeHtml(charge.id)}">${realBillingDate(charge.mes).slice(3)} · saldo ${formatRealBillingCents(realBillingBalance(charge, realStudentPayments))}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="real-student-payment-type">Tipo</label>
              <select id="real-student-payment-type" required>
                <option value="dinheiro">Dinheiro</option>
                <option value="comprovante">Comprovante (sem envio de arquivo)</option>
              </select>
            </div>
            <div class="field">
              <label for="real-student-payment-amount">Valor pago</label>
              <input id="real-student-payment-amount" type="number" min="0.01" step="0.01" max="${realBillingCentsInput(realBillingBalance(defaultCharge, realStudentPayments))}" required>
              <small class="field-help">O valor não pode ultrapassar o saldo da cobrança.</small>
            </div>
          </div>
          <div class="student-action-control">
            <button class="button button--primary button--action" type="submit" data-real-student-payment-submit aria-describedby="real-student-payment-error real-student-payment-status"><span data-action-label>Avisar pagamento</span></button>
            <p class="login-action-error student-action-error" id="real-student-payment-error" role="alert"></p>
            <p class="field-help" id="real-student-payment-status" role="status" aria-live="polite"></p>
          </div>
        </form>
      ` : '<div class="notice notice--info">Não há cobrança aberta com saldo para avisar.</div>')}
    </div>
  `;
}

function renderRealProfessorPaymentRow(payment, charge) {
  const studentName = realBillingStudentNames.get(charge.aluno_id) || "Aluno sem nome";
  const paymentId = escapeHtml(payment.id);
  const isPending = payment.status === "pendente";
  const canUndo = realPaymentUndoDeadline(payment) > Date.now();
  const actions = isPending
    ? `<div class="row-actions">
        <button class="button button--small button--primary button--action" type="button" data-real-payment-action="confirmar" data-real-payment-id="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Confirmar</span></button>
        <button class="button button--small button--danger button--action" type="button" data-real-payment-action="rejeitar" data-real-payment-id="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Rejeitar</span></button>
      </div>`
    : payment.status === "confirmado"
      ? `<div class="row-actions">
          ${canUndo ? `<button class="button button--small button--quiet button--action" type="button" data-real-payment-action="desfazer" data-real-payment-id="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Desfazer</span></button>` : ""}
          <button class="button button--small button--danger button--action" type="button" data-real-payment-action="estornar" data-real-payment-id="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Estornar</span></button>
        </div>`
      : "";
  return `
    <article class="payment-review-row" data-real-payment-row="${paymentId}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(studentName)}</strong><small>${escapeHtml(charge.mes.slice(0, 7))} · vence ${realBillingDate(charge.vencimento)}</small></span>
        <span class="badge ${payment.status === "confirmado" ? "badge--green" : payment.status === "pendente" ? "badge--pending" : "badge--red"}">${escapeHtml(realPaymentStatusLabel(payment.status))}</span>
      </div>
      <p class="field-help">${escapeHtml(payment.origem === "professor" ? "Lançamento do Professor" : "Aviso do aluno")} · ${escapeHtml(payment.tipo)} · ${formatRealBillingCents(payment.valor_centavos)} · saldo ${formatRealBillingCents(realBillingBalance(charge, realProfessorPayments))}${payment.referencia ? ` · ${escapeHtml(payment.referencia)}` : ""} · ${realBillingTimestamp(payment.criado_em)}</p>
      ${actions}
      <p class="login-action-error student-action-error" id="real-payment-error-${paymentId}" role="alert"></p>
      <p class="field-help" id="real-payment-status-${paymentId}" role="status" aria-live="polite"></p>
    </article>
  `;
}

function renderRealProfessorPaymentsScreen() {
  if (realProfessorPaymentsState === "checking") {
    return `${heading("VISÃO DO PROFESSOR", "Pagamentos a confirmar", "Carregando avisos, lançamentos e saldos.")}<div class="notice notice--info">Carregando...</div>`;
  }
  if (realProfessorPaymentsState === "error") {
    return `${heading("VISÃO DO PROFESSOR", "Pagamentos a confirmar", "Confirme avisos e registre recebimentos.")}<div class="notice notice--pending" role="alert">${escapeHtml(realProfessorPaymentsNotice)}</div><div class="student-action-control"><button class="button button--primary button--action" type="button" data-real-professor-payments-retry aria-describedby="real-professor-retry-error real-professor-retry-status"><span data-action-label>Tentar novamente</span></button><p class="login-action-error student-action-error" id="real-professor-retry-error" role="alert"></p><p class="field-help" id="real-professor-retry-status" role="status" aria-live="polite"></p></div>`;
  }
  const chargeById = new Map(realProfessorCharges.map((charge) => [charge.id, charge]));
  const payments = realProfessorPayments.filter((payment) => chargeById.has(payment.cobranca_id));
  const pending = payments.filter((payment) => payment.status === "pendente");
  const history = payments.filter((payment) => payment.status !== "pendente");
  const openCharges = realProfessorCharges.filter((charge) =>
    charge.status === "aberta" && realBillingBalance(charge, realProfessorPayments) > 0n
  );
  scheduleRealPaymentUndoRefresh();
  return `
    ${heading("VISÃO DO PROFESSOR", "Pagamentos a confirmar", "Confirme ou rejeite avisos e registre recebimentos. O app controla pagamentos, mas não movimenta dinheiro.")}
    ${realBillingStudentsState === "error" ? `<div class="notice notice--pending" role="alert">${escapeHtml(realBillingStudentsNotice)}</div>` : ""}
    <div class="content-grid">
      <div class="stack">
        ${panel("Aguardando confirmação", pending.length
          ? pending.map((payment) => renderRealProfessorPaymentRow(payment, chargeById.get(payment.cobranca_id))).join("")
          : emptyState("Nenhum pagamento pendente", "Avisos enviados pelos alunos aparecerão aqui."))}
        ${panel("Histórico de pagamentos", history.length
          ? history.map((payment) => renderRealProfessorPaymentRow(payment, chargeById.get(payment.cobranca_id))).join("")
          : emptyState("Nenhum pagamento no histórico", "Os pagamentos confirmados, rejeitados, estornados ou desfeitos aparecerão aqui."))}
      </div>
      ${panel("Lançar dinheiro recebido", openCharges.length ? `
        <form data-real-professor-payment-form novalidate>
          <div class="form-grid">
            <div class="field">
              <label for="real-professor-charge">Cobrança aberta</label>
              <select id="real-professor-charge" required>
                ${openCharges.map((charge) => `<option value="${escapeHtml(charge.id)}">${escapeHtml(realBillingStudentNames.get(charge.aluno_id) || "Aluno sem nome")} · ${realBillingDate(charge.mes).slice(3)} · saldo ${formatRealBillingCents(realBillingBalance(charge, realProfessorPayments))}</option>`).join("")}
              </select>
            </div>
            <div class="field"><label for="real-professor-payment-amount">Valor recebido</label><input id="real-professor-payment-amount" type="number" min="0.01" step="0.01" max="${realBillingCentsInput(realBillingBalance(openCharges[0], realProfessorPayments))}" required></div>
            <div class="field"><label for="real-professor-payment-type">Tipo</label><input id="real-professor-payment-type" type="text" maxlength="80" required></div>
            <div class="field"><label for="real-professor-payment-reference">Referência</label><input id="real-professor-payment-reference" type="text" maxlength="120" required></div>
          </div>
          <div class="student-action-control">
            <button class="button button--primary button--action" type="submit" data-real-professor-payment-submit aria-describedby="real-professor-payment-error real-professor-payment-status"><span data-action-label>Registrar recebido em dinheiro</span></button>
            <p class="login-action-error student-action-error" id="real-professor-payment-error" role="alert"></p>
            <p class="field-help" id="real-professor-payment-status" role="status" aria-live="polite"></p>
          </div>
        </form>
      ` : '<div class="notice notice--info">Não há cobrança aberta com saldo para lançar.</div>')}
    </div>
  `;
}

async function loadRealStudentPayments(renderScreen = true) {
  const sequence = ++realStudentPaymentsRequestSequence;
  realStudentPaymentsState = "checking";
  realStudentPaymentsNotice = "";
  if (!authClient || !realUser || !isRealActiveStudent() || !realProfile || !realProfile.academia_id) {
    realStudentPaymentsState = "error";
    realStudentPaymentsNotice = "Esta tela exige uma conta real de Aluno ativa.";
    if (renderScreen && currentScreen === "student-payments") screenContent.innerHTML = renderRealStudentPaymentsScreen();
    return;
  }
  if (renderScreen && currentScreen === "student-payments") screenContent.innerHTML = renderRealStudentPaymentsScreen();
  try {
    const [chargesResult, academyResult] = await Promise.all([
      authClient.from("cobrancas_mensais")
        .select("id,aluno_id,mes,vencimento,valor_base_centavos,desconto_centavos,valor_final_centavos,status,enviada_em,reenviada_em")
        .eq("aluno_id", realUser.id)
        .order("vencimento", { ascending: false }),
      authClient.from("academias")
        .select("dias_carencia")
        .eq("id", realProfile.academia_id)
        .maybeSingle()
    ]);
    if (sequence !== realStudentPaymentsRequestSequence || currentScreen !== "student-payments") return;
    for (const result of [chargesResult, academyResult]) {
      if (result.error) throw result.error;
    }
    if (!Array.isArray(chargesResult.data) || !academyResult.data ||
        !Number.isInteger(academyResult.data.dias_carencia) ||
        academyResult.data.dias_carencia < 0 || academyResult.data.dias_carencia > 30) {
      throw new Error("Dados de pagamento indisponíveis.");
    }
    const charges = chargesResult.data.filter((charge) => charge.enviada_em && charge.status !== "cancelada");
    let payments = [];
    if (charges.length) {
      const { data, error } = await authClient.from("pagamentos")
        .select("id,cobranca_id,origem,tipo,referencia,valor_centavos,status,criado_em,confirmado_em,rejeitado_em,estornado_em,desfeito_em")
        .in("cobranca_id", charges.map((charge) => charge.id))
        .order("criado_em", { ascending: false });
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error("Histórico de pagamentos indisponível.");
      payments = data;
    }
    if (sequence !== realStudentPaymentsRequestSequence || currentScreen !== "student-payments") return;
    realStudentCharges = charges;
    realStudentPayments = payments;
    realBillingGraceDays = academyResult.data.dias_carencia;
    realStudentPaymentsState = "found";
  } catch (error) {
    if (sequence !== realStudentPaymentsRequestSequence || currentScreen !== "student-payments") return;
    logRealProfileSupabaseError("consultar pagamentos do Aluno", error);
    realStudentPaymentsState = "error";
    realStudentPaymentsNotice = navigator.onLine === false
      ? "Falha de rede ao carregar seus pagamentos. Verifique a conexão e tente novamente."
      : "Não foi possível carregar seus pagamentos. Confira sua permissão e tente novamente.";
  }
  if (renderScreen && sequence === realStudentPaymentsRequestSequence && currentScreen === "student-payments") {
    screenContent.innerHTML = renderRealStudentPaymentsScreen();
  }
}

async function loadRealProfessorPaymentsData(renderScreen = true) {
  const sequence = ++realProfessorPaymentsRequestSequence;
  realProfessorPaymentsState = "checking";
  realProfessorPaymentsNotice = "";
  if (!authClient || !realUser || !isRealActiveProfessor()) {
    realProfessorPaymentsState = "error";
    realProfessorPaymentsNotice = "Esta tela exige uma conta Google de Professor ativa.";
    if (renderScreen && currentScreen === "payment-review") screenContent.innerHTML = renderRealProfessorPaymentsScreen();
    return;
  }
  if (renderScreen && currentScreen === "payment-review") screenContent.innerHTML = renderRealProfessorPaymentsScreen();
  try {
    const { data: charges, error: chargesError } = await authClient.from("cobrancas_mensais")
      .select("id,aluno_id,mes,vencimento,valor_base_centavos,desconto_centavos,valor_final_centavos,status,enviada_em,reenviada_em")
      .eq("professor_id", realUser.id)
      .order("vencimento", { ascending: false });
    if (chargesError) throw chargesError;
    if (!Array.isArray(charges)) throw new Error("Cobranças indisponíveis.");
    let payments = [];
    if (charges.length) {
      const { data, error } = await authClient.from("pagamentos")
        .select("id,cobranca_id,origem,tipo,referencia,valor_centavos,status,criado_em,confirmado_em,rejeitado_em,estornado_em,desfeito_em")
        .in("cobranca_id", charges.map((charge) => charge.id))
        .order("criado_em", { ascending: false });
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error("Pagamentos indisponíveis.");
      payments = data;
    }
    if (sequence !== realProfessorPaymentsRequestSequence || currentScreen !== "payment-review") return;
    realProfessorCharges = charges;
    realProfessorPayments = payments;
    realProfessorPaymentsState = "found";
  } catch (error) {
    if (sequence !== realProfessorPaymentsRequestSequence || currentScreen !== "payment-review") return;
    logRealProfileSupabaseError("consultar pagamentos do Professor", error);
    realProfessorPaymentsState = "error";
    realProfessorPaymentsNotice = navigator.onLine === false
      ? "Falha de rede ao carregar os pagamentos. Verifique a conexão e tente novamente."
      : "Não foi possível carregar os pagamentos. Confira sua permissão e tente novamente.";
  }
  if (renderScreen && sequence === realProfessorPaymentsRequestSequence && currentScreen === "payment-review") {
    screenContent.innerHTML = renderRealProfessorPaymentsScreen();
  }
}

function readBillingForm(form) {
  const month = form.querySelector("[data-billing-month]").value;
  const graceDays = Number(form.querySelector("[data-billing-grace-days]").value);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return { errorMessage: "Escolha um mês válido." };
  }
  if (!Number.isInteger(graceDays) || graceDays < 0 || graceDays > 30) {
    return { errorMessage: "Informe uma carência entre 0 e 30 dias." };
  }

  const settings = [];
  const selectedStudentKeys = [];
  for (const row of form.querySelectorAll("[data-billing-student]")) {
    const studentKey = row.dataset.billingStudent;
    const student = demoRoster[Number(studentKey)];
    if (!student || student.teacherAccount !== activeDemoAccount || student.status === "locked") {
      return { errorMessage: "Um aluno da lista não está disponível. Atualize a tela e tente novamente." };
    }
    const baseValue = row.querySelector("[data-billing-base]").value.trim();
    const dueValue = row.querySelector("[data-billing-due-day]").value.trim();
    const discountType = row.querySelector("[data-billing-discount-type]").value;
    const discountInput = row.querySelector("[data-billing-discount-value]").value.trim();
    const chosenDuration = row.querySelector("[data-billing-duration]").value;
    const durationInput = row.querySelector("[data-billing-duration-months]").value.trim();
    const exemptionReason = row.querySelector("[data-billing-exemption-reason]").value.trim();
    const selected = row.querySelector("[data-billing-select]").checked;

    if (!["none", "fixed", "percent", "exempt"].includes(discountType)) {
      return { errorMessage: `Escolha um desconto ou isenção válido para ${student.name}.` };
    }
    if (!baseValue && !dueValue && discountType === "none") {
      if (selected) return { errorMessage: `Informe valor-base e vencimento para ${student.name}.` };
      continue;
    }
    const baseAmountCents = parseDemoPaymentCents(baseValue);
    const dueDay = Number(dueValue);
    if (baseAmountCents === null || baseAmountCents <= 0 || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
      return { errorMessage: `Informe valor-base maior que zero e vencimento entre 1 e 28 para ${student.name}.` };
    }

    let discountValue = 0;
    if (discountType === "fixed") {
      const cents = parseDemoPaymentCents(discountInput);
      if (cents === null || cents <= 0) return { errorMessage: `Informe um desconto em reais maior que zero para ${student.name}.` };
      discountValue = cents;
    } else if (discountType === "percent") {
      discountValue = Number(discountInput);
      if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
        return { errorMessage: `Informe um desconto entre 0 e 100% para ${student.name}.` };
      }
    }
    const duration = discountType === "none" ? "this-month" : chosenDuration;
    const durationMonths = discountType !== "none" && duration === "months" ? Number(durationInput) : null;
    if (!["this-month", "months", "until-removed"].includes(duration) ||
        (discountType !== "none" && duration === "months" && (!Number.isInteger(durationMonths) || durationMonths < 1))) {
      return { errorMessage: `Informe uma duração válida para ${student.name}.` };
    }
    if (exemptionReason.length > 300) return { errorMessage: "O motivo da isenção deve ter até 300 caracteres." };

    const previous = billingSettingFor(studentKey, activeDemoAccount);
    const sameRule = previous && previous.discountType === discountType &&
      previous.discountValue === discountValue && previous.duration === duration &&
      previous.durationMonths === durationMonths;
    settings.push({
      studentKey,
      professorAccount: activeDemoAccount,
      baseAmountCents,
      dueDay,
      discountType,
      discountValue,
      duration,
      durationMonths,
      startMonth: sameRule ? previous.startMonth : month,
      exemptionReason: discountType === "exempt" ? exemptionReason : ""
    });
    if (selected) selectedStudentKeys.push(studentKey);
  }
  return { month, graceDays, settings, selectedStudentKeys };
}

function renderStudentPaymentHistory() {
  const entries = [
    ...cashPayments.filter((payment) => payment.account === activeDemoAccount),
    ...receiptPayments.filter((payment) => payment.account === activeDemoAccount)
  ];
  if (!entries.length) return emptyState("Nenhum registro de pagamento", "Avisos e confirmações aparecerão aqui. Cobranças ainda não são geradas.");
  return entries.map((payment) => {
    const status = payment.status === "pending"
      ? ["AGUARDANDO", "badge--amber"]
      : payment.status === "confirmed"
        ? ["CONFIRMADO", "badge--green"]
        : payment.status === "rejected"
          ? ["RECUSADO", "badge--red"]
          : payment.status === "undone"
            ? ["DESFEITO", "badge--amber"]
            : ["ESTORNADO", "badge--red"];
    const title = payment.source === "teacher"
      ? "Recebimento em dinheiro"
      : payment.source === "student"
        ? "Aviso em dinheiro"
        : "Comprovante Pix";
    const date = typeof payment.date === "string" ? payment.date : "";
    const displayDate = date.includes("-") ? formatDemoDate(date) : date || "Data não informada";
    return `
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(displayDate)}</small></span>
        <strong class="row-value">${escapeHtml(payment.amount || "R$ —")}</strong>
        <span class="badge ${status[1]}">${status[0]}</span>
      </div>
    `;
  }).join("");
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

async function copyTeacherCode(codeElement) {
  const code = codeElement.textContent.trim();
  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code)) {
    return "O código não está disponível para cópia. Atualize a tela e tente novamente.";
  }

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(code);
      return "";
    } catch (error) {
      return copyTeacherCodeFromSelection(codeElement);
    }
  }
  return copyTeacherCodeFromSelection(codeElement);
}

function copyTeacherCodeFromSelection(codeElement) {
  const selection = window.getSelection();
  if (!selection || typeof document.createRange !== "function") {
    return "Não foi possível copiar automaticamente. Selecione o código e use Ctrl+C para copiá-lo.";
  }

  try {
    const range = document.createRange();
    range.selectNodeContents(codeElement);
    selection.removeAllRanges();
    selection.addRange(range);
    const copied = typeof document.execCommand === "function" && document.execCommand("copy");
    if (copied) {
      selection.removeAllRanges();
      return "";
    }
  } catch (error) {
    return "Não foi possível copiar automaticamente. O código está selecionado; use Ctrl+C para copiá-lo.";
  }
  return "Não foi possível copiar automaticamente. O código está selecionado; use Ctrl+C para copiá-lo.";
}

async function copyInstructorInviteLink(link) {
  if (!link) return "O link não está disponível. Gere um novo convite.";
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(link);
      return "";
    } catch {
      return copyInstructorInviteLinkFromSelection(link);
    }
  }
  return copyInstructorInviteLinkFromSelection(link);
}

function copyInstructorInviteLinkFromSelection(link) {
  const field = document.createElement("textarea");
  field.value = link;
  field.setAttribute("readonly", "");
  field.setAttribute("aria-hidden", "true");
  field.style.position = "fixed";
  field.style.opacity = "0";
  field.style.pointerEvents = "none";
  let copied = false;
  try {
    document.body.appendChild(field);
    field.select();
    copied = typeof document.execCommand === "function" && document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    field.remove();
  }
  return copied ? "" : "Não foi possível copiar o link automaticamente. Tente novamente em um navegador compatível.";
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

function professorConsentStorageKey(account) {
  return `tatame-demo-professor-consent-${account}`;
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
  if (!isDemoMode) return;
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

const privacyPlaceholder = "O aceite do termo (versão \"rascunho-1\") é gravado com o identificador do perfil, a versão e a data e hora. O Professor aceita na primeira vez, o Instrutor depois de usar o convite e o Aluno novo ao criar o perfil.";

function renderPrivacyDraftContent(headingTag = "h2") {
  return `
    <p class="notice notice--pending">Versão inicial, feita sem revisão jurídica. Não declara conformidade com a lei. Finalidades, bases legais e prazos de retenção ainda serão definidos.</p>
    <p class="panel-copy">O aceite do termo (versão "rascunho-1") é gravado com o identificador do perfil, a versão e a data e hora. O Professor aceita na primeira vez. O Instrutor aceita depois de usar o convite. O Aluno novo aceita ao criar o perfil.</p>

    <section class="privacy-draft-section">
      <${headingTag}>1. Dados que o app guarda</${headingTag}>
      <p>A conta real guarda os dados abaixo. O modo demonstração usa dados fictícios, guardados só no navegador, e não os envia ao Supabase.</p>
      <ul>
        <li>e-mail da conta (login Google, ou e-mail e senha para Aluno e Instrutor);</li>
        <li>nome, papel, idade declarada (adulto ou menor de 18 anos) e vínculo com a academia;</li>
        <li>nome da academia, pedidos de vínculo e vínculos entre Aluno e Professor;</li>
        <li>e-mail de Professor convidado e estado do convite; convites de Instrutor guardam o hash do token, datas e estado;</li>
        <li>nome e idade declarada de aluno sem conta;</li>
        <li>cobranças mensais: valor-base, vencimento, desconto, isenção (com motivo opcional de até 200 caracteres), estado e datas de envio;</li>
        <li>pagamentos: tipo (dinheiro ou comprovante), valor, estado e referência.</li>
      </ul>
      <p>No cadastro por e-mail e senha, o app coleta nome e e-mail. A senha é tratada pelo Supabase Auth e não é guardada pelo app.</p>
      <p>O comprovante no fluxo real guarda só o tipo e o valor, sem imagem. Não pedimos data de nascimento, telefone nem WhatsApp. Pedimos que não escreva dados sensíveis no motivo da isenção.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>2. Compartilhamento</${headingTag}>
      <p>O acesso depende do papel e dos vínculos:</p>
      <ul>
        <li>o Professor vê os Alunos vinculados a ele, suas cobranças e seus pagamentos;</li>
        <li>o Aluno vê apenas as cobranças que o Professor enviou a ele;</li>
        <li>o Instrutor vê só o nome dos Alunos do Professor, nunca valores;</li>
        <li>o Administrador vê fotos de Professores, e não vê foto, nome ou faixa de Alunos.</li>
      </ul>
      <p>O app só controla pagamentos. Ele não processa dinheiro. O app não envia notificações push.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>3. Menores de 18 anos</${headingTag}>
      <p>A idade é só declarada, sem verificação. Menores usam apenas avatar, sem foto de perfil. Convites de Instrutor exigem declaração de adulto. O tratamento de dados de menores e o consentimento de responsáveis ainda não foram resolvidos nesta política.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>4. Fotos</${headingTag}>
      <p>No momento, o app real não grava foto de perfil. O envio de arquivos só será ligado depois do login real, e menores seguirão só com avatar. A escolha de avatar masculino ou feminino é só de imagem na demonstração e não é gravada.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>5. Exclusão de conta</${headingTag}>
      <p>Na demonstração, a exclusão remove os dados pessoais fictícios, mantém registros compartilhados como "Conta excluída" e encerra a sessão. A exclusão de conta real está em construção e não é executada. Existe um conflito conhecido: registros de consentimento e de cobrança podem impedir a remoção de perfis. Até que seja resolvido, esta política não promete exclusão completa.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>6. Retenção</${headingTag}>
      <p>Os prazos não estão definidos. Hoje, pagamentos e cobranças não são apagados, apenas mudam de estado (por exemplo, cancelada ou estornado). Um Professor substituído na academia é desativado, não apagado.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>7. Direitos e solicitações</${headingTag}>
      <p>O titular pode pedir informação, correção ou exclusão pelo contato abaixo. Procedimentos e prazos ainda não foram definidos, e o app não tem autosserviço para isso.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>O que ainda está em construção</${headingTag}>
      <p>No modo real, ainda estão em construção a exclusão de conta, o armazenamento de fotos e as notas privadas. Esses recursos ainda não estão disponíveis.</p>
    </section>

    <section class="privacy-draft-section privacy-draft-contact">
      <${headingTag}>8. Contato</${headingTag}>
      <p>desenvolvedor.aylton@gmail.com</p>
    </section>
  `;
}

const screens = {
  login() {
    const loginControls = isDemoMode
      ? `
        <section class="demo-login-options" aria-labelledby="demo-login-title">
          <p class="eyebrow" id="demo-login-title">MODO DEMONSTRAÇÃO</p>
          <p class="field-help">Contas fictícias independentes para visualizar cada papel. Sair encerra a sessão simulada.</p>
          <div class="demo-login-list">
            ${Object.entries(demoProfiles).map(([account, profile]) => `<button class="button button--quiet" type="button" data-demo-login="${account}">Entrar como ${profile.label} · ${profile.name}</button>`).join("")}
          </div>
          ${button("Tenho um código de convite", "link-teacher", "button button--quiet", "↗")}
        </section>
      `
      : `
        <div class="visually-hidden" id="login-action-status" role="status" aria-live="polite" aria-atomic="true"></div>
        <button class="button button--google button--action" type="button" data-login-action aria-describedby="google-login-error">
          <img class="google-icon" src="assets/logos/google-g.svg" alt="" aria-hidden="true">
          <span data-action-label>Fazer login com o Google</span>
        </button>
        <div class="login-action-error" id="google-login-error" role="alert" aria-atomic="true">${escapeHtml(loginNotice)}</div>
        <div class="auth-divider">ou entre com e-mail</div>
        <form data-real-login-form novalidate>
          <div class="field">
            <label for="login-email">E-mail</label>
            <input id="login-email" name="email" type="email" autocomplete="username" placeholder="seu e-mail" aria-describedby="email-login-error" required>
          </div>
          <div class="field" style="margin-top:12px">
            <label for="login-password">Senha</label>
            <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" aria-describedby="email-login-error" required>
          </div>
          <button class="button button--primary button--action" type="submit" data-login-action aria-describedby="email-login-error" style="width:100%;margin-top:14px"><span data-action-label>Entrar</span></button>
          <div class="login-action-error" id="email-login-error" role="alert" aria-atomic="true"></div>
        </form>
        <p class="field-help" style="margin:15px 0 0">E-mail e senha são para Alunos e Instrutores. Professor e Adm entram pelo Google.</p>
        <button class="button button--quiet" type="button" data-screen-target="create-account">Criar conta</button>
        <button class="button button--quiet" type="button" data-screen-target="forgot-password">Esqueci a senha</button>
      `;
    return `
      ${heading("ACESSO", "Entre na sua conta", isDemoMode ? "Explore a demonstração com contas fictícias." : "Acesse sua conta pelo Google ou com e-mail e senha.")}
      <div class="auth-layout">
        <section class="auth-visual">
          <div>
            <img src="assets/logos/tatame-icone-escudo.svg" alt="">
            <h2>Treino, gestão e evolução no mesmo lugar.</h2>
            <p>${isDemoMode ? "Explore as telas com perfis fictícios." : "Entre para acompanhar suas aulas, graduações e pagamentos."}</p>
          </div>
          <span class="auth-visual-foot">${isDemoMode ? "Dados fictícios · sem login real" : "Acesso protegido · permissões vêm do banco"}</span>
        </section>
        <section class="auth-card">
          <img class="auth-mobile-mark" src="assets/logos/tatame-icone-escudo.svg" alt="">
          <p class="eyebrow">BEM-VINDO AO TATAME</p>
          <h2>${isDemoMode ? "Demonstração" : "Continuar"}</h2>
          <p>${isDemoMode ? "Nenhuma conta real é autenticada nesta área." : "Entre com sua conta real. O papel e as permissões são definidos pelo banco."}</p>
          ${loginControls}
          <div class="login-version"><span>Versão do app</span><span class="version-badge">${APP_VERSION}</span></div>
        </section>
      </div>
    `;
  },

  "create-account"() {
    return `
      ${heading("ACESSO", "Criar conta", "Use seu e-mail para criar uma conta de Aluno ou aceitar um convite de Instrutor.")}
      <div class="content-grid auth-form-layout">
        <section class="panel-card" style="max-width:620px;margin:0 auto">
          <form data-real-signup-form novalidate>
            <div class="field">
              <label for="real-signup-name">Nome</label>
              <input id="real-signup-name" name="name" type="text" autocomplete="name" maxlength="80" aria-describedby="real-signup-error" required>
            </div>
            <div class="field" style="margin-top:12px">
              <label for="real-signup-email">E-mail</label>
              <input id="real-signup-email" name="email" type="email" autocomplete="email" placeholder="seu e-mail" aria-describedby="real-signup-error" required>
            </div>
            <div class="field" style="margin-top:12px">
              <label for="real-signup-password">Senha</label>
              <input id="real-signup-password" name="password" type="password" autocomplete="new-password" minlength="8" aria-describedby="real-signup-help real-signup-error" required>
            </div>
            <div class="field" style="margin-top:12px">
              <label for="real-signup-confirm-password">Confirmar senha</label>
              <input id="real-signup-confirm-password" name="password-confirmation" type="password" autocomplete="new-password" minlength="8" aria-describedby="real-signup-help real-signup-error" required>
            </div>
            <small class="field-help" id="real-signup-help">A senha deve ter pelo menos 8 caracteres.</small>
            <div class="form-actions">
              <button class="button button--primary button--action" type="submit" data-login-action aria-describedby="real-signup-error real-signup-status"><span data-action-label>Criar conta</span></button>
              <button class="button button--quiet" type="button" data-screen-target="login">Voltar para entrar</button>
            </div>
            <div class="login-action-error" id="real-signup-error" role="alert" aria-atomic="true"></div>
            <div class="field-help" id="real-signup-status" role="status" aria-live="polite" aria-atomic="true"></div>
          </form>
        </section>
      </div>
    `;
  },

  "forgot-password"() {
    return `
      ${heading("ACESSO", "Esqueci a senha", "Enviaremos um link para redefinir a senha, se houver uma conta com este e-mail.")}
      <div class="content-grid auth-form-layout">
        <section class="panel-card" style="max-width:620px;margin:0 auto">
          <form data-real-password-reset-form novalidate>
            <div class="field">
              <label for="real-reset-email">E-mail</label>
              <input id="real-reset-email" name="email" type="email" autocomplete="email" placeholder="seu e-mail" aria-describedby="real-reset-error" required>
            </div>
            <div class="form-actions">
              <button class="button button--primary button--action" type="submit" data-login-action aria-describedby="real-reset-error real-reset-status"><span data-action-label>Enviar link</span></button>
              <button class="button button--quiet" type="button" data-screen-target="login">Voltar para entrar</button>
            </div>
            <div class="login-action-error" id="real-reset-error" role="alert" aria-atomic="true"></div>
            <div class="field-help" id="real-reset-status" role="status" aria-live="polite" aria-atomic="true"></div>
          </form>
        </section>
      </div>
    `;
  },

  "password-recovery"() {
    return `
      ${heading("ACESSO", "Definir nova senha", "Escolha uma nova senha para sua conta.")}
      <div class="content-grid auth-form-layout">
        <section class="panel-card" style="max-width:620px;margin:0 auto">
          <form data-real-password-update-form novalidate>
            <div class="field">
              <label for="real-new-password">Nova senha</label>
              <input id="real-new-password" name="password" type="password" autocomplete="new-password" minlength="8" aria-describedby="real-password-update-help real-password-update-error" required>
            </div>
            <div class="field" style="margin-top:12px">
              <label for="real-confirm-new-password">Confirmar nova senha</label>
              <input id="real-confirm-new-password" name="password-confirmation" type="password" autocomplete="new-password" minlength="8" aria-describedby="real-password-update-help real-password-update-error" required>
            </div>
            <small class="field-help" id="real-password-update-help">A senha deve ter pelo menos 8 caracteres.</small>
            <div class="form-actions">
              <button class="button button--primary button--action" type="submit" data-login-action aria-describedby="real-password-update-error real-password-update-status"><span data-action-label>Salvar nova senha</span></button>
            </div>
            <div class="login-action-error" id="real-password-update-error" role="alert" aria-atomic="true"></div>
            <div class="field-help" id="real-password-update-status" role="status" aria-live="polite" aria-atomic="true"></div>
          </form>
        </section>
      </div>
    `;
  },

  "real-account"() {
    const role = realProfile ? escapeHtml(realProfile.papel || "Não definido") : "";
    const storedName = realProfile && typeof realProfile.nome === "string" ? realProfile.nome.trim() : "";
    const canDefineRealTeacherName = isRealActiveProfessor();
    const profileName = storedName
      ? escapeHtml(storedName)
      : canDefineRealTeacherName
        ? "Defina seu nome abaixo."
        : isRealProfessorProfile()
          ? "Edição indisponível."
          : "Nome não definido";
    const realProfessorAccessNotice = isRealProfessorProfile() && !canDefineRealTeacherName
      ? realProfile.ativo !== true
        ? "Seu perfil de Professor está inativo. Peça ao Adm para reativá-lo antes de definir o nome."
        : "Seu perfil de Professor não está vinculado a uma academia. Peça ao Adm para vinculá-lo antes de definir o nome."
      : "";
    const realTeacherNameSection = canDefineRealTeacherName
      ? `${storedName ? "" : '<p class="notice notice--pending" id="real-teacher-name-missing" role="status" aria-live="polite">Seu nome ainda não está definido. Defina-o no campo abaixo.</p>'}
        <form class="real-teacher-name-form" data-real-teacher-name-form>
          <div class="form-grid">
            <div class="field field--wide">
              <label for="real-teacher-name">Nome do perfil</label>
              <input id="real-teacher-name" name="nome" type="text" value="${escapeHtml(storedName)}" autocomplete="name" maxlength="160" aria-describedby="real-teacher-name-help">
              <small class="field-help" id="real-teacher-name-help">Use de 2 a 80 caracteres, sem caracteres de controle.</small>
            </div>
          </div>
          <div class="form-actions">
            <button class="button button--primary button--action" type="submit" data-real-teacher-name-save aria-describedby="real-teacher-name-error real-teacher-name-status">
              <span data-action-label>Definir nome</span>
            </button>
          </div>
          <div class="login-action-error" id="real-teacher-name-error" role="alert" aria-atomic="true"></div>
          <div class="field-help" id="real-teacher-name-status" role="status" aria-live="polite"></div>
        </form>`
      : realProfessorAccessNotice
        ? `<p class="notice notice--pending" role="status">${escapeHtml(realProfessorAccessNotice)}</p>`
        : "";
    const realRoleAvailabilityNotice = !realProfile
      ? "Sem telas próprias identificadas para este papel por enquanto."
      : realProfile.papel === "professor"
        ? `Papel lido do banco: ${role}. Disponível agora: cobranças mensais, pagamentos (confirmar, rejeitar, estornar e lançar dinheiro), graduações, seleção de alunos vinculados nas cobranças e nas graduações e convite de Instrutor.`
        : realProfile.papel === "aluno"
          ? `Papel lido do banco: ${role}. Disponível agora: suas cobranças enviadas pelo Professor, avisar pagamento, sua faixa e histórico de graduações.${isRealActiveInstructor() ? " Como Instrutor de apoio, também pode consultar a lista de alunos do Professor com nome e faixa/grau atuais." : ""}`
          : realProfile.papel === "instrutor"
            ? `Papel lido do banco: ${role}. Disponível agora: lista de alunos do Professor com nome e faixa/grau atuais.`
            : realProfile.papel === "adm"
              ? `Papel lido do banco: ${role}. Disponível agora: gestão de academias, convites de Professor, gestão de Professores e lista de alunos com nome e faixa atual.`
              : `Papel lido do banco: ${role}. Sem telas próprias identificadas para este papel por enquanto.`;
    const realRoleStatusNotice = realProfile && ["professor", "aluno", "instrutor", "adm"].includes(realProfile.papel)
      ? `${realRoleAvailabilityNotice} Em construção: exclusão real da conta, notas privadas reais, armazenamento de fotos (Storage) e conversa real.`
      : realRoleAvailabilityNotice;
    const text = realProfileState === "checking"
      ? ["Verificando seu perfil", "Aguarde a consulta da conta."]
      : realProfileState === "missing"
        ? ["Sua conta ainda não tem perfil", realProfileNotice || "Conclua o cadastro do perfil para acessar o aplicativo."]
        : realProfileState === "found"
          ? realProfessorActivated
            ? realProfile && realProfile.ativo === false
              ? ["Perfil de Professor aguardando troca pelo Adm", `Papel lido do banco: ${role}. O perfil está inativo até o Adm concluir a troca.`]
              : ["Perfil de Professor ativado", realRoleStatusNotice]
            : isRealAdmSession()
              ? ["Perfil de Adm encontrado", realRoleStatusNotice]
              : ["Perfil encontrado", realRoleStatusNotice]
          : ["Não foi possível consultar seu perfil", realProfileNotice || "Confira a conexão e tente novamente. Não é possível determinar se existe um perfil."];
    return `${heading("CONTA", text[0], text[1])}
      ${panel("Sessão", `<p>Sua conta está conectada. Abra o painel da conta para ver o e-mail ou sair.</p>
        ${realProfileState === "found" ? `<p><strong>Papel no banco:</strong> ${role}<br><strong>Nome:</strong> <span id="real-profile-name">${profileName}</span></p>` : ""}
        ${realProfileState === "found" ? realTeacherNameSection : ""}
        ${realProfileState === "error" ? `<p class="login-action-error" role="alert">${escapeHtml(realProfileNotice || text[1])}</p>` : ""}
        ${realInstructorLinkState === "error" ? `<p class="login-action-error" role="alert">${escapeHtml(realInstructorLinkNotice)}</p>` : ""}
        <button class="button button--quiet" type="button" data-open-user-panel>Abrir painel da conta</button>
        ${isRealAdmSession() ? `<div class="form-actions">${button("Academia", "academy", "button button--quiet")}${button("Professores convidados", "teacher-invites", "button button--quiet")}${button("Professores e papéis", "role-management", "button button--quiet")}</div>` : ""}
        ${isRealProfessorProfile() ? `<div class="form-actions">${button("Código e convites", "teacher-code", "button button--quiet")}</div>` : ""}
        ${realProfileState === "error" ? '<button class="button button--quiet" type="button" data-retry-profile>Tentar consultar novamente</button>' : ""}
        ${button("Voltar à entrada de demonstração", "login", "button button--quiet")}`)}`;
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
    const profile = demoProfiles[activeDemoAccount];
    const studentCharges = activeRole === "student"
      ? monthlyCharges.filter((charge) => studentCanSeeCharge(charge, activeDemoAccount))
      : [];
    const latestCharge = [...studentCharges].sort((left, right) => right.month.localeCompare(left.month))[0];
    const nextDueCharge = studentCharges.filter((charge) => charge.status === "aberta")
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0];
    const chargeStatus = latestCharge
      ? latestCharge.status === "paga" ? "PAGA"
        : latestCharge.status === "isenta" ? "ISENTA"
          : latestCharge.status === "cancelada" ? "CANCELADA"
            : monthlyChargeIsLate(latestCharge) ? "ATRASADA" : "EM ABERTO"
      : "Sem cobranças";
    const lastPayment = [...cashPayments, ...receiptPayments].reverse().find((payment) => payment.account === activeDemoAccount);
    const paymentStatus = lastPayment
      ? lastPayment.status === "pending" ? "AGUARDA CONFIRMAÇÃO"
        : lastPayment.status === "confirmed" ? "CONFIRMADO"
          : lastPayment.status === "rejected" ? "RECUSADO" : "HISTÓRICO"
      : "SEM AVISOS";
    const paymentSummary = activeRole === "instructor"
      ? listRow("Aviso de pagamento", paymentStatus, "", `<span class="badge">${paymentStatus}</span>`)
      : listRow(
        lastPayment ? "Pagamento informado" : "Mensalidade",
        lastPayment ? formatDemoDate(lastPayment.date) : "Nenhum pagamento informado",
        lastPayment ? escapeHtml(lastPayment.amount) : latestCharge ? formatDemoCents(latestCharge.finalAmountCents) : "",
        `<span class="badge">${paymentStatus}</span>`
      );
    return `
      ${heading("VISÃO DO ALUNO", "Início", "Resumo pessoal da conta fictícia.")}
      <div class="content-grid">
        <div class="stack">
          ${panel("Meu perfil", personRow(escapeHtml(profile.name), `${escapeHtml(profile.label)} · perfil de demonstração`, "avatar-masculino.jpg", "", activeDemoAccount, "self") + studentAcademyDetails(activeDemoAccount) + `
            <div class="student-belt"><span class="belt-swatch"></span><span><strong>Faixa cadastrada</strong><small>Graus e histórico em Minhas graduações</small></span></div>
          `, "panel-card--highlight")}
          ${activeRole === "student" ? `<div class="card-grid card-grid--two">
            ${metric("SITUAÇÃO DA MENSALIDADE", chargeStatus, "Status demonstrativo", "gold")}
            ${metric("PRÓXIMO VENCIMENTO", nextDueCharge ? formatDemoDate(nextDueCharge.dueDate) : "—", nextDueCharge ? nextDueCharge.month : "Data não informada", "amber")}
          </div>` : ""}
        </div>
        <div class="stack">
          ${panel("Pagamento recente", paymentSummary)}
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
    const teacherAccount = profile ? demoTeacherAccountFor(activeDemoAccount, profile) : null;
    const teacher = teacherAccount ? demoProfiles[teacherAccount] : null;
    const teacherDeleted = deletedDemoAccounts.has(teacherAccount);
    const request = currentLinkRequest();
    return `
      ${heading("VISÃO DO ALUNO", "Meu vínculo", "Professor e academia aos quais sua conta está vinculada.")}
      <div class="content-grid">
        ${panel("Vínculo atual", `
          ${teacher
            ? personRow(escapeHtml(teacher.name), `Professor · ${escapeHtml(demoAcademy.name)}`, "avatar-masculino.jpg", '<span class="badge badge--green">ATIVO</span>', teacherAccount, "professor")
            : teacherDeleted
              ? '<div class="notice notice--pending">Professor: Conta excluída. O vínculo histórico foi preservado.</div>'
              : emptyState("Sem Professor vinculado", "Use um código de seis caracteres para solicitar vínculo.")}
          <div class="belt-display" style="margin-top:14px"><span class="belt-swatch"></span><span class="belt-copy"><strong>Sua faixa e graduações acompanham a conta</strong><small>O histórico de pagamentos fica com o Professor anterior</small></span></div>
          <div class="form-actions">
            ${teacher || teacherDeleted ? button("Trocar de professor", "link-teacher", "button button--quiet", "⌁") : button("Vincular a um professor", "link-teacher", "button button--quiet", "⌁")}
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
    if (activeRole === "instructor") {
      return `
        ${heading("VISÃO DO INSTRUTOR", "Meus pagamentos", "Cobranças e valores não são exibidos para Instrutores.")}
      `;
    }
    const studentPayments = [...cashPayments, ...receiptPayments].filter((payment) => payment.account === activeDemoAccount);
    const pendingPayments = studentPayments.filter((payment) => payment.status === "pending");
    const receivedPayments = studentPayments.filter((payment) => payment.status === "confirmed");
    const lastCashPayment = [...cashPayments].reverse().find((payment) => payment.account === activeDemoAccount && !["undone", "reversed"].includes(payment.status));
    const studentCharges = monthlyCharges.filter((charge) => studentCanSeeCharge(charge, activeDemoAccount));
    const openCharges = studentCharges.filter((charge) => charge.status === "aberta");
    const selectedCharge = openCharges.find((charge) => charge.id === selectedStudentChargeId) || openCharges[0] || null;
    selectedStudentChargeId = selectedCharge ? selectedCharge.id : null;
    const selectedChargeBalance = selectedCharge
      ? Math.max(0, selectedCharge.finalAmountCents - chargeConfirmedCents(selectedCharge))
      : null;
    const receiptAlreadySent = selectedCharge
      ? chargeHasPendingPayment(selectedCharge.id)
      : receiptPayments.some((payment) => payment.account === activeDemoAccount && !payment.chargeId);
    const expectedCents = studentCharges.filter((charge) => charge.status !== "cancelada")
      .reduce((total, charge) => total + charge.finalAmountCents, 0);
    const openCents = openCharges.filter((charge) => !monthlyChargeIsLate(charge))
      .reduce((total, charge) => total + Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge)), 0);
    const lateCharges = openCharges.filter((charge) => monthlyChargeIsLate(charge));
    const lateCents = lateCharges.reduce((total, charge) => total + Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge)), 0);
    const cashResult = lastCashPayment
      ? lastCashPayment.status === "pending"
        ? "Pagamento em dinheiro lançado e PENDENTE até a confirmação do Professor."
        : lastCashPayment.status === "confirmed"
          ? `Pagamento confirmado pelo Professor: ${lastCashPayment.amount} · ${formatDemoDate(lastCashPayment.date)}.`
          : "O Professor recusou o aviso de pagamento em dinheiro."
      : "";
    return `
      ${heading("VISÃO DO ALUNO", "Meus pagamentos", "Consulte cobranças e avisos. O Tatame controla pagamentos; não movimenta dinheiro.")}
      <div class="card-grid card-grid--four">
        ${metric("EM ABERTO", formatDemoCents(openCents), "Saldo dentro do prazo", "gold")}
        ${metric("AGUARDANDO CONFIRMAÇÃO", formatDemoPaymentTotal(pendingPayments), `${pendingPayments.length} aviso(s) ou comprovante(s)`, "amber")}
        ${metric("PAGOS", formatDemoPaymentTotal(receivedPayments), `${receivedPayments.length} confirmação(ões)`, "green")}
        ${metric("ATRASADOS", formatDemoCents(lateCents), `${lateCharges.length} cobrança(s)`, "red")}
      </div>
      <div class="content-grid" style="margin-top:16px">
        ${panel("Cobranças do mês", studentCharges.length
          ? studentCharges.map((charge) => renderMonthlyChargeRow(charge)).join("")
          : emptyState("Nenhuma cobrança registrada", `Valor previsto: ${formatDemoCents(expectedCents)}.`))}
        ${panel("Registros de pagamento", renderStudentPaymentHistory())}
        ${panel("Avisar pagamento", `
          <p class="panel-copy">O aviso fica pendente até o professor confirmar. O app não movimenta dinheiro.</p>
          <div class="stack" style="margin-top:12px">
            <div class="field"><label for="student-charge-select">Cobrança vinculada (opcional)</label><select id="student-charge-select" data-student-charge-select>
              <option value="">Sem cobrança específica</option>
              ${openCharges.map((charge) => `<option value="${escapeHtml(charge.id)}" ${selectedCharge && charge.id === selectedCharge.id ? "selected" : ""}>${escapeHtml(charge.month)} · venc. ${escapeHtml(formatDemoDate(charge.dueDate))} · saldo ${escapeHtml(formatDemoCents(Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge))))}</option>`).join("")}
            </select></div>
            <label class="button button--primary file-action" for="receipt-file">Escolher comprovante Pix (imagem ou PDF)</label>
            <input id="receipt-file" class="visually-hidden" type="file" accept="image/*,application/pdf" data-receipt-file ${receiptAlreadySent ? "disabled" : ""}>
            <div class="form-grid cash-entry-fields${activeRole === "student" ? " cash-entry-fields--student" : ""}">
              <div class="field"><label for="cash-amount">Valor recebido</label><input id="cash-amount" type="number" min="0.01" step="0.01" value="${selectedChargeBalance === null ? "150.00" : (selectedChargeBalance / 100).toFixed(2)}"></div>
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
          <div class="notice notice--pending" id="duplicate-receipt-warning" style="margin-top:10px" ${receiptAlreadySent ? "" : "hidden"}>Já existe um aviso pendente para esta cobrança fictícia. Aguarde a decisão do Professor.</div>
          <p class="field-help">Isenções e descontos são definidos pelo Professor. O estado atrasado considera o vencimento e a carência configurada.</p>
          <p class="field-help" style="margin-top:8px">Parser de comprovante: pendente de teste real no iPhone.</p>
          <p class="field-help" style="margin-top:12px">O Tatame não envia nem guarda arquivos.</p>
        `)}
      </div>
    `;
  },

  "student-chat"() {
    const partner = demoChatPartners(activeDemoAccount)[0];
    return `
      ${heading("VISÃO DO ALUNO", "Conversa com o professor", "Conversa individual entre você e o professor. Não há conversa com outros alunos ou instrutores.")}
      ${panel("Mensagens", `
        ${partner
          ? `${renderDemoConversation(activeDemoAccount, partner)}${renderDemoConversationForm(partner)}`
          : emptyState("Conversa indisponível", "Não há um Professor vinculado para esta conversa demonstrativa.")}
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
    const teacherPayments = [...cashPayments, ...receiptPayments].filter((payment) => payment.professorAccount === activeDemoAccount);
    const pendingPayments = teacherPayments.filter((payment) => payment.status === "pending");
    const summary = monthlyBillingSummary(activeDemoAccount, dashboardSelectedMonth);
    return `
      ${heading("VISÃO DO PROFESSOR", "Painel do professor", "Acompanhe alunos, cobranças e autorizações fictícias.")}
      <div class="card-grid card-grid--four">
        ${renderBillingMetrics(summary)}
      </div>
      <div class="content-grid" style="margin-top:16px">
        ${panel("Período do painel", `
          <div class="field"><label for="dashboard-billing-month">Mês de referência</label><input id="dashboard-billing-month" type="month" value="${escapeHtml(dashboardSelectedMonth)}" data-dashboard-month></div>
          <p class="field-help">Carência atual: ${billingGraceDaysFor(activeDemoAccount)} dia(s). Atrasos são calculados e não ficam gravados.</p>
        `)}
        ${panel("Alertas", `
          ${listRow("Pagamentos a confirmar", `${pendingPayments.length} aviso(s) ou comprovante(s)`, "", `<span class="badge ${pendingPayments.length ? "badge--amber" : "badge--green"}">${pendingPayments.length ? "PENDENTE" : "SEM PENDÊNCIAS"}</span>`)}
          ${listRow("Atrasos", `${chargesForTeacherMonth(activeDemoAccount, dashboardSelectedMonth).filter((charge) => monthlyChargeIsLate(charge)).length} cobrança(s) no mês selecionado`, "", `<span class="badge ${summary.lateCents ? "badge--red" : "badge--green"}">${summary.lateCents ? "VER ATRASOS" : "SEM ATRASOS"}</span>`)}
          ${listRow("Aniversários", "Lista e aviso entram na fase de operação", "", '<span class="badge">F2</span>')}
        `)}
        ${panel("Acessos rápidos", `
          <div class="stack">
            ${button("Configurar cobranças", "monthly-charges", "button button--primary")}
            ${button("Cadastrar aluno", "student-create", "button button--quiet")}
            ${button("Papéis e autorizações", "role-management", "button button--quiet")}
            ${button("Importar extrato Pix", "pix-import", "button button--quiet")}
            ${button("Confirmar pagamentos", "payment-review", "button button--quiet")}
            ${button("Conversas", "teacher-chat", "button button--quiet")}
            <p class="field-help">Cobranças controladas nesta demonstração; sem gateway ou movimentação de dinheiro.</p>
          </div>
        `)}
      </div>
      <div style="margin-top:16px">
        ${panel("Aulas de hoje", `<div class="notice notice--info">Disponível em versão futura. O plano de aulas, arquivo de temas e sugestões ainda não estão disponíveis.</div>`)}
      </div>
    `;
  },

  students() {
    const students = demoRoster
      .map((student, index) => ({ student, index }))
      .filter(({ student }) => student.teacherAccount === activeDemoAccount &&
        (student.account !== "instructor" || student.demoCreated));
    return `
      ${heading("VISÃO DO PROFESSOR", "Alunos", "Gerencie somente os alunos vinculados ao seu perfil.", button("Novo aluno", "student-create", "button button--primary", "+"))}
      ${panel("Lista de alunos", `
        <label class="search-wrap"><span class="search-symbol" aria-hidden="true">⌕</span><input class="search-input" type="search" placeholder="Buscar aluno (demonstração)" aria-label="Buscar aluno" data-student-search></label>
        <div class="filter-row" role="group" aria-label="Filtros de demonstração">
          <button class="filter-chip" type="button" aria-pressed="true" data-student-filter="all">Todos</button>
          <button class="filter-chip" type="button" aria-pressed="false" data-student-filter="active">Ativos</button>
          <button class="filter-chip" type="button" aria-pressed="false" data-student-filter="locked">Trancados</button>
          <button class="filter-chip" type="button" aria-pressed="false" data-student-filter="no-access">Sem acesso</button>
        </div>
        ${students.length ? students.map(({ student, index }) => {
          const locked = student.status === "locked";
          const hasAccess = Boolean(student.account);
          const detail = locked ? "TRANCADO" : hasAccess ? "ATIVO" : "SEM LOGIN";
          const badge = locked ? "badge--amber" : hasAccess ? "badge--green" : "badge--blue";
          const image = index === 2 ? "avatar-feminino.jpg" : "avatar-masculino.jpg";
          return studentEntry(student.name, detail, image, badge, index);
        }).join("") : emptyState("Nenhum aluno vinculado", "Alunos vinculados ao Professor aparecerão aqui.")}
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
          ${personRow(student ? escapeHtml(student.name) : "Nenhum aluno da turma", "Cadastro demonstrativo · perfil de aluno", "avatar-masculino.jpg", "", student, "student")}
          ${student ? studentAcademyDetails(student.account, student) : ""}
          ${student && !student.account ? `
            <form class="student-age-form" data-student-age-form>
              <div class="field">
                <label for="student-age-status">Idade declarada ao Professor</label>
                <select id="student-age-status">
                  <option value="unknown" ${getPhotoProfile(student).age === "unknown" ? "selected" : ""}>Ainda não informada</option>
                  <option value="adult" ${getPhotoProfile(student).age === "adult" ? "selected" : ""}>18 anos ou mais</option>
                  <option value="minor" ${getPhotoProfile(student).age === "minor" ? "selected" : ""}>Menor de 18 anos</option>
                </select>
                <small class="field-help">Sem data de nascimento. Menor de 18 anos usa somente avatar.</small>
              </div>
              <div class="student-action-control">
                <button class="button button--primary button--action" type="button" data-save-student-age><span data-action-label>Salvar classificação</span></button>
                <p class="login-action-error" role="alert"></p>
                <p class="field-help" role="status" aria-live="polite"></p>
              </div>
            </form>
          ` : ""}
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
        <p class="panel-copy" style="margin-top:16px">Contato e outros dados só aparecem conforme o escopo definido para cada perfil.</p>
      </section>
      <section class="tab-panel panel-card" id="panel-payments" role="tabpanel" aria-labelledby="tab-payments" data-tab-panel="payments" hidden>${listRow("Cobrança", "Vencimento: —", "R$ —", '<span class="badge badge--pending">PENDENTE</span>')}${emptyState("Sem registros adicionais", "O histórico é demonstrativo.")}</section>
      <section class="tab-panel panel-card" id="panel-grades" role="tabpanel" aria-labelledby="tab-grades" data-tab-panel="grades" hidden>${gradeForm}</section>
      <section class="tab-panel panel-card" id="panel-feedback" role="tabpanel" aria-labelledby="tab-feedback" data-tab-panel="feedback" hidden>${emptyState("Nenhum feedback demonstrativo", "Mensagens e metas aparecem conforme o roadmap.")}</section>
      <section class="tab-panel panel-card" id="panel-notes" role="tabpanel" aria-labelledby="tab-notes" data-tab-panel="notes" hidden>${renderDemoPrivateNotes(student)}</section>
    `;
  },

  "student-create"() {
    return `
      ${heading("VISÃO DO PROFESSOR", "Novo aluno e convite", "Use somente dados fictícios. Nome e graduação ficam neste navegador; nenhum login ou convite é criado.")}
      <div class="content-grid">
        ${panel("Cadastro", `
          <form data-create-demo-student>
            <div class="form-grid">
              <div class="field"><label for="student-name">Nome fictício</label><input id="student-name" type="text" placeholder="Nome fictício do aluno" required></div>
              <div class="field" id="student-age-field" hidden>
                <label for="student-age-status">Idade declarada pelo Professor</label>
                <select id="student-age-status"><option value="unknown">Ainda não informada</option><option value="adult">18 anos ou mais</option><option value="minor">Menor de 18 anos</option></select>
                <small class="field-help">Sem data de nascimento. Menor de 18 anos usa somente avatar.</small>
              </div>
              <div class="field">
                <label for="student-belt">Faixa</label>
                <select id="student-belt" required><option value="">Selecione</option>${demoBelts.map((belt) => `<option>${belt}</option>`).join("")}</select>
              </div>
              <div class="field"><label for="student-degree">Grau atual</label><select id="student-degree" required disabled><option value="">Selecione a faixa</option></select></div>
              <div class="field">
                <label for="student-access">Acesso (demonstração)</label>
                <select id="student-access"><option value="invite">Convite não gerado</option><option value="no-login">Perfil sem login</option></select>
                <small class="field-help">A demonstração não cria conta nem convite.</small>
              </div>
            </div>
            <p class="field-help" id="student-age-help">Na versão funcional, a idade é declarada no primeiro acesso. Na demonstração, nenhum convite é criado; para perfil sem login, o Professor marca a faixa etária sem data de nascimento.</p>
            <div class="notice notice--info" style="margin-top:16px">A demonstração salva apenas o nome e a graduação no navegador. Nenhum contato, plano, valor, vencimento, login ou convite é criado; a idade declarada fica nesta sessão.</div>
            <div class="form-actions"><button class="button button--quiet" type="reset">Limpar campos</button><div class="student-action-control"><button class="button button--primary button--action" type="submit" data-student-create-action><span data-action-label>Cadastrar aluno fictício</span></button><p class="login-action-error student-action-error" role="alert"></p></div></div>
            <p class="field-help" role="status" aria-live="polite"></p>
          </form>
        `)}
        ${panel("Convite do aluno", `
          <div class="notice notice--info">A demonstração não cria nem envia convites. O cadastro é somente local.</div>
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
              ${hasAcademy ? `
                <div class="teacher-code-value">
                  <strong class="code-display" data-teacher-code-display>${escapeHtml(linkCode)}</strong>
                  <button class="button button--quiet button--action" type="button" data-copy-teacher-code data-teacher-code-action>
                    <span data-action-label>Copiar</span>
                  </button>
                </div>
                <p>Academia: ${escapeHtml(demoAcademy.name)}. Compartilhe com alunos que já têm conta.</p>
                <button class="button button--quiet button--action" type="button" data-change-teacher-code data-teacher-code-action>
                  <span data-action-label>Trocar código</span>
                </button>
                <p class="login-action-error teacher-code-action-error" role="alert" data-teacher-code-error></p>
                <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-teacher-code-status></div>
              ` : `<strong>Professor sem academia</strong><p>O Adm precisa vincular uma academia antes de liberar o código.</p>`}
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
                <button class="button button--small button--primary" type="button" data-bind-professor-academy="${escapeHtml(account)}" ${profile.academyId ? "disabled" : ""}>${profile.academyId ? "Academia vinculada" : `Vincular à ${escapeHtml(demoAcademy.name)}`}</button>
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
              <div><strong>${escapeHtml(demoRoster[0].name)}</strong><small>Valor lido: R$ 150,00 · Data lida: 01/11/2026</small><small>Cobrança sugerida: mensalidade · R$ 150,00</small></div>
              ${teacherPaymentButton("Confirmar", "pix-confirmar", "button button--small button--primary", "data-confirm-pix")}
              <p class="visually-hidden" role="status" aria-live="polite"></p>
            </div>
            <div class="pix-match-row" data-pix-match>
              <div><strong>${escapeHtml(demoRoster[2].name)}</strong><small>Valor lido: R$ 120,00 · Data lida: 02/11/2026</small><small>Cobrança sugerida: mensalidade · R$ 150,00</small></div>
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
            <p class="panel-copy">O recebimento fica confirmado na hora. Você pode desfazê-lo por 120 segundos no histórico; depois, use Estornar.</p>
            <form data-register-teacher-cash>
              <div class="form-grid">
                <div class="field"><label for="teacher-cash-student">Aluno da sua turma</label><input id="teacher-cash-student" type="text" role="combobox" aria-autocomplete="list" aria-controls="teacher-cash-students" aria-expanded="false" autocomplete="off" aria-describedby="teacher-cash-student-help teacher-cash-selection" required><div class="teacher-cash-options" id="teacher-cash-students" role="listbox" aria-label="Alunos da sua turma" hidden></div><small class="field-help" id="teacher-cash-student-help">Digite o nome e selecione o aluno e sua graduação na lista.</small><small class="field-help teacher-cash-selection" id="teacher-cash-selection" role="status"></small></div>
                <div class="field"><label for="teacher-cash-amount">Valor recebido</label><input id="teacher-cash-amount" type="number" min="0.01" step="0.01" value="150.00" required></div>
                <div class="field"><label for="teacher-cash-date">Data de recebimento</label><input id="teacher-cash-date" type="date" value="2026-11-07" required></div>
                <div class="field"><label for="teacher-cash-charge">Cobrança vinculada (opcional)</label><select id="teacher-cash-charge" data-teacher-cash-charge>
                  <option value="">Sem cobrança específica</option>
                  ${monthlyCharges.filter((charge) => charge.professorAccount === activeDemoAccount && charge.status === "aberta").map((charge) => `<option value="${escapeHtml(charge.id)}">${escapeHtml(charge.studentName)} · ${escapeHtml(charge.month)} · saldo ${escapeHtml(formatDemoCents(Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge))))}</option>`).join("")}
                </select></div>
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

  "monthly-charges"() {
    const students = billingStudentsForTeacher(activeDemoAccount);
    const charges = chargesForTeacherMonth(activeDemoAccount, billingSelectedMonth);
    return `
      ${heading("VISÃO DO PROFESSOR", "Cobranças mensais", "Configure a mensalidade por aluno e gere no máximo 24 cobranças por vez. Tudo fica na demonstração local; não há gateway.")}
      <div class="notice notice--info">O app só controla pagamentos e não envia mensagens fora do app.</div>
      <div class="content-grid">
        <div class="stack">
          ${panel("Regras do mês", `
            <form data-billing-form novalidate>
              <div class="form-grid">
                <div class="field"><label for="billing-month">Mês das cobranças</label><input id="billing-month" type="month" value="${escapeHtml(billingSelectedMonth)}" data-billing-month required></div>
                <div class="field"><label for="billing-grace-days">Carência (0 a 30 dias)</label><input id="billing-grace-days" type="number" min="0" max="30" step="1" value="${billingGraceDaysFor(activeDemoAccount)}" data-billing-grace-days required></div>
              </div>
              ${students.length ? students.map((student) => renderBillingConfigRow(student, billingSelectedMonth)).join("") : emptyState("Nenhum aluno ativo", "Somente alunos ativos da sua turma podem receber uma cobrança.")}
              <p class="field-help" id="billing-discount-help">Desconto em R$ ou %, com duração só neste mês, por N meses ou até remover. Regras salvas passam a valer a partir do mês escolhido; cobranças já geradas mantêm seu histórico.</p>
              <p class="field-help" id="billing-duration-help">A contagem dos N meses inclui o mês escolhido.</p>
              <div class="notice notice--pending" id="billing-sensitive-warning">Motivo de isenção é opcional. Não escreva dados de saúde nem outras informações sensíveis.</div>
              <div class="student-action-control">
                <button class="button button--primary button--action" type="submit" data-save-billing-settings aria-describedby="billing-settings-error billing-settings-status"><span data-action-label>Salvar regras</span></button>
                <p class="login-action-error student-action-error" id="billing-settings-error" role="alert"></p>
              </div>
              <p class="field-help" id="billing-settings-status" role="status" aria-live="polite"></p>
              <div class="student-action-control">
                <button class="button button--quiet button--action" type="button" data-generate-monthly-charges aria-describedby="billing-generate-error billing-generate-status"><span data-action-label>Gerar cobranças do mês</span></button>
                <p class="login-action-error student-action-error" id="billing-generate-error" role="alert"></p>
              </div>
              <p class="field-help" id="billing-generate-status" role="status" aria-live="polite"></p>
            </form>
          `)}
        </div>
        <div class="stack">
          ${panel("Cobranças do mês", `
            <p class="field-help" id="monthly-charge-list-month">Mês: ${escapeHtml(billingSelectedMonth)}</p>
            <div id="monthly-charge-list">${charges.length
              ? charges.map((charge) => renderMonthlyChargeRow(charge, true)).join("")
              : emptyState("Nenhuma cobrança neste mês", "Salve as regras dos alunos e gere o lote para registrar as cobranças.")}
            </div>
          `)}
        </div>
      </div>
    `;
  },

  overdue() {
    const lateCharges = chargesForTeacherMonth(activeDemoAccount, dashboardSelectedMonth)
      .filter((charge) => monthlyChargeIsLate(charge));
    return `
      ${heading("VISÃO DO PROFESSOR", "Atrasos e cobrança", "Atrasos são calculados a partir da cobrança aberta, do vencimento e da carência; não são gravados como estado.")}
      <div class="content-grid">
        ${panel("Status de atrasos", `
          <div class="field"><label for="overdue-billing-month">Mês de referência</label><input id="overdue-billing-month" type="month" value="${escapeHtml(dashboardSelectedMonth)}" data-dashboard-month></div>
          <p class="field-help">Carência: ${billingGraceDaysFor(activeDemoAccount)} dia(s), ajustável nas cobranças mensais.</p>
          ${lateCharges.length
            ? lateCharges.map((charge) => `<article class="monthly-charge-row"><div class="list-row"><span class="row-copy"><strong>${escapeHtml(charge.studentName)}</strong><small>Vencimento: ${escapeHtml(formatDemoDate(charge.dueDate))}</small></span><span class="badge badge--red">ATRASADA</span></div>${listRow("Saldo em atraso", "", formatDemoCents(Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge))))}</article>`).join("")
            : '<div class="notice notice--info">Nenhuma cobrança atrasada neste mês.</div>'}
          ${button("Configurar cobranças", "monthly-charges", "button button--quiet")}
        `)}
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
        <button class="quick-action" type="button" data-screen-target="overdue"><span class="quick-action-icon" aria-hidden="true">◷</span><span><strong>Consultar atrasos</strong><small>Ver cobranças atrasadas</small></span></button>
        <button class="quick-action" type="button" data-screen-target="students"><span class="quick-action-icon" aria-hidden="true">♧</span><span><strong>Ver alunos</strong><small>Lista e perfis vinculados</small></span></button>
        <button class="quick-action" type="button" data-screen-target="teacher-home"><span class="quick-action-icon" aria-hidden="true">▦</span><span><strong>Voltar ao painel</strong><small>Resumo e alertas</small></span></button>
      </div>
    `;
  },

  "teacher-chat"() {
    const partners = demoChatPartners(activeDemoAccount);
    if (!partners.includes(selectedTeacherChatPartner)) selectedTeacherChatPartner = partners[0] || null;
    const partner = selectedTeacherChatPartner;
    return `
      ${heading("VISÃO DO PROFESSOR", "Conversas", "Conversas individuais com seus alunos e instrutores. Não há conversa entre outros usuários.")}
      <div class="content-grid">
        ${panel("Conversas", `
          ${partners.length
            ? `<div class="field"><label for="teacher-chat-partner">Pessoa</label><select id="teacher-chat-partner">${partners.map((account) => `<option value="${escapeHtml(account)}" ${account === partner ? "selected" : ""}>${escapeHtml(demoAccountDisplayName(account))}</option>`).join("")}</select></div>`
            : emptyState("Nenhuma conversa disponível", "Alunos e Instrutores vinculados aparecerão aqui.")}
        `)}
        ${panel("Mensagens", `
          ${partner
            ? `${renderDemoConversation(activeDemoAccount, partner)}${renderDemoConversationForm(partner)}`
            : emptyState("Conversa indisponível", "Selecione uma pessoa vinculada à sua conta.")}
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
          <div class="notice notice--pending">Disponível em versão futura. As regras e a tela de auditoria de suporte ainda não estão definidas.</div>
        `)}
      </div>
    `;
  },

  "teacher-invites"() {
    if (isRealAdmSession()) return renderRealAdminInvitesScreen();
    const professor = demoProfiles.professor;
    return `
      ${heading("VISÃO DO ADMINISTRADOR", "Professores convidados", "Apenas o Adm gerencia a lista de professores autorizados.")}
      <div class="content-grid">
        ${panel("Lista de convites", `
          ${professor
            ? personRow(escapeHtml(professor.name), "Estado demonstrativo · sem e-mail ou dado real", "avatar-masculino.jpg", '<span class="badge badge--green">ATIVO</span>', "professor", "professor")
            : personRow("Conta excluída", "Dados pessoais da conta demonstrativa removidos", "avatar-masculino.jpg", '<span class="badge badge--red">EXCLUÍDA</span>', "professor", "professor")}
          ${personRow("PROFESSOR FICTÍCIO 02", "Convite demonstrativo", "avatar-masculino.jpg", '<span class="badge badge--amber">CONVIDADO</span>', "professor-convidado", "professor")}
          ${emptyState("Sem outros registros", "Esta lista não contém pessoas reais.")}
        `)}
        ${panel("Convidar professor", `
          <div class="notice notice--info">Convidar professores estará disponível em versão futura. Nenhum convite é criado nesta demonstração.</div>
        `)}
      </div>
    `;
  },

  "instructor-students"() {
    const isRealInstructorView = isRealActiveInstructor();
    const linkNotice = realInstructorLinkState === "error"
      ? `<div class="notice notice--pending" role="alert">${escapeHtml(realInstructorLinkNotice)}</div>`
      : "";
    const studentsContent = realInstructorStudentsState === "checking"
      ? '<p class="field-help" role="status" aria-live="polite">Carregando alunos vinculados...</p>'
      : realInstructorStudentsState === "error"
        ? `<div class="notice notice--pending" role="alert">${escapeHtml(realInstructorStudentsNotice)}</div>`
        : isRealInstructorView && realInstructorStudents.length
          ? `<ul aria-label="Alunos vinculados">${realInstructorStudents.map((student) => {
            const graduation = student.faixa && Number.isInteger(student.grau)
              ? `Faixa ${escapeHtml(student.faixa)} · ${student.grau} grau${student.grau === 1 ? "" : "s"}`
              : "Sem graduação registrada";
            return `<li><strong>${escapeHtml(student.nome)}</strong><br><small>${graduation}</small></li>`;
          }).join("")}</ul>`
          : '<div class="empty-state"><div><strong>Nenhum aluno vinculado ainda</strong></div></div>';
    return `
      ${heading("VISÃO DO INSTRUTOR", "Alunos vinculados", isRealInstructorView
        ? "Consulte somente o nome e a faixa/grau atuais dos alunos do seu Professor."
        : "Consulte somente os nomes dos alunos vinculados ao seu Professor.")}
      ${linkNotice}
      ${panel("Alunos vinculados", studentsContent)}
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
    const partner = demoChatPartners(activeDemoAccount)[0];
    return `
      ${heading("VISÃO DO INSTRUTOR", "Conversa com o professor", "Conversa individual entre você e o professor principal. Não há conversa com alunos ou outros usuários.")}
      ${panel("Mensagens", `
        ${partner
          ? `${renderDemoConversation(activeDemoAccount, partner)}${renderDemoConversationForm(partner)}`
          : emptyState("Conversa indisponível", "Não há um Professor vinculado para esta conversa demonstrativa.")}
      `)}
    `;
  },

  academy() {
    if (isRealAdmSession()) return renderRealAdminAcademyScreen();
    const canEdit = canEditAcademy();
    const academyProfessors = Object.entries(demoProfiles).filter(([, profile]) =>
      profile.role === "professor" && profile.academyId === demoAcademy.id
    );
    const academyInstructors = Object.values(demoProfiles).filter((profile) =>
      profile.role === "instructor" && profile.academyId === demoAcademy.id && authorizedInstructorNames.has(profile.name)
    );
    return `
      ${heading("ACADEMIA", "Academia", "Página pública para usuários vinculados: equipe e horários de treino.")}
      ${canEdit ? panel("Dados da academia", `
        <p class="field-help">Use somente dados fictícios. Campos e foto são provisórios; nenhum arquivo é guardado.</p>
        <div class="academy-photo-row">
          <div class="academy-photo" id="academy-photo" aria-label="Foto simulada da academia">${academyPhotoText()}</div>
          <div>
            <button class="button button--quiet button--action" type="button" data-academy-photo aria-describedby="academy-photo-error academy-photo-status"><span data-action-label>Trocar foto</span></button>
            <div class="login-action-error" id="academy-photo-error" role="alert"></div>
            <div class="field-help" id="academy-photo-status" role="status"></div>
          </div>
        </div>
        <form data-academy-form>
          <div class="form-grid">
            <div class="field field--wide"><label for="academy-name">Nome da academia</label><input id="academy-name" name="name" value="${escapeHtml(demoAcademy.name)}" required maxlength="120"></div>
            <div class="field"><label for="academy-phone">Telefone fictício</label><input id="academy-phone" name="phone" type="tel" value="${escapeHtml(demoAcademy.phone)}" maxlength="40"></div>
            <div class="field"><label for="academy-email">E-mail fictício</label><input id="academy-email" name="email" type="email" value="${escapeHtml(demoAcademy.email)}" maxlength="254"><span class="email-preview" aria-hidden="true" hidden></span></div>
          </div>
          <div class="form-actions"><div class="academy-save-action"><button class="button button--primary button--action" type="submit" data-academy-save aria-describedby="academy-save-error academy-save-status"><span data-action-label>Salvar academia</span></button><div class="login-action-error" id="academy-save-error" role="alert"></div><div class="field-help" id="academy-save-status" role="status"></div></div></div>
        </form>
      `, "academy-details") : ""}
      <div class="content-grid">
        ${academyProfessors.length ? `<div class="stack">
          ${academyProfessors.map(([account, profile]) => panel("Professor e horários", `
            ${personRow(escapeHtml(profile.name), "Professor · uma turma", "avatar-masculino.jpg", "", account, "professor")}
            <div class="schedule-list">
              ${defaultProfessorSchedule.map(([day, hours]) => listRow(day, hours)).join("")}
            </div>
            <p class="field-help">Grade: ${publishedAcademyGrades.has(account) ? "Publicada" : "Rascunho"}.</p>
          `)).join("")}
          ${panel("Instrutores", academyInstructors.length
            ? academyInstructors.map((profile) => personRow(escapeHtml(profile.name), "Aluno com função de apoio", "avatar-feminino.jpg", "", "instructor", "student")).join("")
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
    const profile = demoProfiles[activeDemoAccount];
    return `
      ${heading("CONTA", "Painel do usuário", "Preferências demonstrativas; perfil e papel vêm do banco na versão funcional.")}
      <div class="content-grid">
        ${panel("Perfil", personRow(profile.name, profile.label, "avatar-masculino.jpg", "", activeDemoAccount, "self") +
          (["student", "instructor"].includes(activeRole) ? studentAcademyDetails(activeDemoAccount) : "") + `
          <div class="stack" style="margin-top:18px">
            ${listRow("Papel", "Simulado para esta demonstração", "", `<span class="badge">${profile.label.toUpperCase()}</span>`)}
            ${listRow("Versão do app", "Visualização do protótipo", "", `<span class="badge badge--gold">${APP_VERSION}</span>`)}
          </div>
        `)}
        ${profilePhotoCard(activeDemoAccount, activeRole)}
        ${panel("Preferências", `
          <div class="settings-row"><span><strong>Tema</strong><small>Segue o aparelho por padrão; alterne para conferir.</small></span><button class="button button--small button--quiet" type="button" data-theme-toggle>Alternar tema</button></div>
          <div class="settings-row"><span><strong>Atualização</strong><small>Disponível em versão futura.</small></span><button class="button button--small button--quiet" type="button" disabled>Buscar versão</button></div>
          <div class="settings-row"><span><strong>Privacidade</strong><small>Texto pendente de revisão e aprovação.</small></span><button class="button button--small button--quiet" type="button" data-open-privacy>Consultar</button></div>
          <div class="settings-row"><span><strong>Ajuda e tutorial</strong><small>Disponível em versão futura.</small></span><button class="button button--small button--quiet" type="button" disabled>Abrir ajuda</button></div>
        `)}
      </div>
    `;
  },

  privacy() {
    return `
      ${heading("PRIVACIDADE", "Privacidade e consentimento", "Texto provisório, feito sem revisão jurídica.")}
      <div class="content-grid">
        ${panel("Conteúdo a revisar", `
          <div class="privacy-draft-content">${renderPrivacyDraftContent("h3")}</div>
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
  const isRealAdmin = isRealAdmSession();
  const isRealStudentLink = id === "link-teacher" && isRealActiveStudent();
  const isRealStudentPayments = id === "student-payments" && isRealActiveStudent();
  const isRealProfessorPayments = id === "payment-review" && isRealActiveProfessor();
  const isRealProfessorGraduations = id === "student-detail" && isRealActiveProfessor();
  const isRealStudentGraduations = id === "student-grades" && isRealActiveStudent();
  const realAdminRenderer = isRealAdmin
    ? {
      "admin-students": renderRealAdminStudentsScreen,
      academy: renderRealAdminAcademyScreen,
      "teacher-invites": renderRealAdminInvitesScreen,
      "role-management": renderRealAdminManagementScreen
    }[id]
    : null;
  const isRealTeacherCode = id === "teacher-code" && isRealProfessorProfile();
  const isRealBilling = id === "monthly-charges" && isRealActiveProfessor();
  const isRealInstructorStudents = id === "instructor-students" && isRealActiveInstructor();
  const isRealInstructorInvite = !isDemoMode && id === "instructor-invite" && !activeRole &&
    (Boolean(realUser) || Boolean(realInstructorInviteToken));
  const screenRenderer = isRealInstructorInvite
    ? renderRealInstructorInviteScreen
    : isRealStudentLink
    ? renderRealStudentLinkScreen
    : isRealStudentPayments
    ? renderRealStudentPaymentsScreen
    : isRealProfessorPayments
    ? renderRealProfessorPaymentsScreen
    : isRealProfessorGraduations
    ? renderRealProfessorGraduationsScreen
    : isRealStudentGraduations
    ? renderRealStudentGraduationsScreen
    : isRealBilling
    ? renderRealBillingScreen
    : isRealTeacherCode
    ? renderRealTeacherCodeScreen
    : realAdminRenderer || screen;
  if (!screenRenderer || !canViewScreen(id)) {
    const message = realUser && !activeRole && ["academy", "teacher-invites", "role-management", "admin-students"].includes(id)
      ? "Esta tela está disponível somente para uma conta real com papel Adm."
      : "Esta tela não está disponível para o papel desta conta.";
    showToast(message, "error");
    return;
  }

  const changedScreen = currentScreen !== id;
  currentScreen = id;
  syncAppModeUI();
  if (changedScreen) window.clearTimeout(realPaymentUndoTimer);
  if (isRealTeacherCode) {
    realTeacherCode = null;
    realTeacherCodeState = "checking";
    realTeacherCodeNotice = "";
    realTeacherLinkRequests = [];
    realTeacherLinkRequestsState = "checking";
    realTeacherLinkRequestsNotice = "";
    realInstructorInvites = [];
    realInstructorInvitesState = "checking";
    realInstructorInvitesNotice = "";
    realUnregisteredStudents = [];
    realUnregisteredStudentsState = "checking";
    realUnregisteredStudentsNotice = "";
  }
  if (isRealBilling) {
    realBillingStudentNames = new Map();
    realBillingStudentsState = "checking";
    realBillingStudentsNotice = "";
    realBillingUnregisteredStudents = [];
    realBillingUnregisteredStudentsState = "checking";
    realBillingUnregisteredStudentsNotice = "";
  }
  if (isRealInstructorStudents) {
    realInstructorStudents = [];
    realInstructorStudentsState = "checking";
    realInstructorStudentsNotice = "";
  }
  const isRealAdminStudents = id === "admin-students" && isRealAdmSession();
  if (isRealAdminStudents) {
    realAdminStudents = [];
    realAdminStudentsState = "checking";
    realAdminStudentsNotice = "";
  }
  if (isRealProfessorPayments) {
    realBillingStudentNames = new Map();
    realBillingStudentsState = "checking";
    realBillingStudentsNotice = "";
    realProfessorPayments = [];
    realProfessorCharges = [];
    realProfessorPaymentsState = "checking";
    realProfessorPaymentsNotice = "";
  }
  if (isRealStudentPayments) {
    realStudentPayments = [];
    realStudentCharges = [];
    realStudentPaymentsState = "checking";
    realStudentPaymentsNotice = "";
  }
  if (isRealProfessorGraduations) {
    realProfessorGraduationStudents = [];
    realProfessorGraduations = [];
    realProfessorGraduationsState = "checking";
    realProfessorGraduationsNotice = "";
    realSelectedGraduationStudentId = "";
  }
  if (isRealStudentGraduations) {
    realStudentGraduations = [];
    realStudentGraduationsState = "checking";
    realStudentGraduationsNotice = "";
  }
  if (isRealStudentLink) {
    realStudentLinkState = "checking";
    realStudentLinkRequest = null;
    realStudentLinkNotice = "";
  }
  if (isDemoMode && screenContent.querySelector('[data-login-action][data-action-state="success"]')) {
    showToast("Simulação concluída. Nenhum login foi realizado.");
  }
  screenContent.innerHTML = screenRenderer();
  if (isRealBilling) {
    loadRealBillingStudents();
    loadRealBillingData();
    loadRealBillingUnregisteredStudents();
  }
  if (isRealInstructorStudents) loadRealInstructorStudents();
  if (isRealAdminStudents) loadRealAdminStudents();
  if (isRealProfessorPayments) {
    loadRealBillingStudents("payment-review");
    loadRealProfessorPaymentsData();
  }
  if (isRealProfessorGraduations) loadRealProfessorGraduations();
  if (isRealStudentGraduations) loadRealStudentGraduations();
  if (isRealStudentPayments) loadRealStudentPayments();
  if (isRealTeacherCode) loadRealTeacherCode();
  if (isRealTeacherCode) loadRealInstructorInvites();
  if (isRealStudentLink) loadRealStudentLinkStatus();
  if (id === "teacher-invites" && isRealAdmSession()) loadRealAdminInvites();
  if (id === "academy" && isRealAdmSession()) loadRealAdminAcademiesForEdit();
  if (id === "role-management" && isRealAdmSession()) loadRealAdminManagement();
  revokeReplacedPhotoUrls();
  screenContent.querySelectorAll('input[type="email"]').forEach(updateEmailPreview);
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

function renderRealTeacherCodeScreen() {
  const eligible = isRealActiveProfessor();
  const canManageUnregisteredStudents = isRealActiveProfessorAccount();
  const hasCode = eligible && realTeacherCodeState === "found" && Boolean(realTeacherCode);
  let stateContent = "";

  if (realTeacherCodeState === "checking") {
    stateContent = '<p class="field-help" role="status" aria-live="polite">Consultando o código da sua turma...</p>';
  } else if (realTeacherCodeState === "error") {
    stateContent = `<p class="login-action-error" role="alert">${escapeHtml(realTeacherCodeNotice)}</p>
      <p class="field-help">Volte a esta tela para tentar consultar novamente.</p>`;
  } else if (realProfile && realProfile.ativo !== true) {
    stateContent = '<div class="notice notice--pending" role="status">Seu perfil de Professor está inativo. O código não pode ser exibido ou gerado; aguarde a liberação pelo Adm.</div>';
  } else if (!realProfile || !realProfile.academia_id) {
    stateContent = '<div class="notice notice--pending" role="status">Seu perfil de Professor ainda não está vinculado a uma academia. O código só fica disponível após o vínculo.</div>';
  } else {
    stateContent = `
      <div class="teacher-code-value"${hasCode ? "" : " hidden"}>
        <strong class="code-display" data-teacher-code-display${hasCode ? "" : " hidden"}>${hasCode ? escapeHtml(realTeacherCode) : ""}</strong>
        <button class="button button--quiet button--action" type="button" data-copy-teacher-code data-teacher-code-action${hasCode ? "" : " hidden"}>
          <span data-action-label>Copiar</span>
        </button>
      </div>
      <p class="field-help" data-teacher-code-empty${hasCode ? " hidden" : ""}>${hasCode ? "" : "Ainda não há código para esta turma."}</p>
      <div class="teacher-code-controls">
        <button class="button button--primary button--action" type="button" data-generate-real-teacher-code data-teacher-code-action>
          <span data-action-label>${hasCode ? "Trocar código" : "Gerar código"}</span>
        </button>
      </div>
      <p class="login-action-error teacher-code-action-error" role="alert" data-teacher-code-error></p>
      <div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-teacher-code-status></div>
    `;
  }

  return `
    ${heading("VISÃO DO PROFESSOR", "Código e convites", "Consulte e compartilhe somente o código de vínculo da sua turma.")}
    <div class="content-grid">
      ${panel("Seu código de vínculo", `<div class="invite-preview">
        <span class="eyebrow">CÓDIGO ATUAL</span>
        ${stateContent}
      </div>`, "panel-card--highlight")}
      ${eligible ? panel("Convites de Instrutor", renderRealInstructorInvites()) : ""}
      ${eligible ? panel("Pedidos de vínculo", renderRealTeacherLinkRequests()) : ""}
      ${canManageUnregisteredStudents ? panel("Alunos sem registro", renderRealUnregisteredStudents()) : ""}
    </div>
  `;
}

function renderRealInstructorInvites() {
  let listContent = "";
  if (realInstructorInvitesState === "checking") {
    listContent = '<p class="field-help" role="status" aria-live="polite">Consultando convites...</p>';
  } else if (realInstructorInvitesState === "error") {
    listContent = `<p class="login-action-error" role="alert">${escapeHtml(realInstructorInvitesNotice || "Não foi possível consultar os convites. Tente novamente mais tarde.")}</p>`;
  } else if (!realInstructorInvites.length) {
    listContent = '<div class="empty-state"><div><strong>Nenhum convite</strong><p>Os convites de uso único aparecerão aqui.</p></div></div>';
  } else {
    listContent = realInstructorInvites.map((invite, index) => {
      const status = realInstructorInviteStatus(invite);
      return `
        <div class="real-instructor-invite-row">
          <div class="real-instructor-invite-copy">
            <strong>Convite ${index + 1}</strong>
            <small>${status}</small>
          </div>
          ${status === "Pendente" ? `
            <div class="real-instructor-invite-action">
              <button class="button button--danger button--small button--action" type="button" data-real-instructor-revoke data-instructor-invite-index="${index}" data-real-instructor-invite-action aria-describedby="real-instructor-revoke-error-${index} real-instructor-revoke-status-${index}">
                <span data-action-label>Revogar</span>
              </button>
              <p class="login-action-error" id="real-instructor-revoke-error-${index}" role="alert" aria-atomic="true"></p>
              <span class="visually-hidden" id="real-instructor-revoke-status-${index}" role="status" aria-live="polite" aria-atomic="true"></span>
            </div>
          ` : ""}
        </div>
      `;
    }).join("");
  }

  return `
    <div class="real-instructor-invites">
      <p class="panel-copy">Gere um link individual de uso único, válido por três dias. Só pode ser aceito por uma conta nova ou por um Aluno adulto.</p>
      <div class="real-instructor-invite-action">
        <button class="button button--primary button--action" type="button" data-real-instructor-generate data-real-instructor-invite-action aria-describedby="real-instructor-generate-error real-instructor-generate-status">
          <span data-action-label>Gerar convite</span>
        </button>
        <p class="login-action-error" id="real-instructor-generate-error" role="alert" aria-atomic="true"></p>
        <div class="field-help" id="real-instructor-generate-status" role="status" aria-live="polite" aria-atomic="true"></div>
      </div>
      ${realInstructorInviteUrl ? `
        <div class="real-instructor-invite-copy-action">
          <p class="field-help">Link pronto. O token não é exibido; copie e compartilhe com a pessoa convidada.</p>
          <button class="button button--quiet button--action" type="button" data-real-instructor-copy data-real-instructor-invite-action aria-describedby="real-instructor-copy-error real-instructor-copy-status">
            <span data-action-label>Copiar link</span>
          </button>
          <p class="login-action-error" id="real-instructor-copy-error" role="alert" aria-atomic="true"></p>
          <div class="field-help" id="real-instructor-copy-status" role="status" aria-live="polite" aria-atomic="true"></div>
        </div>
      ` : ""}
      <div class="real-instructor-invite-list">${listContent}</div>
    </div>
  `;
}

function renderRealInstructorInviteScreen() {
  if (!realUser) {
    return `
      ${heading("CONVITE DE INSTRUTOR", "Aceitar convite", "Entre ou crie sua conta para verificar o convite recebido.")}
      <div class="auth-card">
        <p class="panel-copy">O link é de uso único e expira em três dias. Não exibimos o código do convite nesta tela.</p>
        <button class="button button--google button--action" type="button" data-login-action aria-describedby="google-login-error">
          <span data-action-label>Fazer login com o Google</span>
        </button>
        <div class="login-action-error" id="google-login-error" role="alert" aria-atomic="true"></div>
        <div class="visually-hidden" id="login-action-status" role="status" aria-live="polite" aria-atomic="true"></div>
        <div class="auth-divider">ou use e-mail e senha</div>
        <button class="button button--quiet" type="button" data-screen-target="login">Entrar com e-mail e senha</button>
        <button class="button button--quiet" type="button" data-screen-target="create-account">Criar conta</button>
      </div>
    `;
  }

  const isNewAccount = realProfileState === "missing";
  const isAdultStudent = realProfileState === "found" && realProfile &&
    realProfile.papel === "aluno" && realProfile.idade_declarada === "adulto";
  let accountState = "";
  if (realInstructorConsentPending) {
    accountState = `
      <div class="real-instructor-invite-action">
        <button class="button button--primary button--action" type="button" data-retry-real-instructor-consent aria-describedby="real-instructor-consent-retry-error real-instructor-consent-retry-status">
          <span data-action-label>Tentar registrar consentimento</span>
        </button>
        <p class="login-action-error" id="real-instructor-consent-retry-error" role="alert" aria-atomic="true">Seu acesso foi criado, mas não foi possível registrar o consentimento. Tente novamente.</p>
        <div class="field-help" id="real-instructor-consent-retry-status" role="status" aria-live="polite" aria-atomic="true"></div>
      </div>
    `;
  } else if (realProfileState === "checking") {
    accountState = '<p class="field-help" role="status" aria-live="polite">Consultando a conta...</p>';
  } else if (realProfileState === "error") {
    accountState = `<p class="login-action-error" role="alert">${escapeHtml(realProfileNotice || "Não foi possível consultar sua conta. Tente novamente mais tarde.")}</p>`;
  } else if (realProfileState === "found" && realProfile && realProfile.papel === "aluno" && !isAdultStudent) {
    accountState = '<div class="notice notice--pending" role="status">Este convite só pode ser aceito por quem declarou ser adulto. Menores não podem assumir o papel de Instrutor.</div>';
  } else if (realProfileState === "found" && !isAdultStudent) {
    accountState = '<div class="notice notice--pending" role="status">Este convite só pode ser aceito por uma conta nova ou por uma conta de Aluno adulto.</div>';
  } else if (isNewAccount || isAdultStudent) {
    accountState = `
      <form data-real-instructor-accept-form>
        ${realInstructorInviteToken
          ? '<p class="notice notice--info" role="status">Convite recebido. O código não é exibido.</p>'
          : `<div class="field">
              <label for="real-instructor-invite-link">Link de convite</label>
              <input id="real-instructor-invite-link" name="link" type="password" autocomplete="off" spellcheck="false" aria-describedby="real-instructor-invite-link-help">
              <small class="field-help" id="real-instructor-invite-link-help">Cole o link recebido. O código ficará oculto.</small>
            </div>`}
        ${isNewAccount ? `
          <div class="field">
            <label for="real-instructor-invite-name">Nome</label>
            <input id="real-instructor-invite-name" name="nome" type="text" autocomplete="name" maxlength="80" value="${escapeHtml(getPendingRealSignupName())}" required>
          </div>
          <label class="consent-row">
            <input id="real-instructor-invite-adult" name="adulto" type="checkbox" required>
            <span>Declaro que tenho 18 anos ou mais.</span>
          </label>
        ` : ""}
        <div class="real-instructor-invite-action">
          <button class="button button--primary button--action" type="submit" data-real-instructor-accept data-real-instructor-invite-action aria-describedby="real-instructor-accept-error real-instructor-accept-status">
            <span data-action-label>Aceitar convite</span>
          </button>
          <p class="login-action-error" id="real-instructor-accept-error" role="alert" aria-atomic="true"></p>
          <div class="field-help" id="real-instructor-accept-status" role="status" aria-live="polite" aria-atomic="true"></div>
        </div>
      </form>
    `;
  } else {
    accountState = '<p class="field-help" role="status" aria-live="polite">Não foi possível verificar se esta conta pode aceitar o convite. Atualize a página e tente novamente.</p>';
  }

  return `
    ${heading("CONVITE DE INSTRUTOR", "Aceitar convite", "Só contas novas ou Alunos adultos podem aceitar.")}
    <div class="content-grid">
      ${panel("Convite de uso único", `
        <p class="panel-copy">O convite expira em três dias. Ao aceitar, sua conta passa a Instrutor e fica vinculada ao Professor que enviou o convite.</p>
        <p class="field-help">A idade é declarada; não pedimos data de nascimento.</p>
        ${realInstructorLinkState === "error" ? `<div class="notice notice--pending" role="alert">${escapeHtml(realInstructorLinkNotice)}</div>` : ""}
        ${accountState}
      `)}
    </div>
  `;
}

function realInstructorInviteStatus(invite) {
  if (invite.consumido_em) return "Usado";
  if (invite.revogado_em) return "Revogado";
  const expiresAt = Date.parse(invite.expira_em);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return "Expirado";
  return "Pendente";
}

async function loadRealInstructorInvites() {
  const sequence = ++realInstructorInvitesSequence;
  realInstructorInvites = [];
  realInstructorInvitesState = "checking";
  realInstructorInvitesNotice = "";
  if (!authClient || !realUser || !isRealActiveProfessor()) {
    realInstructorInvitesState = "error";
    realInstructorInvitesNotice = "Esta ação exige uma conta Google de Professor ativa e vinculada a uma academia.";
    if (sequence === realInstructorInvitesSequence && currentScreen === "teacher-code") {
      screenContent.innerHTML = renderRealTeacherCodeScreen();
    }
    return;
  }

  try {
    const { data, error } = await authClient.rpc("listar_convites_instrutor");
    if (sequence !== realInstructorInvitesSequence || currentScreen !== "teacher-code") return;
    if (error) {
      realInstructorInvitesState = "error";
      realInstructorInvitesNotice = navigator.onLine === false
        ? "Falha de rede ao consultar os convites. Verifique sua conexão e tente novamente."
        : "Não foi possível consultar os convites. Tente novamente mais tarde.";
    } else if (!Array.isArray(data) || data.some((invite) =>
      !invite || typeof invite.convite_id !== "string" ||
      typeof invite.expira_em !== "string" ||
      !(invite.consumido_em === null || typeof invite.consumido_em === "string") ||
      !(invite.revogado_em === null || typeof invite.revogado_em === "string")
    )) {
      realInstructorInvitesState = "error";
      realInstructorInvitesNotice = "O servidor retornou uma lista de convites inesperada. Tente novamente mais tarde.";
    } else {
      realInstructorInvites = data.map((invite) => ({
        id: invite.convite_id,
        expira_em: invite.expira_em,
        consumido_em: invite.consumido_em,
        revogado_em: invite.revogado_em
      }));
      realInstructorInvitesState = "found";
    }
  } catch {
    if (sequence !== realInstructorInvitesSequence || currentScreen !== "teacher-code") return;
    realInstructorInvitesState = "error";
    realInstructorInvitesNotice = navigator.onLine === false
      ? "Falha de rede ao consultar os convites. Verifique sua conexão e tente novamente."
      : "Não foi possível consultar os convites. Tente novamente mais tarde.";
  }

  if (sequence === realInstructorInvitesSequence && currentScreen === "teacher-code") {
    screenContent.innerHTML = renderRealTeacherCodeScreen();
  }
}

function renderRealStudentLinkScreen() {
  const pendingRequest = realStudentLinkState === "found" &&
    realStudentLinkRequest && realStudentLinkRequest.status === "pendente";
  const statusMessages = {
    pendente: "Seu pedido está pendente e aguarda a decisão do Professor.",
    aprovado: "Seu último pedido foi aprovado. Você pode enviar outro pedido para mudar de Professor.",
    recusado: "Seu último pedido foi recusado. Confira o código antes de tentar novamente.",
    cancelado: "Seu último pedido foi cancelado. Você pode enviar um novo pedido."
  };
  let requestState = "";
  if (realStudentLinkState === "checking") {
    requestState = '<p class="field-help" role="status" aria-live="polite">Consultando o estado do pedido...</p>';
  } else if (realStudentLinkState === "error") {
    requestState = `<p class="login-action-error" role="alert">${escapeHtml(realStudentLinkNotice)}</p>`;
  } else if (realStudentLinkRequest) {
    requestState = `<div class="notice ${pendingRequest ? "notice--pending" : "notice--info"}" role="status">${escapeHtml(statusMessages[realStudentLinkRequest.status] || "O estado do último pedido não está disponível.")}</div>`;
  } else if (realStudentLinkState === "found") {
    requestState = '<div class="empty-state"><div><strong>Nenhum pedido anterior</strong><p>Quando você enviar um pedido, o estado aparecerá aqui.</p></div></div>';
  }

  const form = realStudentLinkState === "found" && !pendingRequest
    ? `<form data-real-student-link-form>
        <div class="field">
          <label for="real-student-link-code">Código de 6 caracteres</label>
          <input id="real-student-link-code" name="codigo" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="real-student-link-help">
          <small class="field-help" id="real-student-link-help">Digite ou cole o código recebido do Professor. Espaços serão removidos automaticamente.</small>
        </div>
        <div class="form-actions">
          <button class="button button--primary button--action" type="submit" data-real-student-link-submit aria-describedby="real-student-link-error real-student-link-status">
            <span data-action-label>Enviar pedido</span>
          </button>
        </div>
        <div class="login-action-error" id="real-student-link-error" role="alert" aria-atomic="true"></div>
        <div class="field-help" id="real-student-link-status" role="status" aria-live="polite"></div>
      </form>`
    : "";

  return `
    ${heading("CONTA · ALUNO", "Vincular a um Professor", "Envie seu código para solicitar um vínculo. A demonstração continua separada.") }
    <div class="content-grid">
      ${panel("Pedido de vínculo", `${requestState}${form}`, "panel-card--highlight")}
    </div>
  `;
}

function renderRealTeacherLinkRequests() {
  if (realTeacherLinkRequestsState === "checking") {
    return '<p class="field-help" role="status" aria-live="polite">Consultando pedidos pendentes...</p>';
  }
  if (realTeacherLinkRequestsState === "error") {
    return `<p class="login-action-error" role="alert">${escapeHtml(realTeacherLinkRequestsNotice)}</p>`;
  }
  if (!realTeacherLinkRequests.length) {
    return '<div class="empty-state"><div><strong>Nenhum pedido pendente</strong><p>Novos pedidos aparecerão aqui.</p></div></div>';
  }
  return realTeacherLinkRequests.map((request, index) => `
    <article class="link-request-row">
      <strong>${escapeHtml(request.studentName)}</strong>
      <small>Pedido de vínculo</small>
      <div class="row-actions">
        <button class="button button--small button--primary button--action" type="button" data-real-link-decision="approve" data-request-id="${escapeHtml(request.id)}" aria-describedby="real-link-request-error-${index} real-link-request-status-${index}">
          <span data-action-label>Aprovar</span>
        </button>
        <button class="button button--small button--danger button--action" type="button" data-real-link-decision="reject" data-request-id="${escapeHtml(request.id)}" aria-describedby="real-link-request-error-${index} real-link-request-status-${index}">
          <span data-action-label>Recusar</span>
        </button>
      </div>
      <div class="login-action-error" id="real-link-request-error-${index}" role="alert" aria-atomic="true"></div>
      <div class="field-help" id="real-link-request-status-${index}" role="status" aria-live="polite"></div>
    </article>
  `).join("");
}

function renderRealUnregisteredStudents() {
  const rows = realUnregisteredStudentsState === "checking"
    ? '<p class="field-help" role="status" aria-live="polite">Consultando alunos sem registro...</p>'
    : realUnregisteredStudentsState === "error"
      ? `<p class="login-action-error" role="alert">${escapeHtml(realUnregisteredStudentsNotice)}</p>`
      : realUnregisteredStudents.length
        ? `<div class="stack">${realUnregisteredStudents.map((student, index) => {
          const initials = Array.from(student.nome.trim())[0] || "A";
          const ageLabel = student.idade_declarada === "menor" ? "Menor de 18 anos · somente avatar" :
            student.idade_declarada === "adulto" ? "Adulto · somente avatar" : "Idade ainda não declarada · somente avatar";
          const ageSelect = `
            <form class="real-unregistered-age-form" data-real-unregistered-age-form data-student-id="${escapeHtml(student.id)}">
              <div class="form-grid">
                <div class="field">
                  <label for="real-unregistered-age-${index}">Idade declarada</label>
                  <select id="real-unregistered-age-${index}" name="idade_declarada" aria-required="true">
                    <option value="nao_declarada" disabled${student.idade_declarada === "nao_declarada" ? " selected" : ""}>Ainda não declarada</option>
                    <option value="adulto"${student.idade_declarada === "adulto" ? " selected" : ""}>Adulto</option>
                    <option value="menor"${student.idade_declarada === "menor" ? " selected" : ""}>Menor de 18 anos</option>
                  </select>
                </div>
                <div class="form-actions">
                  <button class="button button--primary button--action" type="submit" data-real-unregistered-age-save aria-describedby="real-unregistered-age-error-${index} real-unregistered-age-status-${index}">
                    <span data-action-label>Salvar idade</span>
                  </button>
                </div>
              </div>
              <div class="login-action-error" id="real-unregistered-age-error-${index}" role="alert" aria-atomic="true"></div>
              <div class="field-help" id="real-unregistered-age-status-${index}" role="status" aria-live="polite"></div>
            </form>`;
          return `
            <article class="real-unregistered-student-row">
              <div class="person-row">
                <span class="avatar avatar--small avatar--initials" aria-hidden="true">${escapeHtml(initials)}</span>
                <span class="person-copy"><strong>${escapeHtml(student.nome)}</strong><small>${escapeHtml(ageLabel)}</small></span>
              </div>
              ${ageSelect}
            </article>
          `;
        }).join("")}</div>`
        : '<div class="empty-state"><div><strong>Nenhum aluno sem registro</strong><p>Cadastre um aluno sem conta para gerenciar a declaração de idade.</p></div></div>';

  return `
    <form class="real-unregistered-create-form" data-real-unregistered-create-form>
      <div class="form-grid">
        <div class="field field--wide">
          <label for="real-unregistered-name">Nome do aluno</label>
          <input id="real-unregistered-name" name="nome" type="text" autocomplete="off" maxlength="160" aria-describedby="real-unregistered-create-help">
          <small class="field-help" id="real-unregistered-create-help">Informe de 1 a 80 caracteres. Não é necessário telefone, e-mail ou data de nascimento.</small>
        </div>
        <div class="field field--wide">
          <label for="real-unregistered-create-age">Idade declarada</label>
          <select id="real-unregistered-create-age" name="idade_declarada" aria-required="true">
            <option value="">Selecione</option>
            <option value="adulto">Adulto</option>
            <option value="menor">Menor de 18 anos</option>
          </select>
          <small class="field-help">Menores usam somente avatar; este cadastro não solicita nem armazena foto ou data de nascimento.</small>
        </div>
      </div>
      <div class="form-actions">
        <button class="button button--primary button--action" type="submit" data-real-unregistered-create aria-describedby="real-unregistered-create-error real-unregistered-create-status">
          <span data-action-label>Cadastrar aluno sem conta</span>
        </button>
      </div>
      <div class="login-action-error" id="real-unregistered-create-error" role="alert" aria-atomic="true"></div>
      <div class="field-help" id="real-unregistered-create-status" role="status" aria-live="polite"></div>
    </form>
    <div class="real-unregistered-student-list">${rows}</div>
  `;
}

async function loadRealStudentLinkStatus() {
  if (currentScreen !== "link-teacher") return;
  const sequence = ++realStudentLinkRequestSequence;
  const userId = realUser && realUser.id;
  realStudentLinkState = "checking";
  realStudentLinkRequest = null;
  realStudentLinkNotice = "";
  screenContent.innerHTML = renderRealStudentLinkScreen();
  if (!authClient || !userId || !isRealActiveStudent()) {
    realStudentLinkState = "error";
    realStudentLinkNotice = "Esta ação exige uma conta real de Aluno ativa.";
    if (sequence === realStudentLinkRequestSequence && currentScreen === "link-teacher") {
      screenContent.innerHTML = renderRealStudentLinkScreen();
    }
    return;
  }

  try {
    const { data, error } = await authClient.from("pedidos_vinculo")
      .select("status")
      .eq("aluno_id", userId)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sequence !== realStudentLinkRequestSequence || currentScreen !== "link-teacher") return;
    if (error) {
      realStudentLinkState = "error";
      realStudentLinkNotice = navigator.onLine === false
        ? "Falha de rede ao consultar o pedido. Verifique sua conexão e tente novamente."
        : "Não foi possível consultar o estado do pedido. Tente novamente mais tarde.";
    } else if (data && !["pendente", "aprovado", "recusado", "cancelado"].includes(data.status)) {
      realStudentLinkState = "error";
      realStudentLinkNotice = "O estado do pedido retornado pelo banco não é reconhecido.";
    } else {
      realStudentLinkRequest = data || null;
      realStudentLinkState = "found";
    }
  } catch {
    if (sequence !== realStudentLinkRequestSequence || currentScreen !== "link-teacher") return;
    realStudentLinkState = "error";
    realStudentLinkNotice = navigator.onLine === false
      ? "Falha de rede ao consultar o pedido. Verifique sua conexão e tente novamente."
      : "Não foi possível consultar o estado do pedido. Tente novamente mais tarde.";
  }

  if (sequence === realStudentLinkRequestSequence && currentScreen === "link-teacher") {
    screenContent.innerHTML = renderRealStudentLinkScreen();
  }
}

async function loadRealTeacherCode() {
  const sequence = ++realTeacherCodeRequestSequence;
  realTeacherCode = null;
  realTeacherCodeState = "checking";
  realTeacherCodeNotice = "";
  screenContent.innerHTML = renderRealTeacherCodeScreen();

  if (!authClient || !realUser) {
    realTeacherCodeState = "error";
    realTeacherCodeNotice = "Sua sessão real não está ativa. Entre novamente com o Google.";
    screenContent.innerHTML = renderRealTeacherCodeScreen();
    return;
  }

  try {
    const { data: profile, error: profileError } = await authClient.from("perfis")
      .select("papel,academia_id,ativo")
      .eq("id", realUser.id)
      .maybeSingle();
    if (profileError) {
      if (sequence !== realTeacherCodeRequestSequence || currentScreen !== "teacher-code") return;
      realTeacherCodeState = "error";
      realTeacherCodeNotice = realTeacherCodeErrorMessage(profileError, "read");
      realTeacherLinkRequestsState = "error";
      realTeacherLinkRequestsNotice = navigator.onLine === false
        ? "Falha de rede ao consultar os pedidos. Verifique sua conexão e tente novamente."
        : "Não foi possível confirmar a permissão para consultar os pedidos.";
      realUnregisteredStudentsState = "error";
      realUnregisteredStudentsNotice = navigator.onLine === false
        ? "Falha de rede ao consultar os alunos sem registro. Verifique sua conexão e tente novamente."
        : "Não foi possível confirmar a permissão para consultar os alunos sem registro.";
      screenContent.innerHTML = renderRealTeacherCodeScreen();
      return;
    }
    if (sequence !== realTeacherCodeRequestSequence || currentScreen !== "teacher-code") return;
    if (!profile || profile.papel !== "professor") {
      realProfile = profile ? { ...realProfile, ...profile } : null;
      realProfileState = profile ? "found" : "missing";
      realTeacherCodeState = "error";
      realTeacherCodeNotice = "Não foi possível confirmar um perfil de Professor ativo. Confira sua sessão e tente novamente.";
      renderNavigation();
      if (!canViewScreen("teacher-code")) renderScreen("real-account");
      else screenContent.innerHTML = renderRealTeacherCodeScreen();
      return;
    }

    realProfile = { ...realProfile, ...profile };
    realProfileState = "found";
    renderNavigation();
    if (profile.ativo !== true) {
      realTeacherCodeState = "blocked";
      if (currentScreen === "teacher-code") screenContent.innerHTML = renderRealTeacherCodeScreen();
      return;
    }

    loadRealProfessorStudentRecords();
    if (!profile.academia_id) {
      realTeacherCodeState = "blocked";
      if (currentScreen === "teacher-code") screenContent.innerHTML = renderRealTeacherCodeScreen();
      return;
    }

    loadRealTeacherLinkRequests();
    const { data: classroom, error: classroomError } = await authClient.from("turmas")
      .select("codigo")
      .eq("professor_id", realUser.id)
      .maybeSingle();
    if (classroomError) {
      realTeacherCodeState = "error";
      realTeacherCodeNotice = realTeacherCodeErrorMessage(classroomError, "read");
    } else if (!classroom) {
      realTeacherCodeState = "missing";
    } else if (typeof classroom.codigo !== "string" ||
        !/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(classroom.codigo)) {
      realTeacherCodeState = "error";
      realTeacherCodeNotice = "O código da turma não está disponível em um formato válido. Tente novamente mais tarde.";
    } else {
      realTeacherCode = classroom.codigo;
      realTeacherCodeState = "found";
    }
  } catch (error) {
    realTeacherCodeState = "error";
    realTeacherCodeNotice = realTeacherCodeErrorMessage(error, "read");
  }

  if (sequence === realTeacherCodeRequestSequence && currentScreen === "teacher-code") {
    screenContent.innerHTML = renderRealTeacherCodeScreen();
  }
}

async function loadRealTeacherLinkRequests() {
  if (currentScreen !== "teacher-code") return;
  const sequence = ++realTeacherLinkRequestsSequence;
  const userId = realUser && realUser.id;
  realTeacherLinkRequests = [];
  realTeacherLinkRequestsState = "checking";
  realTeacherLinkRequestsNotice = "";
  if (!authClient || !userId || !isRealActiveProfessor()) {
    realTeacherLinkRequestsState = "error";
    realTeacherLinkRequestsNotice = "Esta leitura exige uma conta Google de Professor ativa vinculada a uma academia.";
    if (sequence === realTeacherLinkRequestsSequence && currentScreen === "teacher-code") {
      screenContent.innerHTML = renderRealTeacherCodeScreen();
    }
    return;
  }

  try {
    const { data: requests, error } = await authClient.from("pedidos_vinculo")
      .select("id,aluno_id")
      .eq("professor_id", userId)
      .eq("status", "pendente")
      .order("criado_em", { ascending: true });
    if (sequence !== realTeacherLinkRequestsSequence || currentScreen !== "teacher-code") return;
    if (error) {
      realTeacherLinkRequestsState = "error";
      realTeacherLinkRequestsNotice = navigator.onLine === false
        ? "Falha de rede ao consultar os pedidos. Verifique sua conexão e tente novamente."
        : "Não foi possível consultar os pedidos. Tente novamente mais tarde.";
    } else if (!requests || requests.length === 0) {
      realTeacherLinkRequestsState = "found";
    } else {
      const studentIds = [...new Set(requests.map((request) => request.aluno_id).filter(Boolean))];
      const { data: profiles, error: profilesError } = await authClient.from("perfis")
        .select("id,nome")
        .in("id", studentIds);
      if (sequence !== realTeacherLinkRequestsSequence || currentScreen !== "teacher-code") return;
      if (profilesError) {
        realTeacherLinkRequestsState = "error";
        realTeacherLinkRequestsNotice = navigator.onLine === false
          ? "Falha de rede ao consultar os nomes dos alunos. Verifique sua conexão e tente novamente."
          : "Não foi possível consultar os nomes dos alunos. Tente novamente mais tarde.";
      } else {
        const namesById = new Map((profiles || []).map((profile) => [profile.id, profile.nome]));
        realTeacherLinkRequests = requests.map((request) => ({
          id: request.id,
          studentName: namesById.get(request.aluno_id) || "Nome não informado"
        }));
        realTeacherLinkRequestsState = "found";
      }
    }
  } catch {
    realTeacherLinkRequestsState = "error";
    realTeacherLinkRequestsNotice = navigator.onLine === false
      ? "Falha de rede ao consultar os pedidos. Verifique sua conexão e tente novamente."
      : "Não foi possível consultar os pedidos. Tente novamente mais tarde.";
  }

  if (sequence === realTeacherLinkRequestsSequence && currentScreen === "teacher-code") {
    screenContent.innerHTML = renderRealTeacherCodeScreen();
  }
}

async function loadRealProfessorStudentRecords() {
  if (currentScreen !== "teacher-code") return;
  const sequence = ++realUnregisteredStudentsSequence;
  const userId = realUser && realUser.id;
  realUnregisteredStudents = [];
  realUnregisteredStudentsState = "checking";
  realUnregisteredStudentsNotice = "";
  if (!authClient || !userId || !isRealActiveProfessorAccount()) {
    realUnregisteredStudentsState = "error";
    realUnregisteredStudentsNotice = "Esta leitura exige uma conta Google de Professor ativa.";
    if (sequence === realUnregisteredStudentsSequence && currentScreen === "teacher-code") {
      screenContent.innerHTML = renderRealTeacherCodeScreen();
    }
    return;
  }

  try {
    const { data: students, error } = await authClient.from("alunos_sem_conta")
      .select("id,nome,idade_declarada")
      .eq("professor_id", userId)
      .order("criado_em", { ascending: false });
    if (sequence !== realUnregisteredStudentsSequence || currentScreen !== "teacher-code") return;
    if (error) {
      realUnregisteredStudentsState = "error";
      realUnregisteredStudentsNotice = navigator.onLine === false
        ? "Falha de rede ao consultar os alunos sem registro. Verifique sua conexão e tente novamente."
        : "Não foi possível consultar os alunos sem registro. Tente novamente mais tarde.";
    } else {
      realUnregisteredStudents = students || [];
      realUnregisteredStudentsState = "found";
    }
  } catch {
    if (sequence !== realUnregisteredStudentsSequence || currentScreen !== "teacher-code") return;
    realUnregisteredStudentsState = "error";
    realUnregisteredStudentsNotice = navigator.onLine === false
      ? "Falha de rede ao consultar os alunos sem registro. Verifique sua conexão e tente novamente."
      : "Não foi possível consultar os alunos sem registro. Tente novamente mais tarde.";
  }

  if (sequence === realUnregisteredStudentsSequence && currentScreen === "teacher-code") {
    screenContent.innerHTML = renderRealTeacherCodeScreen();
  }
}

function updateUserPanelProfile() {
  const profile = demoProfiles[activeDemoAccount];
  document.querySelector("#user-panel-profile-academy").textContent =
    profile && profile.academyId === demoAcademy.id ? demoAcademy.name : profile ? "Sem academia vinculada" : "Conta real";
}

function canEditAcademy() {
  const profile = demoProfiles[activeDemoAccount];
  return activeRole === "adm" || (activeRole === "professor" && profile && profile.academyId === demoAcademy.id);
}

function isRealAdmSession() {
  return Boolean(!activeRole && realUser && realProfileState === "found" && realProfile &&
    realProfile.papel === "adm" && realProfile.ativo === true);
}

function isRealProfessorProfile() {
  return Boolean(!activeRole && realUser && realProfileState === "found" && realProfile &&
    realProfile.papel === "professor");
}

function isRealActiveProfessor() {
  return Boolean(isRealProfessorProfile() && realProfile.ativo === true && realProfile.academia_id);
}

function isRealActiveProfessorAccount() {
  return Boolean(isRealProfessorProfile() && realProfile.ativo === true);
}

function isRealActiveStudent() {
  return Boolean(!activeRole && realUser && realProfileState === "found" && realProfile &&
    realProfile.papel === "aluno" && realProfile.ativo === true);
}

function isRealActiveInstructor() {
  return Boolean(!activeRole && realUser && realProfileState === "found" && realProfile &&
    realProfile.ativo === true &&
    (realProfile.papel === "instrutor" || realInstructorLink && realInstructorLink.instrutor_id === realUser.id));
}

async function loadRealInstructorLink(userId) {
  const sequence = ++realInstructorLinkRequestSequence;
  realInstructorLinkState = "checking";
  realInstructorLinkNotice = "";
  if (!authClient || !userId) {
    realInstructorLink = null;
    realInstructorLinkState = "error";
    realInstructorLinkNotice = "Não foi possível verificar o vínculo de Instrutor. Sua sessão continua ativa.";
    return;
  }

  try {
    const { data, error } = await authClient.from("instrutores_professor")
      .select("instrutor_id,professor_id")
      .eq("instrutor_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (data && (data.instrutor_id !== userId || typeof data.professor_id !== "string")) {
      throw new TypeError("Vínculo de Instrutor indisponível.");
    }
    if (sequence !== realInstructorLinkRequestSequence || !realUser || realUser.id !== userId) return;
    realInstructorLink = data || null;
    realInstructorLinkState = data ? "found" : "missing";
  } catch (error) {
    if (sequence !== realInstructorLinkRequestSequence || !realUser || realUser.id !== userId) return;
    logRealProfileSupabaseError("consultar vínculo de Instrutor", error);
    realInstructorLink = null;
    realInstructorLinkState = "error";
    realInstructorLinkNotice = "Não foi possível verificar o vínculo de Instrutor. Sua sessão continua ativa; tente novamente mais tarde.";
  }
}

function realInstructorInviteReturnMessage(code) {
  const messages = {
    nao_autenticado: "Entre na sua conta para aceitar este convite.",
    convite_invalido_ou_expirado: "O convite é inválido ou expirou. Peça um novo link ao Professor.",
    convite_ja_usado_ou_revogado: "Este convite já foi usado ou revogado. Peça um novo link ao Professor.",
    papel_nao_permitido: "Use uma conta nova ou uma conta de Aluno para aceitar este convite.",
    idade_nao_adulta: "Este convite só pode ser aceito por uma pessoa que declarou ser adulta.",
    ja_e_instrutor_de_outro_professor: "Esta conta já é Instrutor de outro Professor.",
    email_nao_confirmado: "Confirme o e-mail da conta antes de aceitar o convite.",
    nome_invalido: "Informe um nome com até 80 caracteres para criar o perfil."
  };
  return messages[code] || "O servidor retornou uma resposta inesperada. Tente novamente mais tarde.";
}

function extractRealInstructorInviteToken(value) {
  const input = value.trim();
  if (!input) return "";
  try {
    const url = new URL(input, window.location.href);
    const token = url.searchParams.get("convite_instrutor");
    if (token) return token;
  } catch {
    return input;
  }
  return input;
}

async function refreshRealProfileAfterInstructorInvite() {
  const userId = realUser && realUser.id;
  if (!authClient || !userId) {
    realProfile = null;
    realProfileState = "error";
    realProfileNotice = "Convite aceito, mas não foi possível atualizar o perfil. Recarregue a página.";
  } else {
    try {
      const { data, error } = await authClient.from("perfis")
        .select("id,papel,nome,academia_id,ativo,idade_declarada")
        .eq("id", userId)
        .maybeSingle();
      if (error || !data) throw new Error("Perfil indisponível.");
      realProfile = data;
      realProfileState = "found";
      realProfileNotice = "";
    } catch {
      realProfile = null;
      realProfileState = "error";
      realProfileNotice = "Convite aceito, mas não foi possível atualizar o perfil. Recarregue a página.";
    }
  }
  if (realProfileState === "found" && realProfile &&
      (realProfile.papel === "aluno" || realProfile.papel === "instrutor")) {
    await loadRealInstructorLink(userId);
  } else {
    realInstructorLink = null;
    realInstructorLinkState = "idle";
    realInstructorLinkNotice = "";
  }
  renderNavigation();
  renderScreen(realInstructorConsentPending ? "instructor-invite" : "real-account");
}

function handleRealInstructorInviteSubmit(form) {
  const button = form.querySelector("[data-real-instructor-accept]");
  const nameInput = form.querySelector("#real-instructor-invite-name");
  const ageCheck = form.querySelector("#real-instructor-invite-adult");
  const linkInput = form.querySelector("#real-instructor-invite-link");
  runButtonAction(button, {
    feedback: form.querySelector("#real-instructor-accept-error"),
    announcement: form.querySelector("#real-instructor-accept-status"),
    buttons: [...form.querySelectorAll("button,input")],
    loadingText: "Verificando...",
    loadingMessage: "Validando e aceitando o convite.",
    successMessage: "Convite aceito. Sua conta foi atualizada como Instrutor.",
    successLabel: "Convite aceito",
    errorMessage: "Não foi possível aceitar o convite. Confira os dados e tente novamente.",
    successDelay: 0,
    afterSuccess: refreshRealProfileAfterInstructorInvite
  }, async () => {
    if (!authClient || !realUser) return { errorMessage: "Entre na sua conta para aceitar este convite." };
    if (realProfileState !== "missing" && realProfileState !== "found") {
      return { errorMessage: "Não foi possível verificar sua conta. Atualize a página e tente novamente." };
    }
    const isNewAccount = realProfileState === "missing";
    const isAdultStudent = realProfileState === "found" && realProfile &&
      realProfile.papel === "aluno" && realProfile.idade_declarada === "adulto";
    if (!isNewAccount && !isAdultStudent) {
      return { errorMessage: "Este convite só pode ser aceito por uma conta nova ou por uma conta de Aluno adulto." };
    }

    const token = realInstructorInviteToken || extractRealInstructorInviteToken(linkInput ? linkInput.value : "");
    if (!/^[0-9a-f]{64}$/.test(token)) {
      return { errorMessage: "O link de convite é inválido ou expirou. Peça um novo link ao Professor." };
    }

    let name = "";
    let age = "adulto";
    if (isNewAccount) {
      name = nameInput ? nameInput.value.trim() : "";
      const nameLength = Array.from(name).length;
      if (nameLength < 1 || nameLength > 80 || /[\u0000-\u001f\u007f-\u009f]/.test(name)) {
        return { errorMessage: "Informe um nome válido com até 80 caracteres." };
      }
      if (!ageCheck || !ageCheck.checked) {
        return { errorMessage: "Confirme a declaração de que tem 18 anos ou mais." };
      }
    } else {
      name = typeof realProfile.nome === "string" ? realProfile.nome : "";
    }

    try {
      const { data: validation, error: validationError } = await authClient.rpc("validar_convite_instrutor", {
        p_token: token
      });
      if (validationError) {
        return { errorMessage: navigator.onLine === false
          ? "Falha de rede ao validar o convite. Verifique sua conexão e tente novamente."
          : "Não foi possível validar o convite. Tente novamente mais tarde." };
      }
      if (validation !== "ok") {
        return { errorMessage: typeof validation === "string"
          ? realInstructorInviteReturnMessage(validation)
          : "O servidor retornou uma resposta inesperada. Tente novamente mais tarde." };
      }

      const { data, error } = await authClient.rpc("consumir_convite_instrutor", {
        p_token: token,
        p_nome: name,
        p_idade_declarada: age
      });
      if (error) {
        return { errorMessage: navigator.onLine === false
          ? "Falha de rede ao aceitar o convite. Verifique sua conexão e tente novamente."
          : "Não foi possível aceitar o convite. Tente novamente mais tarde." };
      }
      if (data !== "ok") {
        return { errorMessage: typeof data === "string"
          ? realInstructorInviteReturnMessage(data)
          : "O servidor retornou uma resposta inesperada. Tente novamente mais tarde." };
      }

      realInstructorInviteToken = "";
      if (linkInput) linkInput.value = "";
      if (nameInput) nameInput.value = "";
      if (ageCheck) ageCheck.checked = false;
      clearPendingRealSignupName();
      realInstructorConsentPending = true;
      if (await registerRealConsent() === "ok") realInstructorConsentPending = false;
      return {};
    } catch {
      return { errorMessage: navigator.onLine === false
        ? "Falha de rede ao aceitar o convite. Verifique sua conexão e tente novamente."
        : "Não foi possível aceitar o convite. Tente novamente mais tarde." };
    }
  });
}

function handleRealStudentLinkSubmit(form) {
  const button = form.querySelector("[data-real-student-link-submit]");
  const input = form.querySelector("#real-student-link-code");
  runButtonAction(button, {
    feedback: form.querySelector("#real-student-link-error"),
    announcement: form.querySelector("#real-student-link-status"),
    buttons: [button, input],
    loadingText: "Enviando...",
    loadingMessage: "Enviando pedido de vínculo.",
    successMessage: "Pedido enviado. Aguarde a decisão do Professor.",
    errorMessage: "Não foi possível enviar o pedido. Confira a mensagem e tente novamente.",
    successDelay: 0,
    afterSuccess: loadRealStudentLinkStatus
  }, async () => {
    const userId = realUser && realUser.id;
    if (!authClient || !userId || !isRealActiveStudent()) {
      return { errorMessage: "Esta ação exige uma conta real de Aluno ativa." };
    }

    const code = input.value.replace(/\s/g, "").toUpperCase();
    input.value = code;
    if (!/^[0-9A-F]{6}$/.test(code)) {
      return { errorMessage: "Informe um código válido com 6 caracteres hexadecimais." };
    }

    try {
      const { data, error } = await authClient.rpc("solicitar_vinculo", { p_codigo: code });
      if (error) {
        return {
          errorMessage: navigator.onLine === false
            ? "Falha de rede ao enviar o pedido. Verifique sua conexão e tente novamente."
            : "Não foi possível enviar o pedido. Confira o código e tente novamente."
        };
      }
      if (data && data.ok === true) return {};
      if (data && data.ok === false && data.bloqueado === true) {
        return { errorMessage: "O limite de tentativas foi atingido. Aguarde 15 minutos antes de tentar novamente." };
      }
      if (data && data.ok === false) {
        return { errorMessage: "Não foi possível enviar o pedido. Confira o código ou se já existe um vínculo ou pedido pendente." };
      }
      return { errorMessage: "O servidor retornou uma resposta inesperada. Tente novamente mais tarde." };
    } catch {
      return {
        errorMessage: navigator.onLine === false
          ? "Falha de rede ao enviar o pedido. Verifique sua conexão e tente novamente."
          : "Não foi possível enviar o pedido. Tente novamente mais tarde."
      };
    }
  });
}

function handleRealUnregisteredCreateSubmit(form) {
  const button = form.querySelector("[data-real-unregistered-create]");
  const nameInput = form.querySelector("#real-unregistered-name");
  const ageInput = form.querySelector("#real-unregistered-create-age");
  runButtonAction(button, {
    feedback: form.querySelector("#real-unregistered-create-error"),
    announcement: form.querySelector("#real-unregistered-create-status"),
    buttons: [...form.querySelectorAll("button,input,select")],
    loadingText: "Salvando...",
    loadingMessage: "Cadastrando aluno sem conta.",
    successMessage: "Aluno sem conta cadastrado.",
    errorMessage: "Não foi possível cadastrar o aluno. Confira os dados e tente novamente.",
    successDelay: 0,
    afterSuccess: loadRealProfessorStudentRecords
  }, async () => {
    if (!authClient || !realUser || !isRealActiveProfessorAccount()) {
      return { errorMessage: "Esta ação exige uma conta Google de Professor ativa." };
    }
    const name = nameInput.value.trim();
    const nameLength = Array.from(name).length;
    if (nameLength < 1 || nameLength > 80) {
      return { errorMessage: "O nome precisa ter de 1 a 80 caracteres." };
    }
    if (/[\u0000-\u001f\u007f-\u009f]/.test(name)) {
      return { errorMessage: "O nome não pode conter caracteres de controle." };
    }
    const age = ageInput.value;
    if (!["adulto", "menor"].includes(age)) {
      return { errorMessage: "Selecione Adulto ou Menor de 18 anos." };
    }

    try {
      const { data, error } = await authClient.rpc("criar_aluno_sem_conta", {
        p_nome: name,
        p_idade_declarada: age
      });
      if (error) {
        return {
          errorMessage: navigator.onLine === false
            ? "Falha de rede ao cadastrar o aluno. Verifique sua conexão e tente novamente."
            : "Não foi possível cadastrar o aluno. Confira os dados e tente novamente."
        };
      }
      if (typeof data === "string" && data) return {};
      if (data === null) return { errorMessage: "Não foi possível cadastrar o aluno. Verifique sua conta e os dados informados." };
      return { errorMessage: "O servidor retornou uma resposta inesperada. Tente novamente mais tarde." };
    } catch {
      return {
        errorMessage: navigator.onLine === false
          ? "Falha de rede ao cadastrar o aluno. Verifique sua conexão e tente novamente."
          : "Não foi possível cadastrar o aluno. Tente novamente mais tarde."
      };
    }
  });
}

function handleRealUnregisteredAgeSubmit(form) {
  const button = form.querySelector("[data-real-unregistered-age-save]");
  const ageInput = form.querySelector('[name="idade_declarada"]');
  runButtonAction(button, {
    feedback: form.querySelector('[role="alert"]'),
    announcement: form.querySelector('[role="status"]'),
    buttons: [...form.querySelectorAll("button,select")],
    loadingText: "Salvando...",
    loadingMessage: "Atualizando a idade declarada.",
    successMessage: "Idade declarada atualizada.",
    errorMessage: "Não foi possível atualizar a idade. Tente novamente.",
    successDelay: 0,
    afterSuccess: loadRealProfessorStudentRecords
  }, async () => {
    if (!authClient || !realUser || !isRealActiveProfessorAccount()) {
      return { errorMessage: "Esta ação exige uma conta Google de Professor ativa." };
    }
    const studentId = form.dataset.studentId;
    const age = ageInput.value;
    if (!studentId) return { errorMessage: "Este cadastro não está disponível. Atualize a tela." };
    if (!["adulto", "menor"].includes(age)) {
      return { errorMessage: "Selecione Adulto ou Menor de 18 anos." };
    }

    try {
      const { data, error } = await authClient.rpc("atualizar_idade_aluno_sem_conta", {
        p_aluno_id: studentId,
        p_idade_declarada: age
      });
      if (error) {
        return {
          errorMessage: navigator.onLine === false
            ? "Falha de rede ao atualizar a idade. Verifique sua conexão e tente novamente."
            : "Não foi possível atualizar a idade. Tente novamente mais tarde."
        };
      }
      if (data === true) return {};
      if (data === false) return { errorMessage: "O cadastro não está disponível para atualização. Atualize a lista e tente novamente." };
      return { errorMessage: "O servidor retornou uma resposta inesperada. Tente novamente mais tarde." };
    } catch {
      return {
        errorMessage: navigator.onLine === false
          ? "Falha de rede ao atualizar a idade. Verifique sua conexão e tente novamente."
          : "Não foi possível atualizar a idade. Tente novamente mais tarde."
      };
    }
  });
}

function realTeacherNameReturnMessage(code) {
  const messages = {
    nao_autenticado: "Sua sessão Google não está autenticada. Entre novamente para definir o nome.",
    sem_permissao: "Seu perfil não tem permissão para definir o nome. Esta ação exige um Professor ativo.",
    nome_invalido: "O nome precisa ter de 2 a 80 caracteres e não pode conter caracteres de controle."
  };
  return messages[code] || "O servidor retornou uma resposta inesperada. Atualize a tela e tente novamente.";
}

function realTeacherNameSupabaseErrorMessage(error, afterWrite = false) {
  if (!authClient || !realUser) return "Sua sessão Google não está ativa. Entre novamente e tente outra vez.";
  const message = error && typeof error.message === "string" ? error.message : "";
  const networkError = navigator.onLine === false || error instanceof TypeError || /network|fetch|connection|timeout/i.test(message);
  if (networkError) {
    return afterWrite
      ? "O nome foi salvo, mas houve uma falha de rede ao confirmar a leitura. Atualize a tela."
      : "Falha de rede ao definir o nome. Verifique sua conexão e tente novamente.";
  }
  return afterWrite
    ? "O nome foi salvo, mas não foi possível confirmar a leitura do perfil. Atualize a tela."
    : "Não foi possível definir o nome. Tente novamente mais tarde.";
}

function handleRealTeacherNameSubmit(form) {
  const button = form.querySelector("[data-real-teacher-name-save]");
  const input = form.querySelector("#real-teacher-name");
  runButtonAction(button, {
    feedback: form.querySelector("#real-teacher-name-error"),
    announcement: form.querySelector("#real-teacher-name-status"),
    buttons: [button, input],
    loadingText: "Salvando...",
    loadingMessage: "Salvando o nome no seu perfil.",
    successMessage: "Nome definido e confirmado no perfil.",
    errorMessage: "Não foi possível definir o nome. Confira a mensagem e tente novamente."
  }, async () => {
    const userId = realUser && realUser.id;
    if (!authClient || !userId) return { errorMessage: "Sua sessão Google não está ativa. Entre novamente e tente outra vez." };
    if (!isRealActiveProfessor()) return { errorMessage: "Apenas um Professor ativo vinculado a uma academia pode definir o nome." };

    const name = input.value.trim();
    const nameLength = Array.from(name).length;
    if (nameLength < 2 || nameLength > 80) {
      return { errorMessage: "O nome precisa ter de 2 a 80 caracteres." };
    }
    if (/[\u0000-\u001f\u007f-\u009f]/.test(name)) {
      return { errorMessage: "O nome não pode conter caracteres de controle." };
    }

    let nameWasSaved = false;
    try {
      const { data, error } = await authClient.rpc("definir_nome_professor", { p_nome: name });
      if (error) {
        logRealProfileSupabaseError("definir nome do Professor", error);
        return { errorMessage: realTeacherNameSupabaseErrorMessage(error) };
      }
      if (data !== "ok") return { errorMessage: realTeacherNameReturnMessage(data) };
      nameWasSaved = true;

      const { data: profile, error: profileError } = await authClient
        .from("perfis")
        .select("nome")
        .eq("id", userId)
        .maybeSingle();
      if (profileError) {
        logRealProfileSupabaseError("confirmar nome do Professor", profileError);
        return { errorMessage: realTeacherNameSupabaseErrorMessage(profileError, true) };
      }
      if (!profile || typeof profile.nome !== "string" || !profile.nome.trim()) {
        return { errorMessage: "O nome foi salvo, mas não foi possível confirmar o valor no perfil. Atualize a tela." };
      }
      if (!realUser || realUser.id !== userId || !isRealActiveProfessor()) {
        return { errorMessage: "O nome foi salvo, mas a sessão mudou antes da confirmação. Atualize a tela." };
      }

      const savedName = profile.nome.trim();
      realProfile = { ...realProfile, nome: savedName };
      const profileName = screenContent.querySelector("#real-profile-name");
      if (profileName) profileName.textContent = savedName;
      const missingNameNotice = screenContent.querySelector("#real-teacher-name-missing");
      if (missingNameNotice) missingNameNotice.remove();
      input.value = savedName;
    } catch (error) {
      logRealProfileSupabaseError("definir nome do Professor", error);
      return { errorMessage: realTeacherNameSupabaseErrorMessage(error, nameWasSaved) };
    }
  });
}

function realTeacherCodeErrorMessage(error, action) {
  if (!authClient || !realUser) return "Sua sessão real não está ativa. Entre novamente com o Google.";
  if (navigator.onLine === false || error instanceof TypeError) {
    return "Falha de rede. Verifique sua conexão e tente novamente.";
  }
  return action === "generate"
    ? "Não foi possível gerar ou trocar o código. Tente novamente mais tarde."
    : "Não foi possível consultar o código. Tente novamente mais tarde.";
}

function realAdminGuardError() {
  if (!authClient || !realUser) return "Sua sessão real não está ativa. Entre com a conta Google e tente novamente.";
  if (!isRealAdmSession()) return "Esta ação está disponível somente para uma conta real com papel Adm.";
  return "";
}

function logRealAdminDatabaseError(action, error) {
  console.error(`Falha Supabase ao ${action}.`, {
    code: error && typeof error.code === "string" ? error.code : null,
    message: error && typeof error.message === "string" ? error.message : ""
  });
}

function realAdminDatabaseErrorMessage(error, action) {
  const guardError = realAdminGuardError();
  if (guardError) return guardError;
  if (action === "invite" && error && error.code === "23505") {
    return "Já existe um convite ou cadastro para esse e-mail.";
  }
  if (navigator.onLine === false || error instanceof TypeError) {
    return "Falha de rede. Verifique sua conexão e tente novamente.";
  }
  return action === "read"
    ? "Não foi possível carregar os dados. Tente novamente."
    : "Não foi possível concluir a operação. Tente novamente.";
}

function matchesDatabaseInviteEmailCheck(email) {
  const characters = Array.from(email);
  for (let at = 1; at < characters.length; at += 1) {
    if (characters[at] !== "@") continue;
    for (let dot = at + 2; dot < characters.length - 1; dot += 1) {
      if (characters[dot] === ".") return true;
    }
  }
  return false;
}

function academyPhotoText() {
  return demoAcademy.photo === "icon" ? "⌂" : escapeHtml(demoAcademy.name.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0] || "").join("").toLocaleUpperCase("pt-BR"));
}

function renderRealAdminStudentsScreen() {
  const studentsContent = realAdminStudentsState === "checking"
    ? '<p class="field-help" role="status" aria-live="polite">Carregando alunos...</p>'
    : realAdminStudentsState === "error"
      ? `<div class="notice notice--pending" role="alert">${escapeHtml(realAdminStudentsNotice)}</div>
        <div class="student-action-control">
          <button class="button button--primary button--action" type="button" data-real-admin-students-retry aria-describedby="real-admin-students-retry-error real-admin-students-retry-status">
            <span data-action-label>Tentar novamente</span>
          </button>
          <p class="login-action-error student-action-error" id="real-admin-students-retry-error" role="alert"></p>
          <p class="field-help" id="real-admin-students-retry-status" role="status" aria-live="polite"></p>
        </div>`
      : realAdminStudents.length
        ? `<ul aria-label="Alunos ativos">${realAdminStudents.map((student) => {
          const graduation = student.faixa && Number.isInteger(student.grau)
            ? `Faixa ${escapeHtml(student.faixa)} · ${student.grau} grau${student.grau === 1 ? "" : "s"}`
            : "Sem graduação registrada";
          return `<li><strong>${escapeHtml(student.nome)}</strong><br><small>${graduation}</small></li>`;
        }).join("")}</ul>`
        : '<div class="empty-state"><div><strong>Nenhum aluno ativo encontrado</strong></div></div>';
  return `
    ${heading("CONTA REAL · ADM", "Alunos", "Consulte somente o nome e a faixa/grau atuais dos alunos ativos.")}
    ${panel("Alunos ativos", studentsContent)}
  `;
}

function renderRealAdminAcademyResult() {
  if (realCreatedAcademy) {
    const photoMessage = realCreatedAcademy.foto_fundo_url ? "URL da foto de fundo cadastrada." : "Sem foto de fundo.";
    return `<div class="notice notice--info"><strong>Academia lida do banco:</strong> ${escapeHtml(realCreatedAcademy.nome)}<br><small>${photoMessage}</small></div>`;
  }
  if (realCreatedAcademyId) {
    return `<p class="field-help">A academia foi criada. A leitura ainda não foi concluída; tente novamente para ler este registro.</p>`;
  }
  return `<p class="field-help">Nenhuma academia foi criada nesta sessão.</p>`;
}

function renderRealAdminAcademyScreen() {
  return `
    ${heading("CONTA REAL · ADM", "Academia", "Cadastre ou edite academias no banco. Telefone e e-mail não são enviados.")}
    ${panel("Criar academia", `
      <form data-academy-form data-real-academy-form>
        <div class="form-grid">
          <div class="field field--wide">
            <label for="academy-name">Nome da academia</label>
            <input id="academy-name" name="name" aria-required="true" autocomplete="organization">
          </div>
          <div class="field field--wide">
            <label for="academy-photo-url">URL da foto de fundo (opcional)</label>
            <input id="academy-photo-url" name="foto_fundo_url" type="text">
          </div>
        </div>
        <div class="form-actions">
          <div class="academy-save-action">
            <button class="button button--primary button--action" type="submit" data-academy-save aria-describedby="real-academy-error real-academy-status">
              <span data-action-label>${realCreatedAcademyId ? "Ler academia criada" : "Criar academia"}</span>
            </button>
            <div class="login-action-error" id="real-academy-error" role="alert"></div>
            <div class="field-help" id="real-academy-status" role="status" aria-live="polite"></div>
          </div>
        </div>
      </form>
      <div id="real-academy-result" aria-live="polite">${renderRealAdminAcademyResult()}</div>
    `)}
    ${panel("Editar academia", `
      <div id="real-admin-academy-list">Carregando academias...</div>
      <p class="login-action-error" id="real-admin-academy-list-error" role="alert"></p>
    `)}
  `;
}

function renderRealAdminAcademyRows() {
  if (!realAdminAcademies.length) return `<p class="field-help">Nenhuma academia encontrada.</p>`;
  return realAdminAcademies.map((academy, index) => {
    const errorId = `real-academy-edit-error-${index}`;
    const statusId = `real-academy-edit-status-${index}`;
    return `
      <form class="real-admin-academy-row" data-real-admin-academy-form data-academy-id="${escapeHtml(academy.id)}" data-academy-version="${escapeHtml(String(academy.versao_edicao))}">
        <div class="form-grid">
          <div class="field field--wide">
            <label for="real-academy-edit-name-${index}">Nome da academia</label>
            <input id="real-academy-edit-name-${index}" name="nome" value="${escapeHtml(academy.nome)}" autocomplete="organization">
          </div>
          <div class="field field--wide">
            <label for="real-academy-edit-photo-${index}">URL da foto de fundo (opcional)</label>
            <input id="real-academy-edit-photo-${index}" name="foto_fundo_url" value="${escapeHtml(academy.foto_fundo_url || "")}">
          </div>
        </div>
        <div class="form-actions">
          <div class="academy-save-action">
            <button class="button button--primary button--action" type="submit" data-real-academy-save aria-describedby="${errorId} ${statusId}">
              <span data-action-label>Salvar alterações</span>
            </button>
            <div class="login-action-error" id="${errorId}" role="alert"></div>
            <div class="field-help" id="${statusId}" role="status" aria-live="polite"></div>
          </div>
        </div>
      </form>
    `;
  }).join("");
}

function renderRealAdminInvitesScreen() {
  return `
    ${heading("CONTA REAL · ADM", "Professores convidados", "Convites reais são listados do banco. Somente convites pendentes podem ser excluídos.")}
    <div class="content-grid">
      ${panel("Convites reais", `
        <div id="real-invite-list" aria-live="polite">Carregando convites...</div>
        <p class="login-action-error" id="real-invite-list-error" role="alert"></p>
      `)}
      ${panel("Convidar professor", `
        <form data-real-admin-invite-form>
          <div class="field">
            <label for="real-invite-email">E-mail</label>
            <input id="real-invite-email" name="email" type="text" inputmode="email" autocomplete="email" aria-required="true">
          </div>
          <div class="field" style="margin-top:12px">
            <label for="real-invite-academy">Academia</label>
            <select id="real-invite-academy" name="academia_id" aria-required="true" disabled>
              <option value="">Carregando academias...</option>
            </select>
            <div class="login-action-error" id="real-invite-academy-error" role="alert"></div>
          </div>
          <div class="form-actions">
            <div class="academy-save-action">
              <button class="button button--primary button--action" type="submit" data-real-invite-submit aria-describedby="real-invite-error real-invite-status" disabled>
                <span data-action-label>Convidar professor</span>
              </button>
              <div class="login-action-error" id="real-invite-error" role="alert"></div>
              <div class="field-help" id="real-invite-status" role="status" aria-live="polite"></div>
            </div>
          </div>
        </form>
        <p class="field-help">Informe somente dados fictícios ou autorizados para este convite.</p>
      `)}
    </div>
  `;
}

function renderRealAdminManagementScreen() {
  return `
    ${heading("CONTA REAL · ADM", "Papéis e autorizações", "Consulte Professores e Instrutores e gerencie os Professores pelo banco.")}
    ${panel("Academia", `
      <div class="field">
        <label for="real-admin-academy">Academia</label>
        <select id="real-admin-academy" aria-describedby="real-admin-academy-error" disabled>
          <option value="">Carregando academias...</option>
        </select>
        <div class="login-action-error" id="real-admin-academy-error" role="alert"></div>
      </div>
    `)}
    <div id="real-admin-management" aria-live="polite">
      <p class="field-help">Carregando Professores e Instrutores...</p>
    </div>
  `;
}

function renderRealAdminManagementDetails(academyId, profiles, replacementCandidates) {
  const academy = realAdminAcademies.find((item) => item.id === academyId);
  const professors = profiles.filter((profile) => profile.papel === "professor");
  const activeProfessors = professors.filter((profile) => profile.ativo === true);
  const instructors = profiles.filter((profile) => profile.papel === "instrutor");
  const activeOptions = activeProfessors.map((profile) =>
    `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.nome || "Nome não definido")}</option>`
  ).join("");
  const replacementOptions = replacementCandidates.map((profile) =>
    `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.nome || "Nome não definido")}</option>`
  ).join("");
  const rows = profiles.map((profile, index) => {
    const roleLabel = profile.papel === "professor" ? "Professor" : "Instrutor";
    const statusLabel = profile.papel === "professor" ? (profile.ativo ? "Ativo" : "Inativo") : "Vinculado";
    const errorId = `real-professor-action-error-${index}`;
    const statusId = `real-professor-action-status-${index}`;
    const action = profile.papel !== "professor" ? "" : `
      <div class="academy-save-action">
        <button class="button button--small ${profile.ativo ? "button--danger" : "button--quiet"} button--action" type="button"
          data-real-professor-action="${profile.ativo ? "deactivate" : "reactivate"}"
          data-professor-id="${escapeHtml(profile.id)}" aria-describedby="${errorId} ${statusId}">
          <span data-action-label>${profile.ativo ? "Desativar Professor" : "Reativar Professor"}</span>
        </button>
        <div class="login-action-error" id="${errorId}" role="alert"></div>
        <div class="field-help" id="${statusId}" role="status" aria-live="polite"></div>
      </div>
    `;
    return `
      <div class="list-row real-admin-professor-row">
        <span class="row-copy">
          <strong>${escapeHtml(profile.nome || "Nome não definido")}</strong>
          <small>${roleLabel} · ${statusLabel}</small>
        </span>
        ${action}
      </div>
    `;
  }).join("");
  const admLinkStatus = realProfile && realProfile.academia_id === academyId
    ? "Sua conta Adm está vinculada a esta academia."
    : "Sua conta Adm ainda não está vinculada a esta academia.";
  const noActiveNotice = activeProfessors.length
    ? ""
    : `<div class="notice notice--info"><strong>Academia sem Professor ativo.</strong><br>Se houver Professor inativo, você pode reativá-lo; para a troca, selecione um Professor inativo com convite aceito.</div>`;
  const instructorMessage = instructors.length
    ? ""
    : `<p class="field-help">Nenhum Instrutor vinculado a esta academia.</p>`;
  return `
    ${noActiveNotice}
    <div class="content-grid">
      ${panel("Vincular Adm a Professor", `
        <p class="field-help">${admLinkStatus}</p>
        <form data-real-admin-bind-form>
          <div class="field">
            <label for="real-admin-bind-professor">Professor ativo</label>
            <select id="real-admin-bind-professor" ${activeProfessors.length ? "" : "disabled"}>
              <option value="">${activeProfessors.length ? "Selecione um Professor" : "Nenhum Professor ativo"}</option>
              ${activeOptions}
            </select>
          </div>
          <div class="form-actions">
            <div class="academy-save-action">
              <button class="button button--primary button--action" type="submit" data-real-admin-bind
                aria-describedby="real-admin-bind-error real-admin-bind-status" ${activeProfessors.length ? "" : "disabled"}>
                <span data-action-label>Vincular Adm</span>
              </button>
              <div class="login-action-error" id="real-admin-bind-error" role="alert"></div>
              <div class="field-help" id="real-admin-bind-status" role="status" aria-live="polite"></div>
            </div>
          </div>
        </form>
      `)}
      ${panel("Trocar Professor", `
        <p>Somente Professores inativos da academia com convite aceito aparecem para seleção.</p>
        <form data-real-admin-switch-form>
          <div class="field">
            <label for="real-admin-replacement-professor">Novo Professor</label>
            <select id="real-admin-replacement-professor" ${replacementCandidates.length ? "" : "disabled"}>
              <option value="">${replacementCandidates.length ? "Selecione um Professor" : "Nenhum Professor elegível"}</option>
              ${replacementOptions}
            </select>
          </div>
          <div class="form-actions">
            <div class="academy-save-action">
              <button class="button button--primary button--action" type="submit" data-real-admin-switch
                aria-describedby="real-admin-switch-error real-admin-switch-status" ${replacementCandidates.length ? "" : "disabled"}>
                <span data-action-label>Trocar Professor</span>
              </button>
              <div class="login-action-error" id="real-admin-switch-error" role="alert"></div>
              <div class="field-help" id="real-admin-switch-status" role="status" aria-live="polite"></div>
            </div>
          </div>
        </form>
      `)}
    </div>
    ${panel(`Professores e Instrutores · ${escapeHtml(academy ? academy.nome : "")}`, `
      ${profiles.length ? rows : `<p class="field-help">Nenhum Professor ou Instrutor encontrado nesta academia.</p>`}
      ${instructorMessage}
    `)}
  `;
}

function renderRealAdminInviteRows(invites) {
  if (!invites.length) return `<p class="field-help">Nenhum convite encontrado.</p>`;
  const academyNames = new Map(realAdminAcademies.map((academy) => [academy.id, academy.nome]));
  return invites.map((invite, index) => {
    const statusLabel = invite.status === "convidado" ? "Convidado"
      : invite.status === "ativo" ? "Ativo"
        : invite.status === "revogado" ? "Revogado" : invite.status;
    const errorId = `real-invite-delete-error-${index}`;
    const statusId = `real-invite-delete-status-${index}`;
    return `
      <div class="list-row real-admin-invite-row">
        <span class="row-copy">
          <strong>${escapeHtml(invite.email)}</strong>
          <small>${escapeHtml(academyNames.get(invite.academia_id) || "Academia não carregada")} · ${escapeHtml(statusLabel)}</small>
        </span>
        ${invite.status === "convidado" ? `
          <div class="academy-save-action">
            <button class="button button--small button--quiet button--action" type="button" data-real-invite-delete="${escapeHtml(invite.email)}" aria-describedby="${errorId} ${statusId}">
              <span data-action-label>Excluir convite</span>
            </button>
            <div class="login-action-error" id="${errorId}" role="alert"></div>
            <div class="field-help" id="${statusId}" role="status" aria-live="polite"></div>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");
}

async function loadRealAdminInvites() {
  const guardError = realAdminGuardError();
  realAdminAcademies = [];
  const academySelect = screenContent.querySelector("#real-invite-academy");
  const inviteList = screenContent.querySelector("#real-invite-list");
  const academyError = screenContent.querySelector("#real-invite-academy-error");
  const listError = screenContent.querySelector("#real-invite-list-error");
  const inviteButton = screenContent.querySelector("[data-real-invite-submit]");
  if (guardError) {
    if (academyError) academyError.textContent = guardError;
    if (listError) listError.textContent = guardError;
    return false;
  }

  let success = true;
  try {
    const { data, error } = await authClient.from("academias")
      .select("id,nome,foto_fundo_url,versao_edicao")
      .order("nome", { ascending: true });
    if (error) {
      logRealAdminDatabaseError("listar academias para convite", error);
      if (academyError) academyError.textContent = realAdminDatabaseErrorMessage(error, "read");
      if (academySelect) {
        academySelect.replaceChildren(new Option("Não foi possível carregar academias", ""));
        academySelect.disabled = true;
      }
      if (inviteButton) inviteButton.disabled = true;
      success = false;
    } else {
      realAdminAcademies = data || [];
      if (academyError) academyError.textContent = "";
      if (academySelect) {
        academySelect.replaceChildren(new Option(
          realAdminAcademies.length ? "Selecione uma academia" : "Cadastre uma academia primeiro",
          ""
        ));
        realAdminAcademies.forEach((academy) => {
          const option = new Option(academy.nome, academy.id);
          academySelect.add(option);
        });
        academySelect.disabled = realAdminAcademies.length === 0;
      }
      if (inviteButton) inviteButton.disabled = realAdminAcademies.length === 0;
    }
  } catch (error) {
    logRealAdminDatabaseError("listar academias para convite", error);
    if (academyError) academyError.textContent = realAdminDatabaseErrorMessage(error, "read");
    if (academySelect) {
      academySelect.replaceChildren(new Option("Não foi possível carregar academias", ""));
      academySelect.disabled = true;
    }
    if (inviteButton) inviteButton.disabled = true;
    success = false;
  }

  try {
    const { data, error } = await authClient.from("professores_convidados").select("email,academia_id,status");
    if (error) {
      logRealAdminDatabaseError("listar convites de professor", error);
      if (listError) listError.textContent = realAdminDatabaseErrorMessage(error, "read");
      success = false;
    } else if (inviteList) {
      inviteList.innerHTML = renderRealAdminInviteRows(data || []);
      if (listError) listError.textContent = "";
    }
  } catch (error) {
    logRealAdminDatabaseError("listar convites de professor", error);
    if (listError) listError.textContent = realAdminDatabaseErrorMessage(error, "read");
    success = false;
  }
  return success;
}

async function loadRealAdminAcademiesForEdit() {
  const list = screenContent.querySelector("#real-admin-academy-list");
  const listError = screenContent.querySelector("#real-admin-academy-list-error");
  const guardError = realAdminGuardError();
  if (guardError) {
    if (list) list.textContent = guardError;
    if (listError) listError.textContent = guardError;
    return false;
  }
  try {
    const { data, error } = await authClient.from("academias")
      .select("id,nome,foto_fundo_url,versao_edicao")
      .order("nome", { ascending: true });
    if (error) {
      logRealAdminDatabaseError("listar academias para edição", error);
      if (listError) listError.textContent = realAdminDatabaseErrorMessage(error, "read");
      if (list) list.textContent = "Não foi possível carregar as academias.";
      return false;
    }
    realAdminAcademies = data || [];
    if (listError) listError.textContent = "";
    if (list) list.innerHTML = renderRealAdminAcademyRows();
    return true;
  } catch (error) {
    logRealAdminDatabaseError("listar academias para edição", error);
    if (listError) listError.textContent = realAdminDatabaseErrorMessage(error, "read");
    if (list) list.textContent = "Não foi possível carregar as academias.";
    return false;
  }
}

async function loadRealAdminManagement() {
  const academySelect = screenContent.querySelector("#real-admin-academy");
  const management = screenContent.querySelector("#real-admin-management");
  const guardError = realAdminGuardError();
  if (guardError) {
    if (management) management.textContent = guardError;
    return false;
  }
  try {
    const { data, error } = await authClient.from("academias")
      .select("id,nome,foto_fundo_url,versao_edicao")
      .order("nome", { ascending: true });
    if (error) {
      logRealAdminDatabaseError("listar academias para gestão de Professores", error);
      if (academySelect) {
        academySelect.replaceChildren(new Option("Não foi possível carregar academias", ""));
        academySelect.disabled = true;
      }
      if (management) management.textContent = realAdminDatabaseErrorMessage(error, "read");
      return false;
    }
    realAdminAcademies = data || [];
    if (!academySelect || !management) return false;
    academySelect.replaceChildren(new Option(
      realAdminAcademies.length ? "Selecione uma academia" : "Nenhuma academia encontrada",
      ""
    ));
    realAdminAcademies.forEach((academy) => academySelect.add(new Option(academy.nome, academy.id)));
    if (!realAdminAcademies.length) {
      academySelect.disabled = true;
      management.innerHTML = `<p class="field-help">Cadastre uma academia antes de gerenciar seus Professores.</p>`;
      return true;
    }
    const preferredAcademy = realProfile && realAdminAcademies.some((academy) => academy.id === realProfile.academia_id)
      ? realProfile.academia_id
      : realAdminAcademies[0].id;
    academySelect.value = preferredAcademy;
    academySelect.disabled = false;
    return await loadRealAdminManagementForAcademy(preferredAcademy);
  } catch (error) {
    logRealAdminDatabaseError("listar academias para gestão de Professores", error);
    if (academySelect) {
      academySelect.replaceChildren(new Option("Não foi possível carregar academias", ""));
      academySelect.disabled = true;
    }
    if (management) management.textContent = realAdminDatabaseErrorMessage(error, "read");
    return false;
  }
}

async function loadRealAdminManagementForAcademy(academyId) {
  const management = screenContent.querySelector("#real-admin-management");
  const guardError = realAdminGuardError();
  if (guardError) {
    if (management) management.textContent = guardError;
    return false;
  }
  if (!realAdminAcademies.some((academy) => academy.id === academyId)) {
    if (management) management.textContent = "Selecione uma academia cadastrada.";
    return false;
  }
  if (management) management.innerHTML = `<p class="field-help">Carregando Professores e Instrutores...</p>`;
  try {
    const { data: profiles, error: profileError } = await authClient.from("perfis")
      .select("id,papel,nome,academia_id,ativo")
      .eq("academia_id", academyId)
      .in("papel", ["professor", "instrutor"])
      .order("nome", { ascending: true });
    if (profileError) {
      logRealAdminDatabaseError("listar Professores e Instrutores", profileError);
      if (management) management.innerHTML = `<p class="login-action-error" role="alert">${realAdminDatabaseErrorMessage(profileError, "read")}</p>`;
      return false;
    }
    const { data: invitations, error: invitationError } = await authClient.from("professores_convidados")
      .select("perfil_id")
      .eq("academia_id", academyId)
      .eq("status", "ativo")
      .not("perfil_id", "is", null);
    if (invitationError) {
      logRealAdminDatabaseError("listar convites aceitos para troca de Professor", invitationError);
      if (management) management.innerHTML = `<p class="login-action-error" role="alert">${realAdminDatabaseErrorMessage(invitationError, "read")}</p>`;
      return false;
    }
    const acceptedProfileIds = new Set((invitations || []).map((invite) => invite.perfil_id));
    const replacementCandidates = (profiles || []).filter((profile) =>
      profile.papel === "professor" && profile.ativo === false && acceptedProfileIds.has(profile.id)
    );
    if (management) management.innerHTML = renderRealAdminManagementDetails(academyId, profiles || [], replacementCandidates);
    return true;
  } catch (error) {
    logRealAdminDatabaseError("carregar gestão de Professores", error);
    if (management) management.innerHTML = `<p class="login-action-error" role="alert">${realAdminDatabaseErrorMessage(error, "read")}</p>`;
    return false;
  }
}

function realAdminAcademyRpcMessage(code) {
  return {
    nao_autenticado: "Sua sessão real não está ativa. Entre com a conta Google e tente novamente.",
    sem_permissao: "Esta ação está disponível somente para uma conta Adm ativa.",
    nome_invalido: "Informe um nome com 2 a 80 caracteres.",
    academia_nao_encontrada: "A academia não foi encontrada. Atualize a tela e tente novamente.",
    conflito_versao: "A academia foi alterada por outra operação. Recarregue a tela e aplique suas mudanças novamente."
  }[code] || "Não foi possível atualizar a academia. Tente novamente.";
}

function realAdminProfessorRpcMessage(code) {
  return {
    nao_autenticado: "Sua sessão real não está ativa. Entre com a conta Google e tente novamente.",
    sem_permissao: "Esta ação está disponível somente para uma conta Adm ativa.",
    academia_nao_encontrada: "A academia não foi encontrada. Atualize a tela e tente novamente.",
    professor_invalido: "O Professor não atende aos critérios desta operação. Confira o estado da conta e tente novamente.",
    mesmo_professor: "Selecione um Professor diferente do atual.",
    novo_professor_com_dados_proprios: "O novo Professor já possui vínculos, turma ou dados próprios e não pode receber esta transferência.",
    sem_professor_atual: "Não há um Professor anterior disponível para esta troca.",
    nao_pode_desativar_a_si_mesmo: "Não é possível desativar a própria conta.",
    professor_ja_inativo: "Este Professor já está inativo.",
    professor_ja_ativo: "Este Professor já está ativo.",
    professor_ativo_na_academia: "A academia já possui um Professor ativo. Desative-o ou troque-o antes de reativar outro."
  }[code] || "Não foi possível concluir a operação com o Professor. Tente novamente.";
}

function handleRealAdminAcademySubmit(form) {
  const button = form.querySelector("[data-academy-save]");
  runButtonAction(button, {
    feedback: form.querySelector("#real-academy-error"),
    announcement: form.querySelector("#real-academy-status"),
    buttons: [button, ...form.querySelectorAll("input")],
    loadingText: realCreatedAcademyId ? "Lendo..." : "Criando...",
    loadingMessage: realCreatedAcademyId ? "Lendo a academia criada no banco." : "Criando academia no banco.",
    successMessage: "Academia criada e lida do banco.",
    errorMessage: "Não foi possível concluir a operação. Tente novamente.",
    successDelay: 0,
    afterSuccess: () => { loadRealAdminAcademiesForEdit(); }
  }, async () => {
    const guardError = realAdminGuardError();
    if (guardError) return { errorMessage: guardError };
    if (!realCreatedAcademyId) {
      const name = form.querySelector("#academy-name").value.trim();
      const nameLength = Array.from(name).length;
      if (nameLength < 2 || nameLength > 80) return { errorMessage: "Informe um nome com 2 a 80 caracteres." };
      const photoUrl = form.querySelector("#academy-photo-url").value.trim();
      realCreatedAcademy = null;
      try {
        const { data, error } = await authClient.from("academias")
          .insert({ nome: name, foto_fundo_url: photoUrl || null })
          .select("id")
          .single();
        if (error) {
          logRealAdminDatabaseError("criar academia", error);
          return { errorMessage: realAdminDatabaseErrorMessage(error, "createAcademy") };
        }
        if (!data || !data.id) return { errorMessage: "A academia foi enviada, mas não foi possível confirmar o registro. Tente novamente." };
        realCreatedAcademyId = data.id;
      } catch (error) {
        logRealAdminDatabaseError("criar academia", error);
        return { errorMessage: realAdminDatabaseErrorMessage(error, "createAcademy") };
      }
    }

    try {
      const { data, error } = await authClient.from("academias")
        .select("id,nome,foto_fundo_url")
        .eq("id", realCreatedAcademyId)
        .single();
      if (error) {
        logRealAdminDatabaseError("ler academia criada", error);
        const result = screenContent.querySelector("#real-academy-result");
        if (result) result.textContent = "A academia foi criada, mas a leitura não foi concluída. Use Tentar de novo para ler o mesmo registro.";
        return { errorMessage: realAdminDatabaseErrorMessage(error, "read") };
      }
      realCreatedAcademy = data;
      realCreatedAcademyId = null;
      const result = screenContent.querySelector("#real-academy-result");
      if (result) result.innerHTML = renderRealAdminAcademyResult();
    } catch (error) {
      logRealAdminDatabaseError("ler academia criada", error);
      const result = screenContent.querySelector("#real-academy-result");
      if (result) result.textContent = "A academia foi criada, mas a leitura não foi concluída. Use Tentar de novo para ler o mesmo registro.";
      return { errorMessage: realAdminDatabaseErrorMessage(error, "read") };
    }
  });
}

function handleRealAdminAcademyEditSubmit(form) {
  const button = form.querySelector("[data-real-academy-save]");
  const nameInput = form.querySelector('[name="nome"]');
  const photoInput = form.querySelector('[name="foto_fundo_url"]');
  const name = nameInput.value.trim();
  const nameLength = Array.from(name).length;
  const photoUrl = photoInput.value.trim();
  const version = Number(form.dataset.academyVersion);
  runButtonAction(button, {
    feedback: form.querySelector('[role="alert"]'),
    announcement: form.querySelector('[role="status"]'),
    buttons: [button, nameInput, photoInput],
    loadingText: "Salvando...",
    loadingMessage: "Atualizando os dados da academia no banco.",
    successMessage: "Academia atualizada no banco.",
    errorMessage: "Não foi possível atualizar a academia. Tente novamente.",
    successDelay: 0,
    afterSuccess: () => { loadRealAdminAcademiesForEdit(); }
  }, async () => {
    const guardError = realAdminGuardError();
    if (guardError) return { errorMessage: guardError };
    if (nameLength < 2 || nameLength > 80) return { errorMessage: "Informe um nome com 2 a 80 caracteres." };
    if (!Number.isSafeInteger(version) || version < 0) return { errorMessage: "Não foi possível verificar a versão atual. Recarregue a tela." };
    try {
      const { data, error } = await authClient.rpc("atualizar_academia", {
        p_academia_id: form.dataset.academyId,
        p_nome: name,
        p_foto_fundo_url: photoUrl || null,
        p_versao_esperada: version
      });
      if (error) {
        logRealAdminDatabaseError("atualizar academia", error);
        return { errorMessage: realAdminDatabaseErrorMessage(error, "updateAcademy") };
      }
      const result = Array.isArray(data) ? data[0] : data;
      if (!result || result.codigo !== "ok") return { errorMessage: realAdminAcademyRpcMessage(result && result.codigo) };
    } catch (error) {
      logRealAdminDatabaseError("atualizar academia", error);
      return { errorMessage: realAdminDatabaseErrorMessage(error, "updateAcademy") };
    }
  });
}

function handleRealAdminBindSubmit(form) {
  const button = form.querySelector("[data-real-admin-bind]");
  const professorSelect = form.querySelector("#real-admin-bind-professor");
  const academySelect = screenContent.querySelector("#real-admin-academy");
  const professorId = professorSelect.value;
  const academyId = academySelect.value;
  runButtonAction(button, {
    feedback: form.querySelector("#real-admin-bind-error"),
    announcement: form.querySelector("#real-admin-bind-status"),
    buttons: [button, professorSelect, academySelect],
    loadingText: "Vinculando...",
    loadingMessage: "Vinculando sua conta Adm ao Professor.",
    successMessage: "Conta Adm vinculada à academia.",
    errorMessage: "Não foi possível vincular o Adm ao Professor. Tente novamente.",
    afterSuccess: () => { loadRealAdminManagementForAcademy(academyId); }
  }, async () => {
    const guardError = realAdminGuardError();
    if (guardError) return { errorMessage: guardError };
    if (!realAdminAcademies.some((academy) => academy.id === academyId) || !professorId) {
      return { errorMessage: "Selecione um Professor ativo desta academia." };
    }
    try {
      const { data, error } = await authClient.rpc("vincular_adm_professor", { p_professor: professorId });
      if (error) {
        logRealAdminDatabaseError("vincular Adm ao Professor", error);
        return { errorMessage: realAdminDatabaseErrorMessage(error, "update") };
      }
      if (data !== true) {
        return { errorMessage: "Não foi possível vincular. Confira se sua conta tem permissão e se o Professor está ativo e vinculado a uma academia." };
      }
      realProfile = { ...realProfile, academia_id: academyId };
    } catch (error) {
      logRealAdminDatabaseError("vincular Adm ao Professor", error);
      return { errorMessage: realAdminDatabaseErrorMessage(error, "update") };
    }
  });
}

function handleRealAdminSwitchSubmit(form) {
  const button = form.querySelector("[data-real-admin-switch]");
  const professorSelect = form.querySelector("#real-admin-replacement-professor");
  const academySelect = screenContent.querySelector("#real-admin-academy");
  const professorId = professorSelect.value;
  const academyId = academySelect.value;
  if (!window.confirm("Confirma a troca do Professor desta academia?")) return;
  runButtonAction(button, {
    feedback: form.querySelector("#real-admin-switch-error"),
    announcement: form.querySelector("#real-admin-switch-status"),
    buttons: [button, professorSelect, academySelect],
    loadingText: "Trocando...",
    loadingMessage: "Trocando o Professor e transferindo os vínculos previstos no banco.",
    successMessage: "Troca de Professor concluída.",
    errorMessage: "Não foi possível trocar o Professor. Tente novamente.",
    successDelay: 0,
    afterSuccess: () => { loadRealAdminManagementForAcademy(academyId); }
  }, async () => {
    const guardError = realAdminGuardError();
    if (guardError) return { errorMessage: guardError };
    if (!realAdminAcademies.some((academy) => academy.id === academyId) || !professorId) {
      return { errorMessage: "Selecione um Professor elegível desta academia." };
    }
    try {
      const { data, error } = await authClient.rpc("trocar_professor_academia", {
        p_academia: academyId,
        p_novo_professor: professorId
      });
      if (error) {
        logRealAdminDatabaseError("trocar Professor da academia", error);
        return { errorMessage: realAdminDatabaseErrorMessage(error, "update") };
      }
      if (data !== "ok") return { errorMessage: realAdminProfessorRpcMessage(data) };
    } catch (error) {
      logRealAdminDatabaseError("trocar Professor da academia", error);
      return { errorMessage: realAdminDatabaseErrorMessage(error, "update") };
    }
  });
}

function handleRealAdminProfessorAction(button) {
  const action = button.dataset.realProfessorAction;
  const professorId = button.dataset.professorId;
  const row = button.closest(".real-admin-professor-row");
  const deactivate = action === "deactivate";
  const confirmation = deactivate
    ? "Desativar este Professor? A academia poderá ficar sem Professor ativo."
    : "Reativar este Professor? A operação será recusada se a academia já tiver outro Professor ativo.";
  if (!window.confirm(confirmation)) return;
  const functionName = deactivate ? "desativar_professor" : "reativar_professor";
  runButtonAction(button, {
    feedback: row.querySelector('[role="alert"]'),
    announcement: row.querySelector('[role="status"]'),
    buttons: [button, screenContent.querySelector("#real-admin-academy"), ...screenContent.querySelectorAll("[data-real-professor-action]")],
    loadingText: deactivate ? "Desativando..." : "Reativando...",
    loadingMessage: deactivate ? "Desativando Professor no banco." : "Reativando Professor no banco.",
    successMessage: deactivate ? "Professor desativado." : "Professor reativado.",
    errorMessage: "Não foi possível alterar o estado do Professor. Tente novamente.",
    successDelay: 0,
    afterSuccess: () => { loadRealAdminManagementForAcademy(screenContent.querySelector("#real-admin-academy").value); }
  }, async () => {
    const guardError = realAdminGuardError();
    if (guardError) return { errorMessage: guardError };
    if (!["deactivate", "reactivate"].includes(action) || !professorId) {
      return { errorMessage: "Não foi possível identificar a ação. Recarregue a tela e tente novamente." };
    }
    try {
      const { data, error } = await authClient.rpc(functionName, { p_professor: professorId });
      if (error) {
        logRealAdminDatabaseError(`ação ${action} de Professor`, error);
        return { errorMessage: realAdminDatabaseErrorMessage(error, "update") };
      }
      if (data !== "ok") return { errorMessage: realAdminProfessorRpcMessage(data) };
    } catch (error) {
      logRealAdminDatabaseError(`ação ${action} de Professor`, error);
      return { errorMessage: realAdminDatabaseErrorMessage(error, "update") };
    }
  });
}

function handleRealAdminInviteSubmit(form) {
  const button = form.querySelector("[data-real-invite-submit]");
  runButtonAction(button, {
    feedback: form.querySelector("#real-invite-error"),
    announcement: form.querySelector("#real-invite-status"),
    buttons: [button, ...form.querySelectorAll("input, select")],
    loadingText: "Convidando...",
    loadingMessage: "Salvando convite no banco.",
    successMessage: "Convite de professor criado no banco.",
    errorMessage: "Não foi possível criar o convite. Tente novamente.",
    successDelay: 0,
    afterSuccess: () => { loadRealAdminInvites(); }
  }, async () => {
    const guardError = realAdminGuardError();
    if (guardError) return { errorMessage: guardError };
    const emailInput = form.querySelector("#real-invite-email");
    const email = emailInput.value.trim().toLowerCase();
    emailInput.value = email;
    if (!matchesDatabaseInviteEmailCheck(email)) {
      return { errorMessage: "Informe um e-mail no formato aceito pelo banco." };
    }
    const academyId = form.querySelector("#real-invite-academy").value;
    if (!realAdminAcademies.some((academy) => academy.id === academyId)) {
      return { errorMessage: "Selecione uma academia cadastrada." };
    }
    try {
      const { error } = await authClient.from("professores_convidados").insert({
        email,
        academia_id: academyId
      });
      if (error) {
        logRealAdminDatabaseError("criar convite de professor", error);
        return { errorMessage: realAdminDatabaseErrorMessage(error, "invite") };
      }
      form.reset();
    } catch (error) {
      logRealAdminDatabaseError("criar convite de professor", error);
      return { errorMessage: realAdminDatabaseErrorMessage(error, "invite") };
    }
  });
}

function handleRealAdminInviteDelete(button) {
  const row = button.closest(".real-admin-invite-row");
  runButtonAction(button, {
    feedback: row.querySelector("#real-invite-delete-error"),
    announcement: row.querySelector("#real-invite-delete-status"),
    buttons: [button],
    loadingText: "Excluindo...",
    loadingMessage: "Excluindo convite pendente do banco.",
    successMessage: "Convite pendente excluído do banco.",
    errorMessage: "Não foi possível excluir o convite. Tente novamente.",
    successDelay: 0,
    afterSuccess: () => { loadRealAdminInvites(); }
  }, async () => {
    const guardError = realAdminGuardError();
    if (guardError) return { errorMessage: guardError };
    try {
      const { data, error } = await authClient.from("professores_convidados")
        .delete()
        .eq("email", button.dataset.realInviteDelete)
        .eq("status", "convidado")
        .select("email")
        .maybeSingle();
      if (error) {
        logRealAdminDatabaseError("excluir convite pendente", error);
        return { errorMessage: realAdminDatabaseErrorMessage(error, "deleteInvite") };
      }
      if (!data) return { errorMessage: "O convite não está mais pendente ou não foi encontrado." };
    } catch (error) {
      logRealAdminDatabaseError("excluir convite pendente", error);
      return { errorMessage: realAdminDatabaseErrorMessage(error, "deleteInvite") };
    }
  });
}

function updateEmailPreview(input) {
  const preview = input.parentElement.querySelector(".email-preview");
  if (!preview) return;
  preview.textContent = input.value;
  preview.hidden = !input.value || input.scrollWidth <= input.clientWidth;
}

function resetDeleteAccountConfirmation() {
  const confirmation = document.querySelector("#delete-account-confirmation");
  const button = document.querySelector("[data-delete-account]");
  confirmation.value = "";
  confirmation.disabled = false;
  button.disabled = true;
  button.querySelector("[data-action-label]").textContent = "Excluir minha conta";
  button.removeAttribute("aria-label");
  document.querySelector("#delete-account-error").textContent = "";
  document.querySelector("#delete-account-notice").textContent = "";
}

function closeUserPanel(afterClose) {
  if (!userPanel.open || userPanel.classList.contains("is-closing")) return;
  userPanel.classList.add("is-closing");
  const finish = () => {
    userPanel.classList.remove("is-closing");
    userPanel.close();
    if (!document.querySelector("[data-delete-account]").hasAttribute("aria-busy")) resetDeleteAccountConfirmation();
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
    { name: demoRoster[0].name, amount: "R$ 150,00", date: "01/11/2026", match: "Mensalidade · R$ 150,00" },
    { name: demoRoster[2].name, amount: "R$ 120,00", date: "02/11/2026", match: "Mensalidade · R$ 150,00" }
  ];
}

function updateReceiptComparison() {
  const editor = document.querySelector("#receipt-editor");
  const result = document.querySelector("#receipt-result");
  const amount = document.querySelector("#receipt-amount");
  const date = document.querySelector("#receipt-date");
  if (!editor || !result || !amount || !date) return;
  const charge = monthlyCharges.find((item) => item.id === selectedStudentChargeId && studentCanSeeCharge(item, activeDemoAccount) && item.status === "abberta");
  const amountCents = parseDemoPaymentCents(amount.value);
  const balanceCents = charge
    ? Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge))
    : null;
  const isMatch = charge
    ? amountCents !== null && amountCents > 0 && amountCents <= balanceCents
    : amountCents === 15000 && date.value.trim() === "01/11/2026";
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

async function runButtonAction(button, { feedback, announcement, buttons, loadingText, loadingMessage, successMessage, successLabel, errorMessage, afterSuccess, disableAfterSuccess = false, successDelay = 2500 }, action) {
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
  let redirecting = false;
  buttons.forEach((item) => { item.disabled = true; });
  button.setAttribute("aria-busy", "true");
  label.textContent = loadingText;
  announcement.textContent = loadingMessage;

  try {
    const outcome = await action();
    const actionSuccessMessage = outcome && typeof outcome.successMessage === "string"
      ? outcome.successMessage
      : successMessage;
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
    } else if (outcome && outcome.pendingMessage) {
      if (button.isConnected) {
        label.textContent = outcome.pendingLabel;
        announcement.textContent = outcome.pendingMessage;
        if (outcome.redirecting) {
          redirecting = true;
          window.setTimeout(() => {
            if (!button.isConnected) return;
            buttons.forEach((item, index) => { item.disabled = disabledStates[index]; });
            button.removeAttribute("aria-busy");
            label.textContent = "Tentar de novo";
            button.setAttribute("aria-label", `Tentar de novo: ${originalText}`);
            announcement.textContent = "";
            feedback.textContent = "O redirecionamento não foi concluído. Tente novamente.";
          }, 15000);
        }
      } else {
        showToast(outcome.pendingMessage);
      }
    } else if (button.isConnected) {
      succeeded = true;
      button.removeAttribute("aria-busy");
      button.dataset.actionState = "success";
      label.textContent = successLabel || "✓ Concluído";
      announcement.textContent = actionSuccessMessage;
      if (afterSuccess) {
        if (successDelay > 0) await new Promise((resolve) => window.setTimeout(resolve, successDelay));
        if (button.isConnected) afterSuccess();
        else showToast(actionSuccessMessage);
      } else {
        const nextLabel = outcome && outcome.nextLabel ? outcome.nextLabel : originalText;
        button.dataset.originalLabel = nextLabel;
        actionResetTimers.set(button, window.setTimeout(() => {
          delete button.dataset.actionState;
          label.textContent = nextLabel;
        }, 2500));
      }
    } else {
      showToast(actionSuccessMessage);
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
    if (!redirecting) {
      buttons.forEach((item, index) => { item.disabled = item === button && succeeded && disableAfterSuccess ? true : disabledStates[index]; });
      button.removeAttribute("aria-busy");
    }
    if (hadFocus && button.isConnected && document.activeElement === document.body) button.focus();
  }
}

function validPublicKey(key) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  const parts = key.split(".");
  if (parts.length !== 3 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "anon";
  } catch (error) {
    return false;
  }
}

function authConfigurationError() {
  const config = window.TATAME_SUPABASE_CONFIG;
  if (!config || typeof config.publicKey !== "string" || !config.publicKey.trim()) {
    return "A chave pública não está configurada. Preencha js/config.js e tente novamente.";
  }
  if (!validPublicKey(config.publicKey.trim())) return "Chave inválida. Use apenas uma chave pública publishable ou anon.";
  if (!window.supabase || typeof window.supabase.createClient !== "function") return "A biblioteca de login não carregou. Confira os arquivos do aplicativo.";
  if (!["http:", "https:"].includes(window.location.protocol)) return "Abra o aplicativo por HTTP ou HTTPS para usar o login.";
  return "";
}

function syncAppModeUI() {
  document.body.dataset.appMode = isDemoMode ? "demo" : "real";
  document.querySelectorAll("[data-demo-only]").forEach((element) => { element.hidden = !isDemoMode; });
  document.querySelectorAll("[data-real-only]").forEach((element) => { element.hidden = isDemoMode || !realUser; });
  if (!isDemoMode) {
    const realAccountDeletionNotice = document.querySelector(".user-panel-risk [data-real-only]");
    if (realAccountDeletionNotice) {
      realAccountDeletionNotice.textContent = "A exclusão da conta real está em construção. Nenhuma exclusão é executada pelo app.";
    }
  }
  const demoEntryLink = document.querySelector("[data-demo-entry-link]");
  if (demoEntryLink) demoEntryLink.hidden = isDemoMode || Boolean(realUser) || currentScreen !== "login";
}

function syncRealSessionPanel() {
  syncAppModeUI();
  const realSession = document.querySelector("#real-session");
  realSession.hidden = !realUser;
  document.querySelector("#real-session-email").textContent = realUser ? realUser.email || "E-mail não disponível" : "";
  document.querySelector("[data-logout-role]").hidden = !activeDemoAccount;
  document.querySelector(".user-panel-links[aria-label='Ajuda']").hidden = !activeDemoAccount;
  if (!activeDemoAccount && realUser) {
    document.querySelector("#profile-button").hidden = false;
    document.querySelector(".profile-button-copy").innerHTML = "<strong>Conta real</strong><small>Sessão conectada</small>";
    document.querySelector("#user-panel-profile-name").textContent = realUser.email || "E-mail não disponível";
    document.querySelector("#user-panel-profile-role").textContent = "Conta real";
    document.querySelector(".user-panel-links[aria-label='Navegação da conta']").hidden = true;
  }
  const profileNote = document.querySelector(".user-panel-note");
  profileNote.textContent = isDemoMode
    ? "A demonstração usa perfis fictícios e não realiza login real."
    : "O perfil e as permissões são definidos pelo banco.";
}

function logRealProfileSupabaseError(action, error) {
  console.error(`Falha Supabase ao ${action}.`, {
    code: error && typeof error.code === "string" ? error.code : null,
    message: error && typeof error.message === "string" ? error.message : ""
  });
}

function realProfileErrorMessage(error) {
  if (!authClient || !realUser) return "Sua sessão real não está ativa. Entre novamente.";
  if (navigator.onLine === false || error instanceof TypeError) return "Falha de rede. Verifique sua conexão e tente novamente.";
  return "Não foi possível consultar ou ativar seu perfil. Tente novamente mais tarde.";
}

function activateProfessorOnce(userId) {
  if (professorActivationSessionUserId === userId && professorActivationPromise) {
    return professorActivationPromise;
  }
  professorActivationSessionUserId = userId;
  professorActivationPromise = (async () => {
    if (!authClient || !realUser || realUser.id !== userId) {
      return { state: "error", message: "Sua sessão real não está ativa. Entre novamente com o Google." };
    }

    try {
      const { data: activated, error } = await authClient.rpc("ativar_professor");
      if (error) {
        logRealProfileSupabaseError("ativar o perfil de Professor", error);
        return { state: "error", message: realProfileErrorMessage(error) };
      }
      if (activated === false) {
        return {
          state: "missing",
          message: "Não há convite pendente para este e-mail Google ou o e-mail ainda não está confirmado. Confira a conta e tente novamente mais tarde."
        };
      }
      if (activated !== true) {
        return { state: "error", message: "Não foi possível confirmar a ativação do perfil de Professor." };
      }

      const { data: profile, error: profileError } = await authClient.from("perfis")
        .select("id,papel,nome,academia_id,ativo")
        .eq("id", userId)
        .maybeSingle();
      if (profileError) {
        logRealProfileSupabaseError("ler o perfil de Professor ativado", profileError);
        return { state: "error", message: realProfileErrorMessage(profileError) };
      }
      if (!profile) {
        return { state: "error", message: "A ativação foi confirmada, mas não foi possível localizar o perfil atualizado." };
      }
      return { state: "activated", profile };
    } catch (error) {
      logRealProfileSupabaseError("ativar o perfil de Professor", error);
      return { state: "error", message: realProfileErrorMessage(error) };
    }
  })();
  return professorActivationPromise;
}

async function updateRealSession(session) {
  if (realPasswordRecoveryPending) {
    realUser = session && session.user ? { id: session.user.id, email: session.user.email } : null;
    syncRealSessionPanel();
    return;
  }
  const sequence = ++authCheckSequence;
  const previousUser = realUser;
  realUser = session && session.user ? { id: session.user.id, email: session.user.email } : null;
  realInstructorLinkRequestSequence += 1;
  realTeacherCodeRequestSequence += 1;
  realStudentLinkRequestSequence += 1;
  realTeacherLinkRequestsSequence += 1;
  realInstructorInvitesSequence += 1;
  realUnregisteredStudentsSequence += 1;
  realTeacherCode = null;
  realTeacherCodeState = "idle";
  realTeacherCodeNotice = "";
  realInstructorInvites = [];
  realInstructorInvitesState = "idle";
  realInstructorInvitesNotice = "";
  syncRealSessionPanel();
  if (!realUser) {
    if (realOnboardingStage && profileOnboardingDialog.open) profileOnboardingDialog.close();
    realOnboardingHandledSessionUserId = null;
    realOnboardingStage = null;
    realOnboardingAge = null;
    if (previousUser) clearPendingRealSignupName();
    realProfile = null;
    realProfileNotice = "";
    realInstructorLink = null;
    realInstructorLinkState = "idle";
    realInstructorLinkNotice = "";
    realInstructorStudentsRequestSequence += 1;
    realInstructorStudents = [];
    realInstructorStudentsState = "idle";
    realInstructorStudentsNotice = "";
    realAdminStudentsRequestSequence += 1;
    realAdminStudents = [];
    realAdminStudentsState = "idle";
    realAdminStudentsNotice = "";
    realProfessorActivated = false;
    professorActivationSessionUserId = null;
    professorActivationPromise = null;
    realAdminAcademies = [];
    realCreatedAcademyId = null;
    realCreatedAcademy = null;
    realInstructorInviteUrl = "";
    realInstructorConsentPending = false;
    if (!activeRole && previousUser) {
      document.querySelector("#profile-button").hidden = true;
      renderNavigation();
      renderScreen("login");
    }
    return;
  }
  if (previousUser && previousUser.id !== realUser.id) {
    if (realOnboardingStage && profileOnboardingDialog.open) profileOnboardingDialog.close();
    realOnboardingHandledSessionUserId = null;
    realOnboardingStage = null;
    realOnboardingAge = null;
    realProfileNotice = "";
    realInstructorLink = null;
    realInstructorLinkState = "idle";
    realInstructorLinkNotice = "";
    realInstructorStudentsRequestSequence += 1;
    realInstructorStudents = [];
    realInstructorStudentsState = "idle";
    realInstructorStudentsNotice = "";
    realAdminStudentsRequestSequence += 1;
    realAdminStudents = [];
    realAdminStudentsState = "idle";
    realAdminStudentsNotice = "";
    realProfessorActivated = false;
    professorActivationSessionUserId = null;
    professorActivationPromise = null;
    realInstructorInviteToken = "";
    realInstructorInviteUrl = "";
    realInstructorConsentPending = false;
  }
  realProfileState = "checking";
  realProfile = null;
  if (!activeRole && currentScreen === "teacher-code") {
    realTeacherCodeState = "checking";
    screenContent.innerHTML = renderRealTeacherCodeScreen();
  }
  const isPendingInviteAuthScreen = realInstructorInviteToken &&
    ["instructor-invite", "login", "create-account", "forgot-password"].includes(currentScreen);
  if (!activeRole && (!previousUser || previousUser.id !== realUser.id || currentScreen === "real-account") &&
      !isPendingInviteAuthScreen) renderScreen("real-account");
  try {
    if (!authClient) throw new Error("Sessão indisponível.");
    const { data, error } = await authClient.from("perfis")
      .select("id,papel,nome,academia_id,ativo,idade_declarada")
      .eq("id", realUser.id)
      .maybeSingle();
    if (error) throw error;
    if (sequence !== authCheckSequence) return;
    if (data) {
      realProfile = data;
      realProfileState = "found";
      realProfileNotice = "";
      const authProvider = session.user && session.user.app_metadata
        ? session.user.app_metadata.provider
        : "";
      if (authProvider === "email" && ["professor", "adm"].includes(data.papel)) {
        loginNotice = "Professor e Adm devem entrar com Google.";
        const { error: signOutError } = await authClient.auth.signOut({ scope: "local" });
        if (signOutError) {
          recordDiagnostic("Falha ao encerrar sessão incompatível");
          realUser = null;
          realProfile = null;
          realProfileState = "checking";
          loginNotice = "Não foi possível encerrar a sessão. Recarregue a página e entre com Google.";
          document.querySelector("#profile-button").hidden = true;
          renderNavigation();
          renderScreen("login");
          return;
        }
        if (sequence !== authCheckSequence) return;
        realUser = null;
        realProfile = null;
        realProfileState = "checking";
        renderNavigation();
        renderScreen("login");
        const feedback = document.querySelector("#email-login-error");
        if (feedback) feedback.textContent = loginNotice;
        return;
      }
    } else {
      const authProvider = session.user && session.user.app_metadata
        ? session.user.app_metadata.provider
        : "";
      if (authProvider === "email") {
        realProfile = null;
        realProfileState = "missing";
        realProfileNotice = "";
        realProfessorActivated = false;
      } else {
        const activation = await activateProfessorOnce(realUser.id);
        if (sequence !== authCheckSequence) return;
        realProfileNotice = activation.message || "";
        if (activation.state === "activated") {
          realProfile = activation.profile;
          realProfileState = "found";
          realProfessorActivated = true;
        } else {
          realProfile = null;
          realProfileState = activation.state === "missing" ? "missing" : "error";
          realProfessorActivated = false;
        }
      }
    }
  } catch (error) {
    if (sequence !== authCheckSequence) return;
    logRealProfileSupabaseError("consultar o perfil", error);
    recordDiagnostic("Erro ao consultar perfil");
    realProfile = null;
    realProfileNotice = realProfileErrorMessage(error);
    realProfileState = "error";
  }
  if (realProfileState === "found" && realProfile &&
      (realProfile.papel === "aluno" || realProfile.papel === "instrutor")) {
    await loadRealInstructorLink(realUser.id);
  } else {
    realInstructorLink = null;
    realInstructorLinkState = "idle";
    realInstructorLinkNotice = "";
  }
  if (sequence !== authCheckSequence) return;
  renderNavigation();
  if (!activeRole && currentScreen === "teacher-code" && isRealProfessorProfile()) {
    loadRealTeacherCode();
    loadRealInstructorInvites();
  }
  else if (!activeRole && currentScreen === "link-teacher" && isRealActiveStudent()) renderScreen("link-teacher");
  else if (!activeRole && currentScreen === "password-recovery") {
    renderScreen(realInstructorInviteToken ? "instructor-invite" : "real-account");
  }
  else if (!activeRole && realInstructorInviteToken &&
      ["login", "create-account", "forgot-password"].includes(currentScreen)) renderScreen("instructor-invite");
  else if (!activeRole && currentScreen === "real-account") renderScreen("real-account");
  else if (!activeRole && currentScreen === "instructor-invite") renderScreen("instructor-invite");
  else if (!activeRole && currentScreen === "instructor-students" && isRealActiveInstructor()) renderScreen("instructor-students");
  else if (!activeRole && !canViewScreen(currentScreen)) renderScreen("real-account");
  if (!activeRole) maybeOpenRealProfileOnboarding();
}

function removeInstructorInviteTokenFromUrl() {
  const query = new URLSearchParams(window.location.search);
  if (!query.has("convite_instrutor")) return;
  query.delete("convite_instrutor");
  const search = query.toString();
  history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
}

function removeAuthTokensFromUrl() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  ["code", "token", "token_hash", "type"].forEach((key) => query.delete(key));
  ["access_token", "refresh_token", "provider_token", "provider_refresh_token", "token", "token_hash", "type", "expires_in", "expires_at"].forEach((key) => hash.delete(key));
  const search = query.toString();
  const fragment = hash.toString();
  history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${fragment ? `#${fragment}` : ""}`);
}

async function initializeRealAuth() {
  if (isDemoMode) return;
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  const isErrorRedirect = hash.has("error") || query.has("error");
  if (isErrorRedirect) {
    const codes = [hash.get("error"), query.get("error"), hash.get("error_code"), query.get("error_code")];
    loginNotice = codes.includes("access_denied")
      ? "O login foi cancelado. Tente novamente quando quiser."
      : "Não foi possível concluir o login. Confira a conexão e tente novamente.";
    ["error", "error_code", "error_description"].forEach((key) => { hash.delete(key); query.delete(key); });
    const search = query.toString();
    const fragment = hash.toString();
    history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${fragment ? `#${fragment}` : ""}`);
    const feedback = document.querySelector("#google-login-error");
    if (feedback) feedback.textContent = loginNotice;
  }
  if (!isErrorRedirect && (hash.get("type") === "recovery" || query.get("type") === "recovery")) {
    realPasswordRecoveryPending = true;
  }
  if (authConfigurationError()) {
    removeInstructorInviteTokenFromUrl();
    return;
  }
  try {
    authClient = window.supabase.createClient(
      window.TATAME_SUPABASE_CONFIG.url,
      window.TATAME_SUPABASE_CONFIG.publicKey.trim(),
      { auth: { storage: window.sessionStorage } }
    );
    authClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        realPasswordRecoveryPending = true;
        authCheckSequence += 1;
        realUser = session && session.user ? { id: session.user.id, email: session.user.email } : null;
        realProfile = null;
        realProfileState = "checking";
        realProfileNotice = "";
        syncRealSessionPanel();
        removeAuthTokensFromUrl();
        renderNavigation();
        renderScreen("password-recovery");
        return;
      }
      if (realPasswordRecoveryPending || event === "INITIAL_SESSION" ||
          (event === "SIGNED_IN" && realEmailAuthRequestInProgress)) return;
      if (event === "SIGNED_OUT" && realSignoutInProgress) return;
      window.setTimeout(() => {
        if (!realPasswordRecoveryPending) updateRealSession(session);
      }, 0);
    });
    const { data, error } = await authClient.auth.getSession();
    if (error) throw new Error("Sessão indisponível.");
    removeInstructorInviteTokenFromUrl();
    if (!realPasswordRecoveryPending) await updateRealSession(data.session);
  } catch (error) {
    removeInstructorInviteTokenFromUrl();
    recordDiagnostic("Erro ao recuperar sessão");
    console.error("Não foi possível recuperar a sessão.");
    loginNotice = "Não foi possível recuperar a sessão. Confira a conexão e tente novamente.";
    const feedback = document.querySelector("#google-login-error");
    if (feedback) feedback.textContent = loginNotice;
  }
}

function realGoogleLogin(button) {
  if (isDemoMode) return;
  const card = button.closest(".auth-card");
  runButtonAction(button, {
    feedback: card.querySelector("#google-login-error"),
    announcement: card.querySelector("#login-action-status"),
    buttons: [...card.querySelectorAll("[data-login-action]")],
    loadingText: "Conectando...",
    loadingMessage: "Iniciando login Google.",
    errorMessage: "Não foi possível conectar. Confira a conexão e tente novamente."
  }, async () => {
    loginNotice = "";
    const configError = authConfigurationError();
    if (configError) return { errorMessage: configError };
    if (realUser) return { errorMessage: "Já existe uma sessão ativa. Saia da conta antes de entrar novamente." };
    if (!authClient) return { errorMessage: "O login não está disponível. Recarregue a página e tente novamente." };
    try {
      const redirectUrl = new URL(window.location.href);
      redirectUrl.search = "";
      redirectUrl.hash = "";
      if (realInstructorInviteToken) redirectUrl.searchParams.set("convite_instrutor", realInstructorInviteToken);
      const redirectTo = redirectUrl.toString();
      const { data, error } = await authClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true }
      });
      if (error || !data.url) return { errorMessage: "Não foi possível iniciar o login. Confira a conexão e tente novamente." };
      window.location.assign(data.url);
      return { pendingLabel: "Abrindo Google...", pendingMessage: "Redirecionando para o Google.", redirecting: true };
    } catch (error) {
      recordDiagnostic("Erro ao iniciar login");
      console.error("Não foi possível iniciar o login.");
      return { errorMessage: "Não foi possível conectar. Confira a conexão e tente novamente." };
    }
  });
}

function clearPendingRealSignupName() {
  window.sessionStorage.removeItem(realSignupNameSessionKey);
}

function getPendingRealSignupName() {
  if (!realUser || !realUser.email) return "";
  const savedValue = window.sessionStorage.getItem(realSignupNameSessionKey) || "";
  const separator = savedValue.indexOf("\n");
  const savedEmail = separator === -1 ? "" : savedValue.slice(0, separator);
  if (!savedEmail || savedEmail.toLowerCase() !== realUser.email.toLowerCase()) {
    clearPendingRealSignupName();
    return "";
  }
  return savedValue.slice(separator + 1);
}

function realAuthRedirectUrl() {
  const redirectUrl = new URL(window.location.href);
  redirectUrl.search = "";
  redirectUrl.hash = "";
  if (realInstructorInviteToken) redirectUrl.searchParams.set("convite_instrutor", realInstructorInviteToken);
  return redirectUrl.toString();
}

async function signOutRealEmailSession(errorMessage) {
  try {
    const { error } = await authClient.auth.signOut({ scope: "local" });
    return {
      errorMessage: error
        ? `${errorMessage} Não foi possível encerrar a sessão. Recarregue a página e tente novamente.`
        : errorMessage
    };
  } catch {
    return {
      errorMessage: `${errorMessage} Não foi possível encerrar a sessão. Recarregue a página e tente novamente.`
    };
  }
}

async function verifyRealEmailSessionRole(session) {
  try {
    const { data: profile, error } = await authClient.from("perfis")
      .select("papel")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error) {
      return signOutRealEmailSession("Não foi possível verificar o acesso. Confira a conexão e tente novamente.");
    }
    if (profile && ["professor", "adm"].includes(profile.papel)) {
      return signOutRealEmailSession("Professor e Adm devem entrar com Google.");
    }
    return {};
  } catch {
    return signOutRealEmailSession("Não foi possível verificar o acesso. Confira a conexão e tente novamente.");
  }
}

function realEmailSignUp(form) {
  const button = form.querySelector('button[data-login-action][type="submit"]');
  const nameField = form.querySelector("#real-signup-name");
  const emailField = form.querySelector("#real-signup-email");
  const passwordField = form.querySelector("#real-signup-password");
  const confirmationField = form.querySelector("#real-signup-confirm-password");
  runButtonAction(button, {
    feedback: form.querySelector("#real-signup-error"),
    announcement: form.querySelector("#real-signup-status"),
    buttons: [...form.querySelectorAll("input,button")],
    loadingText: "Criando...",
    loadingMessage: "Criando sua conta.",
    successMessage: "Enviamos um link para confirmar seu e-mail.",
    errorMessage: "Não foi possível criar a conta. Confira os dados e tente novamente.",
    afterSuccess: () => {
      passwordField.value = "";
      confirmationField.value = "";
    }
  }, async () => {
    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const password = passwordField.value;
    const confirmation = confirmationField.value;
    const nameLength = Array.from(name).length;
    if (nameLength < 1 || nameLength > 80 || /[\u0000-\u001f\u007f-\u009f]/.test(name)) {
      return { errorMessage: "Informe um nome válido com até 80 caracteres." };
    }
    if (!email || !emailField.validity.valid) return { errorMessage: "Informe um e-mail válido." };
    if (password.length < 8) return { errorMessage: "A senha deve ter pelo menos 8 caracteres." };
    if (password !== confirmation) return { errorMessage: "As senhas não conferem." };
    const configError = authConfigurationError();
    if (configError) return { errorMessage: configError };
    if (!authClient) return { errorMessage: "O cadastro não está disponível. Recarregue a página e tente novamente." };
    try {
      window.sessionStorage.setItem(realSignupNameSessionKey, `${email.toLowerCase()}\n${name}`);
    } catch {
      return { errorMessage: "Não foi possível manter seu nome nesta sessão. Confira as configurações do navegador e tente novamente." };
    }
    try {
      realEmailAuthRequestInProgress = true;
      const { data, error } = await authClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: realAuthRedirectUrl()
        }
      });
      if (error) return { errorMessage: "Não foi possível criar a conta. Confira os dados e tente novamente." };
      if (data && data.session) {
        const roleCheck = await verifyRealEmailSessionRole(data.session);
        if (roleCheck.errorMessage) return roleCheck;
        await updateRealSession(data.session);
        return { successMessage: "Conta criada. Carregando seu perfil." };
      }
      return {};
    } catch {
      return { errorMessage: "Não foi possível criar a conta. Confira a conexão e tente novamente." };
    } finally {
      realEmailAuthRequestInProgress = false;
    }
  });
}

function realPasswordReset(form) {
  const button = form.querySelector('button[data-login-action][type="submit"]');
  const emailField = form.querySelector("#real-reset-email");
  runButtonAction(button, {
    feedback: form.querySelector("#real-reset-error"),
    announcement: form.querySelector("#real-reset-status"),
    buttons: [...form.querySelectorAll("input,button")],
    loadingText: "Enviando...",
    loadingMessage: "Solicitando link de redefinição.",
    successMessage: "Se o e-mail estiver associado a uma conta, enviaremos um link para redefinir a senha.",
    errorMessage: "Não foi possível solicitar o link agora. Confira a conexão e tente novamente."
  }, async () => {
    const email = emailField.value.trim();
    if (!email || !emailField.validity.valid) return { errorMessage: "Informe um e-mail válido." };
    const configError = authConfigurationError();
    if (configError) return { errorMessage: configError };
    if (!authClient) return { errorMessage: "A redefinição não está disponível. Recarregue a página e tente novamente." };
    try {
      const { error } = await authClient.auth.resetPasswordForEmail(email, {
        redirectTo: realAuthRedirectUrl()
      });
      if (error) return { errorMessage: "Não foi possível solicitar o link agora. Confira a conexão e tente novamente." };
      return {};
    } catch {
      return { errorMessage: "Não foi possível solicitar o link agora. Confira a conexão e tente novamente." };
    }
  });
}

function realPasswordUpdate(form) {
  const button = form.querySelector('button[data-login-action][type="submit"]');
  const passwordField = form.querySelector("#real-new-password");
  const confirmationField = form.querySelector("#real-confirm-new-password");
  let recoverySession = null;
  runButtonAction(button, {
    feedback: form.querySelector("#real-password-update-error"),
    announcement: form.querySelector("#real-password-update-status"),
    buttons: [...form.querySelectorAll("input,button")],
    loadingText: "Salvando...",
    loadingMessage: "Atualizando sua senha.",
    successMessage: "Senha atualizada. Abrindo sua conta.",
    errorMessage: "Não foi possível atualizar a senha. Solicite um novo link e tente novamente.",
    successDelay: 0,
    afterSuccess: () => {
      passwordField.value = "";
      confirmationField.value = "";
      realPasswordRecoveryPending = false;
      updateRealSession(recoverySession);
    }
  }, async () => {
    const password = passwordField.value;
    if (!realPasswordRecoveryPending || !realUser) {
      return { errorMessage: "Abra o link de redefinição enviado ao seu e-mail e tente novamente." };
    }
    if (password.length < 8) return { errorMessage: "A senha deve ter pelo menos 8 caracteres." };
    if (password !== confirmationField.value) return { errorMessage: "As senhas não conferem." };
    if (!authClient) return { errorMessage: "A redefinição não está disponível. Solicite um novo link." };
    try {
      const { error } = await authClient.auth.updateUser({ password });
      if (error) return { errorMessage: "Não foi possível atualizar a senha. Solicite um novo link e tente novamente." };
      const { data, error: sessionError } = await authClient.auth.getSession();
      if (sessionError || !data.session) {
        return { errorMessage: "A senha foi atualizada, mas não foi possível continuar. Recarregue a página." };
      }
      recoverySession = data.session;
      return {};
    } catch {
      return { errorMessage: "Não foi possível atualizar a senha. Solicite um novo link e tente novamente." };
    }
  });
}

function realEmailLogin(form) {
  if (isDemoMode) return;
  const button = form.querySelector('button[data-login-action][type="submit"]');
  const card = form.closest(".auth-card");
  const emailField = form.querySelector("#login-email");
  const passwordField = form.querySelector("#login-password");
  if (!(button instanceof HTMLButtonElement) || !(card instanceof HTMLElement) ||
      !(emailField instanceof HTMLInputElement) || !(passwordField instanceof HTMLInputElement)) {
    showToast("Não foi possível iniciar o login. Atualize a página e tente novamente.", "error");
    return;
  }
  runButtonAction(button, {
    feedback: form.querySelector("#email-login-error"),
    announcement: card.querySelector("#login-action-status"),
    buttons: [...card.querySelectorAll("[data-login-action]")],
    loadingText: "Entrando...",
    loadingMessage: "Verificando seus dados.",
    successMessage: "Acesso confirmado. Carregando seu perfil.",
    errorMessage: "Não foi possível entrar. Verifique o e-mail e a senha e tente novamente."
  }, async () => {
    const email = emailField.value.trim();
    const password = passwordField.value;
    if (!email) return { errorMessage: "Informe seu e-mail." };
    if (!emailField.validity.valid) return { errorMessage: "Informe um e-mail válido." };
    if (!password) return { errorMessage: "Informe sua senha." };
    const configError = authConfigurationError();
    if (configError) return { errorMessage: configError };
    if (!authClient) return { errorMessage: "O login não está disponível. Recarregue a página e tente novamente." };
    if (realUser) return { errorMessage: "Já existe uma sessão ativa. Saia da conta antes de entrar novamente." };
    try {
      realEmailAuthRequestInProgress = true;
      const { data, error } = await authClient.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        const code = error && typeof error.code === "string" ? error.code.toLowerCase() : "";
        const message = error && typeof error.message === "string" ? error.message.toLowerCase() : "";
        if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
          return { errorMessage: "Confirme seu e-mail pelo link enviado antes de entrar." };
        }
        return { errorMessage: "Não foi possível entrar. Verifique o e-mail e a senha e tente novamente." };
      }
      const roleCheck = await verifyRealEmailSessionRole(data.session);
      if (roleCheck.errorMessage) return roleCheck;
      await updateRealSession(data.session);
    } catch (error) {
      recordDiagnostic("Erro ao entrar com e-mail");
      console.error("Não foi possível entrar com e-mail.");
      return { errorMessage: "Não foi possível conectar. Confira a conexão e tente novamente." };
    } finally {
      realEmailAuthRequestInProgress = false;
    }
  });
}

function signOutRealAccount(button) {
  runButtonAction(button, {
    feedback: document.querySelector("#real-signout-error"),
    announcement: document.querySelector("#real-signout-status"),
    buttons: [button],
    loadingText: "Saindo...",
    loadingMessage: "Encerrando a sessão.",
    successMessage: "Sessão encerrada.",
    errorMessage: "Não foi possível sair. Confira a conexão e tente novamente.",
    afterSuccess: () => {
      updateRealSession(null);
      closeUserPanel();
    }
  }, async () => {
    if (!authClient || !realUser) return { errorMessage: "Não há sessão ativa para encerrar." };
    try {
      realSignoutInProgress = true;
      const { error } = await authClient.auth.signOut({ scope: "local" });
      if (error) return { errorMessage: "Não foi possível sair. Confira a conexão e tente novamente." };
    } catch (error) {
      recordDiagnostic("Erro ao sair");
      console.error("Não foi possível encerrar a sessão.");
      return { errorMessage: "Não foi possível sair. Confira a conexão e tente novamente." };
    } finally {
      realSignoutInProgress = false;
    }
  });
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
const initialQuery = new URLSearchParams(window.location.search);
removeInstructorInviteTokenFromUrl();
renderScreen(!isDemoMode && initialQuery.has("convite_instrutor")
  ? "instructor-invite"
  : isDemoMode && initialQuery.has("convite") ? "register" : "login");
document.querySelector("#app-version").textContent = APP_VERSION;
document.querySelector("#diagnostics-version").textContent = `Versão do app: ${APP_VERSION}`;
syncRealSessionPanel();
initializeRealAuth();
cashPayments.filter((payment) => payment.source === "teacher" && payment.status === "confirmed" && payment.undoUntil > Date.now())
  .forEach(scheduleTeacherCashExpiry);
window.addEventListener("resize", updateToastPosition);
window.addEventListener("resize", () => screenContent.querySelectorAll('input[type="email"]').forEach(updateEmailPreview));
if (window.ResizeObserver) {
  new ResizeObserver(updateToastPosition).observe(document.querySelector("#mobile-navigation"));
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.matches("[data-student-search]") &&
      currentScreen === "students") filterDemoStudentEntries();
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const studentFilter = target.closest("[data-student-filter]");
  if (studentFilter instanceof HTMLButtonElement && currentScreen === "students") {
    screenContent.querySelectorAll("[data-student-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button === studentFilter));
    });
    filterDemoStudentEntries();
    return;
  }

  const realProfessorAction = target.closest("[data-real-professor-action]");
  if (realProfessorAction instanceof HTMLButtonElement && isRealAdmSession()) {
    handleRealAdminProfessorAction(realProfessorAction);
    return;
  }

  const realInviteDeleteButton = target.closest("[data-real-invite-delete]");
  if (realInviteDeleteButton && isRealAdmSession()) {
    handleRealAdminInviteDelete(realInviteDeleteButton);
    return;
  }

  const retryRealInstructorConsent = target.closest("[data-retry-real-instructor-consent]");
  if (retryRealInstructorConsent instanceof HTMLButtonElement) {
    const action = retryRealInstructorConsent.closest(".real-instructor-invite-action");
    if (!action) {
      recordDiagnostic("Erro ao iniciar uma ação");
      showToast("Não foi possível iniciar a ação. Tente novamente.", "error");
      return;
    }
    const retryMessage = "Seu acesso foi criado, mas não foi possível registrar o consentimento. Tente novamente.";
    runButtonAction(retryRealInstructorConsent, {
      feedback: action.querySelector("#real-instructor-consent-retry-error"),
      announcement: action.querySelector("#real-instructor-consent-retry-status"),
      buttons: [retryRealInstructorConsent],
      loadingText: "Registrando...",
      loadingMessage: "Tentando registrar o consentimento.",
      successMessage: "Consentimento registrado.",
      successLabel: "Consentimento registrado",
      errorMessage: retryMessage,
      successDelay: 0,
      afterSuccess: () => {
        realInstructorConsentPending = false;
        renderScreen("real-account");
      }
    }, async () => {
      if (!realInstructorConsentPending) return { errorMessage: retryMessage };
      if (await registerRealConsent() !== "ok") return { errorMessage: retryMessage };
    });
    return;
  }

  const realOnboardingAction = target.closest("[data-real-onboarding-action]");
  if (realOnboardingAction instanceof HTMLButtonElement) {
    const action = realOnboardingAction.dataset.realOnboardingAction;
    const buttonGroup = Array.from(profileOnboardingDialog.querySelectorAll("button, input"));
    if (action === "age") {
      const selectedAge = profileOnboardingDialog.querySelector('[name="profile-age"]:checked');
      const age = selectedAge ? selectedAge.value : "";
      const isStudentProfileFlow = isRealStudentProfileCreationFlow();
      const nameInput = isStudentProfileFlow
        ? profileOnboardingDialog.querySelector("#real-profile-onboarding-name")
        : null;
      const name = nameInput instanceof HTMLInputElement ? nameInput.value.trim() : "";
      runButtonAction(realOnboardingAction, {
        feedback: document.querySelector("#profile-onboarding-error"),
        announcement: document.querySelector("#profile-onboarding-status"),
        buttons: buttonGroup,
        loadingText: isStudentProfileFlow ? "Validando..." : "Continuando...",
        loadingMessage: isStudentProfileFlow ? "Validando nome e idade." : "Mantendo a declaração somente nesta sessão.",
        successMessage: isStudentProfileFlow ? "Revise o termo para criar seu perfil." : "Declaração temporária concluída; nada foi gravado.",
        successLabel: isStudentProfileFlow ? "Dados informados" : undefined,
        errorMessage: "Não foi possível continuar. Tente novamente.",
        successDelay: 0,
        afterSuccess: () => renderRealProfileOnboarding("consent")
      }, async () => {
        if (!realUser || activeRole || realOnboardingStage !== "age") {
          return { errorMessage: "A sessão mudou. Entre novamente para continuar." };
        }
        if (isStudentProfileFlow && (!name || Array.from(name).length > 80)) {
          return { errorMessage: "Informe um nome com até 80 caracteres." };
        }
        if (!["adult", "minor"].includes(age)) return { errorMessage: "Escolha uma opção de idade para continuar." };
        realOnboardingName = isStudentProfileFlow ? name : "";
        realOnboardingAge = age;
      });
    } else if (action === "continue") {
      const role = realProfileState === "found" && realProfile ? realProfile.papel : null;
      const isStudentProfileFlow = isRealStudentProfileCreationFlow();
      runButtonAction(realOnboardingAction, {
        feedback: document.querySelector("#profile-onboarding-error"),
        announcement: document.querySelector("#profile-onboarding-status"),
        buttons: buttonGroup,
        loadingText: role === "professor" ? "Registrando..." : isStudentProfileFlow ? "Criando perfil..." : "Continuando...",
        loadingMessage: role === "professor"
          ? "Registrando seu consentimento."
          : isStudentProfileFlow ? "Criando o perfil e registrando seu consentimento." : "Concluindo o aviso somente nesta sessão.",
        successMessage: role === "professor"
          ? "Consentimento registrado."
          : isStudentProfileFlow ? "Perfil confirmado; continuando." : "Aviso concluído; nenhuma resposta foi salva.",
        successLabel: role === "professor"
          ? "Consentimento registrado"
          : isStudentProfileFlow ? "Perfil confirmado" : "Aviso concluído",
        errorMessage: "Não foi possível continuar. Tente novamente.",
        successDelay: 0,
        afterSuccess: isStudentProfileFlow
          ? () => {
            finishRealProfileOnboarding();
            renderScreen(currentScreen || "real-account");
          }
          : finishRealProfileOnboarding
      }, async () => {
        if (!realUser || activeRole || realOnboardingStage !== "consent") {
          return { errorMessage: "A sessão mudou. Entre novamente para continuar." };
        }
        if (isStudentProfileFlow) {
          if (!isRealStudentProfileCreationFlow()) {
            return { errorMessage: "A sessão mudou. Entre novamente para continuar." };
          }
          if (!realOnboardingName || Array.from(realOnboardingName).length > 80) {
            return { errorMessage: "Informe um nome com até 80 caracteres." };
          }
          if (!["adult", "minor"].includes(realOnboardingAge)) {
            return { errorMessage: "A declaração de idade é necessária antes de continuar." };
          }
          const age = realOnboardingAge === "adult" ? "adulto" : "menor";
          const result = await createRealStudentProfileAndConsent(realOnboardingName, age);
          if (result === "ok" || result === "perfil_ja_existe") return {};
          if (result === "nao_autenticado") {
            return { errorMessage: "Sua sessão expirou. Entre novamente." };
          }
          if (result === "email_nao_confirmado") {
            return { errorMessage: "Confirme o e-mail da conta antes de continuar." };
          }
          if (result === "email_convidado_professor") {
            return { errorMessage: "Este e-mail foi convidado como Professor. Use o acesso de Professor." };
          }
          if (result === "nome_invalido") {
            return { errorMessage: "Informe um nome com até 80 caracteres." };
          }
          return { errorMessage: "Não foi possível criar seu perfil. Tente novamente." };
        }
        if (role !== "professor" && !realOnboardingAge) {
          return { errorMessage: "A declaração de idade é necessária antes de continuar." };
        }
        if (role === "professor") {
          const result = await registerRealConsent();
          if (result === "nao_autenticado") {
            return { errorMessage: "Sua sessão expirou. Entre novamente." };
          }
          if (result !== "ok") {
            return { errorMessage: "Não foi possível registrar seu consentimento. Tente novamente." };
          }
        }
      });

    }
    return;
  }

  const ageConfirmation = target.closest("[data-confirm-profile-age]");
  if (ageConfirmation instanceof HTMLButtonElement) {
    const selectedAge = profileOnboardingDialog.querySelector('[name="profile-age"]:checked');
    const age = selectedAge ? selectedAge.value : "";
    const buttonGroup = Array.from(profileOnboardingDialog.querySelectorAll("button, input"));
    runButtonAction(ageConfirmation, {
      feedback: document.querySelector("#profile-onboarding-error"),
      announcement: document.querySelector("#profile-onboarding-status"),
      buttons: buttonGroup,
      loadingText: "Confirmando...",
      loadingMessage: "Registrando a declaração somente nesta sessão.",
      successMessage: "Declaração demonstrativa registrada nesta sessão.",
      errorMessage: "Não foi possível registrar. Tente novamente.",
      afterSuccess: () => {
        if (age === "adult") renderProfileOnboarding("consent");
        else finishProfileOnboarding();
      }
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "perfil-idade") throw new Error("Falha simulada de declaração de idade.");
      if (!age) return { errorMessage: "Escolha uma opção para continuar." };
      if (activeDemoAccount !== onboardingAccount) return { errorMessage: "A conta mudou. Reabra a demonstração." };
      const currentPhoto = getPhotoProfile(onboardingAccount).photo;
      updatePhotoProfile(onboardingAccount, {
        age,
        googleConsent: false,
        photo: age === "minor" ? null : currentPhoto,
        onboardingComplete: age === "minor"
      });
    });
    return;
  }

  const googleConsent = target.closest("[data-consent-google]");
  if (googleConsent instanceof HTMLButtonElement) {
    if (!isDemoMode) return;
    const accepted = googleConsent.dataset.consentGoogle === "accept";
    const buttons = Array.from(profileOnboardingDialog.querySelectorAll("[data-consent-google]"));
    runButtonAction(googleConsent, {
      feedback: document.querySelector("#profile-onboarding-error"),
      announcement: document.querySelector("#profile-onboarding-status"),
      buttons,
      loadingText: accepted ? "Confirmando..." : "Salvando...",
      loadingMessage: accepted ? "Aplicando consentimento demonstrativo." : "Registrando a recusa demonstrativa.",
      successMessage: accepted ? "Consentimento demonstrativo aplicado." : "Recusa registrada; o avatar padrão será usado.",
      errorMessage: "Não foi possível concluir. Tente novamente.",
      afterSuccess: finishProfileOnboarding
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "perfil-foto-consentimento") throw new Error("Falha simulada de consentimento.");
      const professorConsent = activeRole === "professor" && activeDemoAccount === onboardingAccount;
      if (activeDemoAccount !== onboardingAccount ||
          (!professorConsent && getPhotoProfile(onboardingAccount).age !== "adult")) {
        return { errorMessage: "A declaração de idade precisa ser confirmada antes." };
      }
      if (professorConsent) {
        localStorage.setItem(professorConsentStorageKey(onboardingAccount), accepted ? "accepted" : "declined");
      }
      const current = getPhotoProfile(onboardingAccount);
      updatePhotoProfile(onboardingAccount, {
        googleConsent: accepted,
        photo: accepted
          ? current.photo && current.photo.kind === "upload"
            ? current.photo
            : { kind: "google", url: "assets/avatars/avatar-feminino.jpg", zoom: 1, x: 50, y: 50 }
          : current.photo && current.photo.kind === "google" ? null : current.photo,
        onboardingComplete: true
      });
    });
    return;
  }

  const continueUnregistered = target.closest("[data-continue-unregistered]");
  if (continueUnregistered instanceof HTMLButtonElement) {
    const buttons = Array.from(profileOnboardingDialog.querySelectorAll("button"));
    runButtonAction(continueUnregistered, {
      feedback: document.querySelector("#profile-onboarding-error"),
      announcement: document.querySelector("#profile-onboarding-status"),
      buttons,
      loadingText: "Continuando...",
      loadingMessage: "Mantendo o avatar até a classificação pelo Professor.",
      successMessage: "O perfil continua com avatar até a marcação do Professor.",
      errorMessage: "Não foi possível continuar. Tente novamente.",
      afterSuccess: finishProfileOnboarding
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      updatePhotoProfile(onboardingAccount, { age: "unknown", photo: null, googleConsent: false, onboardingComplete: true });
    });
    return;
  }

  const photoConsentReview = target.closest("[data-review-photo-consent]");
  if (photoConsentReview instanceof HTMLButtonElement) {
    const account = activeDemoAccount;
    runButtonAction(photoConsentReview, {
      feedback: document.querySelector("#profile-photo-consent-error"),
      announcement: document.querySelector("#profile-photo-consent-status"),
      buttons: [photoConsentReview],
      loadingText: "Abrindo...",
      loadingMessage: "Preparando a escolha demonstrativa.",
      successMessage: "Escolha de consentimento disponível.",
      errorMessage: "Não foi possível abrir. Tente novamente.",
      afterSuccess: () => {
        onboardingAccount = account;
        onboardingFromSettings = true;
        renderProfileOnboarding("consent");
      }
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      if (activeDemoAccount !== account || getPhotoProfile(account).age !== "adult") {
        return { errorMessage: "Somente um perfil adulto pode rever este consentimento." };
      }
    });
    return;
  }

  const photoFileButton = target.closest("[data-open-photo-file]");
  if (photoFileButton instanceof HTMLButtonElement) {
    const control = photoFileButton.closest(".profile-photo-control");
    const input = control.querySelector("#profile-photo-file");
    const account = activeDemoAccount;
    runButtonAction(photoFileButton, {
      feedback: control.querySelector('[role="alert"]'),
      announcement: control.querySelector('[role="status"]'),
      buttons: [photoFileButton],
      loadingText: "Aguardando arquivo...",
      loadingMessage: "Escolha uma imagem do seu dispositivo.",
      successMessage: "Imagem pronta para ajuste; ainda não foi salva.",
      errorMessage: "Não foi possível abrir a imagem. Tente novamente."
    }, async () => {
      const file = await chooseImageFile(input);
      if (!file) return { pendingLabel: "Escolher foto própria", pendingMessage: "Seleção cancelada; nenhuma alteração foi feita." };
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "perfil-foto-selecao") throw new Error("Falha simulada ao selecionar foto.");
      if (activeDemoAccount !== account || getPhotoProfile(account).age !== "adult") {
        return { errorMessage: "Somente um perfil adulto pode usar foto própria." };
      }
      if (!file.type.startsWith("image/")) return { errorMessage: "Escolha um arquivo de imagem válido." };
      if (file.size > 5 * 1024 * 1024) return { errorMessage: "A imagem deve ter no máximo 5 MB." };
      openPhotoEditor(file);
    });
    return;
  }

  const removeProfilePhoto = target.closest("[data-remove-profile-photo]");
  if (removeProfilePhoto instanceof HTMLButtonElement) {
    const account = activeDemoAccount;
    runButtonAction(removeProfilePhoto, {
      feedback: document.querySelector("#profile-photo-remove-error"),
      announcement: document.querySelector("#profile-photo-remove-status"),
      buttons: [removeProfilePhoto],
      loadingText: "Removendo...",
      loadingMessage: "Removendo a foto somente desta sessão.",
      successMessage: "Foto removida; o avatar padrão está ativo.",
      errorMessage: "Não foi possível remover a foto. Tente novamente.",
      afterSuccess: () => renderScreen("user-settings")
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "perfil-foto-remover") throw new Error("Falha simulada ao remover foto.");
      if (activeDemoAccount !== account || getPhotoProfile(account).age !== "adult") {
        return { errorMessage: "A foto não pode ser removida deste perfil." };
      }
      updatePhotoProfile(account, { photo: null, googleConsent: false });
    });
    return;
  }

  const saveProfilePhoto = target.closest("[data-save-profile-photo]");
  if (saveProfilePhoto instanceof HTMLButtonElement) {
    const account = photoEditorAccount;
    runButtonAction(saveProfilePhoto, {
      feedback: document.querySelector("#photo-editor-error"),
      announcement: document.querySelector("#photo-editor-status"),
      buttons: [saveProfilePhoto, ...photoEditorDialog.querySelectorAll("input, [data-cancel-photo-editor]")],
      loadingText: "Salvando...",
      loadingMessage: "Aplicando o enquadramento somente nesta sessão.",
      successMessage: "Foto própria aplicada; nenhum arquivo foi enviado ou armazenado permanentemente.",
      errorMessage: "Não foi possível salvar a foto. Tente novamente.",
      afterSuccess: () => {
        closePhotoEditor();
        if (activeDemoAccount === account) renderScreen("user-settings");
      }
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "perfil-foto-salvar") throw new Error("Falha simulada ao salvar foto.");
      if (!photoEditorFile || !photoEditorUrl || activeDemoAccount !== account ||
          getPhotoProfile(account).age !== "adult") {
        return { errorMessage: "Selecione uma imagem válida e tente novamente." };
      }
      const photo = {
        kind: "upload",
        url: photoEditorUrl,
        zoom: Number(document.querySelector("#photo-editor-zoom").value),
        x: Number(document.querySelector("#photo-editor-x").value),
        y: Number(document.querySelector("#photo-editor-y").value)
      };
      updatePhotoProfile(account, { photo, googleConsent: false });
      photoEditorUrl = "";
    });
    return;
  }

  if (target.closest("[data-cancel-photo-editor]") || target === photoEditorDialog) {
    closePhotoEditor();
    return;
  }

  const saveStudentAge = target.closest("[data-save-student-age]");
  if (saveStudentAge instanceof HTMLButtonElement) {
    const student = selectedGradeStudent;
    const form = saveStudentAge.closest("[data-student-age-form]");
    const age = form.querySelector("#student-age-status").value;
    const control = saveStudentAge.closest(".student-action-control");
    runButtonAction(saveStudentAge, {
      feedback: control.querySelector('[role="alert"]'),
      announcement: control.querySelector('[role="status"]'),
      buttons: [saveStudentAge, form.querySelector("#student-age-status")],
      loadingText: "Salvando...",
      loadingMessage: "Salvando a classificação somente nesta sessão.",
      successMessage: "Classificação demonstrativa salva nesta sessão.",
      errorMessage: "Não foi possível salvar. Tente novamente.",
      afterSuccess: () => renderScreen("student-detail")
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "perfil-idade-aluno") throw new Error("Falha simulada de classificação.");
      if (activeRole !== "professor" || !student || student.account || student.teacherAccount !== activeDemoAccount) {
        return { errorMessage: "Somente o Professor responsável pode marcar aluno sem registro." };
      }
      updatePhotoProfile(student, {
        age,
        photo: age === "adult" ? getPhotoProfile(student).photo : null,
        googleConsent: false
      });
    });
    return;
  }

  if (target.closest("#app-version")) {
    versionClicks += 1;
    if (versionClicks >= 7) document.querySelector("#user-diagnostics").hidden = false;
    return;
  }

  const academyPhoto = target.closest("[data-academy-photo]");
  if (academyPhoto instanceof HTMLButtonElement) {
    const form = screenContent.querySelector("[data-academy-form]");
    const account = activeDemoAccount;
    runButtonAction(academyPhoto, {
      feedback: screenContent.querySelector("#academy-photo-error"),
      announcement: screenContent.querySelector("#academy-photo-status"),
      buttons: [academyPhoto, form.querySelector("[data-academy-save]")],
      loadingText: "Trocando...",
      loadingMessage: "Simulando a troca de foto.",
      successMessage: "Foto simulada alterada; nenhum arquivo foi armazenado.",
      errorMessage: "Não foi possível trocar a foto simulada. Tente novamente."
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "academia-foto") throw new Error("Falha simulada de foto.");
      if (activeDemoAccount !== account || !canEditAcademy()) return { errorMessage: "Sem permissão para alterar esta academia." };
      const next = { ...demoAcademy, photo: demoAcademy.photo === "initials" ? "icon" : "initials" };
      saveDemoAcademy(next);
      Object.assign(demoAcademy, next);
      const photo = document.querySelector("#academy-photo");
      if (photo) photo.textContent = demoAcademy.photo === "icon" ? "⌂" : demoAcademy.name.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0] || "").join("").toLocaleUpperCase("pt-BR");
    });
    return;
  }

  const deleteAccount = target.closest("[data-delete-account]");
  if (deleteAccount instanceof HTMLButtonElement) {
    const confirmation = document.querySelector("#delete-account-confirmation");
    const account = activeDemoAccount;
    if (confirmation.value !== "EXCLUIR") {
      deleteAccount.disabled = true;
      return;
    }
    runButtonAction(deleteAccount, {
      feedback: document.querySelector("#delete-account-error"),
      announcement: document.querySelector("#delete-account-notice"),
      buttons: [deleteAccount, confirmation],
      loadingText: "Excluindo...",
      loadingMessage: "Removendo os dados fictícios e encerrando a sessão demonstrativa.",
      successMessage: "Dados fictícios removidos; os registros compartilhados foram anonimizados.",
      errorMessage: "Não foi possível excluir os dados demonstrativos. Verifique o armazenamento e tente novamente.",
      afterSuccess: endDemoRole
    }, async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "painel-excluir") {
        throw new Error("Falha simulada de exclusão.");
      }
      return deleteDemoAccountData(account);
    }).then(() => {
      if (!userPanel.open || activeDemoAccount !== account) resetDeleteAccountConfirmation();
    });
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
    realGoogleLogin(googleLogin);
    return;
  }

  const realSignout = target.closest("[data-real-signout]");
  if (realSignout instanceof HTMLButtonElement) {
    signOutRealAccount(realSignout);
    return;
  }

  if (target.closest("[data-retry-profile]") && realUser) {
    updateRealSession({ user: realUser });
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
  const realLinkDecision = target.closest("[data-real-link-decision]");
  if (realLinkDecision instanceof HTMLButtonElement) {
    const approve = realLinkDecision.dataset.realLinkDecision === "approve";
    if (!window.confirm(approve ? "Aprovar este pedido de vínculo?" : "Recusar este pedido de vínculo?")) return;
    const row = realLinkDecision.closest(".link-request-row");
    const buttons = [...row.querySelectorAll("[data-real-link-decision]")];
    runButtonAction(realLinkDecision, {
      feedback: row.querySelector('[role="alert"]'),
      announcement: row.querySelector('[role="status"]'),
      buttons,
      loadingText: approve ? "Aprovando..." : "Recusando...",
      loadingMessage: approve ? "Aprovando pedido de vínculo." : "Recusando pedido de vínculo.",
      successMessage: approve ? "Pedido aprovado." : "Pedido recusado.",
      successLabel: approve ? "Aprovado" : "Recusado",
      errorMessage: "Não foi possível decidir o pedido. Atualize a tela e tente novamente.",
      successDelay: 0,
      afterSuccess: loadRealTeacherLinkRequests
    }, async () => {
      const requestId = realLinkDecision.dataset.requestId;
      if (!authClient || !realUser || !isRealActiveProfessor()) {
        return { errorMessage: "Esta ação exige uma conta Google de Professor ativa vinculada a uma academia." };
      }
      if (!requestId) return { errorMessage: "Este pedido não está disponível. Atualize a lista." };
      try {
        const { data, error } = await authClient.rpc("decidir_pedido", {
          p_pedido: requestId,
          p_aprovar: approve
        });
        if (error) {
          return {
            errorMessage: navigator.onLine === false
              ? "Falha de rede ao decidir o pedido. Verifique sua conexão e tente novamente."
              : "Não foi possível decidir o pedido. Tente novamente mais tarde."
          };
        }
        if (data === true) return {};
        if (data === false) return { errorMessage: "O pedido não está mais pendente ou não pode ser decidido. Atualize a lista." };
        return { errorMessage: "O servidor retornou uma resposta inesperada. Tente novamente mais tarde." };
      } catch {
        return {
          errorMessage: navigator.onLine === false
            ? "Falha de rede ao decidir o pedido. Verifique sua conexão e tente novamente."
            : "Não foi possível decidir o pedido. Tente novamente mais tarde."
        };
      }
    });
    return;
  }

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

  const copyTeacherCodeButton = target.closest("[data-copy-teacher-code]");
  if (copyTeacherCodeButton) {
    const preview = copyTeacherCodeButton.closest(".invite-preview");
    const codeElement = preview && preview.querySelector("[data-teacher-code-display]");
    const feedback = preview && preview.querySelector("[data-teacher-code-error]");
    const announcement = preview && preview.querySelector("[data-teacher-code-status]");
    const buttons = [...screenContent.querySelectorAll("[data-teacher-code-action]")];
    runButtonAction(copyTeacherCodeButton, {
      feedback,
      announcement,
      buttons,
      loadingText: "Copiando...",
      loadingMessage: "Copiando somente o código de seis caracteres.",
      successMessage: "Código de seis caracteres copiado.",
      successLabel: "Copiado",
      errorMessage: "Não foi possível copiar. Selecione o código e use Ctrl+C para copiá-lo."
    }, async () => {
      if (!codeElement) return { errorMessage: "O código não está disponível. Atualize a tela e tente novamente." };
      const errorMessage = await copyTeacherCode(codeElement);
      return errorMessage ? { errorMessage } : undefined;
    });
    return;
  }

  const generateInstructorInviteButton = target.closest("[data-real-instructor-generate]");
  if (generateInstructorInviteButton) {
    const section = generateInstructorInviteButton.closest(".real-instructor-invites");
    const feedback = section && section.querySelector("#real-instructor-generate-error");
    const announcement = section && section.querySelector("#real-instructor-generate-status");
    runButtonAction(generateInstructorInviteButton, {
      feedback,
      announcement,
      buttons: [...section.querySelectorAll("[data-real-instructor-invite-action]")],
      loadingText: "Gerando...",
      loadingMessage: "Gerando convite de uso único.",
      successMessage: "Convite gerado. O link está pronto para copiar.",
      successLabel: "Convite gerado",
      errorMessage: "Não foi possível gerar o convite. Verifique a conexão e tente novamente.",
      successDelay: 0,
      afterSuccess: loadRealInstructorInvites
    }, async () => {
      if (!authClient || !realUser || !isRealActiveProfessor()) {
        return { errorMessage: "Esta ação exige uma conta Google de Professor ativa e vinculada a uma academia." };
      }
      try {
        const { data, error } = await authClient.rpc("gerar_convite_instrutor");
        if (error) {
          return { errorMessage: navigator.onLine === false
            ? "Falha de rede ao gerar o convite. Verifique sua conexão e tente novamente."
            : "Não foi possível gerar o convite. Tente novamente mais tarde." };
        }
        if (typeof data !== "string" || !/^[0-9a-f]{64}$/.test(data)) {
          return { errorMessage: "Não foi possível gerar um convite válido. Tente novamente mais tarde." };
        }
        const inviteUrl = new URL(window.location.href);
        inviteUrl.search = "";
        inviteUrl.hash = "";
        inviteUrl.searchParams.set("convite_instrutor", data);
        realInstructorInviteUrl = inviteUrl.href;
        return {};
      } catch {
        return { errorMessage: navigator.onLine === false
          ? "Falha de rede ao gerar o convite. Verifique sua conexão e tente novamente."
          : "Não foi possível gerar o convite. Tente novamente mais tarde." };
      }
    });
    return;
  }

  const copyInstructorInviteButton = target.closest("[data-real-instructor-copy]");
  if (copyInstructorInviteButton) {
    const section = copyInstructorInviteButton.closest(".real-instructor-invites");
    const feedback = section && section.querySelector("#real-instructor-copy-error");
    const announcement = section && section.querySelector("#real-instructor-copy-status");
    runButtonAction(copyInstructorInviteButton, {
      feedback,
      announcement,
      buttons: [...section.querySelectorAll("[data-real-instructor-invite-action]")],
      loadingText: "Copiando...",
      loadingMessage: "Copiando o link do convite.",
      successMessage: "Link copiado. Ele é de uso único e expira em três dias.",
      successLabel: "Copiado",
      errorMessage: "Não foi possível copiar o link. Tente novamente."
    }, async () => {
      const errorMessage = await copyInstructorInviteLink(realInstructorInviteUrl);
      return errorMessage ? { errorMessage } : undefined;
    });
    return;
  }

  const revokeInstructorInviteButton = target.closest("[data-real-instructor-revoke]");
  if (revokeInstructorInviteButton) {
    const index = Number(revokeInstructorInviteButton.dataset.instructorInviteIndex);
    const invite = Number.isInteger(index) ? realInstructorInvites[index] : null;
    if (!invite || realInstructorInviteStatus(invite) !== "Pendente") {
      showToast("Este convite não está mais pendente. Atualize a lista.", "error");
      return;
    }
    if (!window.confirm("Revogar este convite? O link deixará de funcionar.")) return;
    const row = revokeInstructorInviteButton.closest(".real-instructor-invite-row");
    const feedback = row && row.querySelector('[role="alert"]');
    const announcement = row && row.querySelector('[role="status"]');
    const section = revokeInstructorInviteButton.closest(".real-instructor-invites");
    runButtonAction(revokeInstructorInviteButton, {
      feedback,
      announcement,
      buttons: [...section.querySelectorAll("[data-real-instructor-invite-action]")],
      loadingText: "Revogando...",
      loadingMessage: "Revogando convite.",
      successMessage: "Convite revogado.",
      successLabel: "Revogado",
      errorMessage: "Não foi possível revogar o convite. Atualize a lista e tente novamente.",
      successDelay: 0,
      afterSuccess: loadRealInstructorInvites
    }, async () => {
      if (!authClient || !realUser || !isRealActiveProfessor()) {
        return { errorMessage: "Esta ação exige uma conta Google de Professor ativa e vinculada a uma academia." };
      }
      try {
        const { data, error } = await authClient.rpc("revogar_convite_instrutor", {
          p_convite_id: invite.id
        });
        if (error) {
          return { errorMessage: navigator.onLine === false
            ? "Falha de rede ao revogar o convite. Verifique sua conexão e tente novamente."
            : "Não foi possível revogar o convite. Atualize a lista e tente novamente." };
        }
        if (data === true) return {};
        if (data === false) return { errorMessage: "Este convite não está mais pendente ou não pode ser revogado." };
        return { errorMessage: "O servidor retornou uma resposta inesperada. Tente novamente mais tarde." };
      } catch {
        return { errorMessage: navigator.onLine === false
          ? "Falha de rede ao revogar o convite. Verifique sua conexão e tente novamente."
          : "Não foi possível revogar o convite. Atualize a lista e tente novamente." };
      }
    });
    return;
  }

  const generateRealTeacherCodeButton = target.closest("[data-generate-real-teacher-code]");
  if (generateRealTeacherCodeButton) {
    const hadCode = Boolean(realTeacherCode);
    if (hadCode && !window.confirm("Trocar o código? O código atual deixará de valer assim que o novo for gerado.")) return;
    const preview = generateRealTeacherCodeButton.closest(".invite-preview");
    const feedback = preview && preview.querySelector("[data-teacher-code-error]");
    const announcement = preview && preview.querySelector("[data-teacher-code-status]");
    const buttons = [...screenContent.querySelectorAll("[data-teacher-code-action]")];
    runButtonAction(generateRealTeacherCodeButton, {
      feedback,
      announcement,
      buttons,
      loadingText: hadCode ? "Trocando..." : "Gerando...",
      loadingMessage: hadCode ? "Trocando o código da turma." : "Gerando o código da turma.",
      successMessage: hadCode ? "Código trocado. O código anterior não é mais válido." : "Código da turma gerado.",
      successLabel: hadCode ? "Código trocado" : "Código gerado",
      errorMessage: "Não foi possível gerar ou trocar o código. Verifique a conexão e se seu perfil continua ativo e vinculado à academia."
    }, async () => {
      if (!authClient || !realUser) {
        return { errorMessage: "Sua sessão real não está ativa. Entre novamente com o Google." };
      }
      if (!isRealActiveProfessor()) {
        return { errorMessage: "Somente um Professor ativo e vinculado a uma academia pode gerar ou trocar o código." };
      }
      try {
        const { data, error } = await authClient.rpc("gerar_codigo");
        if (error) return { errorMessage: realTeacherCodeErrorMessage(error, "generate") };
        if (data === null) {
          return {
            errorMessage: "Não foi possível gerar ou trocar o código. Confirme se seu perfil continua ativo e vinculado à academia e tente novamente."
          };
        }
        if (typeof data !== "string" || !/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(data)) {
          return { errorMessage: "A geração não retornou um código de seis caracteres válido. Tente novamente." };
        }
        const codeDisplay = preview && preview.querySelector("[data-teacher-code-display]");
        const codeValue = codeDisplay && codeDisplay.closest(".teacher-code-value");
        const copyButton = preview && preview.querySelector("[data-copy-teacher-code]");
        const emptyMessage = preview && preview.querySelector("[data-teacher-code-empty]");
        if (!codeDisplay || !codeValue || !copyButton || !emptyMessage) {
          return { errorMessage: "Não foi possível atualizar a tela com o novo código. Atualize e tente novamente." };
        }
        realTeacherCode = data;
        realTeacherCodeState = "found";
        codeDisplay.textContent = data;
        codeDisplay.hidden = false;
        codeValue.hidden = false;
        copyButton.hidden = false;
        emptyMessage.hidden = true;
        return { nextLabel: "Trocar código" };
      } catch (error) {
        return { errorMessage: realTeacherCodeErrorMessage(error, "generate") };
      }
    });
    return;
  }

  const changeTeacherCodeButton = target.closest("[data-change-teacher-code]");
  if (changeTeacherCodeButton) {
    const preview = changeTeacherCodeButton.closest(".invite-preview");
    const codeDisplay = preview && preview.querySelector("[data-teacher-code-display]");
    const feedback = preview && preview.querySelector("[data-teacher-code-error]");
    const announcement = preview && preview.querySelector("[data-teacher-code-status]");
    const buttons = [...screenContent.querySelectorAll("[data-teacher-code-action]")];
    runButtonAction(changeTeacherCodeButton, {
      feedback,
      announcement,
      buttons,
      loadingText: "Trocando...",
      loadingMessage: "Trocando o código fictício desta sessão.",
      successMessage: "Código fictício trocado.",
      successLabel: "Código trocado",
      errorMessage: "Não foi possível trocar o código fictício. Tente novamente."
    }, async () => {
      const professor = demoProfiles[activeDemoAccount];
      if (!codeDisplay || activeRole !== "professor" || !professor || !professor.academyId) {
        return { errorMessage: "Não foi possível trocar o código fictício. Confira a conta demonstrativa." };
      }
      const code = createUniqueTeacherLinkCode(activeDemoAccount);
      teacherLinkCodes.set(activeDemoAccount, code);
      codeDisplay.textContent = code;
      return { nextLabel: "Trocar código" };
    });
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
    showToast(`Professor vinculado à ${demoAcademy.name}.`);
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
      updateDemoPayments(() => {
        payment.status = isUndo ? "undone" : "reversed";
        const charge = monthlyCharges.find((item) => item.id === payment.chargeId);
        if (charge) refreshMonthlyChargeStatus(charge);
      });
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
          const charge = monthlyCharges.find((item) => item.id === receipt.chargeId);
          if (charge) refreshMonthlyChargeStatus(charge);
        });
        if (receipt.fileInput) receipt.fileInput.value = "";
      } else if (isCashDecision) {
        const payment = cashPayments.find((item) => item.id === paymentAction.dataset.cashId && item.status === "pending");
        if (!payment || activeRole !== "professor" || payment.professorAccount !== activeDemoAccount) {
          return { errorMessage: "Aviso indisponível. Confira sua conta." };
        }
        updateDemoPayments(() => {
          payment.status = paymentAction.dataset.cashDecision === "confirm" ? "confirmed" : "rejected";
          const charge = monthlyCharges.find((item) => item.id === payment.chargeId);
          if (charge) refreshMonthlyChargeStatus(charge);
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
    const rosterStudent = demoRoster.find((student) => student.account === activeDemoAccount);
    const professorAccount = profile && (profile.teacherAccount || (rosterStudent && rosterStudent.teacherAccount));
    const amountInput = document.querySelector("#cash-amount");
    const dateInput = document.querySelector("#cash-date");
    const chargeSelect = document.querySelector("[data-student-charge-select]");
    const requestedChargeId = chargeSelect ? chargeSelect.value : "";
    const selectedCharge = requestedChargeId
      ? monthlyCharges.find((charge) => charge.id === requestedChargeId &&
        studentCanSeeCharge(charge, activeDemoAccount) && charge.professorAccount === professorAccount && charge.status === "aberta")
      : null;
    const amountValue = Number(amountInput.value);
    const amountCents = parseDemoPaymentCents(amountInput.value);
    const balanceCents = selectedCharge
      ? Math.max(0, selectedCharge.finalAmountCents - chargeConfirmedCents(selectedCharge))
      : null;
    let validationMessage = "";
    if (!profile || activeRole !== "student" || !professorAccount) {
      validationMessage = "Não foi possível enviar o aviso. Confira o vínculo com seu Professor.";
    } else if (requestedChargeId && !selectedCharge) {
      validationMessage = "A cobrança selecionada não está disponível. Atualize a tela e tente novamente.";
    } else if (!Number.isFinite(amountValue) || amountCents === null || amountValue <= 0 || !dateInput.value) {
      validationMessage = "Informe um valor e uma data válidos.";
    } else if (selectedCharge && amountCents > balanceCents) {
      validationMessage = `O valor excede o saldo desta cobrança (${formatDemoCents(balanceCents)}).`;
    } else if (selectedCharge
      ? chargeHasPendingPayment(selectedCharge.id)
      : cashPayments.some((payment) => payment.account === activeDemoAccount && payment.status === "pending" && !payment.chargeId)) {
      validationMessage = "Já existe um aviso aguardando confirmação.";
    }
    const result = document.querySelector("#cash-notice-result");
    const completeCashNotice = () => {
      updateDemoPayments(() => cashPayments.push({
        id: `cash-${Date.now()}`,
        account: activeDemoAccount,
        studentName: profile.name,
        professorAccount,
        amount: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountValue),
        date: dateInput.value,
        source: "student",
        chargeId: selectedCharge ? selectedCharge.id : null,
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
        errorMessage: "Não foi possível enviar o aviso. Tente novamente.",
        afterSuccess: () => {
          renderScreen("student-payments");
          showToast("Aviso de pagamento em dinheiro ficou pendente.");
        }
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
    const requestedChargeId = selectedStudentChargeId;
    const selectedCharge = requestedChargeId
      ? monthlyCharges.find((charge) => charge.id === requestedChargeId &&
        studentCanSeeCharge(charge, activeDemoAccount) && charge.status === "aberta")
      : null;
    const amountCents = amountInput ? parseDemoPaymentCents(amountInput.value.trim()) : null;
    const balanceCents = selectedCharge
      ? Math.max(0, selectedCharge.finalAmountCents - chargeConfirmedCents(selectedCharge))
      : null;
    let validationMessage = "";
    if (selectedCharge
      ? chargeHasPendingPayment(selectedCharge.id)
      : receiptPayments.some((payment) => payment.account === activeDemoAccount && !payment.chargeId)) {
      document.querySelector("#duplicate-receipt-warning").hidden = false;
      validationMessage = "Já existe um aviso pendente para esta cobrança fictícia.";
    } else if (!profile || activeRole !== "student" || !profile.teacherAccount || !profile.academyId) {
      validationMessage = "Não foi possível enviar o comprovante. Confira seu vínculo com o Professor.";
    } else if (requestedChargeId && !selectedCharge) {
      validationMessage = "A cobrança selecionada não está disponível. Atualize a tela e tente novamente.";
    } else if (!fileInput.files.length || !amountInput.value.trim() || !dateInput.value.trim()) {
      validationMessage = "Escolha uma imagem ou PDF fictício antes de enviar.";
    } else if (selectedCharge && (amountCents === null || amountCents <= 0 || amountCents > balanceCents)) {
      validationMessage = `Informe um valor maior que zero e até o saldo desta cobrança (${formatDemoCents(balanceCents)}).`;
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
        chargeId: selectedCharge ? selectedCharge.id : null,
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

  const deletePrivateNoteButton = target.closest("[data-delete-private-note]");
  if (deletePrivateNoteButton instanceof HTMLButtonElement) {
    const noteId = deletePrivateNoteButton.dataset.deletePrivateNote;
    const note = demoPrivateNotes.find((item) => item.id === noteId);
    const noteCard = deletePrivateNoteButton.closest(".private-note-entry");
    if (activeRole !== "professor" || currentScreen !== "student-detail" ||
        !selectedGradeStudent || selectedGradeStudent.teacherAccount !== activeDemoAccount ||
        !note || !noteCard) {
      showToast("Esta nota não está disponível para sua conta.", "error");
      return;
    }
    if (!window.confirm("Excluir esta nota privada?")) return;
    runButtonAction(deletePrivateNoteButton, {
      feedback: noteCard.querySelector("[data-private-note-error]"),
      announcement: noteCard.querySelector("[data-private-note-status]"),
      buttons: [...noteCard.querySelectorAll("button")],
      loadingText: "Excluindo...",
      loadingMessage: "Excluindo a nota da demonstração.",
      successMessage: "Nota excluída.",
      successLabel: "Nota excluída",
      errorMessage: "Não foi possível excluir a nota. Tente novamente.",
      afterSuccess: () => {
        renderScreen("student-detail");
        const notesTab = screenContent.querySelector('[data-tab="notes"]');
        if (notesTab) notesTab.click();
      }
    }, async () => {
      const index = demoPrivateNotes.findIndex((item) => item.id === noteId &&
        item.professorAccount === activeDemoAccount &&
        item.studentIndex === demoRoster.indexOf(selectedGradeStudent));
      if (index < 0) return { errorMessage: "A nota não está mais disponível. Atualize a tela." };
      updateDemoData(() => demoPrivateNotes.splice(index, 1), [[demoDataKeys.privateNotes, saveDemoPrivateNotes]]);
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
  if (target instanceof HTMLSelectElement && target.matches("[data-demo-avatar-choice]")) {
    const profile = demoProfiles[activeDemoAccount];
    if (!activeRole || !activeDemoAccount || !profile ||
        !["avatar-masculino.jpg", "avatar-feminino.jpg"].includes(target.value)) return;
    const previousAvatar = profile.avatarImage;
    profile.avatarImage = target.value;
    try {
      saveDemoProfiles();
    } catch {
      profile.avatarImage = previousAvatar;
      target.value = demoAvatarImage(activeDemoAccount) || (activeRole === "instructor" ? "avatar-feminino.jpg" : "avatar-masculino.jpg");
      document.querySelector("#profile-avatar-choice-error").textContent = "Não foi possível salvar o avatar na demonstração. Verifique o armazenamento e tente novamente.";
      return;
    }
    updateProfileAvatars(activeDemoAccount, activeRole);
    renderScreen("user-settings");
    document.querySelector("#profile-avatar-choice-status").textContent = "Avatar atualizado na demonstração.";
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "teacher-chat-partner") {
    if (demoChatPartners(activeDemoAccount).includes(target.value)) {
      selectedTeacherChatPartner = target.value;
      renderScreen("teacher-chat");
    }
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "student-access") {
    const form = target.form;
    const ageField = form.querySelector("#student-age-field");
    const ageHelp = form.querySelector("#student-age-help");
    ageField.hidden = target.value !== "no-login";
    ageHelp.hidden = target.value === "no-login";
    return;
  }
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
  if (target instanceof HTMLTextAreaElement && target.matches("[data-private-note-input]")) {
    const counter = screenContent.querySelector("[data-private-note-counter]");
    if (counter) counter.textContent = `${target.value.length}/500 caracteres`;
  }
  if (target instanceof HTMLInputElement && ["photo-editor-zoom", "photo-editor-x", "photo-editor-y"].includes(target.id)) {
    updatePhotoCropPreview();
  }
  if (target instanceof HTMLInputElement && target.type === "email") updateEmailPreview(target);
  if (target instanceof HTMLInputElement && target.id === "delete-account-confirmation") {
    const button = document.querySelector("[data-delete-account]");
    button.disabled = target.value !== "EXCLUIR";
    button.querySelector("[data-action-label]").textContent = "Excluir minha conta";
    button.removeAttribute("aria-label");
    document.querySelector("#delete-account-error").textContent = "";
    document.querySelector("#delete-account-notice").textContent = "";
  }
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

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === "real-admin-academy" && isRealAdmSession()) {
    loadRealAdminManagementForAcademy(target.value);
  }
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-academy-form]")) return;
  event.preventDefault();
  const form = event.target;
  if (isRealAdmSession()) {
    handleRealAdminAcademySubmit(form);
    return;
  }
  const account = activeDemoAccount;
  const name = form.querySelector("#academy-name").value.trim();
  const phone = form.querySelector("#academy-phone").value.trim();
  const email = form.querySelector("#academy-email").value.trim();
  const button = form.querySelector("[data-academy-save]");
  runButtonAction(button, {
    feedback: form.querySelector("#academy-save-error"),
    announcement: form.querySelector("#academy-save-status"),
    buttons: [button, screenContent.querySelector("[data-academy-photo]"), ...form.querySelectorAll("input")],
    loadingText: "Salvando...",
    loadingMessage: "Salvando dados fictícios neste navegador.",
    successMessage: "Dados fictícios salvos neste navegador.",
    errorMessage: "Não foi possível salvar. Tente novamente."
  }, async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    if (new URLSearchParams(window.location.search).get("erro-simulado") === "academia-salvar") throw new Error("Falha simulada de academia.");
    if (activeDemoAccount !== account || !canEditAcademy()) return { errorMessage: "Sem permissão para alterar esta academia." };
    if (!name) return { errorMessage: "Informe o nome da academia." };
    const next = { ...demoAcademy, name, phone, email };
    saveDemoAcademy(next);
    Object.assign(demoAcademy, next);
    const photo = document.querySelector("#academy-photo");
    if (photo) photo.innerHTML = academyPhotoText();
  });
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-student-link-form]")) return;
  event.preventDefault();
  handleRealStudentLinkSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-unregistered-create-form]")) return;
  event.preventDefault();
  handleRealUnregisteredCreateSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-unregistered-age-form]")) return;
  event.preventDefault();
  handleRealUnregisteredAgeSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-teacher-name-form]")) return;
  event.preventDefault();
  handleRealTeacherNameSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-admin-academy-form]")) return;
  event.preventDefault();
  handleRealAdminAcademyEditSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-admin-bind-form]")) return;
  event.preventDefault();
  handleRealAdminBindSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-admin-switch-form]")) return;
  event.preventDefault();
  handleRealAdminSwitchSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-admin-invite-form]")) return;
  event.preventDefault();
  handleRealAdminInviteSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-instructor-accept-form]")) return;
  event.preventDefault();
  handleRealInstructorInviteSubmit(event.target);
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
      !demoProfiles.instructor || demoProfiles.instructor.role !== "instructor") {
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
        (invite.type === "instructor" && (!demoProfiles.instructor || demoProfiles.instructor.role !== "instructor"))) {
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
    updateEmailPreview(form.querySelector("#register-email"));
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
  event.target.querySelector("#student-age-field").hidden = true;
  event.target.querySelector("#student-age-help").hidden = false;
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-demo-private-note-form]")) return;
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector("[data-save-demo-private-note]");
  const input = form.querySelector("[data-private-note-input]");
  const student = selectedGradeStudent;
  const studentIndex = demoRoster.indexOf(student);
  const text = input.value.trim();
  if (button.disabled) return;
  runButtonAction(button, {
    feedback: form.querySelector("[data-private-note-error]"),
    announcement: form.querySelector("[data-private-note-status]"),
    buttons: [...form.querySelectorAll("button, textarea")],
    loadingText: "Salvando...",
    loadingMessage: "Salvando a nota na demonstração.",
    successMessage: "Nota salva nesta demonstração.",
    successLabel: "Nota salva",
    errorMessage: "Não foi possível salvar a nota. Tente novamente.",
    afterSuccess: () => {
      renderScreen("student-detail");
      const notesTab = screenContent.querySelector('[data-tab="notes"]');
      if (notesTab) notesTab.click();
    }
  }, async () => {
    if (activeRole !== "professor" || !student || studentIndex < 0 ||
        student.teacherAccount !== activeDemoAccount || currentScreen !== "student-detail") {
      return { errorMessage: "Selecione um aluno da sua turma antes de salvar a nota." };
    }
    if (!text || text.length > 500) return { errorMessage: "Escreva uma nota de até 500 caracteres." };
    const note = {
      id: `nota-${Date.now()}-${demoPrivateNotes.length}`,
      studentIndex,
      studentName: student.name,
      studentAccount: student.account,
      professorAccount: activeDemoAccount,
      text,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    updateDemoData(() => demoPrivateNotes.push(note), [[demoDataKeys.privateNotes, saveDemoPrivateNotes]]);
  });
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
  const age = form.querySelector("#student-access").value === "no-login"
    ? form.querySelector("#student-age-status").value
    : "unknown";
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
    let createdStudent;
    updateDemoData(() => {
      createdStudent = { account: null, name, grade: gradeLabel(belt, degree), teacherAccount: account, demoCreated: true };
      demoRoster.push(createdStudent);
    }, [[demoDataKeys.roster, saveDemoRoster]]);
    photoProfiles.set(createdStudent, { age, googleConsent: false, photo: null, onboardingComplete: true });
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
  const amountCents = parseDemoPaymentCents(form.querySelector("#teacher-cash-amount").value);
  const dateValue = form.querySelector("#teacher-cash-date").value;
  const requestedChargeId = form.querySelector("[data-teacher-cash-charge]").value;
  const typeValue = form.querySelector("#teacher-cash-type").value.trim();
  const referenceValue = form.querySelector("#teacher-cash-reference").value.trim();
  const search = normalizeTeacherCashSearch(studentInput);
  const students = demoRoster.filter((item) => item.teacherAccount === activeDemoAccount &&
    [item.name, teacherCashStudentLabel(item)].some((value) => normalizeTeacherCashSearch(value) === search));
  const selected = studentField.dataset.selectedStudent === undefined ? null : demoRoster[Number(studentField.dataset.selectedStudent)];
  const student = selected && selected.teacherAccount === activeDemoAccount && normalizeTeacherCashSearch(teacherCashStudentLabel(selected)) === search
    ? selected : students.length === 1 ? students[0] : null;
  const charge = requestedChargeId
    ? monthlyCharges.find((item) => item.id === requestedChargeId &&
      item.professorAccount === activeDemoAccount && item.status === "aberta")
    : null;
  const chargeBalance = charge
    ? Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge))
    : null;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton.disabled) return;
  const valid = activeRole === "professor" && student && Number.isFinite(amountValue) && amountCents !== null &&
    amountValue > 0 && dateValue && typeValue && referenceValue &&
    (!requestedChargeId || (charge && charge.studentKey === studentBillingKey(student) && amountCents <= chargeBalance));
  const formattedAmount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountValue);
  if (valid && !window.confirm(`${formattedAmount} para ${student.name} (${student.grade}), ${typeValue} · ${referenceValue}?`)) return;
  runButtonAction(submitButton, {
    feedback: submitButton.parentElement.querySelector('[role="alert"]'),
    announcement: form.querySelector("#teacher-cash-result"),
    buttons: Array.from(screenContent.querySelectorAll("[data-professor-payment-action]")),
    loadingText: "Salvando...",
    loadingMessage: "Registrando recebimento.",
    successMessage: "Recebimento lançado. Desfaça em até 120 segundos no histórico.",
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
      chargeId: charge ? charge.id : null,
      undoUntil: Date.now() + 120000
    };
    updateDemoPayments(() => {
      cashPayments.push(payment);
      if (charge) refreshMonthlyChargeStatus(charge);
    });
    refreshTeacherCashHistory();
    scheduleTeacherCashExpiry(payment);
    showToast("Recebimento lançado. Desfaça em até 120 segundos no histórico.");
  });
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement)) return;
  const form = event.target;
  if (form.matches("[data-real-signup-form]")) {
    event.preventDefault();
    realEmailSignUp(form);
    return;
  }
  if (form.matches("[data-real-password-reset-form]")) {
    event.preventDefault();
    realPasswordReset(form);
    return;
  }
  if (form.matches("[data-real-password-update-form]")) {
    event.preventDefault();
    realPasswordUpdate(form);
    return;
  }
  if (form.matches("[data-real-login-form]")) {
    event.preventDefault();
    realEmailLogin(form);
    return;
  }
  if (!isDemoMode || !form.matches("[data-demo-form]")) return;
  event.preventDefault();
  if (form.matches("[data-conversation-form]")) {
    const chatButton = form.querySelector("[data-conversation-send]");
    const messageField = form.querySelector("[data-chat-message]");
    const partnerAccount = form.dataset.chatPartner;
    if (!(chatButton instanceof HTMLButtonElement) || !(messageField instanceof HTMLInputElement)) {
      showToast("Não foi possível iniciar o envio da mensagem. Atualize a tela e tente novamente.", "error");
      return;
    }
    runButtonAction(chatButton, {
      feedback: form.querySelector("#demo-chat-error"),
      announcement: form.querySelector("#demo-chat-status"),
      buttons: [chatButton, messageField],
      loadingText: "Enviando...",
      loadingMessage: "Salvando a mensagem fictícia neste navegador.",
      successMessage: "Mensagem salva nesta demonstração.",
      successLabel: "Mensagem enviada",
      errorMessage: "Não foi possível salvar a mensagem. Verifique o armazenamento e tente novamente.",
      afterSuccess: () => {
        renderScreen(currentScreen);
        showToast("Mensagem salva nesta demonstração.");
      }
    }, async () => {
      const simulatedError = new URLSearchParams(window.location.search).get("erro-simulado");
      if (simulatedError === "conversa-salvar" || (activeRole === "student" && simulatedError === "aluno-mensagem")) {
        throw new Error("Falha simulada de envio da mensagem.");
      }
      const partners = demoChatPartners(activeDemoAccount);
      const text = messageField.value.trim();
      if (!partners.includes(partnerAccount) || !text) {
        return { errorMessage: "Confira a pessoa vinculada e escreva uma mensagem." };
      }
      const participants = [activeDemoAccount, partnerAccount].sort();
      const id = participants.join("::");
      updateDemoConversations(() => {
        let conversation = demoConversationFor(activeDemoAccount, partnerAccount);
        if (!conversation) {
          conversation = { id, participants, messages: [] };
          demoConversations.push(conversation);
        }
        conversation.messages.push({
          senderAccount: activeDemoAccount,
          text,
          sentAt: new Date().toISOString()
        });
      });
      messageField.value = "";
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

const privacyModalContent = document.querySelector("#privacy-modal-content");
privacyModalContent.innerHTML = renderPrivacyDraftContent("h3");

privacyDialog.addEventListener("click", (event) => {
  if (event.target === privacyDialog) privacyDialog.close();
});

termsDialog.addEventListener("click", (event) => {
  if (event.target === termsDialog) termsDialog.close();
});

profileOnboardingDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
});

photoEditorDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closePhotoEditor();
});

window.addEventListener("beforeunload", () => {
  for (const url of replacedPhotoUrls) URL.revokeObjectURL(url);
  for (const profile of photoProfiles.values()) {
    if (profile.photo && profile.photo.kind === "upload" && profile.photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(profile.photo.url);
    }
  }
  if (photoEditorUrl) URL.revokeObjectURL(photoEditorUrl);
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

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.matches("[data-billing-month]")) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(target.value)) return;
    billingSelectedMonth = target.value;
    document.querySelectorAll("[data-billing-student]").forEach((row) => {
      const studentKey = row.dataset.billingStudent;
      const existingCharge = monthlyCharges.some((charge) =>
        charge.studentKey === studentKey && charge.professorAccount === activeDemoAccount && charge.month === billingSelectedMonth
      );
      const checkbox = row.querySelector("[data-billing-select]");
      if (!checkbox) return;
      checkbox.disabled = existingCharge;
      checkbox.checked = !existingCharge && (checkbox.checked || Boolean(billingSettingFor(studentKey, activeDemoAccount)));
      const label = checkbox.parentElement.querySelector("span");
      if (label) label.textContent = existingCharge ? "Cobrança já gerada para este mês" : "Incluir no lote deste mês";
    });
    const monthLabel = document.querySelector("#monthly-charge-list-month");
    const chargeList = document.querySelector("#monthly-charge-list");
    const charges = chargesForTeacherMonth(activeDemoAccount, billingSelectedMonth);
    if (monthLabel) monthLabel.textContent = `Mês: ${billingSelectedMonth}`;
    if (chargeList) {
      chargeList.innerHTML = charges.length
        ? charges.map((charge) => renderMonthlyChargeRow(charge, true)).join("")
        : emptyState("Nenhuma cobrança neste mês", "Salve as regras dos alunos e gere o lote para registrar as cobranças.");
    }
    return;
  }
  if (target instanceof HTMLInputElement && target.matches("[data-dashboard-month]")) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(target.value)) return;
    dashboardSelectedMonth = target.value;
    renderScreen(currentScreen);
    return;
  }
  if (target instanceof HTMLSelectElement && target.matches("[data-student-charge-select]")) {
    const selectedCharge = monthlyCharges.find((item) =>
      item.id === target.value && studentCanSeeCharge(item, activeDemoAccount) && item.status === "aberta"
    );
    selectedStudentChargeId = selectedCharge ? selectedCharge.id : null;
    const charge = selectedCharge || null;
    const balanceCents = charge
      ? Math.max(0, charge.finalAmountCents - chargeConfirmedCents(charge))
      : null;
    const amountInput = document.querySelector("#cash-amount");
    if (amountInput) amountInput.value = balanceCents === null ? "150.00" : (balanceCents / 100).toFixed(2);
    const alreadySent = charge
      ? chargeHasPendingPayment(charge.id)
      : receiptPayments.some((payment) => payment.account === activeDemoAccount && !payment.chargeId);
    const fileInput = document.querySelector("[data-receipt-file]");
    const warning = document.querySelector("#duplicate-receipt-warning");
    const status = document.querySelector("#receipt-status");
    if (fileInput) fileInput.disabled = alreadySent;
    if (warning) warning.hidden = !alreadySent;
    if (status) status.textContent = alreadySent ? "Comprovante enviado; aguardando confirmação do professor." : "";
    updateReceiptComparison();
  }
});

function readRealBillingRuleForm(form) {
  const studentId = form.querySelector("#real-billing-student-id").value.trim();
  const startMonth = form.querySelector("#real-billing-start-month").value;
  const baseCents = parseRealBillingCents(form.querySelector("#real-billing-base").value);
  const dueDay = Number(form.querySelector("#real-billing-due-day").value);
  const discountType = form.querySelector("#real-billing-discount-type").value;
  const discountValue = form.querySelector("#real-billing-discount-value").value.trim();
  const percentValue = form.querySelector("#real-billing-discount-percent").value.trim();
  const durationType = form.querySelector("#real-billing-duration").value;
  const durationValue = form.querySelector("#real-billing-duration-months").value.trim();
  const reasonValue = form.querySelector("#real-billing-reason").value.trim();

  if (!realBillingStudentNames.has(studentId)) {
    return { errorMessage: "Selecione um aluno vinculado." };
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth)) {
    return { errorMessage: "Escolha o mês inicial da regra." };
  }
  if (baseCents === null || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    return { errorMessage: "Confira o valor-base e o dia de vencimento entre 1 e 28." };
  }
  if (discountType === "valor_fixo") {
    const discountCents = parseRealBillingCents(discountValue);
    if (discountCents === null) return { errorMessage: "Informe um desconto em reais válido, com até duas casas decimais." };
  }
  if (discountType === "percentual") {
    const percent = Number(percentValue.replace(",", "."));
    if (!/^\d+(?:[,.]\d{1,2})?$/.test(percentValue) || !Number.isFinite(percent) || percent < 0 || percent > 100) {
      return { errorMessage: "Informe um desconto percentual entre 0 e 100, com até duas casas decimais." };
    }
  }
  if (!["nenhum", "valor_fixo", "percentual", "isencao"].includes(discountType)) {
    return { errorMessage: "Escolha um tipo de desconto válido." };
  }
  if (discountType !== "isencao" && reasonValue) {
    return { errorMessage: "O motivo só pode ser informado quando a regra é uma isenção." };
  }
  if (Array.from(reasonValue).length > 200) {
    return { errorMessage: "O motivo da isenção deve ter no máximo 200 caracteres." };
  }
  const durationMonths = durationValue === "" ? null : Number(durationValue);
  if (!["este_mes", "n_meses", "ate_remover"].includes(durationType) ||
      (durationType === "n_meses" && (!Number.isInteger(durationMonths) || durationMonths < 1)) ||
      (durationType !== "n_meses" && durationMonths !== null)) {
    return { errorMessage: "Confira a duração da regra e o número de meses." };
  }

  const fixedDiscount = discountType === "valor_fixo"
    ? parseRealBillingCents(discountValue)
    : null;
  const percentageDiscount = discountType === "percentual"
    ? Number(percentValue.replace(",", "."))
    : null;
  return {
    p_aluno_id: studentId,
    p_valor_base_centavos: baseCents,
    p_dia_vencimento: dueDay,
    p_tipo_desconto: discountType,
    p_desconto_centavos: fixedDiscount,
    p_desconto_percentual: percentageDiscount,
    p_motivo_isencao: discountType === "isencao" ? reasonValue || null : null,
    p_duracao_tipo: durationType,
    p_mes_inicio: `${startMonth}-01`,
    p_duracao_meses: durationMonths
  };
}

async function callRealBillingRpc(functionName, parameters, failureMessage) {
  if (!authClient || !realUser || !isRealActiveProfessor()) {
    return { errorMessage: "Esta ação exige uma conta Google de Professor ativa." };
  }
  const { data, error } = await authClient.rpc(functionName, parameters);
  if (error) {
    logRealProfileSupabaseError(`executar ${functionName}`, error);
    return { errorMessage: failureMessage };
  }
  return { data };
}

async function callRealPaymentRpc(functionName, parameters, role, failureMessage) {
  const allowed = role === "student" ? isRealActiveStudent() : isRealActiveProfessor();
  if (!authClient || !realUser || !allowed) {
    return { errorMessage: "Esta ação exige uma conta ativa com a permissão necessária." };
  }
  try {
    const { data, error } = await authClient.rpc(functionName, parameters);
    if (error) {
      logRealProfileSupabaseError(`executar ${functionName}`, error);
      return { errorMessage: failureMessage };
    }
    return { data };
  } catch (error) {
    logRealProfileSupabaseError(`executar ${functionName}`, error);
    return { errorMessage: failureMessage };
  }
}

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target instanceof HTMLSelectElement && target.id === "real-graduation-student" &&
      currentScreen === "student-detail" && isRealActiveProfessor()) {
    if (realProfessorGraduationStudents.some((student) => student.id === target.value)) {
      realSelectedGraduationStudentId = target.value;
      screenContent.innerHTML = renderRealProfessorGraduationsScreen();
    }
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "real-graduation-belt" &&
      currentScreen === "student-detail" && isRealActiveProfessor()) {
    const form = target.closest("[data-real-graduation-form]");
    const degreeSelect = form && form.querySelector("#real-graduation-degree");
    if (!degreeSelect) return;
    const degrees = beltDegrees(demoBelts.indexOf(target.value));
    degreeSelect.innerHTML = `<option value="">${degrees.length ? "Selecione" : "Selecione a faixa"}</option>${degrees.map((degree) => `<option value="${degree}">${degree} ${degree === 1 ? "grau" : "graus"}</option>`).join("")}`;
    degreeSelect.disabled = degrees.length === 0;
    return;
  }
  if (target.matches("#real-student-charge")) {
    const charge = realStudentCharges.find((item) => item.id === target.value);
    const amount = document.querySelector("#real-student-payment-amount");
    if (charge && amount instanceof HTMLInputElement) {
      amount.max = realBillingCentsInput(realBillingBalance(charge, realStudentPayments));
    }
    return;
  }
  if (target.matches("#real-professor-charge")) {
    const charge = realProfessorCharges.find((item) => item.id === target.value);
    const amount = document.querySelector("#real-professor-payment-amount");
    if (charge && amount instanceof HTMLInputElement) {
      amount.max = realBillingCentsInput(realBillingBalance(charge, realProfessorPayments));
    }
    return;
  }
  if (!(target instanceof HTMLInputElement) || !target.matches("[data-real-billing-month]") ||
      !isRealActiveProfessor() || !/^\d{4}-(0[1-9]|1[0-2])$/.test(target.value)) return;
  realBillingSelectedMonth = target.value;
  loadRealBillingData();
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement)) return;
  const form = event.target;
  if (form.matches("[data-real-graduation-form]")) {
    event.preventDefault();
    const button = form.querySelector("[data-real-graduation-submit]");
    const failureMessage = "Não foi possível atribuir a graduação. Confira os dados e tente novamente.";
    runButtonAction(button, {
      feedback: form.querySelector("#real-graduation-error"),
      announcement: form.querySelector("#real-graduation-status"),
      buttons: [button, ...form.querySelectorAll("select, input, textarea")],
      loadingText: "Registrando...",
      loadingMessage: "Registrando a nova graduação.",
      successMessage: "Graduação registrada no histórico.",
      errorMessage: failureMessage,
      afterSuccess: () => loadRealProfessorGraduations()
    }, async () => {
      const student = realProfessorGraduationStudents.find((item) => item.id === realSelectedGraduationStudentId);
      const belt = form.querySelector("#real-graduation-belt").value;
      const degreeValue = form.querySelector("#real-graduation-degree").value;
      const degree = degreeValue === "" ? -1 : Number(degreeValue);
      const date = form.querySelector("#real-graduation-date").value;
      const observation = form.querySelector("#real-graduation-observation").value;
      const beltIndex = demoBelts.indexOf(belt);
      if (!student || !isRealActiveProfessor() || !beltDegrees(beltIndex).includes(degree)) {
        return { errorMessage: "Selecione um aluno vinculado e uma faixa e grau válidos." };
      }
      if (!isValidRealGraduationDate(date)) {
        return { errorMessage: "Informe uma data válida que não seja futura." };
      }
      if (observation.length > 200) {
        return { errorMessage: "A observação deve ter no máximo 200 caracteres." };
      }
      const result = await callRealBillingRpc("atribuir_graduacao", {
        p_aluno_id: student.id,
        p_faixa: belt,
        p_grau: degree,
        p_data_graduacao: date,
        p_observacao: observation || null
      }, failureMessage);
      if (result.errorMessage) return result;
      if (typeof result.data !== "string" || !result.data) return { errorMessage: failureMessage };
    });
    return;
  }
  if (form.matches("[data-real-student-payment-form]")) {
    event.preventDefault();
    const button = form.querySelector("[data-real-student-payment-submit]");
    runButtonAction(button, {
      feedback: form.querySelector("#real-student-payment-error"),
      announcement: form.querySelector("#real-student-payment-status"),
      buttons: [button],
      loadingText: "Enviando...",
      loadingMessage: "Registrando o aviso de pagamento.",
      successMessage: "Aviso registrado e aguardando confirmação do Professor.",
      errorMessage: "Não foi possível registrar. Confira o valor e o saldo.",
      afterSuccess: () => loadRealStudentPayments()
    }, async () => {
      const chargeId = form.querySelector("#real-student-charge").value;
      const charge = realStudentCharges.find((item) => item.id === chargeId);
      const amount = parseRealBillingCents(form.querySelector("#real-student-payment-amount").value);
      const type = form.querySelector("#real-student-payment-type").value;
      const balance = charge ? realBillingBalance(charge, realStudentPayments) : 0n;
      if (!charge || charge.status !== "aberta" || balance <= 0n ||
          realStudentPayments.some((payment) => payment.cobranca_id === chargeId && payment.status === "pendente")) {
        return { errorMessage: "Não foi possível registrar. Esta cobrança não está disponível para novo aviso." };
      }
      if (!amount || BigInt(amount) > balance || !["dinheiro", "comprovante"].includes(type)) {
        return { errorMessage: "Não foi possível registrar. Confira o valor e o saldo." };
      }
      const result = await callRealPaymentRpc("registrar_aviso_pagamento", {
        p_cobranca_id: chargeId,
        p_valor_centavos: amount,
        p_tipo: type
      }, "student", "Não foi possível registrar. Confira o valor e o saldo.");
      if (result.errorMessage) return result;
      if (typeof result.data !== "string" || !result.data) {
        return { errorMessage: "Não foi possível registrar. Confira o valor e o saldo." };
      }
    });
    return;
  }
  if (form.matches("[data-real-professor-payment-form]")) {
    event.preventDefault();
    const button = form.querySelector("[data-real-professor-payment-submit]");
    runButtonAction(button, {
      feedback: form.querySelector("#real-professor-payment-error"),
      announcement: form.querySelector("#real-professor-payment-status"),
      buttons: [button],
      loadingText: "Registrando...",
      loadingMessage: "Registrando o recebimento em dinheiro.",
      successMessage: "Recebimento lançado.",
      errorMessage: "Não foi possível lançar o pagamento. Confira o valor e o saldo.",
      afterSuccess: () => loadRealProfessorPaymentsData()
    }, async () => {
      const chargeId = form.querySelector("#real-professor-charge").value;
      const charge = realProfessorCharges.find((item) => item.id === chargeId);
      const amount = parseRealBillingCents(form.querySelector("#real-professor-payment-amount").value);
      const type = form.querySelector("#real-professor-payment-type").value.trim();
      const reference = form.querySelector("#real-professor-payment-reference").value.trim();
      const balance = charge ? realBillingBalance(charge, realProfessorPayments) : 0n;
      if (!charge || charge.status !== "aberta" || balance <= 0n || !type || type.length > 80 ||
          !reference || reference.length > 120 || !amount || BigInt(amount) > balance) {
        return { errorMessage: "Não foi possível lançar o pagamento. Confira o valor, o saldo, o tipo e a referência." };
      }
      const result = await callRealPaymentRpc("lancar_pagamento_professor", {
        p_cobranca_id: chargeId,
        p_valor_centavos: amount,
        p_tipo: type,
        p_referencia: reference
      }, "professor", "Não foi possível lançar o pagamento. Confira o valor e o saldo.");
      if (result.errorMessage) return result;
      if (typeof result.data !== "string" || !result.data) {
        return { errorMessage: "Não foi possível lançar o pagamento. Confira o valor e o saldo." };
      }
    });
    return;
  }
  if (form.matches("[data-real-billing-grace-form]")) {
    event.preventDefault();
    const button = form.querySelector("[data-real-billing-save-grace]");
    runButtonAction(button, {
      feedback: form.querySelector("#real-billing-grace-error"),
      announcement: form.querySelector("#real-billing-grace-status"),
      buttons: [button],
      loadingText: "Salvando...",
      loadingMessage: "Atualizando a carência da academia.",
      successMessage: "Carência atualizada.",
      errorMessage: "Não foi possível salvar a carência. Confira a permissão e tente novamente.",
      afterSuccess: () => loadRealBillingData()
    }, async () => {
      const days = Number(form.querySelector("#real-billing-grace-days").value);
      if (!Number.isInteger(days) || days < 0 || days > 30) {
        return { errorMessage: "Informe uma carência entre 0 e 30 dias." };
      }
      const result = await callRealBillingRpc("definir_carencia_cobranca", { p_dias: days },
        "Não foi possível salvar a carência. Confira a permissão e tente novamente.");
      if (result.errorMessage) return result;
      if (result.data !== true) return { errorMessage: "Não foi possível salvar a carência. Confira a permissão e tente novamente." };
    });
    return;
  }
  if (!form.matches("[data-real-billing-rule-form]")) return;
  event.preventDefault();
  const button = form.querySelector("[data-real-billing-save-rule]");
  runButtonAction(button, {
    feedback: form.querySelector("#real-billing-rule-error"),
    announcement: form.querySelector("#real-billing-rule-status"),
    buttons: [button],
    loadingText: "Salvando...",
    loadingMessage: "Salvando a regra de cobrança no banco.",
    successMessage: "Regra salva.",
    errorMessage: "Não foi possível salvar a regra. Confira os dados e tente novamente.",
    afterSuccess: () => loadRealBillingData()
  }, async () => {
    const parameters = readRealBillingRuleForm(form);
    if (parameters.errorMessage) return parameters;
    const result = await callRealBillingRpc("salvar_regra_cobranca", parameters,
      "Não foi possível salvar a regra. Confira o aluno, os dados e sua autorização.");
    if (result.errorMessage) return result;
    if (typeof result.data !== "string" || !result.data) {
      return { errorMessage: "Não foi possível salvar a regra. Confira o aluno, os dados e sua autorização." };
    }
  });
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches("[data-real-unregistered-message-form]")) return;
  event.preventDefault();
  const button = form.querySelector("[data-real-unregistered-copy]");
  runButtonAction(button, {
    feedback: form.querySelector("#real-unregistered-copy-error"),
    announcement: form.querySelector("#real-unregistered-copy-status"),
    buttons: [button],
    loadingText: "Copiando...",
    loadingMessage: "Preparando a mensagem.",
    successMessage: "Mensagem copiada. Ela não foi salva no app.",
    errorMessage: "Não foi possível copiar a mensagem. Confira os dados e tente novamente.",
    afterSuccess: () => form.reset()
  }, async () => {
    const student = realBillingUnregisteredStudents.find((item) =>
      item.id === form.querySelector("#real-unregistered-student").value
    );
    const amount = parseRealBillingCents(form.querySelector("#real-unregistered-amount").value);
    const dueDate = form.querySelector("#real-unregistered-due-date").value;
    if (!student) return { errorMessage: "Selecione um aluno sem conta." };
    if (amount === null || amount <= 0) return { errorMessage: "Informe um valor válido maior que zero." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { errorMessage: "Informe uma data de vencimento válida." };
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      return { errorMessage: "A área de transferência não está disponível. Tente novamente em um navegador compatível." };
    }
    const message = `Olá, ${student.nome}! Segue o lembrete da cobrança no valor de ${formatRealBillingCents(String(amount))}, com vencimento em ${realBillingDate(dueDate)}.`;
    await navigator.clipboard.writeText(message);
  });
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const retryAdminStudents = target.closest("[data-real-admin-students-retry]");
  if (retryAdminStudents) {
    runButtonAction(retryAdminStudents, {
      feedback: document.querySelector("#real-admin-students-retry-error"),
      announcement: document.querySelector("#real-admin-students-retry-status"),
      buttons: [retryAdminStudents],
      loadingText: "Carregando...",
      loadingMessage: "Atualizando a lista de alunos.",
      successMessage: "Lista de alunos atualizada.",
      errorMessage: "Não foi possível carregar os alunos. Tente novamente.",
      afterSuccess: () => { screenContent.innerHTML = renderRealAdminStudentsScreen(); }
    }, async () => {
      await loadRealAdminStudents(false);
      if (realAdminStudentsState === "error") return { errorMessage: realAdminStudentsNotice };
    });
    return;
  }

  const retryProfessorGraduations = target.closest("[data-real-professor-graduations-retry]");
  if (retryProfessorGraduations) {
    runButtonAction(retryProfessorGraduations, {
      feedback: document.querySelector("#real-professor-graduations-retry-error"),
      announcement: document.querySelector("#real-professor-graduations-retry-status"),
      buttons: [retryProfessorGraduations],
      loadingText: "Carregando...",
      loadingMessage: "Atualizando graduações dos alunos vinculados.",
      successMessage: "Graduações atualizadas.",
      errorMessage: "Não foi possível carregar graduações. Tente novamente.",
      afterSuccess: () => { screenContent.innerHTML = renderRealProfessorGraduationsScreen(); }
    }, async () => {
      await loadRealProfessorGraduations(false);
      if (realProfessorGraduationsState === "error") return { errorMessage: realProfessorGraduationsNotice };
    });
    return;
  }

  const retryStudentGraduations = target.closest("[data-real-student-graduations-retry]");
  if (retryStudentGraduations) {
    runButtonAction(retryStudentGraduations, {
      feedback: document.querySelector("#real-student-graduations-retry-error"),
      announcement: document.querySelector("#real-student-graduations-retry-status"),
      buttons: [retryStudentGraduations],
      loadingText: "Carregando...",
      loadingMessage: "Atualizando suas graduações.",
      successMessage: "Graduações atualizadas.",
      errorMessage: "Não foi possível carregar suas graduações. Tente novamente.",
      afterSuccess: () => { screenContent.innerHTML = renderRealStudentGraduationsScreen(); }
    }, async () => {
      await loadRealStudentGraduations(false);
      if (realStudentGraduationsState === "error") return { errorMessage: realStudentGraduationsNotice };
    });
    return;
  }

  const retryStudentPayments = target.closest("[data-real-student-payments-retry]");
  if (retryStudentPayments) {
    runButtonAction(retryStudentPayments, {
      feedback: document.querySelector("#real-student-retry-error"),
      announcement: document.querySelector("#real-student-retry-status"),
      buttons: [retryStudentPayments],
      loadingText: "Carregando...",
      loadingMessage: "Atualizando suas cobranças e pagamentos.",
      successMessage: "Informações atualizadas.",
      errorMessage: "Não foi possível carregar seus pagamentos. Tente novamente.",
      afterSuccess: () => { screenContent.innerHTML = renderRealStudentPaymentsScreen(); }
    }, async () => {
      await loadRealStudentPayments(false);
      if (realStudentPaymentsState === "error") return { errorMessage: realStudentPaymentsNotice };
    });
    return;
  }

  const retryProfessorPayments = target.closest("[data-real-professor-payments-retry]");
  if (retryProfessorPayments) {
    runButtonAction(retryProfessorPayments, {
      feedback: document.querySelector("#real-professor-retry-error"),
      announcement: document.querySelector("#real-professor-retry-status"),
      buttons: [retryProfessorPayments],
      loadingText: "Carregando...",
      loadingMessage: "Atualizando pagamentos e cobranças.",
      successMessage: "Informações atualizadas.",
      errorMessage: "Não foi possível carregar os pagamentos. Tente novamente.",
      afterSuccess: () => { screenContent.innerHTML = renderRealProfessorPaymentsScreen(); }
    }, async () => {
      await Promise.all([
        loadRealBillingStudents("payment-review", false),
        loadRealProfessorPaymentsData(false)
      ]);
      if (realProfessorPaymentsState === "error" || realBillingStudentsState === "error") {
        return { errorMessage: realProfessorPaymentsNotice || realBillingStudentsNotice };
      }
    });
    return;
  }

  const realPaymentAction = target.closest("[data-real-payment-action]");
  if (realPaymentAction) {
    const action = realPaymentAction.dataset.realPaymentAction;
    const paymentId = realPaymentAction.dataset.realPaymentId;
    const row = realPaymentAction.closest("[data-real-payment-row]");
    const confirmation = action === "rejeitar"
      ? "Rejeitar este aviso de pagamento?"
      : action === "estornar" ? "Estornar este pagamento confirmado?" : "";
    if (confirmation && !window.confirm(confirmation)) return;
    const isUndo = action === "desfazer";
    const failureMessage = action === "confirmar"
      ? "Não foi possível confirmar. Confira o saldo da cobrança."
      : action === "rejeitar"
        ? "Não foi possível rejeitar este aviso. Atualize os pagamentos e tente novamente."
        : action === "estornar"
          ? "Não foi possível estornar este pagamento. Atualize os pagamentos e tente novamente."
          : "Não foi possível desfazer este lançamento. O prazo pode ter terminado.";
    runButtonAction(realPaymentAction, {
      feedback: row.querySelector("[role='alert']"),
      announcement: row.querySelector("[role='status']"),
      buttons: Array.from(row.querySelectorAll("button")),
      loadingText: action === "desfazer" ? "Desfazendo..." : action === "estornar" ? "Estornando..." : action === "rejeitar" ? "Rejeitando..." : "Confirmando...",
      loadingMessage: "Atualizando o pagamento.",
      successMessage: action === "desfazer" ? "Lançamento desfeito." : action === "estornar" ? "Pagamento estornado." : action === "rejeitar" ? "Aviso rejeitado." : "Pagamento confirmado.",
      errorMessage: failureMessage,
      afterSuccess: () => loadRealProfessorPaymentsData()
    }, async () => {
      const result = await callRealPaymentRpc(
        isUndo ? "desfazer_lancamento_professor" : "decidir_pagamento",
        isUndo ? { p_pagamento_id: paymentId } : { p_pagamento_id: paymentId, p_acao: action },
        "professor",
        failureMessage
      );
      if (result.errorMessage) return result;
      if (result.data !== true) return { errorMessage: failureMessage };
    });
    return;
  }

  const editRuleButton = target.closest("[data-real-billing-edit-rule]");
  if (editRuleButton) {
    const rule = realBillingRules.find((item) => item.id === editRuleButton.dataset.realBillingEditRule);
    const form = document.querySelector("[data-real-billing-rule-form]");
    if (!rule || !form || !realBillingStudentNames.has(rule.aluno_id)) return;
    form.querySelector("#real-billing-student-id").value = rule.aluno_id;
    form.querySelector("#real-billing-start-month").value = rule.mes_inicio.slice(0, 7);
    form.querySelector("#real-billing-base").value = realBillingCentsInput(rule.valor_base_centavos);
    form.querySelector("#real-billing-due-day").value = rule.dia_vencimento;
    form.querySelector("#real-billing-discount-type").value = rule.tipo_desconto;
    form.querySelector("#real-billing-discount-value").value = rule.desconto_centavos === null
      ? "" : realBillingCentsInput(rule.desconto_centavos);
    form.querySelector("#real-billing-discount-percent").value = rule.desconto_percentual === null
      ? "" : String(rule.desconto_percentual).replace(".", ",");
    form.querySelector("#real-billing-duration").value = rule.duracao_tipo;
    form.querySelector("#real-billing-duration-months").value = rule.duracao_meses || "";
    form.querySelector("#real-billing-reason").value = rule.motivo_isencao || "";
    form.querySelector("#real-billing-student-id").focus();
    return;
  }

  const removeRuleButton = target.closest("[data-real-billing-remove-rule]");
  if (removeRuleButton) {
    const row = removeRuleButton.closest("[data-real-billing-rule]");
    const ruleId = removeRuleButton.dataset.realBillingRemoveRule;
    runButtonAction(removeRuleButton, {
      feedback: row.querySelector("[role='alert']"),
      announcement: row.querySelector("[role='status']"),
      buttons: Array.from(row.querySelectorAll("button")),
      loadingText: "Removendo...",
      loadingMessage: "Desativando a regra de cobrança.",
      successMessage: "Regra removida.",
      errorMessage: "Não foi possível remover a regra. Atualize a tela e tente novamente.",
      afterSuccess: () => loadRealBillingData()
    }, async () => {
      const result = await callRealBillingRpc("remover_regra_cobranca", { p_regra_id: ruleId },
        "Não foi possível remover a regra. Atualize a tela e tente novamente.");
      if (result.errorMessage) return result;
      if (result.data !== true) return { errorMessage: "A regra não está mais ativa ou não pode ser removida por esta conta." };
    });
    return;
  }

  const generateButton = target.closest("[data-real-billing-generate]");
  if (generateButton) {
    runButtonAction(generateButton, {
      feedback: document.querySelector("#real-billing-generate-error"),
      announcement: document.querySelector("#real-billing-generate-status"),
      buttons: [generateButton],
      loadingText: "Gerando...",
      loadingMessage: "Gerando as cobranças do mês.",
      successMessage: "Cobranças geradas.",
      errorMessage: "Não foi possível gerar as cobranças. Confira as regras e tente novamente.",
      afterSuccess: () => loadRealBillingData()
    }, async () => {
      const result = await callRealBillingRpc("gerar_cobrancas_mensais", {
        p_mes: `${realBillingSelectedMonth}-01`
      }, "Não foi possível gerar as cobranças. Confira as regras e tente novamente.");
      if (result.errorMessage) return result;
      if (!Number.isInteger(result.data) || result.data < 1) {
        return { errorMessage: "Nenhuma cobrança nova foi gerada. Confira as regras ativas e se o mês já foi gerado." };
      }
    });
    return;
  }

  const sendButton = target.closest("[data-real-billing-send]");
  if (sendButton) {
    const row = sendButton.closest("[data-real-monthly-charge]");
    const chargeId = sendButton.dataset.realBillingSend;
    runButtonAction(sendButton, {
      feedback: row.querySelector('[id^="real-send-error-"]'),
      announcement: row.querySelector('[id^="real-send-status-"]'),
      buttons: Array.from(row.querySelectorAll("button")),
      loadingText: "Enviando...",
      loadingMessage: "Registrando o envio da cobrança.",
      successMessage: "Cobrança disponibilizada ao aluno.",
      errorMessage: "Não foi possível enviar a cobrança. Atualize a tela e tente novamente.",
      afterSuccess: () => loadRealBillingData()
    }, async () => {
      const result = await callRealBillingRpc("enviar_cobranca", { p_cobranca_id: chargeId },
        "Não foi possível enviar a cobrança. Atualize a tela e tente novamente.");
      if (result.errorMessage) return result;
      const messages = {
        sem_permissao: "Sua conta não tem permissão para enviar esta cobrança.",
        cobranca_indisponivel: "A cobrança não está disponível nesta conta. Atualize a tela.",
        cobranca_fechada: "Somente cobranças abertas podem ser enviadas."
      };
      if (result.data !== "ok") {
        return { errorMessage: messages[result.data] || "Não foi possível enviar a cobrança. Atualize a tela e tente novamente." };
      }
    });
    return;
  }

  const cancelButton = target.closest("[data-real-billing-cancel]");
  if (!cancelButton) return;
  const row = cancelButton.closest("[data-real-monthly-charge]");
  const charge = realBillingCharges.find((item) => item.id === cancelButton.dataset.realBillingCancel);
  if (!charge || charge.status !== "aberta" ||
      !window.confirm("Cancelar esta cobrança aberta? Ela continuará no histórico do Professor.")) return;
  runButtonAction(cancelButton, {
    feedback: row.querySelector('[id^="real-cancel-error-"]'),
    announcement: row.querySelector('[id^="real-cancel-status-"]'),
    buttons: Array.from(row.querySelectorAll("button")),
    loadingText: "Cancelando...",
    loadingMessage: "Cancelando a cobrança.",
    successMessage: "Cobrança cancelada.",
    errorMessage: "Não foi possível cancelar a cobrança. Ela pode ter pagamentos ativos ou já estar fechada.",
    afterSuccess: () => loadRealBillingData()
  }, async () => {
    const result = await callRealBillingRpc("cancelar_cobranca", { p_cobranca_id: charge.id },
      "Não foi possível cancelar a cobrança. Ela pode ter pagamentos ativos ou já estar fechada.");
    if (result.errorMessage) return result;
    if (result.data !== true) {
      return { errorMessage: "Não foi possível cancelar a cobrança. Ela pode ter pagamentos ativos ou já estar fechada." };
    }
  });
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-billing-form]")) return;
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector("[data-save-billing-settings]");
  const generateButton = form.querySelector("[data-generate-monthly-charges]");
  runButtonAction(button, {
    feedback: form.querySelector("#billing-settings-error"),
    announcement: form.querySelector("#billing-settings-status"),
    buttons: [button, generateButton],
    loadingText: "Salvando...",
    loadingMessage: "Salvando regras de cobrança fictícias.",
    successMessage: "Regras e carência salvas nesta demonstração.",
    errorMessage: "Não foi possível salvar as regras. Tente novamente.",
    afterSuccess: () => {
      renderScreen("monthly-charges");
      showToast("Regras e carência salvas nesta demonstração.");
    }
  }, async () => {
    if (activeRole !== "professor") return { errorMessage: "Somente o Professor pode configurar cobranças." };
    const parsed = readBillingForm(form);
    if (parsed.errorMessage) return parsed;
    if (new URLSearchParams(window.location.search).get("erro-simulado") === "professor-cobranca-salvar") {
      throw new Error("Falha simulada ao salvar regras de cobrança.");
    }
    updateDemoPayments(() => {
      const otherSettings = billingSettings.filter((setting) => setting.professorAccount !== activeDemoAccount);
      billingSettings.splice(0, billingSettings.length, ...otherSettings, ...parsed.settings);
      billingGraceDaysByProfessor.set(activeDemoAccount, parsed.graceDays);
    });
  });
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const actionButton = target.closest("[data-send-monthly-charge], [data-copy-monthly-charge]");
  if (actionButton) {
    const row = actionButton.closest("[data-monthly-charge]");
    const isSend = actionButton.hasAttribute("data-send-monthly-charge");
    const chargeId = isSend ? actionButton.dataset.sendMonthlyCharge : actionButton.dataset.copyMonthlyCharge;
    const charge = monthlyCharges.find((item) => item.id === chargeId && item.professorAccount === activeDemoAccount);
    const actionName = isSend ? "send" : "copy";
    runButtonAction(actionButton, {
      feedback: row.querySelector(`[data-${actionName}-charge-error]`),
      announcement: row.querySelector(`[data-${actionName}-charge-status]`),
      buttons: Array.from(row.querySelectorAll("button")),
      loadingText: isSend ? "Enviando..." : "Copiando...",
      loadingMessage: isSend ? "Disponibilizando cobrança nesta demonstração." : "Copiando mensagem.",
      successMessage: isSend ? "Cobrança disponibilizada nesta demonstração." : "Mensagem copiada.",
      errorMessage: isSend ? "Não foi possível enviar a cobrança. Tente novamente." : "Não foi possível copiar. Confira a permissão da área de transferência e tente novamente.",
      afterSuccess: isSend ? () => renderScreen("monthly-charges") : undefined
    }, async () => {
      if (activeRole !== "professor" || !charge || charge.professorAccount !== activeDemoAccount || charge.status !== "aberta") {
        return { errorMessage: "Esta cobrança não está mais disponível. Atualize a tela e tente novamente." };
      }
      if (isSend) {
        updateDemoPayments(() => {
          if (charge.sentOn) charge.resentOn = demoTodayIsoDate();
          else charge.sentOn = demoTodayIsoDate();
        });
      } else {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
          return { errorMessage: "A área de transferência não está disponível. Tente novamente em um navegador compatível." };
        }
        await navigator.clipboard.writeText(monthlyChargeMessage(charge));
      }
    });
    return;
  }
  const generateButton = target.closest("[data-generate-monthly-charges]");
  if (generateButton) {
    const form = generateButton.closest("[data-billing-form]");
    const saveButton = form.querySelector("[data-save-billing-settings]");
    runButtonAction(generateButton, {
      feedback: form.querySelector("#billing-generate-error"),
      announcement: form.querySelector("#billing-generate-status"),
      buttons: [generateButton, saveButton],
      loadingText: "Gerando...",
      loadingMessage: "Registrando cobranças do mês.",
      successMessage: "Cobranças geradas nesta demonstração.",
      errorMessage: "Não foi possível gerar as cobranças. Tente novamente.",
      afterSuccess: () => {
        renderScreen("monthly-charges");
        showToast("Cobranças geradas nesta demonstração.");
      }
    }, async () => {
      if (activeRole !== "professor") return { errorMessage: "Somente o Professor pode gerar cobranças." };
      const parsed = readBillingForm(form);
      if (parsed.errorMessage) return parsed;
      if (parsed.selectedStudentKeys.length > 24) return { errorMessage: "Selecione no máximo 24 alunos por lote." };
      if (!parsed.selectedStudentKeys.length) return { errorMessage: "Selecione ao menos um aluno configurado." };
      if (new URLSearchParams(window.location.search).get("erro-simulado") === "professor-cobranca-lote") {
        throw new Error("Falha simulada ao gerar cobranças.");
      }

      const selectedSettings = parsed.selectedStudentKeys.map((studentKey) =>
        parsed.settings.find((setting) => setting.studentKey === studentKey)
      );
      if (selectedSettings.some((setting) => !setting)) {
        return { errorMessage: "Salve um valor-base e vencimento válidos para cada aluno selecionado." };
      }
      const selectedStudents = parsed.selectedStudentKeys.map((studentKey) => demoRoster[Number(studentKey)]);
      if (selectedStudents.some((student) => !student || student.teacherAccount !== activeDemoAccount || student.status === "locked")) {
        return { errorMessage: "Um aluno selecionado não está disponível nesta turma." };
      }
      if (parsed.selectedStudentKeys.some((studentKey) => monthlyCharges.some((charge) =>
        charge.studentKey === studentKey && charge.professorAccount === activeDemoAccount && charge.month === parsed.month
      ))) {
        return { errorMessage: "Uma ou mais cobranças já foram geradas para este mês." };
      }

      const charges = selectedStudents.map((student, index) => {
        const setting = selectedSettings[index];
        const amounts = billingAmountsFor(setting, parsed.month);
        return {
          id: `monthly-charge-${Date.now()}-${index}`,
          studentKey: setting.studentKey,
          studentAccount: student.account,
          studentName: student.name,
          professorAccount: activeDemoAccount,
          month: parsed.month,
          dueDate: `${parsed.month}-${String(setting.dueDay).padStart(2, "0")}`,
          ...amounts
        };
      });
      updateDemoPayments(() => {
        const otherSettings = billingSettings.filter((setting) => setting.professorAccount !== activeDemoAccount);
        billingSettings.splice(0, billingSettings.length, ...otherSettings, ...parsed.settings);
        billingGraceDaysByProfessor.set(activeDemoAccount, parsed.graceDays);
        monthlyCharges.push(...charges);
      });
    });
    return;
  }

  const cancelChargeButton = target.closest("[data-cancel-monthly-charge]");
  if (!cancelChargeButton) return;
  const chargeRow = cancelChargeButton.closest("[data-monthly-charge]");
  const chargeId = cancelChargeButton.dataset.cancelMonthlyCharge;
  const charge = monthlyCharges.find((item) =>
    item.id === chargeId && item.professorAccount === activeDemoAccount
  );
  if (activeRole !== "professor" || !charge || charge.status !== "aberta") return;
  if (!chargeHasActivePayment(charge.id) &&
      !window.confirm(`Cancelar a cobrança de ${charge.studentName} referente a ${charge.month}? Ela continuará no histórico e sairá dos indicadores.`)) {
    return;
  }
  runButtonAction(cancelChargeButton, {
    feedback: chargeRow.querySelector("[data-cancel-charge-error]"),
    announcement: chargeRow.querySelector("[data-cancel-charge-status]"),
    buttons: [cancelChargeButton],
    loadingText: "Cancelando...",
    loadingMessage: "Cancelando a cobrança fictícia.",
    successMessage: "Cobrança cancelada; o registro continua no histórico.",
    errorMessage: "Não foi possível cancelar a cobrança. Tente novamente.",
    afterSuccess: () => {
      renderScreen("monthly-charges");
      showToast("Cobrança cancelada; o registro continua no histórico.");
    }
  }, async () => {
    const currentCharge = monthlyCharges.find((item) =>
      item.id === chargeId && item.professorAccount === activeDemoAccount
    );
    if (activeRole !== "professor" || !currentCharge || currentCharge.status !== "aberta") {
      return { errorMessage: "Esta cobrança não está mais aberta. Atualize a tela e tente novamente." };
    }
    if (chargeHasActivePayment(currentCharge.id)) {
      return { errorMessage: "Rejeite os avisos pendentes ou estorne os pagamentos antes de cancelar esta cobrança." };
    }
    updateDemoPayments(() => { currentCharge.status = "cancelada"; });
  });
});
