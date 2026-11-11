"use strict";

const APP_VERSION = "5.24";
const DEFAULT_PERSON_AVATAR_SRC = "assets/avatars/avatar-masculino.jpg";
const FEMALE_PERSON_AVATAR_SRC = "assets/avatars/avatar-feminino.jpg";
const REAL_PERSON_AVATARS = {
  masculino: DEFAULT_PERSON_AVATAR_SRC,
  feminino: FEMALE_PERSON_AVATAR_SRC
};
const REAL_PAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
const REAL_PAYMENT_PROOF_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
document.body.dataset.appMode = "real";
const CONSENT_TERM_VERSION = "rascunho-1";
const realSignupNameSessionKey = "tatame-real-signup-name";
const diagnosticEvents = [];

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
      ["link-teacher", "Vincular a um professor", "⌁"],
      ["no-access", "Aguardando liberação", "◷"],
      ["instructor-invite", "Convite de instrutor", "◇"]
    ]
  },
  {
    title: "Treino",
    roles: ["instructor"],
    items: [
      ["instructor-class", "Aula delegada", "▣"],
      ["instructor-students", "Alunos vinculados", "♧"]
    ]
  },
  {
    title: "Início",
    roles: ["adm"],
    items: [["admin-home", "Painel do Adm", "▦"]]
  },
  {
    title: "Início",
    roles: ["student", "instructor", "professor"],
    items: [["home", "Início", "⌂"]]
  },
  {
    title: "Vínculo",
    roles: ["student"],
    items: [["link-teacher", "Vincular a um Professor", "⌁"]]
  },
  {
    title: "Minha conta de aluno",
    roles: ["student", "instructor"],
    items: [
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
    title: "Treino",
    roles: ["student", "professor", "instructor"],
    items: [["training-board", "Mural e grade", "▤"]]
  },
  {
    title: "Planejamento",
    roles: ["professor", "instructor"],
    items: [["training-plan", "Plano semanal", "▦"]]
  },
  {
    title: "Acompanhamento",
    roles: ["student"],
    items: [["student-progress", "Feedbacks e metas", "◇"]]
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
  professor: ["home", "students", "student-detail", "teacher-code", "role-management", "payment-review", "monthly-charges", "teacher-chat", "training-board", "training-plan", "academy", "user-settings", "privacy"],
  instructor: ["home", "student-payments", "student-grades", "instructor-class", "instructor-chat", "training-board", "training-plan", "academy", "user-settings", "privacy"],
  student: ["home", "student-payments", "student-grades", "student-chat", "student-progress", "training-board", "link-teacher", "academy", "user-settings", "privacy"]
};
const beltOrder = ["Branca", "Azul", "Roxa", "Marrom", "Preta", "Coral vermelha e preta", "Coral vermelha e branca", "Vermelha"];
const tutorialStepsByRole = {
  adm: [
    ["admin-home", "Painel do Adm", "Consulte os indicadores e selecione um cartão para abrir academias, Professores, alunos ou convites."],
    ["teacher-invites", "Professores convidados", "Gerencie convites de Professor e acompanhe os convites existentes."],
    ["academy", "Academias", "Consulte e administre academias e os vínculos de Professores conforme sua permissão."]
  ],
  professor: [
    ["home", "Início", "Acompanhe pagamentos a confirmar, cobranças atrasadas e atalhos para as tarefas mais usadas."],
    ["payment-review", "Pagamentos a confirmar", "Revise avisos de pagamento, consulte comprovantes e confirme ou rejeite recebimentos. Também pode lançar manualmente um recebimento."],
    ["monthly-charges", "Cobranças mensais", "Configure regras de cobrança; os campos de desconto e duração aparecem conforme a opção escolhida. Acompanhe cobranças e filtre as atrasadas."]
  ],
  instrutor: [
    ["home", "Início", "Confira a aula delegada para hoje, quando houver, e acesse o treino compartilhado e os alunos vinculados."],
    ["instructor-class", "Treino compartilhado", "Consulte a aula compartilhada pelo Professor e registre se seguiu a orientação."],
    ["instructor-students", "Alunos vinculados", "Consulte somente os nomes e a faixa/grau atuais dos alunos vinculados ao seu Professor."]
  ],
  aluno: [
    ["home", "Início", "Consulte a situação das cobranças do mês e os atalhos para pagamentos, graduações e conversa."],
    ["student-payments", "Meus pagamentos", "Consulte cobranças enviadas e avise um pagamento; o comprovante é opcional."],
    ["student-grades", "Minhas graduações", "Acompanhe sua faixa atual e o histórico registrado pelo Professor."]
  ]
};
const tutorialIllustrations = [
  '<svg viewBox="0 0 96 72" aria-hidden="true"><rect x="14" y="12" width="68" height="48" rx="8" fill="none" stroke="currentColor" stroke-width="4"/><path d="M25 28h46M25 39h30M25 50h20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="4"/></svg>',
  '<svg viewBox="0 0 96 72" aria-hidden="true"><circle cx="34" cy="27" r="11" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="64" cy="27" r="11" fill="none" stroke="currentColor" stroke-width="4"/><path d="M14 59c2-12 10-18 20-18s18 6 20 18M44 59c2-12 10-18 20-18s18 6 20 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="4"/></svg>',
  '<svg viewBox="0 0 96 72" aria-hidden="true"><path d="M48 9 78 20v17c0 15-12 25-30 31C30 62 18 52 18 37V20z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"/><path d="m34 36 9 9 19-20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/></svg>'
];
let tutorialStepIndex = 0;
let tutorialReturnFocus = null;
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
let realPaymentAcademyName = "";
let realPaymentAcademyPhotoUrl = "";
let realBillingState = "idle";
let realBillingNotice = "";
let realBillingRequestSequence = 0;
let realBillingSelectedMonth = realGraduationToday().slice(0, 7);
let realBillingLateOnly = false;
let realStudentPayments = [];
let realStudentCharges = [];
let realStudentPaymentProofs = new Map();
let realPaymentProofsNotice = "";
let realStudentPaymentsState = "idle";
let realStudentPaymentsNotice = "";
let realStudentPaymentsRequestSequence = 0;
let realProfessorPayments = [];
let realProfessorCharges = [];
let realProfessorPaymentProofs = new Map();
let realProfessorPaymentsState = "idle";
let realProfessorPaymentsNotice = "";
let realProfessorPaymentsRequestSequence = 0;
let realProofCleanupRunning = false;
let realProofCleanupNotice = "";
let realProfessorGraduationStudents = [];
let realProfessorGraduations = [];
let realProfessorGraduationsState = "idle";
let realProfessorGraduationsNotice = "";
let realProfessorGraduationsRequestSequence = 0;
let realSelectedGraduationStudentId = "";
const REAL_PROFILE_PHOTO_MAX_CONCURRENT = 20;
const realLinkedProfilePhotoQueue = [];
let realLinkedProfilePhotoRequestsInFlight = 0;
let realStudentGraduations = [];
let realStudentGraduationsState = "idle";
let realStudentGraduationsNotice = "";
let realStudentGraduationsRequestSequence = 0;
let realStudentGraduationsOwnerId = "";
let realPaymentUndoTimer = null;
let realPaymentReceiptChargeId = "";
let realProofViewerWindow = null;
let realProfessorMetricsMonth = realGraduationToday().slice(0, 7);
let realCreatedAcademyId = null;
let realCreatedAcademy = null;
let realAdminAcademies = [];
let realAcademyPhotoUrls = new Map();
let realAdminProfessorPhotoUrls = new Map();
let realAvatarChoiceByProfile = new Map();
let realAvatarChoiceOwnerId = "";
let realAvatarChoiceState = "idle";
let realProfessorAcademy = null;
let realProfessorAcademyPhotoUrl = "";
let realOwnProfessorPhotoUrl = "";
let realOwnProfessorPhotoPath = "";
let realOwnProfilePhotoPath = "";
let realProfessorPhotoNotice = "";
let realProfessorAcademyState = "idle";
let realProfessorAcademyNotice = "";
let realProfessorAcademyRequestSequence = 0;
let realAdminStudents = [];
let realAdminStudentsState = "idle";
let realAdminStudentsNotice = "";
let realAdminStudentsRequestSequence = 0;
let realAdminDashboardAcademies = [];
let realAdminDashboardProfessors = [];
let realAdminDashboardStudents = 0;
let realAdminDashboardPendingInvites = 0;
let realAdminDashboardState = "idle";
let realAdminDashboardNotice = "";
let realAdminDashboardRequestSequence = 0;
let realHomeState = "idle";
let realHomeNotice = "";
let realHomeData = null;
let realHomeRequestSequence = 0;
let realHomeProfileContext = { academyName: "", academyPhotoUrl: "", professor: null, ownPhotoUrl: "" };
let realHomeProfileRequestSequence = 0;
let authClient = null;
let authCheckSequence = 0;
let realSessionCacheGeneration = 0;
let loginNotice = "";
let realSignoutInProgress = false;
let realPasswordRecoveryPending = false;
let realEmailAuthRequestInProgress = false;
let currentScreen = "";

function realPersonAvatarSrc(profileId) {
  const choice = profileId && realAvatarChoiceByProfile.get(profileId);
  return REAL_PERSON_AVATARS[choice] || DEFAULT_PERSON_AVATAR_SRC;
}

function isMissingAvatarChoiceColumn(error) {
  const code = error && typeof error.code === "string" ? error.code : "";
  const message = error && typeof error.message === "string" ? error.message : "";
  return code === "42703" || /avatar_escolhido/i.test(message);
}

function updateRealAvatarFallbacks(profileId) {
  if (!profileId) return;
  const src = realPersonAvatarSrc(profileId);
  document.querySelectorAll("[data-avatar-choice-profile-id][data-avatar-fallback='true']")
    .forEach((image) => {
      if (image.dataset.avatarChoiceProfileId === profileId) image.src = src;
    });
}

function renderRealAvatarChoiceControls(profileId) {
  const state = realAvatarChoiceOwnerId === profileId ? realAvatarChoiceState : "loading";
  const choice = REAL_PERSON_AVATARS[realAvatarChoiceByProfile.get(profileId)]
    ? realAvatarChoiceByProfile.get(profileId)
    : "masculino";
  const enabled = state === "ready";
  const disabled = enabled ? "" : " disabled";
  const statusText = state === "loading"
    ? "Carregando a preferência de avatar..."
    : state === "unavailable"
      ? "A escolha ficará disponível após a atualização do banco. Mantivemos o avatar masculino."
      : state === "error"
        ? "Não foi possível carregar a preferência. Mantivemos o avatar masculino; tente novamente mais tarde."
        : "";
  return `
    <fieldset class="avatar-choice-options"${enabled ? "" : " disabled"}>
      <legend>Avatar quando não houver foto</legend>
      <label class="avatar-choice-option">
        <input type="radio" name="real-avatar-choice" value="masculino"${choice === "masculino" ? " checked" : ""}${disabled}>
        <img src="${DEFAULT_PERSON_AVATAR_SRC}" alt="">
        <span>Masculino</span>
      </label>
      <label class="avatar-choice-option">
        <input type="radio" name="real-avatar-choice" value="feminino"${choice === "feminino" ? " checked" : ""}${disabled}>
        <img src="${FEMALE_PERSON_AVATAR_SRC}" alt="">
        <span>Feminino</span>
      </label>
    </fieldset>
    <div class="student-action-control">
      <button class="button button--quiet button--action" type="button" data-real-avatar-choice-save${disabled} aria-describedby="real-avatar-choice-error real-avatar-choice-status">
        <span data-action-label>Salvar avatar</span>
      </button>
      <p class="login-action-error student-action-error" id="real-avatar-choice-error" role="alert"></p>
      <p class="field-help" id="real-avatar-choice-status" role="status" aria-live="polite">${escapeHtml(statusText)}</p>
    </div>`;
}

async function loadRealAvatarPreferences(profileIds) {
  const ids = [...new Set(profileIds.filter((id) => typeof id === "string" && id))];
  if (!ids.length || !authClient) return "error";
  const sessionGeneration = realSessionCacheGeneration;
  try {
    const { data, error } = await authClient.from("perfis")
      .select("id,avatar_escolhido").in("id", ids);
    if (sessionGeneration !== realSessionCacheGeneration) return "error";
    if (error) {
      ids.forEach((id) => {
        realAvatarChoiceByProfile.set(id, "masculino");
        updateRealAvatarFallbacks(id);
      });
      if (isMissingAvatarChoiceColumn(error)) return "unavailable";
      logRealProfileSupabaseError("consultar preferência de avatar", error);
      return "error";
    }
    ids.forEach((id) => {
      realAvatarChoiceByProfile.set(id, "masculino");
      updateRealAvatarFallbacks(id);
    });
    (Array.isArray(data) ? data : []).forEach((profile) => {
      if (profile && ids.includes(profile.id) &&
          Object.prototype.hasOwnProperty.call(REAL_PERSON_AVATARS, profile.avatar_escolhido)) {
        realAvatarChoiceByProfile.set(profile.id, profile.avatar_escolhido);
        updateRealAvatarFallbacks(profile.id);
      }
    });
    return "ready";
  } catch (error) {
    if (sessionGeneration === realSessionCacheGeneration) {
      ids.forEach((id) => realAvatarChoiceByProfile.set(id, "masculino"));
      logRealProfileSupabaseError("consultar preferência de avatar", error);
    }
    return "error";
  }
}

function ensureRealAvatarChoiceLoaded() {
  if (!authClient || !realUser || !realProfile || realProfile.id !== realUser.id) return;
  if (realAvatarChoiceOwnerId === realUser.id && realAvatarChoiceState !== "idle") return;
  const userId = realUser.id;
  const sessionGeneration = realSessionCacheGeneration;
  realAvatarChoiceOwnerId = userId;
  realAvatarChoiceState = "loading";
  void loadRealAvatarPreferences([userId]).then((state) => {
    if (sessionGeneration !== realSessionCacheGeneration ||
        !realUser || realUser.id !== userId) return;
    realAvatarChoiceState = state;
    updateRealAvatarFallbacks(userId);
    void loadRealUserPanelMedia();
    const controls = screenContent.querySelector("[data-real-avatar-choice-controls]");
    if (controls && currentScreen === "user-settings") {
      controls.innerHTML = renderRealAvatarChoiceControls(userId);
    }
  });
}

const navigation = document.querySelector("#screen-navigation");
const screenContent = document.querySelector("#screen-content");
const currentTitle = document.querySelector("#current-screen-title");
const sidebar = document.querySelector("#app-sidebar");
const sidebarBackdrop = document.querySelector("#sidebar-backdrop");
const menuButton = document.querySelector("#mobile-menu-button");
let mobileSidebarTrigger = menuButton;
const toastRegion = document.querySelector("#toast-region");
const privacyDialog = document.querySelector("#privacy-modal");
const termsDialog = document.querySelector("#terms-modal");
const tutorialDialog = document.querySelector("#tutorial-modal");
const profileOnboardingDialog = document.querySelector("#profile-onboarding");
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
  login: "login", home: "home", "link-teacher": "link", "no-access": "clock",
  "instructor-invite": "invite",
  "student-payments": "payment", "student-grades": "grade", "student-chat": "message",
  "training-board": "grade", "training-plan": "lesson", "student-progress": "grade",
  students: "people", "student-detail": "profile",
  "teacher-code": "link", "role-management": "shield",
  "payment-review": "payment", "monthly-charges": "payment",
  "teacher-chat": "message", "instructor-class": "lesson",
  "instructor-students": "people",
  "instructor-chat": "message", "admin-home": "home", "teacher-invites": "people",
  "admin-students": "people",
  academy: "academy", "user-settings": "settings", privacy: "shield"
};
const mobileNavigationLabels = {
  login: "Entrar", home: "Início", "link-teacher": "Vincular",
  "student-payments": "Pagamentos",
  "student-grades": "Graduações", "student-chat": "Conversa", students: "Alunos",
  "student-detail": "Ficha", "teacher-code": "Código", "instructor-class": "Aula",
  "instructor-students": "Alunos vinculados", "training-board": "Mural", "training-plan": "Plano semanal",
  "student-progress": "Metas",
  "admin-home": "Painel", "admin-students": "Alunos", "teacher-invites": "Convites", "role-management": "Papéis",
  "monthly-charges": "Cobranças",
  academy: "Academia"
};
navigationIconByScreen.more = "actions";

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
      : navigationGroups.filter((group) => group.roles.includes("public"));
  const orderedGroups = [...visibleGroups].sort((left, right) =>
    Number(right.title === "Início") - Number(left.title === "Início")
  );
  navigation.innerHTML = orderedGroups.map((group) => ({
    ...group,
    items: group.items.filter(([id]) =>
      canViewScreen(id) &&
      !(id === "link-teacher" && isRealActiveStudent() && realHomeData && realHomeData.hasLink)
    )
  })).filter((group) => group.items.length > 0).map((group) => `
    <section class="nav-group" aria-label="${group.title}">
      <h2 class="nav-group-title">${isRealStudentInstructor && group.title === "Treino" ? "Instrutor" : group.title}</h2>
      ${group.items.map(([id, title]) => `
        <button class="nav-item" type="button" data-screen-target="${id}">
          <span class="nav-icon">${navigationIcon(id)}</span>
          <span>${isRealProfessorProfile() && id === "role-management" ? "Aula delegada" : title}</span>
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
  const isUnlinkedStudent = isRealActiveStudent() && realHomeData && realHomeData.hasLink === false;
  const items = isRealAdmSession()
      ? ["admin-home", "admin-students", "teacher-invites", "role-management"]
          .filter(canViewScreen)
      : isRealProfessorProfile()
        ? ["home", "payment-review", "monthly-charges", "students"]
            .filter(canViewScreen)
      : isRealStudentInstructor
          ? ["home", "link-teacher", "student-payments", "instructor-class"].filter(canViewScreen)
        : isRealActiveStudent()
          ? ["home", "student-payments", "student-grades", isUnlinkedStudent ? "link-teacher" : "student-chat"]
              .filter(canViewScreen)
        : isRealActiveInstructor()
          ? ["home", "instructor-class", "instructor-students", "training-plan"].filter(canViewScreen)
          : ["login", "instructor-invite"].filter(canViewScreen);
  mobileNavigation.style.setProperty("--mobile-nav-items", items.length + 1);
  mobileNavigation.innerHTML = `${items.map((id) => {
    const info = screenInfo[id] || { title: id, group: "" };
    const label = id === "instructor-students" && isRealStudentInstructor
      ? "Instrutor"
      : mobileNavigationLabels[id] || info.title;
    return `<button type="button" data-screen-target="${id}" aria-label="${info.title}"><span class="mobile-nav-icon">${navigationIcon(id)}</span><span class="mobile-nav-label">${label}</span></button>`;
  }).join("")}<button type="button" data-open-sidebar aria-controls="app-sidebar" aria-expanded="false" aria-label="Abrir navegação completa"><span class="mobile-nav-icon">${navigationIcon("more")}</span><span class="mobile-nav-label">Mais</span></button>`;
  updateToastPosition();
}

function canViewScreen(id) {
  if (realPasswordRecoveryPending) return id === "password-recovery";
  if (id === "real-account") return Boolean(realUser);
  if (!realUser) {
    return id === "login" ||
      id === "create-account" ||
      id === "forgot-password" ||
      (id === "instructor-invite" && Boolean(realInstructorInviteToken));
  }
  if (id === "home") return isRealActiveProfessor() || isRealActiveStudent() || isRealActiveInstructor();
  return id === "user-settings" ||
    (id === "link-teacher" && isRealActiveStudent()) ||
    ["no-access", "instructor-invite"].includes(id) ||
    (isRealAdmSession() && ["admin-home", "academy", "teacher-invites", "role-management", "admin-students"].includes(id)) ||
    (isRealProfessorProfile() && id === "teacher-code") ||
    (isRealActiveProfessor() && id === "academy") ||
    (isRealActiveProfessor() && ["home", "monthly-charges", "payment-review", "student-detail", "students", "teacher-chat", "role-management", "training-board", "training-plan"].includes(id)) ||
    (isRealActiveStudent() && ["home", "student-payments", "student-grades", "student-chat", "student-progress", "training-board"].includes(id)) ||
    (isRealActiveInstructor() && ["home", "instructor-students", "instructor-class", "instructor-chat", "training-board", "training-plan"].includes(id));
}

function isRealStudentProfileCreationFlow() {
  return Boolean(realUser) && realProfileState === "missing" &&
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
      ? "Ao continuar, seu consentimento será registrado no banco, associado à versão deste termo e à data e hora do aceite. Leia a política de privacidade antes de continuar."
      : isStudentProfileFlow
        ? "Ao aceitar, será criado seu perfil de Aluno e registrado o consentimento com o identificador do perfil, a versão deste termo e a data e hora do aceite. Leia a política de privacidade antes de continuar."
        : role === "aluno"
          ? "Para este perfil já existente, esta tela não registra uma nova resposta. Leia a política de privacidade antes de continuar."
        : "Se você aceitar um convite de Instrutor, o registro ocorrerá após o convite ser consumido. Leia a política de privacidade antes de continuar.";
    content.innerHTML = `
      <p id="profile-onboarding-copy" class="profile-onboarding-copy">${consentCopy}</p>
      <div class="profile-onboarding-links">
        <button class="link-simples-modal" type="button" data-open-privacy>Ler política</button>
      </div>
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

async function checkRealConsentAccepted() {
  if (!authClient || !realUser) return false;
  try {
    const { data, error } = await authClient.rpc("consentimento_atual_aceito", {
      p_versao: CONSENT_TERM_VERSION
    });
    if (error) {
      recordDiagnostic("Erro ao consultar consentimento");
      return false;
    }
    return data === true;
  } catch {
    recordDiagnostic("Erro ao consultar consentimento");
    return false;
  }
}

async function maybeOpenRealProfileOnboarding() {
  if (!realUser) return;
  const userId = realUser.id;
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
  if (role === "professor") {
    realOnboardingHandledSessionUserId = userId;
    if (await checkRealConsentAccepted()) return;
    if (!realUser || realUser.id !== userId) return;
  } else {
    realOnboardingHandledSessionUserId = userId;
  }
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
    if (!realUser || realUser.id !== userId) return "erro";

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

function panel(title, body, extraClass = "") {
  return `
    <section class="panel-card ${extraClass}">
      <div class="panel-heading"><h3>${title}</h3></div>
      ${body}
    </section>
  `;
}

function metric(label, value, note, tone = "", target = "") {
  const tag = target ? "button" : "article";
  return `
    <${tag} class="metric-card ${tone ? `metric-card--${tone}` : ""}${target ? " metric-card--link" : ""}"${target ? ` type="button" data-screen-target="${target}"` : ""}>
      <span class="metric-label">${label}</span>
      <strong class="metric-value">${value}</strong>
      <span class="metric-note">${note}</span>
      ${target ? '<span class="metric-note">Ver detalhes →</span>' : ""}
    </${tag}>
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

function gradeBeltIndex(grade) {
  const belt = grade.split(" · ")[0].replace(/^faixa\s+/i, "").trim().toLocaleLowerCase("pt-BR");
  return beltOrder.findIndex((item) => item.toLocaleLowerCase("pt-BR") === belt);
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

function gradeVisual(grade) {
  const index = gradeBeltIndex(grade);
  const degree = gradeDegree(grade);
  if (!beltDegrees(index).includes(degree)) return "";
  return `<span class="rank-belt rank-belt--${index}" aria-hidden="true"><span class="rank-belt-bar">${'<i></i>'.repeat(degree)}</span></span>`;
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

function renderTutorialStep() {
  const role = realProfile && realProfile.papel;
  const roleNames = { adm: "Adm", professor: "Professor", instrutor: "Instrutor", aluno: "Aluno" };
  const steps = tutorialStepsByRole[role] || [];
  const step = steps[tutorialStepIndex];
  if (!step) return;
  document.querySelector("#tutorial-progress").textContent = `${roleNames[role]} · passo ${tutorialStepIndex + 1} de ${steps.length}`;
  document.querySelector("#tutorial-title").textContent = `Tutorial ${roleNames[role]}`;
  document.querySelector("#tutorial-illustration").innerHTML = tutorialIllustrations[tutorialStepIndex % tutorialIllustrations.length];
  document.querySelector("#tutorial-step-title").textContent = step[1];
  document.querySelector("#tutorial-copy").textContent = step[2];
  document.querySelector("[data-tutorial-back]").disabled = tutorialStepIndex === 0;
  document.querySelector("[data-tutorial-next]").textContent = tutorialStepIndex === steps.length - 1 ? "Concluir" : "Próximo";
}

function openTutorial() {
  if (!realProfile || !tutorialStepsByRole[realProfile.papel]) {
    showToast("O tutorial estará disponível depois que o perfil for carregado.", "error");
    return;
  }
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

const privacyPlaceholder = "O aceite do termo é gravado com o identificador do perfil, a versão do termo e a data e hora. O Professor aceita na primeira vez, o Instrutor depois de usar o convite e o Aluno novo ao criar o perfil.";

function renderPrivacyDraftContent(headingTag = "h2") {
  return `
    <p class="panel-copy">O aceite do termo é gravado com o identificador do perfil, a versão do termo e a data e hora. O Professor aceita na primeira vez. O Instrutor aceita depois de usar o convite. O Aluno novo aceita ao criar o perfil.</p>
    <p class="panel-copy">O redesign reorganiza a navegação: barra lateral no computador e barra inferior com menu “Mais” no celular. A mudança visual não altera as permissões nem os dados acessíveis por perfil.</p>

    <section class="privacy-draft-section">
      <${headingTag}>1. Dados que o app guarda</${headingTag}>
      <p>A conta real guarda os dados abaixo.</p>
      <ul>
        <li>e-mail da conta (login Google, ou e-mail e senha para Aluno e Instrutor);</li>
        <li>nome, papel, idade declarada (adulto ou menor de 18 anos) e vínculo com a academia;</li>
        <li>nome da academia, códigos e pedidos de vínculo, e vínculos entre Aluno e Professor;</li>
        <li>e-mail de Professor convidado e estado do convite; convites de Instrutor guardam o hash do token, datas e estado;</li>
        <li>nome e idade declarada de aluno sem conta;</li>
        <li>cobranças mensais: valor-base, vencimento, desconto, isenção (com motivo opcional de até 200 caracteres), estado e datas de envio;</li>
        <li>pagamentos: o Aluno registra aviso como Dinheiro ou Comprovante; o Professor pode lançar recebimento como Pix, Dinheiro, Transferência ou Outro. O app guarda valor, estado, referência e datas correspondentes;</li>
        <li>fotos de perfil e da academia enviadas, além de metadados como formato, tamanho e data de atualização; escolha do avatar de perfil;</li>
        <li>notas privadas, feedbacks, metas e mensagens trocadas conforme os papéis e vínculos;</li>
        <li>dados de graduação, avisos e conteúdos de treino compartilhados nas telas do app.</li>
      </ul>
      <p>No cadastro por e-mail e senha, o app coleta nome e e-mail. A senha é tratada pelo Supabase Auth e não é guardada pelo app.</p>
      <p>A exportação baixa arquivos JSON ou CSV com dados já carregados e visíveis para a própria conta. Não é backup do servidor. Não pedimos data de nascimento, telefone nem WhatsApp. Pedimos que não escreva dados sensíveis no motivo da isenção.</p>
      <p>O Aluno pode anexar opcionalmente ao aviso de pagamento um comprovante JPG, PNG ou PDF de até 10 MiB. Enquanto o arquivo está ativo e o pagamento aguarda decisão, ele fica acessível somente ao Aluno autor e ao Professor vinculado. Ao confirmar ou rejeitar, o app solicita a remoção do arquivo do Storage. Também tenta remover arquivos após 30 dias sem decisão; o aviso e os registros do pagamento permanecem.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>2. Compartilhamento</${headingTag}>
      <p>O acesso depende do papel e dos vínculos:</p>
      <ul>
        <li>o Professor vê os Alunos vinculados a ele, suas cobranças e seus pagamentos;</li>
        <li>o Aluno vê apenas as cobranças que o Professor enviou a ele;</li>
        <li>o Instrutor vê apenas os dados de alunos e conteúdos compartilhados com ele; não vê pagamentos, notas privadas, feedbacks ou metas;</li>
        <li>o Adm não tem acesso às telas de pagamentos, notas privadas, feedbacks ou metas.</li>
      </ul>
      <p>O Aluno pode solicitar vínculo usando um código; o vínculo depende da decisão do Professor. Alunos sem conta não entram nas cobranças mensais gravadas no banco real. A mensagem copiada na tela de cobranças não cria nem salva a cobrança e o texto não é armazenado.</p>
      <p>O app só controla pagamentos: não processa dinheiro, não envia mensagens fora do app e não usa notificações push.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>3. Menores de 18 anos</${headingTag}>
      <p>A idade é só declarada, sem verificação. Alunos menores ou sem idade declarada usam somente avatar; não enviam foto de pessoa. Convites de Instrutor exigem declaração de adulto.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>4. Fotos e avatares</${headingTag}>
      <p>Fotos de pessoa aceitam JPG ou PNG de até 5 MiB e ficam em armazenamento privado. A exibição é quadrada, com cantos suavemente arredondados e corte centralizado; no painel do usuário, a foto é redonda.</p>
      <ul>
        <li>Adm: vê somente a própria foto de perfil; como exceção, pode ver a foto do Professor;</li>
        <li>Aluno adulto e Instrutor: veem a própria foto e a do Professor vinculado; o Professor vinculado pode ver a foto deles;</li>
        <li>Professor: vê a própria foto; a foto dele fica visível aos Alunos e Instrutores vinculados e ao Adm;</li>
        <li>Aluno menor ou sem idade declarada: não tem foto de pessoa e usa avatar; pode ver a foto do Professor vinculado;</li>
        <li>foto da academia: JPG ou PNG de até 5 MiB, visível a todos os perfis autenticados.</li>
      </ul>
      <p>Quando não há uma foto de pessoa visível, o app mostra o avatar escolhido nas Preferências: masculino ou feminino. O padrão é masculino. As imagens dos avatares são arquivos locais; a escolha é guardada no perfil. Um novo envio aceito substitui a foto anterior. Quem pode enviar foto de perfil também pode solicitar sua remoção nas Preferências, após confirmação; o app solicita a remoção do arquivo e do registro e informa se a operação não for concluída.</p>
      <p>As regras acima são as decisões previstas para o produto. O acesso de Instrutor às fotos do Professor e o acesso do Professor às fotos de Instrutor ainda dependem de a política do banco reconhecer a relação de Instrutor; confirme essa configuração antes de considerar o acesso efetivo.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>5. Exclusão de conta</${headingTag}>
      <p>A exclusão da conta ainda está em construção.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>6. Retenção</${headingTag}>
      <p>Pagamentos e cobranças não são apagados, apenas mudam de estado (por exemplo, cancelada ou estornado). Um Professor substituído na academia é desativado, não apagado. A remoção física do comprovante é solicitada pelo app à API do Storage; se não for concluída, o app tenta novamente ao abrir pagamentos. O aviso e os registros permanecem.</p>
    </section>

    <section class="privacy-draft-section">
      <${headingTag}>7. Direitos e solicitações</${headingTag}>
      <p>O titular pode pedir informação, correção ou exclusão pelo contato abaixo. O app não tem autosserviço para esses pedidos.</p>
    </section>

    <section class="privacy-draft-section privacy-draft-contact">
      <${headingTag}>8. Contato</${headingTag}>
      <p><a href="mailto:desenvolvedor.aylton@gmail.com">desenvolvedor.aylton@gmail.com</a></p>
    </section>
  `;
}

const screens = {
  login() {
    return `
      ${heading("ACESSO", "Entre na sua conta", "Acesse sua conta pelo Google ou com e-mail e senha.")}
      <div class="auth-layout">
        <section class="auth-visual">
          <div>
            <img src="assets/logos/tatame-icone-escudo.svg" alt="">
            <h2>Treino, gestão e evolução no mesmo lugar.</h2>
            <p>Entre para acompanhar suas aulas, graduações e pagamentos.</p>
          </div>
          <span class="auth-visual-foot">Acesso protegido · permissões vêm do banco</span>
        </section>
        <section class="auth-card">
          <img class="auth-mobile-mark" src="assets/logos/tatame-icone-escudo.svg" alt="">
          <p class="eyebrow">BEM-VINDO AO TATAME</p>
          <h2>Continuar</h2>
          <p>Entre com sua conta real. O papel e as permissões são definidos pelo banco.</p>
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
            <div class="field"><label for="real-signup-name">Nome</label><input id="real-signup-name" name="name" type="text" autocomplete="name" maxlength="80" aria-describedby="real-signup-error" required></div>
            <div class="field" style="margin-top:12px"><label for="real-signup-email">E-mail</label><input id="real-signup-email" name="email" type="email" autocomplete="email" placeholder="seu e-mail" aria-describedby="real-signup-error" required></div>
            <div class="field" style="margin-top:12px"><label for="real-signup-password">Senha</label><input id="real-signup-password" name="password" type="password" autocomplete="new-password" minlength="8" aria-describedby="real-signup-help real-signup-error" required></div>
            <div class="field" style="margin-top:12px"><label for="real-signup-confirm-password">Confirmar senha</label><input id="real-signup-confirm-password" name="password-confirmation" type="password" autocomplete="new-password" minlength="8" aria-describedby="real-signup-help real-signup-error" required></div>
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
      <div class="content-grid auth-form-layout"><section class="panel-card" style="max-width:620px;margin:0 auto">
        <form data-real-password-reset-form novalidate>
          <div class="field"><label for="real-reset-email">E-mail</label><input id="real-reset-email" name="email" type="email" autocomplete="email" placeholder="seu e-mail" aria-describedby="real-reset-error" required></div>
          <div class="form-actions"><button class="button button--primary button--action" type="submit" data-login-action aria-describedby="real-reset-error real-reset-status"><span data-action-label>Enviar link</span></button><button class="button button--quiet" type="button" data-screen-target="login">Voltar para entrar</button></div>
          <div class="login-action-error" id="real-reset-error" role="alert" aria-atomic="true"></div>
          <div class="field-help" id="real-reset-status" role="status" aria-live="polite" aria-atomic="true"></div>
        </form>
      </section></div>
    `;
  },
  "password-recovery"() {
    return `
      ${heading("ACESSO", "Definir nova senha", "Escolha uma nova senha para sua conta.")}
      <div class="content-grid auth-form-layout"><section class="panel-card" style="max-width:620px;margin:0 auto">
        <form data-real-password-update-form novalidate>
          <div class="field"><label for="real-new-password">Nova senha</label><input id="real-new-password" name="password" type="password" autocomplete="new-password" minlength="8" aria-describedby="real-password-update-help real-password-update-error" required></div>
          <div class="field" style="margin-top:12px"><label for="real-confirm-new-password">Confirmar nova senha</label><input id="real-confirm-new-password" name="password-confirmation" type="password" autocomplete="new-password" minlength="8" aria-describedby="real-password-update-help real-password-update-error" required></div>
          <small class="field-help" id="real-password-update-help">A senha deve ter pelo menos 8 caracteres.</small>
          <div class="form-actions"><button class="button button--primary button--action" type="submit" data-login-action aria-describedby="real-password-update-error real-password-update-status"><span data-action-label>Salvar nova senha</span></button></div>
          <div class="login-action-error" id="real-password-update-error" role="alert" aria-atomic="true"></div>
          <div class="field-help" id="real-password-update-status" role="status" aria-live="polite" aria-atomic="true"></div>
        </form>
      </section></div>
    `;
  },
  "real-account"() {
    return renderRealAccountScreen();
  },
  "no-access"() {
    return `
      ${heading("ACESSO", "Aguardando liberação", "Esta tela não revela dados nem áreas protegidas para uma conta sem autorização.")}
      <div class="auth-card access-card"><span class="access-icon" aria-hidden="true">◷</span><p class="eyebrow">CONTA AINDA NÃO AUTORIZADA</p><h2>Não foi possível liberar o acesso</h2><p>Peça ao administrador para confirmar seu convite. O papel e as permissões são verificados no banco, não nesta tela.</p>${button("Voltar para entrar", "login", "button button--primary")}</div>
    `;
  },
  "instructor-students"() {
    const linkNotice = realInstructorLinkState === "error"
      ? `<div class="notice notice--pending" role="alert">${escapeHtml(realInstructorLinkNotice)}</div>`
      : "";
    const studentsContent = realInstructorStudentsState === "checking"
      ? '<p class="field-help" role="status" aria-live="polite">Carregando alunos vinculados...</p>'
      : realInstructorStudentsState === "error"
        ? `<div class="notice notice--pending" role="alert">${escapeHtml(realInstructorStudentsNotice)}</div>`
        : realInstructorStudents.length
          ? `<ul aria-label="Alunos vinculados">${realInstructorStudents.map((student) => {
            const graduation = student.faixa && Number.isInteger(student.grau)
              ? `Faixa ${escapeHtml(student.faixa)} · ${student.grau} grau${student.grau === 1 ? "" : "s"}`
              : "Sem graduação registrada";
            return `<li><strong>${escapeHtml(student.nome)}</strong><br><small>${graduation}</small></li>`;
          }).join("")}</ul>`
          : '<div class="empty-state"><div><strong>Nenhum aluno vinculado ainda</strong></div></div>';
    return `${heading("VISÃO DO INSTRUTOR", "Alunos vinculados", "Consulte somente o nome e a faixa/grau atuais dos alunos do seu Professor.")}${linkNotice}${panel("Alunos vinculados", studentsContent)}`;
  },
  privacy() {
    return `${heading("PRIVACIDADE", "Privacidade e consentimento", "Consulte o conteúdo atualizado na página própria ou no modal.")}<div class="content-grid">${panel("Política de privacidade", `<p class="panel-copy">O conteúdo da página própria também é exibido no modal do app.</p><div class="stack"><button class="button button--quiet" type="button" data-open-privacy>Ler política no modal</button><a class="button button--quiet" href="privacidade.html">Abrir Política de privacidade</a></div>`)}</div>`;
  }
};

function renderRealAccountScreen() {
  const role = realProfile ? escapeHtml(realProfile.papel || "Não definido") : "";
  const storedName = realProfile && typeof realProfile.nome === "string" ? realProfile.nome.trim() : "";
  const canDefineRealTeacherName = isRealActiveProfessor();
  const realTeacherNameSection = canDefineRealTeacherName
    ? `<form class="real-teacher-name-form" data-real-teacher-name-form><div class="form-grid"><div class="field field--wide"><label for="real-teacher-name">Nome do perfil</label><input id="real-teacher-name" name="nome" type="text" value="${escapeHtml(storedName)}" autocomplete="name" maxlength="160" aria-describedby="real-teacher-name-help"><small class="field-help" id="real-teacher-name-help">Use de 2 a 80 caracteres, sem caracteres de controle.</small></div></div><div class="form-actions"><button class="button button--primary button--action" type="submit" data-real-teacher-name-save aria-describedby="real-teacher-name-error real-teacher-name-status"><span data-action-label>Definir nome</span></button></div><div class="login-action-error" id="real-teacher-name-error" role="alert" aria-atomic="true"></div><div class="field-help" id="real-teacher-name-status" role="status" aria-live="polite"></div></form>`
    : "";
  const [title, copy] = realProfileState === "checking"
    ? ["Verificando seu perfil", "Aguarde a consulta da conta."]
    : realProfileState === "missing"
      ? ["Sua conta ainda não tem perfil", realProfileNotice || "Conclua o cadastro do perfil para acessar o aplicativo."]
      : realProfileState === "error"
        ? ["Não foi possível consultar seu perfil", realProfileNotice || "Confira a conexão e tente novamente."]
        : ["Perfil encontrado", `Papel lido do banco: ${role}.`];
  return `${heading("CONTA", title, copy)}${panel("Sessão", `<p>Sua conta está conectada. Abra o painel da conta para ver o e-mail ou sair.</p>${realProfileState === "found" ? `<p><strong>Papel no banco:</strong> ${role}<br><strong>Nome:</strong> ${escapeHtml(storedName || "Nome não definido")}</p>${realTeacherNameSection}` : ""}${realProfileState === "error" ? `<p class="login-action-error" role="alert">${escapeHtml(realProfileNotice || copy)}</p><div class="student-action-control"><button class="button button--quiet button--action" type="button" data-retry-profile aria-describedby="real-profile-retry-error real-profile-retry-status"><span data-action-label>Tentar consultar novamente</span></button><p class="login-action-error" id="real-profile-retry-error" role="alert"></p><p class="field-help" id="real-profile-retry-status" role="status" aria-live="polite"></p></div>` : ""}<button class="button button--quiet" type="button" data-open-user-panel>Abrir painel da conta</button>${isRealAdmSession() ? `<div class="form-actions">${button("Academia", "academy", "button button--quiet")}${button("Professores convidados", "teacher-invites", "button button--quiet")}${button("Professores e papéis", "role-management", "button button--quiet")}</div>` : ""}${isRealProfessorProfile() ? `<div class="form-actions">${button("Código e convites", "teacher-code", "button button--quiet")}</div>` : ""}`)}`;
}
function closeMobileMenu() {
  const wasOpen = sidebar.classList.contains("is-open");
  document.querySelectorAll(".app-main, #mobile-navigation").forEach((element) => { element.inert = false; });
  sidebar.classList.remove("is-open");
  sidebarBackdrop.classList.remove("is-visible");
  menuButton.setAttribute("aria-expanded", "false");
  document.querySelectorAll("#mobile-navigation [data-open-sidebar]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
  sidebar.removeAttribute("role");
  sidebar.removeAttribute("aria-modal");
  const focusTarget = mobileSidebarTrigger || menuButton;
  if (wasOpen && focusTarget.getClientRects().length) focusTarget.focus();
  mobileSidebarTrigger = menuButton;
}

function openMobileMenu(trigger = menuButton) {
  if (sidebar.classList.contains("is-open")) {
    closeMobileMenu();
    return;
  }
  mobileSidebarTrigger = trigger;
  sidebar.classList.add("is-open");
  sidebarBackdrop.classList.add("is-visible");
  sidebar.setAttribute("role", "dialog");
  sidebar.setAttribute("aria-modal", "true");
  trigger.setAttribute("aria-expanded", "true");
  sidebar.querySelector("a, button").focus();
  document.querySelectorAll(".app-main, #mobile-navigation").forEach((element) => { element.inert = true; });
}

function realTutorialCopy(text) {
  return text
    .replace(/[^.!?]*(?:fict|demonstr|simulad|em breve|em construção)[^.!?]*[.!?]?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderRealTutorial(role) {
  const steps = (tutorialStepsByRole[role] || [])
    .filter(([screenId]) => canViewScreen(screenId))
    .map(([, title, copy]) => ({ title, copy: realTutorialCopy(copy) }))
    .filter((step) => step.copy && !/(?:fict|demonstr|simulad|em breve|em construção)/i.test(step.copy))
    .slice(0, 3);
  return steps.length
    ? `<ol class="real-help-steps">${steps.map((step) => `<li><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.copy)}</p></li>`).join("")}</ol>`
    : emptyState("Tutorial indisponível", "Não há passos disponíveis para o papel desta conta.");
}

async function loadRealProfessorPhotoSettings() {
  const userId = realUser && realUser.id;
  const sessionGeneration = realSessionCacheGeneration;
  realOwnProfessorPhotoUrl = "";
  realOwnProfessorPhotoPath = "";
  realProfessorPhotoNotice = "";
  if (!authClient || !userId || !isRealActiveProfessorAccount()) return;
  try {
    const { data: photo, error } = await authClient.from("professores_fotos")
      .select("caminho_storage").eq("professor_id", userId).maybeSingle();
    if (sessionGeneration !== realSessionCacheGeneration || !realUser || realUser.id !== userId) return;
    if (error) {
      logRealProfileSupabaseError("consultar foto do Professor", error);
      realProfessorPhotoNotice = "Não foi possível carregar a foto atual. Atualize a tela e tente novamente.";
    } else if (photo && typeof photo.caminho_storage === "string") {
      realOwnProfessorPhotoPath = photo.caminho_storage;
      const signed = await createStorageSignedUrl("professores", photo.caminho_storage, "foto do Professor");
      if (sessionGeneration !== realSessionCacheGeneration || !realUser || realUser.id !== userId) return;
      if (signed.errorMessage) realProfessorPhotoNotice = signed.errorMessage;
      else realOwnProfessorPhotoUrl = signed.signedUrl;
    }
  } catch (error) {
    if (sessionGeneration !== realSessionCacheGeneration || !realUser || realUser.id !== userId) return;
    logRealProfileSupabaseError("consultar foto do Professor", error);
    realProfessorPhotoNotice = "Não foi possível carregar a foto atual. Tente novamente.";
  }
  if (currentScreen === "user-settings" && sessionGeneration === realSessionCacheGeneration) {
    screenContent.innerHTML = renderRealUserSettingsScreen();
  }
}

function canShowRealProfilePhotoForm(profile) {
  return Boolean(profile && (
    profile.papel === "adm" ||
    profile.papel === "instrutor" ||
    (profile.papel === "aluno" && profile.idade_declarada === "adulto")
  ));
}

function canEditRealProfilePhoto(profile) {
  return Boolean(profile && profile.ativo && canShowRealProfilePhotoForm(profile));
}

async function loadRealProfilePhotoPreview(userId) {
  const sessionGeneration = realSessionCacheGeneration;
  if (!authClient || !userId) return;
  realOwnProfilePhotoPath = "";
  try {
    const { data: photos, error } = await authClient.rpc("obter_foto_perfil", {
      p_perfil_id: userId
    });
    if (sessionGeneration !== realSessionCacheGeneration || !realUser || realUser.id !== userId || currentScreen !== "user-settings") return;
    if (error) {
      logRealProfileSupabaseError("consultar foto de perfil", error);
      return;
    }
    const photo = Array.isArray(photos) ? photos[0] : null;
    if (!photo || typeof photo.caminho_storage !== "string") {
      const removeButton = screenContent.querySelector("[data-real-profile-photo-remove]");
      if (removeButton) removeButton.hidden = true;
      return;
    }
    realOwnProfilePhotoPath = photo.caminho_storage;
    const removeButton = screenContent.querySelector("[data-real-profile-photo-remove]");
    if (removeButton) removeButton.hidden = false;

    const { data: signedPhoto, error: signedError } = await authClient.storage
      .from("perfis")
      .createSignedUrl(photo.caminho_storage, 300);
    if (sessionGeneration !== realSessionCacheGeneration || !realUser || realUser.id !== userId || currentScreen !== "user-settings") return;
    if (signedError) {
      logRealProfileSupabaseError("criar URL temporária da foto de perfil", signedError);
      return;
    }
    if (!signedPhoto || typeof signedPhoto.signedUrl !== "string") {
      console.error("Não foi possível criar a URL temporária da foto de perfil.");
      return;
    }

    const avatar = screenContent.querySelector("#real-profile-photo-avatar");
    if (!avatar) return;
    const fallbackImage = avatar.querySelector("img[data-avatar-fallback='true']");
    if (fallbackImage) fallbackImage.remove();
    const image = new Image();
    image.alt = "Foto de perfil";
    image.addEventListener("load", () => {
      if (sessionGeneration !== realSessionCacheGeneration || !realUser || realUser.id !== userId || currentScreen !== "user-settings" || !avatar.isConnected) return;
      avatar.replaceChildren(image);
      avatar.classList.remove("avatar--initials");
      avatar.removeAttribute("aria-hidden");
    }, { once: true });
    image.addEventListener("error", () => {
      console.error("Não foi possível carregar a foto de perfil; mantendo o avatar.");
    }, { once: true });
    image.src = signedPhoto.signedUrl;
  } catch (error) {
    if (sessionGeneration !== realSessionCacheGeneration || !realUser || realUser.id !== userId) return;
    logRealProfileSupabaseError("carregar foto de perfil", error);
  }
}

function renderRealLinkedProfileAvatar(profile) {
  return `<span class="avatar avatar--small avatar--initials" data-real-linked-profile-avatar="${escapeHtml(profile.id)}" aria-hidden="true"><img src="${escapeHtml(realPersonAvatarSrc(profile.id))}" alt="" loading="lazy" data-avatar-choice-profile-id="${escapeHtml(profile.id)}" data-avatar-fallback="true"></span>`;
}

function pumpRealLinkedProfilePhotoQueue() {
  while (realLinkedProfilePhotoRequestsInFlight < REAL_PROFILE_PHOTO_MAX_CONCURRENT &&
         realLinkedProfilePhotoQueue.length) {
    const { task, resolve } = realLinkedProfilePhotoQueue.shift();
    realLinkedProfilePhotoRequestsInFlight += 1;
    void (async () => {
      try {
        await task();
      } catch (error) {
        logRealProfileSupabaseError("carregar foto de perfil vinculada", error);
      } finally {
        realLinkedProfilePhotoRequestsInFlight -= 1;
        resolve();
        pumpRealLinkedProfilePhotoQueue();
      }
    })();
  }
}

function queueRealLinkedProfilePhotoTask(task) {
  return new Promise((resolve) => {
    realLinkedProfilePhotoQueue.push({ task, resolve });
    pumpRealLinkedProfilePhotoQueue();
  });
}

async function loadRealLinkedProfilePhotoAvatars(profiles, screenId) {
  if (!Array.isArray(profiles) || !authClient || !realUser || !isRealActiveProfessor() ||
      !["students", "student-detail"].includes(screenId) || currentScreen !== screenId) return;
  const professorId = realUser.id;
  const sessionGeneration = realSessionCacheGeneration;
  const linkedProfilesById = new Map(
    profiles
      .filter((profile) => profile && typeof profile.id === "string")
      .map((profile) => [profile.id, profile])
  );
  await loadRealAvatarPreferences([...linkedProfilesById.keys()]);
  if (sessionGeneration !== realSessionCacheGeneration ||
      !realUser || realUser.id !== professorId || currentScreen !== screenId) return;
  const avatars = Array.from(screenContent.querySelectorAll("[data-real-linked-profile-avatar]"));
  const tasks = Array.from(linkedProfilesById.values()).map((profile) => {
    const avatar = avatars.find((element) => element.dataset.realLinkedProfileAvatar === profile.id);
    if (!avatar) return Promise.resolve();
    const isCurrent = () =>
      sessionGeneration === realSessionCacheGeneration &&
      Boolean(realUser && realUser.id === professorId) &&
      isRealActiveProfessor() &&
      currentScreen === screenId &&
      avatar.isConnected &&
      (screenId !== "student-detail" || realSelectedGraduationStudentId === profile.id);
    return queueRealLinkedProfilePhotoTask(async () => {
      if (!isCurrent()) return;
      try {
        const { data: photos, error } = await authClient.rpc("obter_foto_perfil", {
          p_perfil_id: profile.id
        });
        if (!isCurrent()) return;
        if (error) {
          logRealProfileSupabaseError("consultar foto de perfil vinculada", error);
          return;
        }
        const photo = Array.isArray(photos) ? photos[0] : null;
        if (!photo || typeof photo.caminho_storage !== "string") return;

        const { data: signedPhoto, error: signedError } = await authClient.storage
          .from("perfis")
          .createSignedUrl(photo.caminho_storage, 300);
        if (!isCurrent()) return;
        if (signedError) {
          logRealProfileSupabaseError("criar URL temporária da foto de perfil vinculada", signedError);
          return;
        }
        if (!signedPhoto || typeof signedPhoto.signedUrl !== "string") {
          console.error("Não foi possível criar a URL temporária da foto de perfil vinculada.");
          return;
        }

        const image = new Image();
        image.alt = `Foto de perfil de ${profile.nome || "aluno vinculado"}`;
        image.addEventListener("load", () => {
          if (!isCurrent()) return;
          avatar.replaceChildren(image);
          avatar.classList.remove("avatar--initials");
          avatar.removeAttribute("aria-hidden");
        }, { once: true });
        image.addEventListener("error", () => {
          if (isCurrent()) console.error("Não foi possível carregar a foto de perfil vinculada; mantendo o avatar.");
        }, { once: true });
        image.src = signedPhoto.signedUrl;
      } catch (error) {
        if (!isCurrent()) return;
        logRealProfileSupabaseError("carregar foto de perfil vinculada", error);
      }
    });
  });
  await Promise.all(tasks);
}

function renderRealUserSettingsScreen() {
  const title = heading("CONTA", "Configurações, tutorial e ajuda", "Informações da conta e orientações disponíveis para seu papel.");
  if (realProfileState === "checking") {
    return `${title}<div class="notice notice--info" role="status">Carregando os dados da conta...</div>`;
  }
  if (realProfileState === "error") {
    return `${title}<div class="notice notice--pending" role="alert">${escapeHtml(realProfileNotice || "Não foi possível carregar os dados da conta.")}</div>
      <div class="student-action-control">
        <button class="button button--primary button--action" type="button" data-retry-profile aria-describedby="real-settings-retry-error real-settings-retry-status"><span data-action-label>Tentar novamente</span></button>
        <p class="login-action-error student-action-error" id="real-settings-retry-error" role="alert"></p>
        <p class="field-help" id="real-settings-retry-status" role="status" aria-live="polite"></p>
      </div>`;
  }
  if (realProfileState !== "found" || !realProfile) {
    return `${title}${emptyState("Perfil ainda não disponível", "Conclua ou atualize o cadastro da conta para ver os dados do perfil.")}`;
  }

  const roleLabels = { adm: "Adm", professor: "Professor", instrutor: "Instrutor", aluno: "Aluno" };
  const name = typeof realProfile.nome === "string" && realProfile.nome.trim()
    ? realProfile.nome.trim()
    : "";
  const role = roleLabels[realProfile.papel] || "";
  const email = realUser && typeof realUser.email === "string" ? realUser.email : "";
  const accountRows = [
    name ? listRow("Nome", "", escapeHtml(name)) : "",
    role ? listRow("Papel", "", escapeHtml(role)) : "",
    email ? listRow("E-mail", "", escapeHtml(email)) : ""
  ].filter(Boolean).join("");
  const showProfilePhotoForm = canShowRealProfilePhotoForm(realProfile);
  const profilePhotoVisibility = realProfile.papel === "adm"
    ? "A foto fica visível somente para você."
    : "A foto fica visível somente para você e para o Professor vinculado.";
  ensureRealAvatarChoiceLoaded();
  if (showProfilePhotoForm && realUser) {
    void loadRealProfilePhotoPreview(realUser.id);
  }
  const profilePhotoPanel = realProfile.papel === "professor"
    ? isRealActiveProfessorAccount()
      ? panel("Foto do Professor", `
          <p class="field-help">JPG ou PNG, até 5 MiB. A foto fica visível aos Alunos vinculados ao Professor e ao Adm.</p>
          <img class="real-media-preview" src="${escapeHtml(realOwnProfessorPhotoUrl || realPersonAvatarSrc(realProfile.id))}" alt="${realOwnProfessorPhotoUrl ? "Foto atual do Professor" : "Avatar padrão do Professor"}"${realOwnProfessorPhotoUrl ? "" : ` data-avatar-choice-profile-id="${escapeHtml(realProfile.id)}" data-avatar-fallback="true"`}>
          ${realOwnProfessorPhotoUrl ? "" : '<p class="field-help">Nenhuma foto enviada.</p>'}
          <div data-real-avatar-choice-controls>${renderRealAvatarChoiceControls(realProfile.id)}</div>
          ${realProfessorPhotoNotice ? `<p class="login-action-error" role="alert">${escapeHtml(realProfessorPhotoNotice)}</p>` : ""}
          <form data-real-professor-photo-form>
            <div class="field">
              <label for="real-professor-photo-file">Escolher foto</label>
              <input id="real-professor-photo-file" name="foto" type="file" accept="image/jpeg,image/png" aria-describedby="real-professor-photo-help">
              <small class="field-help" id="real-professor-photo-help">Somente Professor ativo pode enviar foto pessoal.</small>
            </div>
            <div class="student-action-control">
              <button class="button button--primary button--action" type="submit" data-real-professor-photo-save aria-describedby="real-professor-photo-error real-professor-photo-status"><span data-action-label>Enviar foto</span></button>
              <p class="login-action-error student-action-error" id="real-professor-photo-error" role="alert"></p>
              <p class="field-help" id="real-professor-photo-status" role="status" aria-live="polite"></p>
            </div>
            <div class="student-action-control">
              <button class="button button--danger button--action" type="button" data-real-professor-photo-remove${realOwnProfessorPhotoPath ? "" : " hidden"} aria-describedby="real-professor-photo-remove-error real-professor-photo-remove-status"><span data-action-label>Remover foto</span></button>
              <p class="login-action-error student-action-error" id="real-professor-photo-remove-error" role="alert"></p>
              <p class="field-help" id="real-professor-photo-remove-status" role="status" aria-live="polite"></p>
            </div>
          </form>
        `)
      : panel("Foto do Professor", `
          <div class="person-row">
            <img class="avatar" src="${realPersonAvatarSrc(realProfile.id)}" alt="" data-avatar-choice-profile-id="${escapeHtml(realProfile.id)}" data-avatar-fallback="true">
            <div class="person-copy"><div class="notice notice--info">Somente Professor ativo pode enviar foto pessoal.</div></div>
          </div>
          <div data-real-avatar-choice-controls>${renderRealAvatarChoiceControls(realProfile.id)}</div>
        `)
    : showProfilePhotoForm
      ? panel("Foto de perfil", `
          <div class="person-row">
            <div class="avatar avatar--initials" id="real-profile-photo-avatar" aria-hidden="true"><img src="${realPersonAvatarSrc(realProfile.id)}" alt="" data-avatar-choice-profile-id="${escapeHtml(realProfile.id)}" data-avatar-fallback="true"></div>
            <div class="person-copy"><small>${profilePhotoVisibility}</small></div>
          </div>
          <div data-real-avatar-choice-controls>${renderRealAvatarChoiceControls(realProfile.id)}</div>
          <form data-real-profile-photo-form>
            <div class="field">
              <label for="real-profile-photo-file">Escolher foto</label>
              <input id="real-profile-photo-file" name="foto" type="file" accept="image/jpeg,image/png" aria-describedby="real-profile-photo-help">
              <small class="field-help" id="real-profile-photo-help">JPG ou PNG, até 5 MiB.</small>
            </div>
            <div class="student-action-control">
              <button class="button button--primary button--action" type="submit" data-real-profile-photo-save aria-describedby="real-profile-photo-error real-profile-photo-status"><span data-action-label>Enviar foto</span></button>
              <p class="login-action-error student-action-error" id="real-profile-photo-error" role="alert"></p>
              <p class="field-help" id="real-profile-photo-status" role="status" aria-live="polite"></p>
            </div>
            <div class="student-action-control">
              <button class="button button--danger button--action" type="button" data-real-profile-photo-remove${realOwnProfilePhotoPath ? "" : " hidden"} aria-describedby="real-profile-photo-remove-error real-profile-photo-remove-status"><span data-action-label>Remover foto</span></button>
              <p class="login-action-error student-action-error" id="real-profile-photo-remove-error" role="alert"></p>
              <p class="field-help" id="real-profile-photo-remove-status" role="status" aria-live="polite"></p>
            </div>
          </form>
        `)
      : panel("Foto pessoal", `
          <div class="person-row">
            <div class="avatar"><img src="${realPersonAvatarSrc(realProfile.id)}" alt="" data-avatar-choice-profile-id="${escapeHtml(realProfile.id)}" data-avatar-fallback="true"></div>
            <div class="person-copy"><div class="notice notice--info">Menores de idade ou sem idade declarada usam somente avatar.</div></div>
          </div>
          <div data-real-avatar-choice-controls>${renderRealAvatarChoiceControls(realProfile.id)}</div>
        `);
  return `${title}
    <div class="content-grid">
      <div class="stack">
        ${panel("Dados da conta", accountRows || emptyState("Dados da conta indisponíveis", "Não há dados de perfil para exibir."))}
        ${profilePhotoPanel}
        ${panel("Tutorial", renderRealTutorial(realProfile.papel))}
        ${panel("Perguntas frequentes", `
          <div class="real-help-faq">
            <details><summary>Quais telas estão disponíveis?</summary><p>As telas disponíveis dependem do papel definido no perfil da conta.</p></details>
            <details><summary>As preferências desta tela são gravadas no banco?</summary><p>Esta tela não grava preferências no banco.</p></details>
            <details><summary>Quem pode consultar pagamentos?</summary><p>O Professor consulta pagamentos dos alunos vinculados e cada Aluno consulta somente os próprios pagamentos. Adm e Instrutor não têm acesso a essas telas.</p></details>
          </div>
        `)}
      </div>
      <div class="stack">
        ${panel("Ajuda e suporte", `
          <p>Para falar com o suporte, envie um e-mail para <a href="mailto:desenvolvedor.aylton@gmail.com">desenvolvedor.aylton@gmail.com</a>.</p>
          <p><a href="privacidade.html">Política de privacidade</a></p>
          <p class="field-help">Exportar baixa só o que você já vê no app. Não é backup do servidor.</p>
          <p class="field-help">Versão do app: ${escapeHtml(APP_VERSION)}</p>
        `)}
      </div>
    </div>`;
}

const realFeatureData = {
  state: "idle",
  error: "",
  notes: [],
  grades: [],
  notices: [],
  faq: [],
  plans: [],
  themes: [],
  feedbacks: [],
  goals: [],
  conversations: [],
  conversationRecipients: [],
  conversationProfessorId: null,
  delegatedLessons: [],
  linkedInstructors: [],
  linkedStudents: [],
  unregisteredStudents: [],
  unregisteredNotes: [],
  dropIns: []
};
let realFeatureRequestSequence = 0;
let realStudentDetailRequestSequence = 0;

function featureAccessNotice() {
  return '<div class="notice notice--pending" role="alert">Entre com uma conta ativa vinculada para consultar estes dados.</div>';
}

function renderFeatureLoadState() {
  if (realFeatureData.state === "checking") {
    return '<p class="field-help" role="status" aria-live="polite">Carregando...</p>';
  }
  if (realFeatureData.state === "error") {
    return `<div class="notice notice--pending" role="alert">${escapeHtml(realFeatureData.error)}</div><div class="student-action-control"><button class="button button--primary button--action" type="button" data-reload-feature aria-describedby="real-feature-reload-error real-feature-reload-status"><span data-action-label>Tentar novamente</span></button><p class="login-action-error" id="real-feature-reload-error" role="alert"></p><p class="field-help" id="real-feature-reload-status" role="status" aria-live="polite"></p></div>`;
  }
  return "";
}

function featureActionButton(action, id, label, title = label) {
  return `<div class="student-action-control"><button class="button button--quiet button--action" type="button" data-feature-action="${action}" data-feature-id="${escapeHtml(id || "")}" aria-label="${escapeHtml(title)}"><span data-action-label>${escapeHtml(label)}</span></button><p class="login-action-error" role="alert"></p><p class="field-help" role="status" aria-live="polite"></p></div>`;
}

function featureSubmitButton(label) {
  return `<div class="student-action-control"><button class="button button--primary button--action" type="submit"><span data-action-label>${escapeHtml(label)}</span></button><p class="login-action-error" role="alert"></p><p class="field-help" role="status" aria-live="polite"></p></div>`;
}

function renderFeatureTextField(name, label, value, max, multiline = false, required = true) {
  const id = `feature-${name}-${Math.random().toString(36).slice(2, 8)}`;
  const requiredAttributes = required ? "required minlength=\"1\"" : "";
  const element = multiline
    ? `<textarea id="${id}" name="${name}" maxlength="${max}" ${requiredAttributes}>${escapeHtml(value || "")}</textarea>`
    : `<input id="${id}" name="${name}" maxlength="${max}" ${requiredAttributes} value="${escapeHtml(value || "")}">`;
  return `<div class="field"><label for="${id}">${label}</label>${element}<small class="field-help" data-feature-counter="${name}">${(value || "").length}/${max} caracteres</small></div>`;
}

function featureDateMonday(value = "") {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? 1 : 8 - day));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function renderRealTrainingBoard() {
  if (!isRealActiveProfessor() && !isRealActiveStudent() && !isRealActiveInstructor()) return featureAccessNotice();
  if (realFeatureData.state !== "found") return renderFeatureLoadState();
  const canEdit = isRealActiveProfessor();
  const grades = realFeatureData.grades || [];
  const notices = realFeatureData.notices || [];
  const faqs = realFeatureData.faq || [];
  const gradeRows = grades.length ? grades.map((grade) => `
    <article class="panel-card">
      ${canEdit ? `<form data-feature-form="edit-grade" data-feature-id="${escapeHtml(grade.id)}">
        ${renderFeatureTextField("dias", "Dias", grade.dias, 500, true)}
        ${renderFeatureTextField("horario", "Horário", grade.horario, 500, true)}
        ${featureSubmitButton("Salvar alterações")}
      </form>` : `<p><strong>${escapeHtml(grade.dias)}</strong></p><p>${escapeHtml(grade.horario)}</p>`}
      <p class="field-help">${grade.publicada ? "Grade publicada" : "Rascunho"}${grade.arquivado ? " · Arquivada" : ""}</p>
      ${canEdit && !grade.arquivado ? featureActionButton("archive-grade", grade.id, "Arquivar") : ""}
    </article>`).join("") : emptyState("Nenhuma grade", "As grades publicadas aparecerão aqui.");
  const noticeRows = notices.length ? notices.map((notice) => `
    <article class="panel-card">
      ${canEdit ? `<form data-feature-form="edit-notice" data-feature-id="${escapeHtml(notice.id)}">
        ${renderFeatureTextField("titulo", "Título", notice.titulo, 80)}
        ${renderFeatureTextField("texto", "Aviso", notice.texto, 500, true)}
        <label><input type="checkbox" name="fixado" ${notice.fixado ? "checked" : ""}> Fixar aviso</label>
        ${featureSubmitButton("Salvar alterações")}
      </form>` : `<h3>${escapeHtml(notice.titulo)}</h3><p>${escapeHtml(notice.texto)}</p>`}
      ${notice.fixado ? '<small class="badge badge--blue">FIXADO</small>' : ""}
      ${canEdit && !notice.arquivado ? featureActionButton("archive-notice", notice.id, "Arquivar") : ""}
    </article>`).join("") : emptyState("Nenhum aviso", "Os avisos publicados pelo Professor aparecerão aqui.");
  const faqRows = faqs.length ? faqs.map((item) => `
    <article class="panel-card">
      ${canEdit ? `<form data-feature-form="edit-faq" data-feature-id="${escapeHtml(item.id)}">
        ${renderFeatureTextField("pergunta", "Pergunta", item.pergunta, 200)}
        ${renderFeatureTextField("resposta", "Resposta", item.resposta, 500, true)}
        <input type="hidden" name="ordem" value="${Number(item.ordem) || 0}">
        ${featureSubmitButton("Salvar alterações")}
      </form>` : `<h3>${escapeHtml(item.pergunta)}</h3><p>${escapeHtml(item.resposta)}</p>`}
      ${canEdit && !item.arquivado ? featureActionButton("archive-faq", item.id, "Arquivar") : ""}
    </article>`).join("") : emptyState("Nenhuma pergunta frequente", "As perguntas e respostas aparecerão aqui.");
  return `${heading("TREINO", "Mural e grade", "Grade, avisos e perguntas frequentes do Professor vinculado.")}
    <div class="content-grid">
      ${panel("Grade semanal", `${canEdit ? `<form data-feature-form="create-grade">
        ${renderFeatureTextField("dias", "Dias", "", 500, true)}
        ${renderFeatureTextField("horario", "Horário", "", 500, true)}
        ${featureSubmitButton("Criar grade")}
      </form><div class="form-actions">${featureActionButton("publish-grade", "", "Publicar ou retirar publicação")}</div>` : ""}
        ${gradeRows}`)}
      ${panel("Avisos", `${canEdit ? `<form data-feature-form="create-notice">
        ${renderFeatureTextField("titulo", "Título", "", 80)}
        ${renderFeatureTextField("texto", "Aviso", "", 500, true)}
        <label><input type="checkbox" name="fixado"> Fixar aviso</label>
        ${featureSubmitButton("Publicar aviso")}
      </form>` : ""}${noticeRows}`)}
      ${panel("Perguntas frequentes", `${canEdit ? `<form data-feature-form="create-faq">
        ${renderFeatureTextField("pergunta", "Pergunta", "", 200)}
        ${renderFeatureTextField("resposta", "Resposta", "", 500, true)}
        <input type="hidden" name="ordem" value="0">
        ${featureSubmitButton("Adicionar pergunta")}
      </form>` : ""}${faqRows}`)}
    </div>`;
}

function renderPlanItemEditor(item = {}) {
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  return `<div class="form-grid" data-plan-item>
    <div class="field"><label>Dia do treino</label><select name="dia" aria-label="Dia do treino">${days.map((day, index) => `<option value="${index}" ${Number(item.dia) === index ? "selected" : ""}>${day}</option>`).join("")}</select></div>
    <div class="field"><label>Tema</label><input name="tema" aria-label="Tema" maxlength="80" value="${escapeHtml(item.tema || "")}" required minlength="1"><small class="field-help" data-feature-counter="tema">${(item.tema || "").length}/80 caracteres</small></div>
    <div class="field field--wide"><label>Descrição</label><textarea name="descricao" aria-label="Descrição" maxlength="300">${escapeHtml(item.descricao || "")}</textarea><small class="field-help" data-feature-counter="descricao">${(item.descricao || "").length}/300 caracteres</small></div>
  </div>`;
}

function renderAddPlanItemButton(controlId) {
  const errorId = `${controlId}-error`;
  const statusId = `${controlId}-status`;
  return `<div class="student-action-control">
    <button class="button button--quiet button--action" type="button" data-add-plan-item aria-describedby="${escapeHtml(errorId)} ${escapeHtml(statusId)}"><span data-action-label>Adicionar treino</span></button>
    <p class="login-action-error" id="${escapeHtml(errorId)}" role="alert"></p>
    <p class="field-help" id="${escapeHtml(statusId)}" role="status" aria-live="polite"></p>
  </div>`;
}

function renderRealTrainingPlan() {
  if (!isRealActiveProfessor() && !isRealActiveInstructor()) return featureAccessNotice();
  if (realFeatureData.state !== "found") return renderFeatureLoadState();
  const canEdit = isRealActiveProfessor();
  const plans = realFeatureData.plans || [];
  const groupedPlans = new Map();
  plans.forEach((row) => {
    if (!groupedPlans.has(row.id)) groupedPlans.set(row.id, { ...row, itens: [] });
    if (row.tema !== null) groupedPlans.get(row.id).itens.push({ dia: row.dia, tema: row.tema, descricao: row.descricao || "" });
  });
  const planRows = [...groupedPlans.values()].map((plan) => `
    <article class="panel-card">
      <h3>Semana de ${escapeHtml(plan.semana_inicio)}</h3>
      ${canEdit ? `<form data-feature-form="edit-plan" data-feature-id="${escapeHtml(plan.id)}">
        <div class="field"><label>Segunda-feira da semana</label><input type="date" name="semana_inicio" value="${escapeHtml(plan.semana_inicio)}" required></div>
        ${(plan.itens.length ? plan.itens : [{}]).map(renderPlanItemEditor).join("")}
        ${renderAddPlanItemButton(`edit-plan-item-${plan.id}`)}
        ${featureSubmitButton("Salvar plano")}
      </form>` : `<p>${plan.itens.map((item) => `${["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][item.dia]} · ${escapeHtml(item.tema)}${item.descricao ? ` — ${escapeHtml(item.descricao)}` : ""}`).join("<br>") || "Sem itens cadastrados."}</p>`}
      ${canEdit ? featureActionButton("share-plan", plan.id, plan.compartilhado ? "Retirar compartilhamento" : "Compartilhar com Instrutor") : ""}
    </article>`).join("") || emptyState("Nenhum plano semanal", "Os planos compartilhados pelo Professor aparecerão aqui.");
  const themes = canEdit ? (realFeatureData.themes || []).map((theme) => `
    <article class="panel-card">
      <form data-feature-form="edit-theme" data-feature-id="${escapeHtml(theme.id)}">
        ${renderFeatureTextField("nome", "Nome do tema", theme.nome, 80)}
        ${renderFeatureTextField("descricao", "Descrição", theme.descricao || "", 300, true, false)}
        <label><input type="checkbox" name="arquivado" ${theme.arquivado ? "checked" : ""}> Arquivado</label>
        ${featureSubmitButton("Salvar tema")}
      </form>
    </article>`).join("") : "";
  return `${heading("PLANEJAMENTO", "Plano semanal", "O compartilhamento libera o plano somente ao Instrutor vinculado.")}
    <div class="content-grid">
      ${panel("Planos semanais", `${canEdit ? `<form data-feature-form="create-plan">
        <div class="field"><label for="feature-week-start">Segunda-feira da semana</label><input id="feature-week-start" type="date" name="semana_inicio" value="${featureDateMonday()}" required></div>
        ${renderPlanItemEditor()}
        ${renderAddPlanItemButton("create-plan-item")}
        ${featureSubmitButton("Criar plano")}
      </form>` : ""}${planRows}`)}
      ${canEdit ? panel("Biblioteca de temas", `<form data-feature-form="create-theme">
        ${renderFeatureTextField("nome", "Nome do tema", "", 80)}
        ${renderFeatureTextField("descricao", "Descrição", "", 300, true, false)}
        ${featureSubmitButton("Adicionar tema")}
      </form>${themes || emptyState("Biblioteca vazia", "Adicione temas para sua equipe.")}`) : ""}
    </div>`;
}

function renderRealStudentProgress() {
  if (!isRealActiveStudent()) return featureAccessNotice();
  if (realFeatureData.state !== "found") return renderFeatureLoadState();
  const feedbacks = realFeatureData.feedbacks || [];
  const goals = realFeatureData.goals || [];
  return `${heading("ACOMPANHAMENTO", "Feedbacks e metas", "Consulte somente os registros vinculados à sua conta.")}
    <div class="content-grid">
      ${panel("Feedbacks", feedbacks.length ? feedbacks.map((item) => `<article class="panel-card"><p>${escapeHtml(item.texto)}</p></article>`).join("") : emptyState("Nenhum feedback", "Seu Professor poderá registrar feedbacks para você."))}
      ${panel("Metas", goals.length ? goals.map((item) => `<article class="panel-card"><p>${escapeHtml(item.texto)}</p><small>${escapeHtml(item.status === "cumprida" ? "Cumprida" : "Em andamento")}</small></article>`).join("") : emptyState("Nenhuma meta", "As metas definidas pelo Professor aparecerão aqui."))}
    </div>`;
}

function renderRealConversations() {
  if (!isRealActiveProfessor() && !isRealActiveStudent() && !isRealActiveInstructor()) return featureAccessNotice();
  if (realFeatureData.state !== "found") return renderFeatureLoadState();
  const conversations = new Map();
  (realFeatureData.conversations || []).forEach((message) => {
    if (!conversations.has(message.conversa_id)) conversations.set(message.conversa_id, []);
    conversations.get(message.conversa_id).push(message);
  });
  const threads = [...conversations.entries()].map(([id, messages]) => {
    const first = messages[0];
    const otherParty = isRealActiveProfessor() ? first.participante_nome || "Aluno vinculado" : "Professor";
    return `<article class="panel-card">
      <h3>${escapeHtml(otherParty)}</h3>
      <div class="chat-thread" role="log" aria-live="polite">
        ${messages.map((message) => `<p><strong>${message.remetente_id === realUser.id ? "Você" : escapeHtml(otherParty)}:</strong> ${escapeHtml(message.texto)}</p>`).join("")}
      </div>
      <form data-feature-form="reply-conversation" data-feature-id="${escapeHtml(id)}">
        <div class="field"><label>Mensagem</label><textarea name="texto" required minlength="1"></textarea></div>
        ${featureSubmitButton("Responder")}
      </form>
    </article>`;
  }).join("") || emptyState("Nenhuma conversa", "As conversas com seu Professor aparecerão aqui.");
  const fixedRecipientId = isRealActiveInstructor()
    ? realInstructorLink && realInstructorLink.professor_id
    : isRealActiveStudent()
      ? realFeatureData.conversationProfessorId
      : "";
  const canCreate = isRealActiveProfessor()
    ? realFeatureData.conversationRecipients.length > 0
    : typeof fixedRecipientId === "string" && fixedRecipientId.length > 0;
  const recipientField = isRealActiveProfessor()
    ? `<div class="field"><label for="feature-chat-recipient">Aluno vinculado</label><select id="feature-chat-recipient" name="destinatario" required>${realFeatureData.conversationRecipients.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.nome)}</option>`).join("")}</select></div>`
    : `<input type="hidden" name="destinatario" value="${escapeHtml(fixedRecipientId)}">`;
  const form = canCreate ? `<form data-feature-form="create-conversation">
    ${recipientField}
    <div class="field"><label for="feature-chat-text">Mensagem</label><textarea id="feature-chat-text" name="texto" required minlength="1"></textarea></div>
    ${featureSubmitButton("Iniciar conversa")}
  </form>` : "";
  return `${heading("COMUNICAÇÃO", "Conversas", "Mensagens individuais entre o Professor e pessoas vinculadas.")}
    <div class="content-grid">${panel("Mensagens", `${form}${threads}`)}</div>`;
}

function renderRealDelegatedLessonScreen() {
  const professor = isRealActiveProfessor();
  if (!professor && !isRealActiveInstructor()) return featureAccessNotice();
  if (realFeatureData.state !== "found") return renderFeatureLoadState();
  const lessons = realFeatureData.delegatedLessons || [];
  if (professor) {
    const linkedInstructors = realFeatureData.linkedInstructors || [];
    const createForm = linkedInstructors.length
      ? `<form data-feature-form="create-delegated">
          <div class="field"><label for="feature-delegated-instructor">Instrutor vinculado</label>
            <select id="feature-delegated-instructor" name="instrutor_id" required>
              ${linkedInstructors.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.nome)}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label for="feature-delegated-mode">Formato</label>
            <select id="feature-delegated-mode" name="modo" required>
              <option value="plan">Plano</option><option value="free">Treino livre</option>
            </select>
          </div>
          <div class="field"><label for="feature-delegated-plan">Plano decidido pelo Professor</label>
            <textarea id="feature-delegated-plan" name="plano"></textarea>
          </div>
          ${featureSubmitButton("Criar aula delegada")}
        </form>`
      : emptyState("Nenhum Instrutor vinculado", "Vincule um Instrutor antes de delegar uma aula.");
    return `${heading("GESTÃO DE PAPÉIS", "Aula delegada", "Gerencie somente aulas delegadas a Instrutores vinculados.")}
      <div class="content-grid">
      ${panel("Nova aula delegada", createForm)}
      ${panel("Aulas delegadas", lessons.length ? lessons.map((lesson) => `<article class="panel-card">
        <strong>Aula do Instrutor</strong>
        <form data-feature-form="edit-delegated" data-feature-id="${escapeHtml(lesson.instrutor_id)}">
          <div class="field"><label>Formato</label><select name="modo"><option value="plan" ${lesson.modo === "plan" ? "selected" : ""}>Plano</option><option value="free" ${lesson.modo === "free" ? "selected" : ""}>Treino livre</option></select></div>
          <div class="field"><label>Plano decidido pelo Professor</label><textarea name="plano" ${lesson.modo === "free" ? "disabled" : ""}>${escapeHtml(lesson.plano || "")}</textarea></div>
          ${featureSubmitButton("Salvar aula")}
        </form>
        ${lesson.compartilhada ? '<p class="field-help">Aula compartilhada com o Instrutor.</p>' : featureActionButton("share-delegated", lesson.instrutor_id, "Compartilhar")}
      </article>`).join("") : emptyState("Nenhuma aula delegada", "As aulas delegadas aparecerão aqui."))}
      </div>`;
  }
  const lesson = lessons.find((item) => item.instrutor_id === realUser.id && item.compartilhada);
  if (!lesson) return `${heading("VISÃO DO INSTRUTOR", "Aula delegada", "O Professor controla o que fica disponível.")}${emptyState("Nenhuma aula compartilhada", "Aguarde a publicação do Professor.")}`;
  const followed = lesson.seguido;
  return `${heading("VISÃO DO INSTRUTOR", "Aula delegada", "Registre se seguiu a orientação do Professor.")}
    ${panel("Aula", `${lesson.modo === "free" ? "Treino livre" : escapeHtml(lesson.plano)}
      ${followed ? `<p>Registro: ${followed === "yes" ? "Segui" : "Não segui"}</p>` : `<div class="form-actions">${featureActionButton("follow-delegated-yes", realUser.id, "Segui")}${featureActionButton("follow-delegated-no", realUser.id, "Não segui")}</div>`}`)}`;
}

function renderRealFeatureScreenById(screenId) {
  const renderer = {
    students: renderRealFeatureStudents,
    "training-board": renderRealTrainingBoard,
    "training-plan": renderRealTrainingPlan,
    "student-progress": renderRealStudentProgress,
    "teacher-chat": renderRealConversations,
    "student-chat": renderRealConversations,
    "instructor-chat": renderRealConversations,
    "instructor-class": renderRealDelegatedLessonScreen,
    "role-management": renderRealDelegatedLessonScreen
  }[screenId];
  return renderer ? renderer() : "";
}

async function loadRealFeatureScreen(screenId, updateView = true) {
  const sequence = ++realFeatureRequestSequence;
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentRequest = () =>
    sequence === realFeatureRequestSequence &&
    sessionGeneration === realSessionCacheGeneration &&
    currentScreen === screenId &&
    Boolean(realUser && realUser.id === userId);
  realFeatureData.state = "checking";
  realFeatureData.error = "";
  if (updateView && currentScreen === screenId) screenContent.innerHTML = renderRealFeatureScreenById(screenId);
  if (!authClient || !realUser ||
      !(isRealActiveProfessor() || isRealActiveStudent() || isRealActiveInstructor())) {
    realFeatureData.state = "error";
    realFeatureData.error = "Esta conta não tem permissão para consultar estes dados.";
  } else {
    try {
      if (screenId === "training-board") {
        const [grades, notices, faq] = await Promise.all([
          authClient.rpc("listar_grade_semanal"),
          authClient.rpc("listar_avisos"),
          authClient.rpc("listar_faq")
        ]);
        if (grades.error) throw grades.error;
        if (notices.error) throw notices.error;
        if (faq.error) throw faq.error;
        if (![grades.data, notices.data, faq.data].every(Array.isArray)) throw new TypeError("Lista indisponível.");
        if (!isCurrentRequest()) return;
        realFeatureData.grades = grades.data;
        realFeatureData.notices = notices.data;
        realFeatureData.faq = faq.data;
      } else if (screenId === "training-plan") {
        const plans = await authClient.rpc("listar_planos_semanais");
        if (plans.error) throw plans.error;
        if (!Array.isArray(plans.data)) throw new TypeError("Lista indisponível.");
        if (!isCurrentRequest()) return;
        realFeatureData.plans = plans.data;
        if (isRealActiveProfessor()) {
          const themes = await authClient.rpc("listar_temas_biblioteca");
          if (themes.error) throw themes.error;
          if (!Array.isArray(themes.data)) throw new TypeError("Lista indisponível.");
          if (!isCurrentRequest()) return;
          realFeatureData.themes = themes.data;
        } else {
          realFeatureData.themes = [];
        }
      } else if (screenId === "student-progress") {
        const [feedbacks, goals] = await Promise.all([
          authClient.rpc("listar_feedbacks", { p_aluno_id: null }),
          authClient.rpc("listar_metas", { p_aluno_id: null })
        ]);
        if (feedbacks.error) throw feedbacks.error;
        if (goals.error) throw goals.error;
        if (!Array.isArray(feedbacks.data) || !Array.isArray(goals.data)) throw new TypeError("Lista indisponível.");
        if (!isCurrentRequest()) return;
        realFeatureData.feedbacks = feedbacks.data;
        realFeatureData.goals = goals.data;
      } else if (["teacher-chat", "student-chat", "instructor-chat"].includes(screenId)) {
        const conversations = await authClient.rpc("listar_conversas_professor");
        if (conversations.error) throw conversations.error;
        if (!Array.isArray(conversations.data)) throw new TypeError("Lista indisponível.");
        if (!isCurrentRequest()) return;
        realFeatureData.conversations = conversations.data;
        realFeatureData.conversationRecipients = [];
        realFeatureData.conversationProfessorId = null;
        if (isRealActiveProfessor()) {
          const { data: links, error: linksError } = await authClient.from("vinculos")
            .select("aluno_id").eq("professor_id", realUser.id);
          if (linksError) throw linksError;
          if (!Array.isArray(links)) throw new TypeError("Lista indisponível.");
          if (!isCurrentRequest()) return;
          const ids = links.map((row) => row.aluno_id).filter((id) => typeof id === "string");
          const profiles = ids.length
            ? await authClient.from("perfis").select("id,nome").in("id", ids)
            : { data: [], error: null };
          if (profiles.error) throw profiles.error;
          if (!Array.isArray(profiles.data)) throw new TypeError("Lista indisponível.");
          if (!isCurrentRequest()) return;
          realFeatureData.conversationRecipients = profiles.data
            .filter((row) => typeof row.id === "string" && typeof row.nome === "string")
            .map((row) => ({ id: row.id, nome: row.nome }));
        } else if (isRealActiveStudent()) {
          const { data: link, error: linkError } = await authClient.from("vinculos")
            .select("professor_id").eq("aluno_id", realUser.id).maybeSingle();
          if (linkError) throw linkError;
          if (link && typeof link.professor_id !== "string") throw new TypeError("Vínculo indisponível.");
          if (!isCurrentRequest()) return;
          realFeatureData.conversationProfessorId = link ? link.professor_id : null;
        }
      } else if (["role-management", "instructor-class"].includes(screenId)) {
        const delegated = await authClient.rpc("listar_aulas_delegadas");
        if (delegated.error) throw delegated.error;
        if (!Array.isArray(delegated.data)) throw new TypeError("Lista indisponível.");
        if (!isCurrentRequest()) return;
        realFeatureData.delegatedLessons = delegated.data;
        realFeatureData.linkedInstructors = [];
        if (isRealActiveProfessor()) {
          const { data: links, error: linksError } = await authClient.from("instrutores_professor")
            .select("instrutor_id").eq("professor_id", realUser.id);
          if (linksError) throw linksError;
          if (!Array.isArray(links) || links.some((row) => !row || typeof row.instrutor_id !== "string")) {
            throw new TypeError("Instrutores indisponíveis.");
          }
          const instructorIds = [...new Set(links.map((row) => row.instrutor_id))];
          const profiles = instructorIds.length
            ? await authClient.from("perfis").select("id,nome").in("id", instructorIds)
            : { data: [], error: null };
          if (profiles.error) throw profiles.error;
          if (!Array.isArray(profiles.data)) throw new TypeError("Nomes dos Instrutores indisponíveis.");
          if (!isCurrentRequest()) return;
          const namesById = new Map(profiles.data.map((row) => [row.id, row.nome]));
          realFeatureData.linkedInstructors = instructorIds.map((id) => ({
            id,
            nome: typeof namesById.get(id) === "string" ? namesById.get(id) : id
          }));
        }
      } else if (screenId === "students") {
        const { data: links, error: linksError } = await authClient.from("vinculos")
          .select("aluno_id,status").eq("professor_id", realUser.id);
        if (linksError) throw linksError;
        if (!Array.isArray(links)) throw new TypeError("Lista indisponível.");
        const ids = links.map((row) => row.aluno_id).filter((id) => typeof id === "string");
        const profiles = ids.length
          ? await authClient.from("perfis").select("id,nome").in("id", ids)
          : { data: [], error: null };
        if (profiles.error) throw profiles.error;
        if (!Array.isArray(profiles.data)) throw new TypeError("Nomes indisponíveis.");
        if (!isCurrentRequest()) return;
        const profileById = new Map(profiles.data.map((row) => [row.id, row]));
        realFeatureData.linkedStudents = links.map((row) => ({
          id: row.aluno_id,
          nome: profileById.get(row.aluno_id)?.nome || "",
          status: row.status
        })).filter((row) => row.nome);
        const { data: unregistered, error: unregisteredError } = await authClient.from("alunos_sem_conta")
          .select("id,nome,status").eq("professor_id", realUser.id).order("criado_em", { ascending: false });
        if (unregisteredError) throw unregisteredError;
        if (!Array.isArray(unregistered)) throw new TypeError("Lista indisponível.");
        if (!isCurrentRequest()) return;
        realFeatureData.unregisteredStudents = unregistered;
        const noteLists = await Promise.all(unregistered.map(async (student) => {
          const result = await authClient.rpc("listar_notas_privadas", {
            p_aluno_id: null,
            p_aluno_sem_conta_id: student.id
          });
          if (result.error) throw result.error;
          if (!Array.isArray(result.data)) throw new TypeError("Notas indisponíveis.");
          return result.data;
        }));
        if (!isCurrentRequest()) return;
        realFeatureData.unregisteredNotes = noteLists.flat();
        const dropIns = await authClient.rpc("listar_aulas_avulsas");
        if (dropIns.error) throw dropIns.error;
        if (!Array.isArray(dropIns.data)) throw new TypeError("Aulas indisponíveis.");
        if (!isCurrentRequest()) return;
        realFeatureData.dropIns = dropIns.data;
      }
      if (!isCurrentRequest()) return;
      realFeatureData.state = "found";
    } catch (error) {
      if (!isCurrentRequest()) return;
      logRealProfileSupabaseError(`consultar ${screenId}`, error);
      realFeatureData.state = "error";
      realFeatureData.error = navigator.onLine === false
        ? "Falha de rede. Verifique sua conexão e tente novamente."
        : "Não foi possível carregar estes dados. Tente novamente.";
    }
  }
  if (isCurrentRequest() && updateView) {
    screenContent.innerHTML = renderRealFeatureScreenById(screenId);
    if (screenId === "students" && realFeatureData.state === "found") {
      void loadRealLinkedProfilePhotoAvatars(realFeatureData.linkedStudents, screenId);
    }
  }
}

function renderRealGraduationCurrent(graduations) {
  const latest = graduations[0];
  if (!latest) return '<div class="notice notice--info">Sem graduação registrada</div>';
  const grade = gradeLabel(latest.faixa, latest.grau);
  return `
    <div class="belt-display belt-display--rank real-graduation-current">
      ${gradeVisual(grade)}
      <span class="belt-copy"><strong>${escapeHtml(grade)}</strong><small>Data: ${escapeHtml(formatRealDate(latest.data_graduacao))}</small></span>
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
              <small>Data: ${escapeHtml(formatRealDate(graduation.data_graduacao))}</small>
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
        <div class="real-academy-list-item">
          ${renderRealLinkedProfileAvatar(selectedStudent)}
          <div class="field user-panel-profile-copy">
            <label for="real-graduation-student">Aluno</label>
            <select id="real-graduation-student">
              ${realProfessorGraduationStudents.map((student) => `<option value="${escapeHtml(student.id)}"${student.id === selectedStudent.id ? " selected" : ""}>${escapeHtml(student.nome)}</option>`).join("")}
            </select>
          </div>
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
                ${beltOrder.map((belt) => `<option value="${escapeHtml(belt)}">${escapeHtml(belt)}</option>`).join("")}
              </select>
            </div>
            <div class="field field--wide">
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
    void loadRealLinkedProfilePhotoAvatars([realProfessorGraduationStudents.find((student) =>
      student.id === realSelectedGraduationStudentId
    )].filter(Boolean), screenId);
  }
}

async function loadRealStudentGraduations(renderScreen = true) {
  const sequence = ++realStudentGraduationsRequestSequence;
  const screenId = "student-grades";
  const userId = realUser && realUser.id;
  realStudentGraduationsState = "checking";
  realStudentGraduationsNotice = "";
  realStudentGraduationsOwnerId = "";
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
    realStudentGraduationsOwnerId = userId;
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

async function loadRealStudentDetailData(updateView = true) {
  const sequence = ++realStudentDetailRequestSequence;
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentRequest = () =>
    sequence === realStudentDetailRequestSequence &&
    sessionGeneration === realSessionCacheGeneration &&
    currentScreen === "student-detail" &&
    Boolean(realUser && realUser.id === userId);
  const studentId = realSelectedGraduationStudentId;
  realFeatureData.state = "checking";
  realFeatureData.error = "";
  if (!studentId || !authClient || !isRealActiveProfessor()) {
    realFeatureData.state = "error";
    realFeatureData.error = "Não foi possível selecionar um aluno vinculado.";
  } else {
    try {
      const [notes, feedbacks, goals] = await Promise.all([
        authClient.rpc("listar_notas_privadas", {
          p_aluno_id: studentId,
          p_aluno_sem_conta_id: null
        }),
        authClient.rpc("listar_feedbacks", { p_aluno_id: studentId }),
        authClient.rpc("listar_metas", { p_aluno_id: studentId })
      ]);
      if (notes.error) throw notes.error;
      if (feedbacks.error) throw feedbacks.error;
      if (goals.error) throw goals.error;
      if (![notes.data, feedbacks.data, goals.data].every(Array.isArray)) throw new TypeError("Lista indisponível.");
      if (!isCurrentRequest()) return;
      realFeatureData.notes = notes.data;
      realFeatureData.feedbacks = feedbacks.data;
      realFeatureData.goals = goals.data;
      realFeatureData.state = "found";
    } catch (error) {
      if (!isCurrentRequest()) return;
      logRealProfileSupabaseError("consultar notas, feedbacks e metas", error);
      realFeatureData.state = "error";
      realFeatureData.error = navigator.onLine === false
        ? "Falha de rede. Verifique sua conexão e tente novamente."
        : "Não foi possível carregar os registros deste aluno. Tente novamente.";
    }
  }
  if (isCurrentRequest() && updateView) {
    screenContent.innerHTML = renderRealProfessorGraduationsScreen();
    void loadRealLinkedProfilePhotoAvatars([realProfessorGraduationStudents.find((student) =>
      student.id === realSelectedGraduationStudentId
    )].filter(Boolean), "student-detail");
  }
}

async function runRealFeatureRpc(functionName, parameters, expectsUuid) {
  if (!authClient || !realUser) return { errorMessage: "Entre novamente para continuar." };
  const professorOnly = [
    "salvar_nota_privada", "excluir_nota_privada", "criar_feedback", "criar_meta",
    "atualizar_status_meta", "criar_grade_semanal", "editar_grade_semanal",
    "arquivar_grade_semanal", "publicar_grade_semanal", "criar_aviso",
    "editar_aviso", "arquivar_aviso", "criar_faq", "editar_faq", "arquivar_faq",
    "definir_status_aluno_vinculado", "definir_status_aluno_sem_conta",
    "criar_aula_avulsa", "excluir_aula_avulsa", "criar_aula_delegada",
    "editar_aula_delegada", "compartilhar_aula_delegada", "criar_plano_semanal",
    "editar_plano_semanal", "compartilhar_plano_semanal", "criar_tema_biblioteca",
    "editar_tema_biblioteca"
  ];
  const professorOrStudent = ["listar_feedbacks", "listar_metas"];
  const validRole = professorOnly.includes(functionName)
    ? isRealActiveProfessor()
    : professorOrStudent.includes(functionName)
      ? isRealActiveProfessor() || isRealActiveStudent()
      : ["professor", "aluno", "instrutor"].includes(realProfile && realProfile.papel) &&
        (isRealActiveProfessor() || isRealActiveStudent() || isRealActiveInstructor());
  if (!validRole) return { errorMessage: "Sua conta não tem permissão para esta ação." };
  const { data, error } = await authClient.rpc(functionName, parameters);
  if (error) {
    logRealProfileSupabaseError(`executar ${functionName}`, error);
    return { errorMessage: "Não foi possível salvar. Confira os dados e tente novamente." };
  }
  const success = expectsUuid
    ? typeof data === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data)
    : data === true;
  return success ? { data } : { errorMessage: "A operação não foi concluída. Confira os dados e tente novamente." };
}

async function reloadRealFeatureScreen() {
  if (currentScreen === "student-detail") await loadRealStudentDetailData();
  else await loadRealFeatureScreen(currentScreen);
}

function renderRealExportButton(action, label) {
  if (!isRealActiveProfessor() && !isRealActiveStudent()) return "";
  const safeAction = escapeHtml(action);
  return `<div class="student-action-control">
    <button class="button button--quiet button--action" type="button" data-real-export="${safeAction}" aria-describedby="real-export-error-${safeAction} real-export-status-${safeAction}">
      <span data-action-label>${escapeHtml(label)}</span>
    </button>
    <p class="login-action-error student-action-error" id="real-export-error-${safeAction}" role="alert"></p>
    <p class="field-help" id="real-export-status-${safeAction}" role="status" aria-live="polite"></p>
  </div>`;
}

function renderRealFeatureStudents() {
  if (!isRealActiveProfessor()) return featureAccessNotice();
  if (realFeatureData.state !== "found") return renderFeatureLoadState();
  const registered = realFeatureData.linkedStudents || [];
  const unregistered = realFeatureData.unregisteredStudents || [];
  const unregisteredNotes = realFeatureData.unregisteredNotes || [];
  const dropIns = realFeatureData.dropIns || [];
  const dropInRows = dropIns.map((entry) => {
    const student = unregistered.find((item) => item.id === entry.aluno_sem_conta_id);
    return student ? `<li>${escapeHtml(student.nome)} · ${escapeHtml(entry.data_aula)}
      ${featureActionButton("delete-drop-in", entry.id, "Excluir diária")}</li>` : "";
  }).join("");
  return `${heading("VISÃO DO PROFESSOR", "Alunos", "Gerencie trancamentos e aulas avulsas dos alunos sem conta.")}
    ${renderRealExportButton("professor-students", "Exportar dados")}
    <div class="content-grid">
      ${panel("Alunos vinculados", registered.length ? registered.map((student) => `<article class="panel-card">
        <div class="real-academy-list-item">
          ${renderRealLinkedProfileAvatar(student)}
          <div class="user-panel-profile-copy">
            <strong>${escapeHtml(student.nome)}</strong><small>${student.status === "locked" ? "Trancado" : "Ativo"}</small>
          </div>
        </div>
        ${featureActionButton("toggle-linked-lock", student.id, student.status === "locked" ? "Destrancar" : "Trancar")}
      </article>`).join("") : emptyState("Nenhum aluno vinculado", "Alunos vinculados aparecerão aqui."))}
      ${panel("Alunos sem conta", unregistered.length ? unregistered.map((student) => `<article class="panel-card">
        <strong>${escapeHtml(student.nome)}</strong><small>${student.status === "locked" ? "Trancado" : "Ativo"}</small>
        ${featureActionButton("toggle-unregistered-lock", student.id, student.status === "locked" ? "Destrancar" : "Trancar")}
        <form data-feature-form="create-drop-in" data-student-id="${escapeHtml(student.id)}">
          <div class="field"><label>Data da aula avulsa</label><input type="date" name="data_aula" required></div>
          ${featureSubmitButton("Registrar diária")}
        </form>
        <form data-feature-form="create-note" data-student-id="${escapeHtml(student.id)}">
          ${renderFeatureTextField("texto", "Nota privada", "", 500, true)}
          ${featureSubmitButton("Salvar nota")}
        </form>
        ${unregisteredNotes.filter((note) => note.aluno_sem_conta_id === student.id).map((note) => `<div class="private-note-entry"><p>${escapeHtml(note.texto)}</p>${featureActionButton("delete-note", note.id, "Excluir nota")}</div>`).join("")}
      </article>`).join("") : emptyState("Nenhum aluno sem conta", "Alunos sem conta aparecerão aqui."))}
      ${panel("Aulas avulsas", dropInRows ? `<ul>${dropInRows}</ul>` : emptyState("Nenhuma diária", "As aulas avulsas registradas aparecerão aqui."))}
    </div>`;
}

screens["training-board"] = renderRealTrainingBoard;
screens["training-plan"] = renderRealTrainingPlan;
screens["student-progress"] = renderRealStudentProgress;

function renderRealHomeShortcuts(items) {
  return `<div class="form-actions">${items.map(([screenId, label]) =>
    `<button class="button button--quiet" type="button" data-screen-target="${escapeHtml(screenId)}">${escapeHtml(label)}</button>`
  ).join("")}</div>`;
}

function renderRealHomeProfileHeader() {
  if (!realProfile || realProfileState !== "found" || realProfile.papel === "adm") return "";
  const isStudent = isRealActiveStudent();
  const isInstructor = isRealActiveInstructor();
  const isLinkedStudent = isStudent && realHomeData && realHomeData.hasLink === true;
  const people = [];
  const academyId = realProfile.academia_id ||
    (realHomeProfileContext.professor && realHomeProfileContext.professor.academiaId) || "";
  const academy = academyId && (realHomeProfileContext.academyName || "Academia vinculada");
  const professor = realHomeProfileContext.professor;
  const ownName = typeof realProfile.nome === "string" && realProfile.nome.trim()
    ? realProfile.nome.trim()
    : "Seu perfil";
  const ownInitial = Array.from(ownName)[0].toLocaleUpperCase("pt-BR");
  const ownPhoto = realHomeProfileContext.ownPhotoUrl;
  const academyInitial = academy ? Array.from(academy)[0].toLocaleUpperCase("pt-BR") : "A";
  const renderPerson = (label, name, initial, photoUrl = "", isPerson = false, profileId = "") => {
    const avatarImageUrl = isPerson ? photoUrl || realPersonAvatarSrc(profileId) : photoUrl;
    const fallbackAttributes = isPerson && !photoUrl && profileId
      ? ` data-avatar-choice-profile-id="${escapeHtml(profileId)}" data-avatar-fallback="true"`
      : "";
    const avatarContent = avatarImageUrl
      ? `<img src="${escapeHtml(avatarImageUrl)}" alt=""${fallbackAttributes}>`
      : escapeHtml(initial);
    return `
      <article class="home-profile-person">
        <span class="home-profile-avatar${isPerson ? " home-profile-avatar--person" : ""}" aria-hidden="true">${avatarContent}</span>
        <span class="home-profile-copy">
          <small>${escapeHtml(label)}</small>
          <strong>${escapeHtml(name)}</strong>
        </span>
      </article>`;
  };
  const academyCard = () => renderPerson("ACADEMIA", academy, academyInitial, realHomeProfileContext.academyPhotoUrl);
  const professorCard = () => professor
    ? renderPerson("PROFESSOR", professor.name, professor.initial, professor.photoUrl, true, professor.id)
    : "";
  const ownCard = () => renderPerson("VOCÊ", ownName, ownInitial, ownPhoto, true, realProfile.id);

  if (isStudent) {
    if (isLinkedStudent) {
      if (academy) people.push(academyCard());
      if (professor) people.push(professorCard());
    }
    people.push(ownCard());
  } else if (isInstructor) {
    people.push(ownCard());
    if (professor) people.push(professorCard());
    if (academy) people.push(academyCard());
  } else if (isRealActiveProfessor()) {
    people.push(ownCard());
    if (academy) people.push(academyCard());
  }
  if (!people.length) return "";
  return `<section class="home-profile-strip" aria-label="Perfil e vínculos">${people.join("")}</section>`;
}

async function loadRealHomeProfilePhoto(profile, isCurrentRequest) {
  if (!profile || !authClient || !isCurrentRequest()) return "";
  try {
    let path = "";
    let bucket = "";
    if (profile.papel === "professor") {
      const { data, error } = await authClient.from("professores_fotos")
        .select("caminho_storage").eq("professor_id", profile.id).maybeSingle();
      if (!isCurrentRequest()) return "";
      if (error) {
        logRealProfileSupabaseError("consultar foto do Professor na tela inicial", error);
        return "";
      }
      path = data && data.caminho_storage;
      bucket = "professores";
    } else if (profile.papel === "instrutor" ||
        (profile.papel === "aluno" && profile.idade_declarada === "adulto")) {
      const { data, error } = await authClient.rpc("obter_foto_perfil", {
        p_perfil_id: profile.id
      });
      if (!isCurrentRequest()) return "";
      if (error) {
        logRealProfileSupabaseError("consultar foto de perfil na tela inicial", error);
        return "";
      }
      const photo = Array.isArray(data) ? data[0] : null;
      path = photo && photo.caminho_storage;
      bucket = "perfis";
    }
    if (typeof path !== "string" || !path) return "";
    const signed = await createStorageSignedUrl(bucket, path, "foto do perfil na tela inicial");
    return isCurrentRequest() ? signed.signedUrl || "" : "";
  } catch (error) {
    if (isCurrentRequest()) logRealProfileSupabaseError("carregar foto de perfil na tela inicial", error);
    return "";
  }
}

async function loadRealHomeProfileContext(professorId) {
  const sequence = ++realHomeProfileRequestSequence;
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentRequest = () =>
    sequence === realHomeProfileRequestSequence &&
    sessionGeneration === realSessionCacheGeneration &&
    currentScreen === "home" &&
    Boolean(realUser && realUser.id === userId);
  const context = { academyName: "", academyPhotoUrl: "", professor: null, ownPhotoUrl: "" };
  realHomeProfileContext = context;
  if (!authClient || !realUser || !realProfile || realProfileState !== "found") return;
  const academyIds = new Set(
    [realProfile.academia_id].filter((id) => typeof id === "string" && id)
  );
  const loadAcademy = async (academyId) => {
    try {
      const { data, error } = await authClient.from("academias").select("nome")
        .eq("id", academyId).maybeSingle();
      if (!isCurrentRequest()) return;
      if (error) {
        logRealProfileSupabaseError("consultar nome da academia na tela inicial", error);
        return;
      }
      if (data && typeof data.nome === "string") context.academyName = data.nome.trim();
      context.academyPhotoUrl = await loadRealAcademyPhotoUrl(academyId);
    } catch (error) {
      if (isCurrentRequest()) logRealProfileSupabaseError("carregar dados da academia na tela inicial", error);
    }
  };
  const loadProfessor = async () => {
    if (typeof professorId !== "string" || !professorId) return;
    try {
      const { data, error } = await authClient.from("perfis")
        .select("id,nome,academia_id").eq("id", professorId).maybeSingle();
      if (!isCurrentRequest()) return;
      if (error) {
        logRealProfileSupabaseError("consultar Professor vinculado na tela inicial", error);
        return;
      }
      const name = data && typeof data.nome === "string" ? data.nome.trim() : "";
      if (!data || !name) return;
      if (typeof data.academia_id === "string" && data.academia_id) academyIds.add(data.academia_id);
      const photo = await authClient.from("professores_fotos").select("caminho_storage")
        .eq("professor_id", professorId).maybeSingle();
      if (!isCurrentRequest()) return;
      let photoUrl = "";
      if (photo.error) {
        logRealProfileSupabaseError("consultar foto do Professor vinculado", photo.error);
      } else if (photo.data && typeof photo.data.caminho_storage === "string") {
        const signed = await createStorageSignedUrl("professores", photo.data.caminho_storage, "foto do Professor vinculado");
        if (isCurrentRequest()) photoUrl = signed.signedUrl || "";
      }
      context.professor = {
        id: professorId,
        name,
        initial: Array.from(name)[0].toLocaleUpperCase("pt-BR"),
        photoUrl,
        academiaId: typeof data.academia_id === "string" ? data.academia_id : ""
      };
    } catch (error) {
      if (isCurrentRequest()) logRealProfileSupabaseError("carregar Professor vinculado na tela inicial", error);
    }
  };

  const ownPhotoPromise = loadRealHomeProfilePhoto(realProfile, isCurrentRequest)
    .then((photoUrl) => { if (isCurrentRequest()) context.ownPhotoUrl = photoUrl; });
  const professorPromise = loadProfessor();
  await Promise.all([ownPhotoPromise, professorPromise]);
  if (!isCurrentRequest()) return;
  const avatarChoiceState = await loadRealAvatarPreferences([
    userId,
    context.professor && context.professor.id
  ]);
  if (!isCurrentRequest()) return;
  realAvatarChoiceOwnerId = userId;
  realAvatarChoiceState = avatarChoiceState;
  void loadRealUserPanelMedia();
  const academyId = [...academyIds][0];
  if (academyId) await loadAcademy(academyId);
  if (!isCurrentRequest()) return;
  realHomeProfileContext = context;
  screenContent.innerHTML = renderRealHomeScreen();
}

function renderRealHomeScreen() {
  if (!isRealActiveProfessor() && !isRealActiveStudent() && !isRealActiveInstructor()) {
    return featureAccessNotice();
  }
  const isProfessor = isRealActiveProfessor();
  const isStudent = isRealActiveStudent();
  const isInstructor = isRealActiveInstructor();
  const profileHeader = renderRealHomeProfileHeader();
  const title = isProfessor
    ? heading("VISÃO DO PROFESSOR", "Início", "Acompanhe pendências e acesse suas ferramentas.")
    : isStudent
      ? heading("VISÃO DO ALUNO", "Início", "Veja o que precisa de atenção e escolha o próximo passo.")
      : heading("VISÃO DO INSTRUTOR", "Início", "Consulte a aula compartilhada e acesse seus alunos.");

  if (realHomeState === "idle" || realHomeState === "checking") {
    return `${title}${profileHeader}<div class="notice notice--info" role="status" aria-live="polite">Carregando seu resumo...</div>`;
  }
  if (realHomeState === "error") {
    return `${title}${profileHeader}
      <div class="notice notice--pending" role="alert">${escapeHtml(realHomeNotice)}</div>
      <div class="student-action-control">
        <button class="button button--primary button--action" type="button" data-real-home-retry aria-describedby="real-home-retry-error real-home-retry-status">
          <span data-action-label>Tentar novamente</span>
        </button>
        <p class="login-action-error student-action-error" id="real-home-retry-error" role="alert"></p>
        <p class="field-help" id="real-home-retry-status" role="status" aria-live="polite"></p>
      </div>`;
  }

  const data = realHomeData || {};
  if (isProfessor) {
    const pendingPayments = data.pendingPayments || 0;
    const lateCharges = data.lateCharges || 0;
    const shortcuts = [
      ["students", "Alunos"],
      ["teacher-code", "Código e convites"]
    ];
    const nextAction = pendingPayments
      ? button("Revisar pagamentos", "payment-review", "button button--primary")
      : lateCharges
        ? button("Ver cobranças atrasadas", "monthly-charges", "button button--primary")
        : button("Ver alunos", "students", "button button--primary");
    return `${title}${profileHeader}
      <div class="summary-grid">
        ${metric("PAGAMENTOS A CONFIRMAR", String(pendingPayments), "Avisos aguardando decisão", "amber")}
        ${metric("COBRANÇAS ATRASADAS", String(lateCharges), "Mês selecionado", lateCharges ? "red" : "green")}
      </div>
      ${pendingPayments || lateCharges ? "" : emptyState("Tudo em dia", "Não há pagamentos aguardando decisão nem cobranças atrasadas.")}
      ${panel("Próxima ação", nextAction)}
      ${panel("Atalhos", renderRealHomeShortcuts(shortcuts))}`;
  }
  if (isStudent) {
    const counts = data.monthCounts || { pending: 0, paid: 0, late: 0, exempt: 0 };
    if (!data.hasLink) {
      return `${title}${profileHeader}
        ${panel("Próxima ação", `<p>Vincule seu perfil a um Professor para consultar os dados da academia.</p>${button("Vincular a um Professor", "link-teacher", "button button--primary")}`)}`;
    }
    const hasPending = counts.pending > 0 || counts.late > 0;
    return `${title}${profileHeader}
      ${data.monthChargeCount
        ? `<div class="summary-grid">
            ${metric("PENDENTES", String(counts.pending), "Cobranças dentro do prazo", "amber")}
            ${metric("ATRASADAS", String(counts.late), "Cobranças que precisam de atenção", "red")}
          </div>`
        : emptyState("Nenhuma cobrança neste mês", "As cobranças enviadas pelo Professor aparecerão aqui.")}
      ${panel(hasPending ? "Próxima ação" : "Tudo em dia", hasPending
        ? button("Ver pagamentos", "student-payments", "button button--primary")
        : `<p>Não há pagamentos pendentes neste mês.</p>${button("Ver graduações", "student-grades", "button button--quiet")}`)}`;
  }
  return `${title}${profileHeader}
    ${panel("Próxima ação", `<p>Confira a aula delegada e o plano compartilhado pelo Professor.</p>${renderRealHomeShortcuts([
      ["instructor-class", "Abrir Aula"],
      ["training-plan", "Ver Plano semanal"]
    ])}`)}`;
}

async function loadRealHomeData(renderScreen = true) {
  const sequence = ++realHomeRequestSequence;
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentRequest = () =>
    sequence === realHomeRequestSequence &&
    sessionGeneration === realSessionCacheGeneration &&
    currentScreen === "home" &&
    Boolean(realUser && realUser.id === userId);

  realHomeState = "checking";
  realHomeNotice = "";
  realHomeData = null;
  realHomeProfileContext = { academyName: "", academyPhotoUrl: "", professor: null, ownPhotoUrl: "" };
  realHomeProfileRequestSequence += 1;
  renderMobileNavigation();

  try {
    if (!authClient || !realUser) throw new Error("Entre com sua conta real para carregar o Início.");
    if (isRealActiveProfessor()) {
      await Promise.all([
        loadRealProfessorPaymentsData(false, true),
        loadRealBillingData(true)
      ]);
      if (!isCurrentRequest()) return false;
      if (realProfessorPaymentsState !== "found" || realBillingState !== "found") {
        throw new Error(realProfessorPaymentsNotice || realBillingNotice ||
          "Não foi possível carregar pagamentos e cobranças. Tente novamente.");
      }
      const lateCharges = realBillingCharges.filter((charge) =>
        charge.status === "aberta" &&
        realBillingBalance(charge, realBillingPayments) > 0n &&
        realBillingIsLate(charge)
      ).length;
      realHomeData = {
        pendingPayments: realProfessorPayments.filter((payment) => payment.status === "pendente").length,
        lateCharges
      };
    } else if (isRealActiveStudent()) {
      const { data: link, error } = await authClient.from("vinculos")
        .select("professor_id").eq("aluno_id", realUser.id).maybeSingle();
      if (error) throw error;
      if (!isCurrentRequest()) return false;
      const month = realGraduationToday().slice(0, 7);
      if (!link) {
        realStudentCharges = [];
        realStudentPayments = [];
        realHomeData = {
          hasLink: false,
          month,
          monthChargeCount: 0,
          monthCounts: { pending: 0, paid: 0, late: 0, exempt: 0 }
        };
      } else {
        await loadRealStudentPayments(false, true);
        if (!isCurrentRequest()) return false;
        if (realStudentPaymentsState !== "found") {
          throw new Error(realStudentPaymentsNotice || "Não foi possível carregar suas cobranças. Tente novamente.");
        }
        const monthCharges = realStudentCharges.filter((charge) =>
          typeof charge.mes === "string" && charge.mes.slice(0, 7) === month
        );
        const monthCounts = { pending: 0, paid: 0, late: 0, exempt: 0 };
        for (const charge of monthCharges) {
          const balance = realBillingBalance(charge, realStudentPayments);
          if (charge.status === "isenta") monthCounts.exempt += 1;
          else if (charge.status === "paga" || balance <= 0n) monthCounts.paid += 1;
          else if (realBillingIsLate(charge)) monthCounts.late += 1;
          else monthCounts.pending += 1;
        }
        realHomeData = {
          hasLink: true,
          professorId: link.professor_id,
          month,
          monthChargeCount: monthCharges.length,
          monthCounts
        };
      }
    } else if (isRealActiveInstructor()) {
      realHomeData = {};
    } else {
      throw new Error("Esta conta não tem permissão para carregar o Início.");
    }
    if (!isCurrentRequest()) return false;
    realHomeState = "found";
  } catch (error) {
    if (!isCurrentRequest()) return false;
    logRealProfileSupabaseError("carregar Início", error);
    realHomeState = "error";
    realHomeNotice = error instanceof Error && error.message
      ? error.message
      : navigator.onLine === false
        ? "Falha de rede ao carregar o Início. Verifique a conexão e tente novamente."
        : "Não foi possível carregar o Início. Tente novamente.";
  }

  if (isCurrentRequest()) {
    const professorId = isRealActiveStudent()
      ? realHomeData && realHomeData.professorId
      : isRealActiveInstructor() && realInstructorLink
        ? realInstructorLink.professor_id
        : "";
    void loadRealHomeProfileContext(professorId);
    renderNavigation();
    if (renderScreen) screenContent.innerHTML = renderRealHomeScreen();
  }
  return realHomeState === "found";
}

function renderScreen(id) {
  const screen = screens[id];
  const isRealAdmin = isRealAdmSession();
  const isRealAdminHome = id === "admin-home" && isRealAdmin;
  const isRealHome = id === "home" &&
    (isRealActiveProfessor() || isRealActiveStudent() || isRealActiveInstructor());
  const isRealProfessorAcademy = id === "academy" && isRealActiveProfessor();
  const isRealUserSettings = id === "user-settings" && Boolean(realUser);
  const isRealStudentLink = id === "link-teacher" && isRealActiveStudent();
  const isRealStudentPayments = id === "student-payments" && isRealActiveStudent();
  const isRealProfessorPayments = id === "payment-review" && isRealActiveProfessor();
  const isRealProfessorGraduations = id === "student-detail" && isRealActiveProfessor();
  const isRealStudentGraduations = id === "student-grades" && isRealActiveStudent();
  const realAdminRenderer = isRealAdmin
    ? {
      "admin-home": renderRealAdminDashboardScreen,
      "admin-students": renderRealAdminStudentsScreen,
      academy: renderRealAdminAcademyScreen,
      "teacher-invites": renderRealAdminInvitesScreen,
      "role-management": renderRealAdminManagementScreen
    }[id]
    : null;
  const realProfessorAcademyRenderer = isRealProfessorAcademy
    ? renderRealProfessorAcademyScreen
    : null;
  const isRealTeacherCode = id === "teacher-code" && isRealProfessorProfile();
  const isRealBilling = id === "monthly-charges" && isRealActiveProfessor();
  const isRealChatScreen = ["teacher-chat", "student-chat", "instructor-chat"].includes(id) &&
    (isRealActiveProfessor() || isRealActiveStudent() || isRealActiveInstructor());
  const isRealDelegationScreen = (id === "role-management" && isRealActiveProfessor()) ||
    (id === "instructor-class" && isRealActiveInstructor());
  const isRealFeatureScreen = (
    ["training-board", "training-plan", "student-progress"].includes(id) ||
      isRealChatScreen || isRealDelegationScreen
  ) && (isRealActiveProfessor() || isRealActiveStudent() || isRealActiveInstructor());
  const isRealStudentsScreen = id === "students" && isRealActiveProfessor();
  const isRealInstructorStudents = id === "instructor-students" && isRealActiveInstructor();
  const isRealInstructorInvite = id === "instructor-invite" &&
    (Boolean(realUser) || Boolean(realInstructorInviteToken));
  const realFeatureRenderer = isRealFeatureScreen
    ? () => renderRealFeatureScreenById(id)
    : isRealStudentsScreen ? renderRealFeatureStudents : null;
  const screenRenderer = isRealInstructorInvite
    ? renderRealInstructorInviteScreen
    : isRealHome
    ? renderRealHomeScreen
    : isRealUserSettings
    ? renderRealUserSettingsScreen
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
    : realProfessorAcademyRenderer || realFeatureRenderer || realAdminRenderer || screen;
  if (!screenRenderer || !canViewScreen(id)) {
    const message = realUser && ["academy", "teacher-invites", "role-management", "admin-students"].includes(id)
      ? "Esta tela está disponível somente para uma conta real com papel Adm."
      : "Esta tela não está disponível para o papel desta conta.";
    showToast(message, "error");
    return;
  }

  const changedScreen = currentScreen !== id;
  currentScreen = id;
  if (changedScreen) {
    window.clearTimeout(realPaymentUndoTimer);
    realPaymentReceiptChargeId = "";
  }
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
  if (isRealProfessorAcademy) {
    realProfessorAcademy = null;
    realProfessorAcademyState = "checking";
    realProfessorAcademyNotice = "";
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
  if (isRealAdminHome) {
    realAdminDashboardAcademies = [];
    realAdminDashboardProfessors = [];
    realAdminProfessorPhotoUrls = new Map();
    realAdminDashboardStudents = 0;
    realAdminDashboardPendingInvites = 0;
    realAdminDashboardState = "checking";
    realAdminDashboardNotice = "";
  }
  if (isRealProfessorPayments) {
    realBillingGraceDays = null;
    realBillingStudentNames = new Map();
    realBillingStudentsState = "checking";
    realBillingStudentsNotice = "";
    realProfessorPayments = [];
    realProfessorCharges = [];
    realProfessorPaymentsState = "checking";
    realProfessorPaymentsNotice = "";
  }
  if (isRealStudentPayments) {
    realBillingGraceDays = null;
    realPaymentAcademyName = "";
    realPaymentAcademyPhotoUrl = "";
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
    realStudentGraduationsOwnerId = "";
  }
  if (isRealStudentLink) {
    realStudentLinkState = "checking";
    realStudentLinkRequest = null;
    realStudentLinkNotice = "";
  }
  if (isRealHome) {
    realHomeState = "checking";
    realHomeNotice = "";
    realHomeData = null;
  }
  screenContent.innerHTML = screenRenderer();
  if (isRealHome) loadRealHomeData();
  if (isRealFeatureScreen || isRealStudentsScreen) loadRealFeatureScreen(id);
  if (isRealAdminHome) loadRealAdminDashboard();
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
  if (isRealUserSettings) loadRealProfessorPhotoSettings();
  if (isRealTeacherCode) loadRealTeacherCode();
  if (isRealTeacherCode) loadRealInstructorInvites();
  if (isRealStudentLink) loadRealStudentLinkStatus();
  if (id === "teacher-invites" && isRealAdmSession()) loadRealAdminInvites();
  if (id === "academy" && isRealAdmSession()) loadRealAdminAcademiesForEdit();
  if (isRealProfessorAcademy) loadRealProfessorAcademy();
  if (id === "role-management" && isRealAdmSession()) loadRealAdminManagement();
  screenContent.querySelectorAll('input[type="email"]').forEach(updateEmailPreview);
  const screenTitle = id === "role-management" && isRealProfessorProfile()
    ? "Aula delegada"
    : screenInfo[id].title;
  currentTitle.textContent = screenTitle;
  document.title = `${screenTitle} | Tatame`;
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
        <button class="button button--small button--quiet button--action" type="button" data-real-billing-edit-rule="${escapeHtml(rule.id)}" aria-describedby="real-rule-error-${escapeHtml(rule.id)} real-rule-status-${escapeHtml(rule.id)}${canEdit ? "" : ` real-rule-student-unavailable-${escapeHtml(rule.id)}`}"${canEdit ? "" : " disabled"}><span data-action-label>Editar</span></button>
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

function realBillingBalance(charge, payments) {
  return realBillingIntegerCents(charge.valor_final_centavos) -
    realPaymentTotalForCharge(charge.id, "confirmado", payments);
}

function realBillingSummary(charges = realBillingCharges, payments = realBillingPayments) {
  const sum = (charges, predicate, field = "valor_final_centavos") => charges
    .filter(predicate)
    .reduce((total, charge) => total + realBillingIntegerCents(charge[field]), 0n);
  const balanceSum = (predicate) => charges
    .filter(predicate)
    .reduce((total, charge) => total + realBillingBalance(charge, payments), 0n);
  return {
    expected: sum(charges, (charge) => charge.status !== "cancelada"),
    confirmed: payments
      .filter((payment) => payment.status === "confirmado")
      .reduce((total, payment) => total + realBillingIntegerCents(payment.valor_centavos), 0n),
    pending: payments
      .filter((payment) => payment.status === "pendente")
      .reduce((total, payment) => total + realBillingIntegerCents(payment.valor_centavos), 0n),
    open: balanceSum((charge) => charge.status === "aberta" && !realBillingIsLate(charge)),
    late: balanceSum((charge) => charge.status === "aberta" && realBillingIsLate(charge)),
    exempt: sum(charges, (charge) => charge.status === "isenta", "valor_base_centavos"),
    exemptCount: charges.filter((charge) => charge.status === "isenta").length
  };
}

function realProfessorMonthSummary(month) {
  const charges = realProfessorCharges.filter((charge) =>
    typeof charge.mes === "string" && charge.mes.slice(0, 7) === month
  );
  const chargeIds = new Set(charges.map((charge) => charge.id));
  const payments = realProfessorPayments.filter((payment) => chargeIds.has(payment.cobranca_id));
  return { ...realBillingSummary(charges, payments), charges };
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
  const visibleCharges = realBillingLateOnly
    ? realBillingCharges.filter((charge) =>
      charge.status === "aberta" &&
      realBillingBalance(charge, realBillingPayments) > 0n &&
      realBillingIsLate(charge)
    )
    : realBillingCharges;
  const chargeRows = ready && visibleCharges.length
    ? visibleCharges.map(renderRealMonthlyChargeRow).join("")
    : ready ? emptyState(
      realBillingLateOnly ? "Nenhuma cobrança atrasada" : "Nenhuma cobrança neste mês",
      realBillingLateOnly ? "Não há cobranças em atraso neste mês." : "Salve as regras e gere as cobranças do mês."
    )
      : loading
        ? '<p class="field-help" role="status" aria-live="polite">Consultando cobranças e alunos vinculados...</p>'
        : "";
  return `
    ${heading("VISÃO DO PROFESSOR", "Cobranças mensais", "Configure regras, gere cobranças e acompanhe as cobranças do mês.")}
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
              <div class="field" hidden><label for="real-billing-discount-value">Desconto em R$</label><input id="real-billing-discount-value" type="text" inputmode="decimal"${disabled}></div>
              <div class="field" hidden><label for="real-billing-discount-percent">Desconto em %</label><input id="real-billing-discount-percent" type="text" inputmode="decimal"${disabled}></div>
              <div class="field"><label for="real-billing-duration">Duração</label><select id="real-billing-duration" required${disabled}>
                <option value="este_mes">Só este mês</option>
                <option value="n_meses">N meses</option>
                <option value="ate_remover">Até remover</option>
              </select></div>
              <div class="field" hidden><label for="real-billing-duration-months">Número de meses</label><input id="real-billing-duration-months" type="number" min="1" step="1"${disabled}></div>
            </div>
            <div class="field" hidden><label for="real-billing-reason">Motivo opcional da isenção</label><textarea id="real-billing-reason" maxlength="400"${disabled}></textarea></div>
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
          <button class="button ${realBillingLateOnly ? "button--primary" : "button--quiet"}" type="button" data-real-billing-late-filter aria-pressed="${realBillingLateOnly}" aria-label="Filtrar cobranças atrasadas"${disabled}>Atrasadas</button>
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

async function loadRealBillingData(allowHome = false) {
  const sequence = ++realBillingRequestSequence;
  const screenId = allowHome ? "home" : "monthly-charges";
  realBillingState = "checking";
  realBillingNotice = "";
  realBillingPayments = [];
  if (!authClient || !realUser || !isRealActiveProfessor()) {
    realBillingState = "error";
    realBillingNotice = "Esta tela exige uma conta Google de Professor ativa.";
    if (!allowHome && currentScreen === screenId) screenContent.innerHTML = renderRealBillingScreen();
    return;
  }
  if (!allowHome && currentScreen === screenId) screenContent.innerHTML = renderRealBillingScreen();

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
    if (sequence !== realBillingRequestSequence || currentScreen !== screenId) return;
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
    if (sequence !== realBillingRequestSequence || currentScreen !== screenId) return;
    realBillingRules = rulesResult.data;
    realBillingCharges = chargesResult.data;
    realBillingPayments = payments;
    realBillingGraceDays = academyResult.data.dias_carencia;
    realBillingState = "found";
  } catch (error) {
    if (sequence !== realBillingRequestSequence || currentScreen !== screenId) return;
    logRealProfileSupabaseError("consultar cobranças do Professor", error);
    realBillingState = "error";
    realBillingNotice = realBillingErrorMessage(error);
  }

  if (!allowHome && sequence === realBillingRequestSequence && currentScreen === screenId) {
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

function realPaymentTotalForCharge(chargeId, status, payments) {
  return payments
    .filter((payment) => payment.cobranca_id === chargeId && payment.status === status)
    .reduce((total, payment) => total + realBillingIntegerCents(payment.valor_centavos), 0n);
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

function setRealProofCleanupNotice(message) {
  if (typeof message !== "string") throw new TypeError("Aviso de remoção de comprovante inválido.");
  realProofCleanupNotice = message;
}

async function uploadPaymentProof(paymentId, file) {
  const failureMessage = "Não foi possível registrar o comprovante. Atualize os pagamentos e tente novamente.";
  if (!authClient || !realUser || !isRealActiveStudent() || typeof paymentId !== "string" || !paymentId) {
    return { errorMessage: "Esta ação exige uma conta real de Aluno ativa." };
  }
  const validationError = validateStorageFile(
    file,
    REAL_PAYMENT_PROOF_MIME_TYPES,
    REAL_PAYMENT_PROOF_MAX_BYTES,
    "o comprovante"
  );
  if (validationError) return { errorMessage: validationError };
  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf"
  }[file.type];
  if (!extension || !window.crypto || typeof window.crypto.randomUUID !== "function") {
    return { errorMessage: "Não foi possível preparar o arquivo. Atualize o navegador e tente novamente." };
  }
  const path = `${paymentId}/${window.crypto.randomUUID()}.${extension}`;
  const userId = realUser.id;
  const sessionGeneration = realSessionCacheGeneration;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration && Boolean(realUser && realUser.id === userId);
  let uploadSucceeded = false;
  const removeUnregisteredFile = async () => {
    try {
      const { error } = await authClient.storage.from("comprovantes").remove([path]);
      if (error) {
        logRealProfileSupabaseError("remover comprovante não registrado", error);
        return false;
      }
      return true;
    } catch (error) {
      logRealProfileSupabaseError("remover comprovante não registrado", error);
      return false;
    }
  };
  try {
    const { error: uploadError } = await authClient.storage.from("comprovantes").upload(path, file, {
      cacheControl: "0",
      contentType: file.type,
      upsert: false
    });
    if (uploadError) {
      logRealProfileSupabaseError("enviar comprovante", uploadError);
      return { errorMessage: "Não foi possível enviar o comprovante. Confira a conexão e tente novamente." };
    }
    uploadSucceeded = true;
    if (!isCurrentSession()) {
      await removeUnregisteredFile();
      return { errorMessage: "A sessão mudou. Atualize os pagamentos e tente novamente." };
    }
    const result = await callRealPaymentRpc("registrar_comprovante_pagamento", {
      p_pagamento_id: paymentId,
      p_caminho_storage: path,
      p_tipo_mime: file.type
    }, "student", failureMessage);
    if (result.errorMessage || result.data !== true) {
      const removed = await removeUnregisteredFile();
      return {
        errorMessage: removed
          ? result.errorMessage || failureMessage
          : "O comprovante foi enviado, mas não pôde ser registrado nem removido. Atualize os pagamentos e tente novamente."
      };
    }
    return {};
  } catch (error) {
    logRealProfileSupabaseError("enviar ou registrar comprovante", error);
    if (uploadSucceeded && isCurrentSession()) await removeUnregisteredFile();
    return { errorMessage: "Não foi possível enviar o comprovante. Confira a conexão e tente novamente." };
  }
}

async function removeRegisteredPaymentProof(paymentId, path, role) {
  const failureMessage = "Não foi possível remover o comprovante. Ele será tentado novamente ao atualizar os pagamentos.";
  if (!authClient || !realUser || !["student", "professor"].includes(role) ||
      !(role === "student" ? isRealActiveStudent() : isRealActiveProfessor())) {
    return { errorMessage: "Esta ação exige uma conta ativa com a permissão necessária." };
  }
  const proofs = role === "student" ? realStudentPaymentProofs : realProfessorPaymentProofs;
  const proof = proofs.get(paymentId);
  if (!proof || typeof path !== "string" || proof.caminho_storage !== path) {
    return { errorMessage: "O comprovante não está disponível para remoção. Atualize os pagamentos e tente novamente." };
  }
  if (proof.estado_arquivo === "removido") return {};
  const userId = realUser.id;
  const sessionGeneration = realSessionCacheGeneration;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration && Boolean(realUser && realUser.id === userId);
  try {
    const request = await callRealPaymentRpc("registrar_remocao_comprovante_pagamento", {
      p_pagamento_id: paymentId,
      p_arquivo_removido: false
    }, role, failureMessage);
    if (request.errorMessage) return request;
    if (request.data !== true) return { errorMessage: failureMessage };
    if (!isCurrentSession()) return { errorMessage: "A sessão mudou. Atualize os pagamentos e tente novamente." };

    const { error: removalError } = await authClient.storage.from("comprovantes").remove([path]);
    if (removalError) {
      logRealProfileSupabaseError("remover comprovante do Storage", removalError);
      return { errorMessage: failureMessage };
    }
    if (!isCurrentSession()) return { errorMessage: "A sessão mudou. Atualize os pagamentos e tente novamente." };

    const confirmation = await callRealPaymentRpc("registrar_remocao_comprovante_pagamento", {
      p_pagamento_id: paymentId,
      p_arquivo_removido: true
    }, role, failureMessage);
    if (confirmation.errorMessage) return confirmation;
    if (confirmation.data !== true) return { errorMessage: failureMessage };
    proofs.set(paymentId, { ...proof, estado_arquivo: "removido" });
    return {};
  } catch (error) {
    logRealProfileSupabaseError("remover comprovante do Storage", error);
    return { errorMessage: failureMessage };
  }
}

function renderRealStudentPaymentRow(charge) {
  const payments = realStudentPayments.filter((payment) => payment.cobranca_id === charge.id);
  const statusLabel = charge.status === "aberta" && realBillingIsLate(charge)
    ? "Atrasada"
    : ({ aberta: "Em aberto", paga: "Paga", isenta: "Isenta" })[charge.status] || "Indisponível";
  const balance = realBillingBalance(charge, realStudentPayments);
  const pendingPayment = payments.find((payment) => payment.status === "pendente");
  const pendingProof = pendingPayment && pendingPayment.tipo === "comprovante" &&
    !realStudentPaymentProofs.has(pendingPayment.id) && !realPaymentProofsNotice;
  return `
    <article class="monthly-charge-row" data-real-student-charge="${escapeHtml(charge.id)}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(formatRealDate(charge.mes).slice(3))}</strong><small>Vencimento: ${escapeHtml(formatRealDate(charge.vencimento))}</small></span>
        <span class="badge ${charge.status === "paga" ? "badge--green" : statusLabel === "Atrasada" ? "badge--red" : "badge--pending"}">${statusLabel}</span>
      </div>
      <div class="monthly-charge-values">
        ${listRow("Valor final", "", formatRealBillingCents(charge.valor_final_centavos))}
        ${listRow("Saldo", "", formatRealBillingCents(balance))}
      </div>
      ${payments.length ? `
        <div class="stack">
          ${payments.map((payment) => {
            const proof = realStudentPaymentProofs.get(payment.id);
            const proofLabel = proof
              ? proof.estado_arquivo === "ativo" ? "Comprovante anexado."
                : proof.estado_arquivo === "remocao_pendente" ? "Remoção do comprovante pendente."
                  : "Comprovante removido."
              : "";
            return `<p class="field-help">${escapeHtml(realPaymentStatusLabel(payment.status))} · ${escapeHtml(payment.tipo)} · ${formatRealBillingCents(payment.valor_centavos)} · ${realBillingTimestamp(payment.criado_em)}${proofLabel ? ` · ${proofLabel}` : ""}</p>`;
          }).join("")}
        </div>
      ` : ""}
      ${pendingProof ? `
        <div class="student-proof-retry">
          <label class="field">Comprovante opcional
            <input type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" aria-label="Arquivo do comprovante">
            <small class="field-help">JPG, PNG ou PDF, até 10 MiB.</small>
          </label>
          <button class="button button--small button--primary button--action" type="button" data-real-student-proof-upload="${escapeHtml(pendingPayment.id)}" aria-describedby="student-proof-retry-error-${escapeHtml(pendingPayment.id)} student-proof-retry-status-${escapeHtml(pendingPayment.id)}"><span data-action-label>Anexar comprovante</span></button>
          <p class="login-action-error student-action-error" id="student-proof-retry-error-${escapeHtml(pendingPayment.id)}" role="alert"></p>
          <p class="field-help" id="student-proof-retry-status-${escapeHtml(pendingPayment.id)}" role="status" aria-live="polite"></p>
        </div>
      ` : ""}
      ${pendingPayment ? '<p class="notice notice--pending">Há um aviso de pagamento aguardando confirmação do Professor.</p>' : ""}
    </article>
  `;
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
    return `${heading("VISÃO DO ALUNO", "Meus pagamentos", "Carregando suas cobranças e pagamentos.")}<div class="notice notice--info" role="status">Carregando...</div>`;
  }
  if (realStudentPaymentsState === "error") {
    return `${heading("VISÃO DO ALUNO", "Meus pagamentos", "Consulte somente suas cobranças enviadas pelo Professor.")}<div class="notice notice--pending" role="alert">${escapeHtml(realStudentPaymentsNotice)}</div><div class="student-action-control"><button class="button button--primary button--action" type="button" data-real-student-payments-retry aria-describedby="real-student-retry-error real-student-retry-status"><span data-action-label>Tentar novamente</span></button><p class="login-action-error student-action-error" id="real-student-retry-error" role="alert"></p><p class="field-help" id="real-student-retry-status" role="status" aria-live="polite"></p></div>`;
  }
  return `
    ${heading("VISÃO DO ALUNO", "Meus pagamentos", "Consulte suas cobranças enviadas pelo Professor e avise quando realizar um pagamento.")}
    ${realPaymentProofsNotice ? `<div class="notice notice--pending" role="alert">${escapeHtml(realPaymentProofsNotice)}</div>` : ""}
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
                ${openCharges.map((charge) => `<option value="${escapeHtml(charge.id)}">${escapeHtml(formatRealDate(charge.mes).slice(3))} · saldo ${formatRealBillingCents(realBillingBalance(charge, realStudentPayments))}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="real-student-payment-type">Tipo</label>
              <select id="real-student-payment-type" required>
                <option value="dinheiro">Dinheiro</option>
                <option value="comprovante">Comprovante (opcional)</option>
              </select>
            </div>
            <div class="field">
              <label for="real-student-payment-amount">Valor pago</label>
              <input id="real-student-payment-amount" type="number" min="0.01" step="0.01" max="${realBillingCentsInput(realBillingBalance(defaultCharge, realStudentPayments))}" required>
              <small class="field-help">O valor não pode ultrapassar o saldo da cobrança.</small>
            </div>
            <div class="field field--wide" id="real-student-proof-field" hidden>
              <label for="real-student-proof-file">Comprovante (opcional)</label>
              <input id="real-student-proof-file" type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf">
              <small class="field-help">JPG, PNG ou PDF, até 10 MiB. O aviso pode ser enviado sem arquivo.</small>
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
  const proof = realProfessorPaymentProofs.get(payment.id);
  const proofCreatedAt = proof ? Date.parse(proof.criado_em) : NaN;
  const canViewProof = Boolean(proof && proof.estado_arquivo === "ativo" &&
    Number.isFinite(proofCreatedAt) && proofCreatedAt > Date.now() - 30 * 24 * 60 * 60 * 1000);
  const isPending = payment.status === "pendente";
  const canUndo = realPaymentUndoDeadline(payment) > Date.now();
  const actions = [
    ...(isPending ? [
      `<button class="button button--small button--primary button--action" type="button" data-real-payment-action="confirmar" data-real-payment-id="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Confirmar</span></button>`,
      `<button class="button button--small button--danger button--action" type="button" data-real-payment-action="rejeitar" data-real-payment-id="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Rejeitar</span></button>`
    ] : payment.status === "confirmado" ? [
      ...(canUndo ? [`<button class="button button--small button--quiet button--action" type="button" data-real-payment-action="desfazer" data-real-payment-id="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Desfazer</span></button>`] : []),
      `<button class="button button--small button--danger button--action" type="button" data-real-payment-action="estornar" data-real-payment-id="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Estornar</span></button>`
    ] : []),
    ...(canViewProof ? [
      `<button class="button button--small button--quiet button--action" type="button" data-real-proof-view="${paymentId}" aria-describedby="real-payment-error-${paymentId} real-payment-status-${paymentId}"><span data-action-label>Ver comprovante</span></button>`
    ] : [])
  ].join("");
  return `
    <article class="payment-review-row" data-real-payment-row="${paymentId}">
      <div class="list-row">
        <span class="row-copy"><strong>${escapeHtml(studentName)}</strong><small>${escapeHtml(formatRealDate(charge.mes).slice(3))} · vence ${escapeHtml(formatRealDate(charge.vencimento))}</small></span>
        <span class="badge ${payment.status === "confirmado" ? "badge--green" : payment.status === "pendente" ? "badge--pending" : "badge--red"}">${escapeHtml(realPaymentStatusLabel(payment.status))}</span>
      </div>
      <p class="field-help">${escapeHtml(payment.origem === "professor" ? "Lançamento do Professor" : "Aviso do aluno")} · ${escapeHtml(payment.tipo)} · ${formatRealBillingCents(payment.valor_centavos)} · saldo ${formatRealBillingCents(realBillingBalance(charge, realProfessorPayments))}${payment.referencia ? ` · ${escapeHtml(payment.referencia)}` : ""} · ${realBillingTimestamp(payment.criado_em)}</p>
      ${proof && !canViewProof ? `<p class="field-help">Comprovante indisponível (${escapeHtml(proof.estado_arquivo)}).</p>` : ""}
      ${actions ? `<div class="row-actions">${actions}</div>` : ""}
      <p class="login-action-error student-action-error" id="real-payment-error-${paymentId}" role="alert"></p>
      <p class="field-help" id="real-payment-status-${paymentId}" role="status" aria-live="polite"></p>
    </article>
  `;
}

function renderRealProfessorPaymentsScreen() {
  if (realProfessorPaymentsState === "checking") {
    return `${heading("VISÃO DO PROFESSOR", "Pagamentos a confirmar", "Carregando avisos, lançamentos e saldos.")}<div class="notice notice--info" role="status">Carregando...</div>`;
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
    ${realPaymentProofsNotice ? `<div class="notice notice--pending" role="alert">${escapeHtml(realPaymentProofsNotice)}</div>` : ""}
    ${realProofCleanupNotice ? `<div class="notice notice--pending" role="alert">${escapeHtml(realProofCleanupNotice)}</div>` : ""}
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
                ${openCharges.map((charge) => `<option value="${escapeHtml(charge.id)}">${escapeHtml(realBillingStudentNames.get(charge.aluno_id) || "Aluno sem nome")} · ${escapeHtml(formatRealDate(charge.mes).slice(3))} · saldo ${formatRealBillingCents(realBillingBalance(charge, realProfessorPayments))}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="real-professor-payment-amount">Valor recebido</label>
              <input id="real-professor-payment-amount" type="number" min="0.01" step="0.01" max="${realBillingCentsInput(realBillingBalance(openCharges[0], realProfessorPayments))}" required>
            </div>
            <div class="field">
              <label for="real-professor-payment-type">Tipo</label>
              <select id="real-professor-payment-type" required><option value="Dinheiro">Dinheiro</option></select>
            </div>
            <div class="field">
              <label for="real-professor-payment-reference">Referência</label>
              <input id="real-professor-payment-reference" type="text" maxlength="120" required>
            </div>
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

async function loadRealStudentPayments(renderScreen = true, allowHome = false) {
  const sequence = ++realStudentPaymentsRequestSequence;
  const screenId = allowHome ? "home" : "student-payments";
  realStudentPaymentsState = "checking";
  realStudentPaymentsNotice = "";
  realPaymentProofsNotice = "";
  realStudentCharges = [];
  realStudentPayments = [];
  realStudentPaymentProofs = new Map();
  if (!authClient || !realUser || !isRealActiveStudent() || !realProfile || !realProfile.academia_id) {
    realStudentPaymentsState = "error";
    realStudentPaymentsNotice = "Esta tela exige um perfil de Aluno ativo vinculado a uma academia.";
    if (renderScreen && !allowHome && currentScreen === screenId) {
      screenContent.innerHTML = renderRealStudentPaymentsScreen();
    }
    return;
  }
  if (renderScreen && !allowHome && currentScreen === screenId) {
    screenContent.innerHTML = renderRealStudentPaymentsScreen();
  }
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
    if (sequence !== realStudentPaymentsRequestSequence || currentScreen !== screenId) return;
    for (const result of [chargesResult, academyResult]) {
      if (result.error) throw result.error;
    }
    if (!Array.isArray(chargesResult.data) || !academyResult.data ||
        !Number.isInteger(academyResult.data.dias_carencia) ||
        academyResult.data.dias_carencia < 0 || academyResult.data.dias_carencia > 30) {
      throw new TypeError("Dados de pagamento indisponíveis.");
    }
    const charges = chargesResult.data.filter((charge) => charge.enviada_em && charge.status !== "cancelada");
    let payments = [];
    if (charges.length) {
      const { data, error } = await authClient.from("pagamentos")
        .select("id,cobranca_id,origem,tipo,referencia,valor_centavos,status,criado_em,confirmado_em,rejeitado_em,estornado_em,desfeito_em")
        .in("cobranca_id", charges.map((charge) => charge.id))
        .order("criado_em", { ascending: false });
      if (error) throw error;
      if (!Array.isArray(data)) throw new TypeError("Histórico de pagamentos indisponível.");
      payments = data;
    }
    let proofs = [];
    if (payments.length) {
      const { data, error } = await authClient.from("comprovantes_pagamento")
        .select("pagamento_id,caminho_storage,tipo_mime,tamanho_bytes,estado_arquivo,criado_em")
        .in("pagamento_id", payments.map((payment) => payment.id));
      if (error) {
        realPaymentProofsNotice = "Não foi possível verificar os comprovantes. Atualize os pagamentos e tente novamente.";
        throw error;
      }
      if (!Array.isArray(data) || data.some((proof) =>
        !proof || typeof proof.pagamento_id !== "string" ||
        typeof proof.caminho_storage !== "string" ||
        !["image/jpeg", "image/png", "application/pdf"].includes(proof.tipo_mime) ||
        !Number.isInteger(proof.tamanho_bytes) || proof.tamanho_bytes < 1 || proof.tamanho_bytes > 10485760 ||
        !["ativo", "remocao_pendente", "removido"].includes(proof.estado_arquivo) ||
        typeof proof.criado_em !== "string"
      )) {
        realPaymentProofsNotice = "Os dados dos comprovantes estão indisponíveis. Atualize os pagamentos e tente novamente.";
        throw new TypeError("Comprovantes indisponíveis.");
      }
      proofs = data;
    }
    if (sequence !== realStudentPaymentsRequestSequence || currentScreen !== screenId) return;
    realStudentCharges = charges;
    realStudentPayments = payments;
    realStudentPaymentProofs = new Map(proofs.map((proof) => [proof.pagamento_id, proof]));
    realBillingGraceDays = academyResult.data.dias_carencia;
    realStudentPaymentsState = "found";
  } catch (error) {
    if (sequence !== realStudentPaymentsRequestSequence || currentScreen !== screenId) return;
    logRealProfileSupabaseError("consultar pagamentos do Aluno", error);
    realStudentPaymentsState = "error";
    realStudentPaymentsNotice = navigator.onLine === false
      ? "Falha de rede ao carregar seus pagamentos. Verifique a conexão e tente novamente."
      : "Não foi possível carregar seus pagamentos. Confira sua permissão e tente novamente.";
  }
  if (renderScreen && !allowHome && sequence === realStudentPaymentsRequestSequence &&
      currentScreen === screenId) {
    screenContent.innerHTML = renderRealStudentPaymentsScreen();
  }
}

async function cleanupExpiredRealPaymentProofs(requestSequence) {
  if (realProofCleanupRunning) return;
  realProofCleanupRunning = true;
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration &&
    Boolean(realUser && realUser.id === userId && isRealActiveProfessor());
  const isCurrentRequest = () =>
    requestSequence === realProfessorPaymentsRequestSequence && isCurrentSession();
  let failed = false;

  try {
    setRealProofCleanupNotice("");
    const { data, error } = await authClient.rpc("listar_comprovantes_pagamento_expirados");
    if (error) throw error;
    if (!Array.isArray(data) || data.some((entry) =>
      !entry || typeof entry.pagamento_id !== "string"
    )) {
      throw new TypeError("Lista de comprovantes vencidos indisponível.");
    }
    const paymentIds = new Set(data.map((entry) => entry.pagamento_id));
    for (const [paymentId, proof] of realProfessorPaymentProofs) {
      if (proof.estado_arquivo === "remocao_pendente") paymentIds.add(paymentId);
    }
    for (const paymentId of paymentIds) {
      if (!isCurrentRequest()) return;
      const proof = realProfessorPaymentProofs.get(paymentId);
      if (!proof || proof.estado_arquivo !== "ativo") {
        if (proof && proof.estado_arquivo === "remocao_pendente") {
          const result = await removeRegisteredPaymentProof(paymentId, proof.caminho_storage, "professor");
          if (result.errorMessage) failed = true;
          continue;
        }
        failed = true;
        recordDiagnostic("Comprovante vencido ausente dos pagamentos carregados");
        continue;
      }
      const result = await removeRegisteredPaymentProof(
        paymentId,
        proof.caminho_storage,
        "professor"
      );
      if (result.errorMessage) failed = true;
    }
  } catch (error) {
    if (!isCurrentRequest()) return;
    logRealProfileSupabaseError("remover comprovantes vencidos", error);
    failed = true;
  } finally {
    const nextSequence = realProfessorPaymentsRequestSequence;
    const retryLatestLoad = requestSequence !== nextSequence &&
      realProfessorPaymentsState === "found" && currentScreen === "payment-review" &&
      isCurrentSession();
    realProofCleanupRunning = false;
    if (retryLatestLoad) {
      void cleanupExpiredRealPaymentProofs(nextSequence);
      return;
    }
    if (isCurrentRequest()) {
      setRealProofCleanupNotice(failed
        ? "Não foi possível remover todos os comprovantes vencidos. Atualize os pagamentos para tentar novamente."
        : "");
      if (currentScreen === "payment-review" && realProfessorPaymentsState === "found") {
        screenContent.innerHTML = renderRealProfessorPaymentsScreen();
      }
    }
  }
}

async function loadRealProfessorPaymentsData(renderScreen = true, allowHome = false) {
  const sequence = ++realProfessorPaymentsRequestSequence;
  const screenId = allowHome ? "home" : "payment-review";
  realProfessorPaymentsState = "checking";
  realProfessorPaymentsNotice = "";
  realPaymentProofsNotice = "";
  realBillingGraceDays = null;
  realProfessorCharges = [];
  realProfessorPayments = [];
  realProfessorPaymentProofs = new Map();
  realProofCleanupNotice = "";
  if (!authClient || !realUser || !isRealActiveProfessor()) {
    realProfessorPaymentsState = "error";
    realProfessorPaymentsNotice = "Esta tela exige uma conta Google de Professor ativa.";
    if (renderScreen && !allowHome && currentScreen === screenId) {
      screenContent.innerHTML = renderRealProfessorPaymentsScreen();
    }
    return;
  }
  if (renderScreen && !allowHome && currentScreen === screenId) {
    screenContent.innerHTML = renderRealProfessorPaymentsScreen();
  }
  try {
    const [chargesResult, academyResult] = await Promise.all([
      authClient.from("cobrancas_mensais")
        .select("id,aluno_id,mes,vencimento,valor_base_centavos,desconto_centavos,valor_final_centavos,status,enviada_em,reenviada_em")
        .eq("professor_id", realUser.id)
        .order("vencimento", { ascending: false }),
      authClient.from("academias")
        .select("dias_carencia")
        .eq("id", realProfile.academia_id)
        .maybeSingle()
    ]);
    if (chargesResult.error) throw chargesResult.error;
    if (academyResult.error) throw academyResult.error;
    const charges = chargesResult.data;
    if (!Array.isArray(charges)) throw new TypeError("Cobranças indisponíveis.");
    if (!academyResult.data || !Number.isInteger(academyResult.data.dias_carencia) ||
        academyResult.data.dias_carencia < 0 || academyResult.data.dias_carencia > 30) {
      throw new TypeError("Carência de cobrança indisponível.");
    }
    let payments = [];
    if (charges.length) {
      const { data, error } = await authClient.from("pagamentos")
        .select("id,cobranca_id,origem,tipo,referencia,valor_centavos,status,criado_em,confirmado_em,rejeitado_em,estornado_em,desfeito_em")
        .in("cobranca_id", charges.map((charge) => charge.id))
        .order("criado_em", { ascending: false });
      if (error) throw error;
      if (!Array.isArray(data)) throw new TypeError("Pagamentos indisponíveis.");
      payments = data;
    }
    let proofs = [];
    if (payments.length) {
      const { data, error } = await authClient.from("comprovantes_pagamento")
        .select("pagamento_id,caminho_storage,tipo_mime,tamanho_bytes,estado_arquivo,criado_em")
        .in("pagamento_id", payments.map((payment) => payment.id));
      if (error) {
        realPaymentProofsNotice = "Não foi possível verificar os comprovantes. Atualize os pagamentos e tente novamente.";
        throw error;
      }
      if (!Array.isArray(data) || data.some((proof) =>
        !proof || typeof proof.pagamento_id !== "string" ||
        typeof proof.caminho_storage !== "string" ||
        !["image/jpeg", "image/png", "application/pdf"].includes(proof.tipo_mime) ||
        !Number.isInteger(proof.tamanho_bytes) || proof.tamanho_bytes < 1 || proof.tamanho_bytes > 10485760 ||
        !["ativo", "remocao_pendente", "removido"].includes(proof.estado_arquivo) ||
        typeof proof.criado_em !== "string"
      )) {
        realPaymentProofsNotice = "Os dados dos comprovantes estão indisponíveis. Atualize os pagamentos e tente novamente.";
        throw new TypeError("Comprovantes indisponíveis.");
      }
      proofs = data;
    }
    if (sequence !== realProfessorPaymentsRequestSequence || currentScreen !== screenId) return;
    realProfessorCharges = charges;
    realProfessorPayments = payments;
    realProfessorPaymentProofs = new Map(proofs.map((proof) => [proof.pagamento_id, proof]));
    realBillingGraceDays = academyResult.data.dias_carencia;
    realProfessorPaymentsState = "found";
  } catch (error) {
    if (sequence !== realProfessorPaymentsRequestSequence || currentScreen !== screenId) return;
    logRealProfileSupabaseError("consultar pagamentos do Professor", error);
    realProfessorPaymentsState = "error";
    realProfessorPaymentsNotice = navigator.onLine === false
      ? "Falha de rede ao carregar os pagamentos. Verifique a conexão e tente novamente."
      : "Não foi possível carregar os pagamentos. Confira sua permissão e tente novamente.";
  }
  if (renderScreen && !allowHome && sequence === realProfessorPaymentsRequestSequence &&
      currentScreen === screenId) {
    screenContent.innerHTML = renderRealProfessorPaymentsScreen();
  }
  if (sequence === realProfessorPaymentsRequestSequence && currentScreen === screenId &&
      realProfessorPaymentsState === "found") {
    void cleanupExpiredRealPaymentProofs(sequence);
  }
}

function renderRealProfessorScreen(screenId) {
  return screenId === "monthly-charges"
    ? renderRealBillingScreen()
    : renderRealProfessorPaymentsScreen();
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

  const cancelAction = pendingRequest
    ? `<div class="student-action-control">
        <button class="button button--quiet button--action" type="button" data-real-student-link-cancel aria-describedby="real-student-link-cancel-error real-student-link-cancel-status">
          <span data-action-label>Cancelar pedido</span>
        </button>
        <div class="login-action-error" id="real-student-link-cancel-error" role="alert" aria-atomic="true"></div>
        <div class="field-help" id="real-student-link-cancel-status" role="status" aria-live="polite"></div>
      </div>`
    : "";

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
    ${heading("CONTA · ALUNO", "Vincular a um Professor", "Envie seu código para solicitar um vínculo.") }
    <div class="content-grid">
      ${panel("Pedido de vínculo", `${requestState}${cancelAction}${form}`, "panel-card--highlight")}
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
                <span class="avatar avatar--small avatar--initials" aria-hidden="true"><img src="${DEFAULT_PERSON_AVATAR_SRC}" alt="" loading="lazy"></span>
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
  const roleLabels = { adm: "Adm", professor: "Professor", instrutor: "Instrutor", aluno: "Aluno" };
  const name = realUser && realProfile && realProfile.nome || realUser && realUser.email || "Sem sessão ativa";
  const role = realProfile && roleLabels[realProfile.papel] || (realUser ? "Conta real" : "Perfil");
  document.querySelector("#user-panel-profile-name").textContent = name;
  document.querySelector("#user-panel-profile-role").textContent = role;
  document.querySelector("#sidebar-profile-name").textContent = name;
  document.querySelector("#sidebar-profile-role").textContent = role;
  document.querySelector(".sidebar-profile-button").hidden = !realUser;
  const headerProfileCopy = document.querySelector("#profile-button .profile-button-copy");
  headerProfileCopy.querySelector("strong").textContent = name;
  headerProfileCopy.querySelector("small").textContent = role;
  document.querySelector("#profile-button").setAttribute("aria-label", `Abrir painel do usuário: ${name}`);
  setUserPanelAcademyText(realProfile && realProfile.academia_id ? "Academia: carregando..." : "Sem academia vinculada");
  if (realUser) {
    ensureRealAvatarChoiceLoaded();
    void loadRealUserPanelMedia();
  }
  else clearRealUserPanelMedia();
}

function setUserPanelAcademyText(text) {
  const line = document.querySelector("#user-panel-profile-academy");
  const image = document.querySelector("#user-panel-academy-photo");
  if (!line) return;
  if (image) image.remove();
  line.textContent = text;
  if (image) line.append(image);
}

function clearRealUserPanelMedia() {
  const avatarSrc = realUser ? realPersonAvatarSrc(realUser.id) : DEFAULT_PERSON_AVATAR_SRC;
  document.querySelectorAll(
    "#profile-button-avatar img, .sidebar-profile-avatar img, #user-panel-profile-photo"
  ).forEach((image) => {
    image.onload = null;
    image.onerror = null;
    image.alt = "";
    image.hidden = false;
    image.src = avatarSrc;
  });
  const academyImage = document.querySelector("#user-panel-academy-photo");
  if (academyImage) {
    academyImage.removeAttribute("src");
    academyImage.alt = "";
    academyImage.hidden = true;
  }
  const avatar = document.querySelector("#user-panel-avatar");
  if (avatar) avatar.setAttribute("aria-hidden", "true");
  setUserPanelAcademyText("Sem academia vinculada");
}

async function loadRealUserPanelMedia() {
  clearRealUserPanelMedia();
  if (!authClient || !realUser || !realProfile || realProfileState !== "found") return;
  const userId = realUser.id;
  const sessionGeneration = realSessionCacheGeneration;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration && Boolean(realUser && realUser.id === userId);
  const profileAvatar = document.querySelector("#user-panel-avatar");
  const profileImage = document.querySelector("#user-panel-profile-photo");
  const profileImages = Array.from(document.querySelectorAll(
    "#profile-button-avatar img, .sidebar-profile-avatar img, #user-panel-profile-photo"
  ));

  const showSignedProfilePhoto = async (path, bucket, expiresIn) => {
    try {
      const { data: signed, error } = await authClient.storage.from(bucket).createSignedUrl(path, expiresIn);
      if (!isCurrentSession()) return;
      if (error || !signed || typeof signed.signedUrl !== "string") {
        if (error) logRealProfileSupabaseError("abrir foto do perfil no painel", error);
        else console.error("Não foi possível criar a URL temporária da foto de perfil no painel.");
        return;
      }
      if (!profileAvatar || !profileImage || !profileImages.length) return;
      for (const image of profileImages) {
        const isPanelImage = image === profileImage;
        image.alt = isPanelImage ? "Foto de perfil" : "";
        image.onload = () => {
          image.onload = null;
          image.onerror = null;
          if (!isCurrentSession()) {
            image.alt = "";
            image.src = realPersonAvatarSrc(userId);
            return;
          }
          image.hidden = false;
          if (isPanelImage) profileAvatar.removeAttribute("aria-hidden");
        };
        image.onerror = () => {
          image.onload = null;
          image.onerror = null;
          if (!isCurrentSession()) return;
          image.alt = "";
          image.src = realPersonAvatarSrc(userId);
          image.hidden = false;
          if (isPanelImage) {
            profileAvatar.setAttribute("aria-hidden", "true");
            console.error("Não foi possível carregar a foto de perfil no painel; o avatar foi mantido.");
          }
        };
        image.src = signed.signedUrl;
      }
    } catch (error) {
      if (isCurrentSession()) logRealProfileSupabaseError("abrir foto do perfil no painel", error);
    }
  };

  if (realProfile.papel === "professor") {
    try {
      const { data: photo, error } = await authClient.from("professores_fotos")
        .select("caminho_storage").eq("professor_id", userId).maybeSingle();
      if (!isCurrentSession()) return;
      if (error) {
        logRealProfileSupabaseError("consultar foto do Professor no painel", error);
      } else if (photo && typeof photo.caminho_storage === "string") {
        await showSignedProfilePhoto(photo.caminho_storage, "professores", 60);
      }
    } catch (error) {
      if (isCurrentSession()) logRealProfileSupabaseError("consultar foto do Professor no painel", error);
    }
    return;
  }
  if (realProfile.papel === "adm" || realProfile.papel === "instrutor" ||
      (realProfile.papel === "aluno" && realProfile.idade_declarada === "adulto")) {
    try {
      const { data: photos, error } = await authClient.rpc("obter_foto_perfil", {
        p_perfil_id: userId
      });
      if (!isCurrentSession()) return;
      if (error) {
        logRealProfileSupabaseError("consultar foto de perfil no painel", error);
        return;
      }
      const photo = Array.isArray(photos) ? photos[0] : null;
      if (photo && typeof photo.caminho_storage === "string") {
        await showSignedProfilePhoto(photo.caminho_storage, "perfis", 300);
      }
    } catch (error) {
      if (isCurrentSession()) logRealProfileSupabaseError("consultar foto de perfil no painel", error);
    }
  }
}

function validateStorageFile(file, mimeTypes, maxBytes, label) {
  if (!file) return `Escolha um arquivo para enviar ${label}.`;
  if (!mimeTypes.includes(file.type)) return `Use somente os formatos permitidos para ${label}.`;
  if (!Number.isFinite(file.size) || file.size < 1 || file.size > maxBytes) {
    return `O arquivo de ${label} deve ter tamanho entre 1 byte e ${Math.floor(maxBytes / 1048576)} MiB.`;
  }
  return "";
}

async function createStorageSignedUrl(bucket, path, purpose) {
  try {
    const { data, error } = await authClient.storage.from(bucket).createSignedUrl(path, 60);
    if (error) {
      logRealProfileSupabaseError(`gerar URL temporária de ${purpose}`, error);
      return { errorMessage: `Não foi possível abrir ${purpose}. Tente novamente.` };
    }
    if (!data || typeof data.signedUrl !== "string") {
      return { errorMessage: `Não foi possível abrir ${purpose}. Tente novamente.` };
    }
    return { signedUrl: data.signedUrl };
  } catch (error) {
    logRealProfileSupabaseError(`gerar URL temporária de ${purpose}`, error);
    return { errorMessage: `Não foi possível abrir ${purpose}. Tente novamente.` };
  }
}

async function uploadRegisteredPhoto(bucket, path, file, functionName, parameters, purpose) {
  try {
    const storage = authClient.storage.from(bucket);
    let { error: uploadError } = await storage.upload(path, file, {
      cacheControl: "0",
      contentType: file.type,
      upsert: false
    });
    if (uploadError) {
      logRealProfileSupabaseError(`enviar ${purpose}`, uploadError);
      const alreadyExists = Number(uploadError.statusCode) === 409 ||
        /already exists|duplicate/i.test(`${uploadError.message || ""} ${uploadError.error || ""}`);
      if (alreadyExists) {
        const { error: updateError } = await storage.update(path, file, {
          cacheControl: "0",
          contentType: file.type
        });
        if (updateError) {
          uploadError = updateError;
          logRealProfileSupabaseError(`atualizar ${purpose}`, updateError);
        } else {
          uploadError = null;
        }
      }
    }
    if (uploadError) {
      return {
        errorMessage: Number(uploadError.statusCode) === 403
          ? "Você não tem permissão para enviar esta foto."
          : `Não foi possível enviar ${purpose}. Confira a conexão e tente novamente.`
      };
    }
    const { data, error } = await authClient.rpc(functionName, parameters);
    if (error) {
      logRealProfileSupabaseError(`registrar ${purpose}`, error);
      return {
        errorMessage: Number(error.statusCode) === 403
          ? "Você não tem permissão para enviar esta foto."
          : `O arquivo foi enviado, mas não foi possível registrar ${purpose}. Tente novamente.`
      };
    }
    if (data !== true) {
      return { errorMessage: `O arquivo foi enviado, mas não foi possível registrar ${purpose}. Tente novamente.` };
    }
    return {};
  } catch (error) {
    logRealProfileSupabaseError(`enviar ou registrar ${purpose}`, error);
    return {
      errorMessage: Number(error?.statusCode) === 403
        ? "Você não tem permissão para enviar esta foto."
        : `Não foi possível enviar ${purpose}. Confira a conexão e tente novamente.`
    };
  }
}

async function loadRealAcademyPhotoUrl(academyId) {
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration && Boolean(realUser && realUser.id === userId);
  if (!authClient || !userId || typeof academyId !== "string" || !academyId) return "";
  try {
    const { data: photo, error } = await authClient.from("academias_fotos")
      .select("caminho_storage").eq("academia_id", academyId).maybeSingle();
    if (!isCurrentSession()) return "";
    if (error) {
      logRealProfileSupabaseError("consultar foto da academia", error);
      return "";
    }
    if (!photo || typeof photo.caminho_storage !== "string") return "";
    const signed = await createStorageSignedUrl("academias", photo.caminho_storage, "foto da academia");
    return isCurrentSession() ? signed.signedUrl || "" : "";
  } catch (error) {
    if (!isCurrentSession()) return "";
    logRealProfileSupabaseError("consultar foto da academia", error);
    return "";
  }
}

async function loadRealAcademyPhotoUrls(academies) {
  realAcademyPhotoUrls = new Map();
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration && Boolean(realUser && realUser.id === userId);
  const ids = academies.map((academy) => academy.id).filter((id) => typeof id === "string");
  if (!ids.length || !authClient || !userId) return;
  try {
    const { data, error } = await authClient.from("academias_fotos")
      .select("academia_id,caminho_storage").in("academia_id", ids);
    if (!isCurrentSession()) return;
    if (error) {
      logRealProfileSupabaseError("listar fotos das academias", error);
      return;
    }
    for (const photo of data || []) {
      if (typeof photo.academia_id !== "string" || typeof photo.caminho_storage !== "string") continue;
      const signed = await createStorageSignedUrl("academias", photo.caminho_storage, "foto da academia");
      if (!isCurrentSession()) return;
      if (signed.signedUrl) realAcademyPhotoUrls.set(photo.academia_id, signed.signedUrl);
    }
  } catch (error) {
    if (!isCurrentSession()) return;
    logRealProfileSupabaseError("listar fotos das academias", error);
  }
}

function isRealAdmSession() {
  return Boolean(realUser && realProfileState === "found" && realProfile &&
    realProfile.papel === "adm" && realProfile.ativo === true);
}

function isRealProfessorProfile() {
  return Boolean(realUser && realProfileState === "found" && realProfile &&
    realProfile.papel === "professor");
}

function isRealActiveProfessor() {
  return Boolean(isRealProfessorProfile() && realProfile.ativo === true && realProfile.academia_id);
}

function isRealActiveProfessorAccount() {
  return Boolean(isRealProfessorProfile() && realProfile.ativo === true);
}

function isRealActiveStudent() {
  return Boolean(realUser && realProfileState === "found" && realProfile &&
    realProfile.papel === "aluno" && realProfile.ativo === true);
}

function isRealActiveInstructor() {
  return Boolean(realUser && realProfileState === "found" && realProfile &&
    realProfile.ativo === true &&
    (realProfile.papel === "instrutor" || realInstructorLink && realInstructorLink.instrutor_id === realUser.id));
}

function realInitialScreen() {
  if (isRealAdmSession()) return "admin-home";
  if (isRealActiveProfessor() || isRealActiveStudent() || isRealActiveInstructor()) return "home";
  return "real-account";
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

function realGraduationToday() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function formatRealDate(dataISO) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dataISO));
  if (!match) return "Data indisponível";
  return `${match[3]}/${match[2]}/${match[1]}`;
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
  const beltIndex = record && typeof record.faixa === "string" ? beltOrder.indexOf(record.faixa) : -1;
  return Boolean(record) &&
    typeof record.aluno_id === "string" &&
    beltDegrees(beltIndex).includes(record.grau) &&
    typeof record.data_graduacao === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(record.data_graduacao) &&
    typeof record.criado_em === "string" &&
    (record.observacao === null || typeof record.observacao === "string");
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
    ${heading("VISÃO DO ADM", "Alunos", "Consulte somente o nome e a faixa/grau atuais dos alunos ativos.")}
    ${panel("Alunos ativos", studentsContent)}
  `;
}

async function loadRealAdminDashboard(renderScreen = true) {
  const sequence = ++realAdminDashboardRequestSequence;
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentRequest = () =>
    sequence === realAdminDashboardRequestSequence &&
    sessionGeneration === realSessionCacheGeneration &&
    Boolean(realUser && realUser.id === userId && isRealAdmSession());

  realAdminDashboardAcademies = [];
  realAdminDashboardProfessors = [];
  realAdminDashboardStudents = 0;
  realAdminDashboardPendingInvites = 0;
  realAdminDashboardState = "checking";
  realAdminDashboardNotice = "";

  const guardError = realAdminGuardError();
  if (guardError) {
    realAdminDashboardState = "error";
    realAdminDashboardNotice = guardError;
  } else {
    try {
      const [academiesResult, professorsResult, studentsResult, invitesResult] = await Promise.all([
        authClient.from("academias").select("id,nome").order("nome", { ascending: true }),
        authClient.from("perfis").select("id,nome,academia_id")
          .eq("papel", "professor").eq("ativo", true).order("nome", { ascending: true }),
        authClient.rpc("listar_alunos_para_adm"),
        authClient.from("professores_convidados").select("status").eq("status", "convidado")
      ]);
      if (!isCurrentRequest()) return false;
      for (const result of [academiesResult, professorsResult, studentsResult, invitesResult]) {
        if (result.error) throw result.error;
      }
      if (!Array.isArray(academiesResult.data) || academiesResult.data.some((academy) =>
        !academy || typeof academy.id !== "string" || typeof academy.nome !== "string"
      ) || !Array.isArray(professorsResult.data) || professorsResult.data.some((profile) =>
        !profile || typeof profile.id !== "string" ||
        (profile.nome !== null && typeof profile.nome !== "string") ||
        (profile.academia_id !== null && typeof profile.academia_id !== "string")
      ) || !Array.isArray(studentsResult.data) || studentsResult.data.some((student) =>
        !student || typeof student.aluno_id !== "string" || typeof student.nome !== "string" ||
        !((student.faixa === null && student.grau === null) ||
          (typeof student.faixa === "string" && student.faixa.trim().length > 0 &&
            Number.isInteger(student.grau) && student.grau >= 0))
      ) || !Array.isArray(invitesResult.data)) {
        throw new TypeError("Resumo administrativo indisponível.");
      }
      realAdminDashboardAcademies = academiesResult.data;
      realAdminDashboardProfessors = professorsResult.data;
      realAdminDashboardStudents = studentsResult.data.length;
      realAdminDashboardPendingInvites = invitesResult.data.length;
      await loadRealAvatarPreferences(realAdminDashboardProfessors.map((profile) => profile.id));
      if (!isCurrentRequest()) return false;
      await loadRealAcademyPhotoUrls(realAdminDashboardAcademies);
      if (!isCurrentRequest()) return false;
      const professorIds = realAdminDashboardProfessors
        .map((profile) => profile.id)
        .filter((id) => typeof id === "string");
      if (professorIds.length) {
        try {
          const { data: photos, error: photoError } = await authClient.from("professores_fotos")
            .select("professor_id,caminho_storage").in("professor_id", professorIds);
          if (!isCurrentRequest()) return false;
          if (photoError) {
            logRealAdminDatabaseError("listar fotos de Professores do painel", photoError);
          } else {
            for (const photo of photos || []) {
              if (!isCurrentRequest()) return false;
              if (typeof photo.professor_id !== "string" ||
                  typeof photo.caminho_storage !== "string") continue;
              const signed = await createStorageSignedUrl(
                "professores", photo.caminho_storage, "foto do Professor"
              );
              if (!isCurrentRequest()) return false;
              if (signed.signedUrl) {
                realAdminProfessorPhotoUrls.set(photo.professor_id, signed.signedUrl);
              }
            }
          }
        } catch (error) {
          if (!isCurrentRequest()) return false;
          logRealAdminDatabaseError("listar fotos de Professores do painel", error);
        }
      }
      realAdminDashboardState = "found";
    } catch (error) {
      if (!isCurrentRequest()) return false;
      logRealAdminDatabaseError("carregar resumo administrativo", error);
      realAdminDashboardState = "error";
      realAdminDashboardNotice = realAdminDatabaseErrorMessage(error, "read");
    }
  }

  if (renderScreen && sequence === realAdminDashboardRequestSequence && currentScreen === "admin-home") {
    screenContent.innerHTML = renderRealAdminDashboardScreen();
  }
  return realAdminDashboardState === "found";
}

function renderRealAdminDashboardScreen() {
  const title = heading("VISÃO DO ADM", "Painel do Adm", "Resumo das academias, Professores ativos, alunos e convites pendentes.");
  if (realAdminDashboardState === "checking" || realAdminDashboardState === "idle") {
    return `${title}<div class="notice notice--info" role="status">Carregando o resumo administrativo...</div>`;
  }
  if (realAdminDashboardState === "error") {
    return `${title}<div class="notice notice--pending" role="alert">${escapeHtml(realAdminDashboardNotice)}</div>
      <div class="student-action-control">
        <button class="button button--primary button--action" type="button" data-real-admin-dashboard-retry aria-describedby="real-admin-dashboard-retry-error real-admin-dashboard-retry-status">
          <span data-action-label>Tentar novamente</span>
        </button>
        <p class="login-action-error student-action-error" id="real-admin-dashboard-retry-error" role="alert"></p>
        <p class="field-help" id="real-admin-dashboard-retry-status" role="status" aria-live="polite"></p>
      </div>`;
  }

  const academyNames = new Map(realAdminDashboardAcademies.map((academy) => [academy.id, academy.nome]));
  const academiesContent = realAdminDashboardAcademies.length
    ? `<ul aria-label="Academias">${realAdminDashboardAcademies.map((academy) => {
      const photoUrl = realAcademyPhotoUrls.get(academy.id);
      return `<li class="real-academy-list-item">
        ${photoUrl ? `<img class="real-media-avatar" src="${escapeHtml(photoUrl)}" alt="Foto da academia ${escapeHtml(academy.nome)}">` : ""}
        <span>${escapeHtml(academy.nome)}</span>
      </li>`;
    }).join("")}</ul>`
    : `${emptyState("Nenhuma academia cadastrada", "As academias cadastradas aparecerão aqui.")}
       ${button("Criar academia", "academy", "button button--quiet")}`;
  const professorsContent = realAdminDashboardProfessors.length
    ? `<ul aria-label="Professores ativos">${realAdminDashboardProfessors.map((profile) => {
      const name = typeof profile.nome === "string" && profile.nome.trim() ? profile.nome.trim() : "Nome não informado";
      const academy = academyNames.get(profile.academia_id) || "Academia não vinculada";
      const photoUrl = realAdminProfessorPhotoUrls.get(profile.id);
      return `<li class="real-academy-list-item">
        <img class="real-media-avatar real-media-avatar--person" src="${escapeHtml(photoUrl || realPersonAvatarSrc(profile.id))}" alt="${photoUrl ? `Foto de ${escapeHtml(name)}` : ""}"${photoUrl ? "" : ` data-avatar-choice-profile-id="${escapeHtml(profile.id)}" data-avatar-fallback="true" aria-hidden="true"`}>
        <span><strong>${escapeHtml(name)}</strong><br><small>${escapeHtml(academy)}</small></span>
      </li>`;
    }).join("")}</ul>`
    : `${emptyState("Nenhum Professor ativo encontrado", "Professores ativos aparecerão aqui.")}
       ${button("Gerenciar Professores", "role-management", "button button--quiet")}`;
  const invitationsContent = realAdminDashboardPendingInvites
    ? `<p>${realAdminDashboardPendingInvites} convite(s) de Professor aguardando aceite.</p>`
    : `${emptyState("Nenhum convite pendente", "Convites pendentes aparecerão aqui.")}
       ${button("Convidar Professor", "teacher-invites", "button button--quiet")}`;

  return `${title}
    <div class="card-grid card-grid--four">
      ${metric("ACADEMIAS", String(realAdminDashboardAcademies.length), "Cadastradas", "gold", "academy")}
      ${metric("PROFESSORES ATIVOS", String(realAdminDashboardProfessors.length), "Papel Professor", "green", "role-management")}
      ${metric("ALUNOS ATIVOS", String(realAdminDashboardStudents), "Papel Aluno", "blue", "admin-students")}
      ${metric("CONVITES PENDENTES", String(realAdminDashboardPendingInvites), "Professores convidados", "amber", "teacher-invites")}
    </div>
    <div class="content-grid" style="margin-top:16px">
      ${panel("Academias", academiesContent)}
      ${panel("Professores ativos", professorsContent)}
      ${panel("Convites de Professor", invitationsContent)}
    </div>`;
}

function renderRealAdminAcademyResult() {
  if (realCreatedAcademy) {
    const photoMessage = realCreatedAcademy.foto_fundo_url ? "URL da foto de fundo cadastrada." : "Sem foto de fundo.";
    const photoUrl = realAcademyPhotoUrls.get(realCreatedAcademy.id);
    return `<div class="notice notice--info"><strong>Academia lida do banco:</strong> ${escapeHtml(realCreatedAcademy.nome)}<br><small>${photoMessage}</small></div>
      ${photoUrl ? `<img class="real-media-preview" src="${escapeHtml(photoUrl)}" alt="Foto da academia ${escapeHtml(realCreatedAcademy.nome)}">` : '<p class="field-help">Nenhuma foto da academia cadastrada.</p>'}`;
  }
  if (realCreatedAcademyId) {
    return `<p class="field-help">A academia foi criada. A leitura ainda não foi concluída; tente novamente para ler este registro.</p>`;
  }
  return `<p class="field-help">Nenhuma academia foi criada nesta sessão.</p>`;
}

function renderRealAdminAcademyScreen() {
  return `
    ${heading("VISÃO DO ADM", "Academia", "Cadastre ou edite academias no banco. Telefone e e-mail não são enviados.")}
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
          <div class="field field--wide">
            <label for="academy-new-photo-file">Foto da academia (opcional)</label>
            <input id="academy-new-photo-file" type="file" accept="image/jpeg,image/png">
            <small class="field-help">JPG ou PNG, até 5 MiB. A academia será criada antes do envio da foto.</small>
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

function renderRealProfessorAcademyScreen() {
  const title = heading("VISÃO DO PROFESSOR", "Academia", "Edite somente a academia vinculada ao seu perfil.");
  if (realProfessorAcademyState === "checking") {
    return `${title}<p class="field-help" role="status" aria-live="polite">Carregando os dados da academia...</p>`;
  }
  if (realProfessorAcademyState === "error") {
    return `${title}<p class="login-action-error" role="alert">${escapeHtml(realProfessorAcademyNotice || "Não foi possível carregar a academia.")}</p>
      <p class="field-help">Abra outra tela e volte para tentar novamente.</p>`;
  }
  if (!realProfessorAcademy || realProfessorAcademyState !== "found") {
    return `${title}${emptyState("Academia não encontrada", "Não foi possível localizar a academia vinculada ao seu perfil.")}`;
  }

  return `${title}
    ${panel("Dados da academia", `
      <form data-real-professor-academy-form data-academy-id="${escapeHtml(realProfessorAcademy.id)}" data-academy-version="${escapeHtml(String(realProfessorAcademy.versao_edicao))}">
        ${realProfessorAcademyPhotoUrl
          ? `<img class="real-media-preview" src="${escapeHtml(realProfessorAcademyPhotoUrl)}" alt="Foto da academia ${escapeHtml(realProfessorAcademy.nome)}">`
          : '<p class="field-help">Nenhuma foto da academia cadastrada.</p>'}
        <div class="form-grid">
          <div class="field field--wide">
            <label for="real-professor-academy-name">Nome da academia</label>
            <input id="real-professor-academy-name" name="nome" value="${escapeHtml(realProfessorAcademy.nome)}" maxlength="80" autocomplete="organization" required>
          </div>
          <div class="field field--wide">
            <label for="real-professor-academy-photo">URL da foto de fundo (opcional)</label>
            <input id="real-professor-academy-photo" name="foto_fundo_url" value="${escapeHtml(realProfessorAcademy.foto_fundo_url || "")}">
          </div>
          <div class="field field--wide">
            <label for="real-professor-academy-upload">Foto da academia</label>
            <input id="real-professor-academy-upload" data-real-academy-photo-file type="file" accept="image/jpeg,image/png">
            <small class="field-help">JPG ou PNG, até 5 MiB.</small>
          </div>
        </div>
        <div class="student-action-control">
          <button class="button button--quiet button--action" type="button" data-real-academy-photo-upload="${escapeHtml(realProfessorAcademy.id)}" aria-describedby="real-professor-academy-photo-error real-professor-academy-photo-status"><span data-action-label>Enviar foto da academia</span></button>
          <p class="login-action-error student-action-error" id="real-professor-academy-photo-error" data-real-academy-photo-error role="alert"></p>
          <p class="field-help" id="real-professor-academy-photo-status" data-real-academy-photo-status role="status" aria-live="polite"></p>
        </div>
        <div class="form-actions">
          <div class="academy-save-action">
            <button class="button button--primary button--action" type="submit" data-real-professor-academy-save aria-describedby="real-professor-academy-error real-professor-academy-status">
              <span data-action-label>Salvar alterações</span>
            </button>
            <div class="login-action-error" id="real-professor-academy-error" role="alert"></div>
            <div class="field-help" id="real-professor-academy-status" role="status" aria-live="polite"></div>
          </div>
        </div>
      </form>
    `)}
  `;
}

function renderRealAdminAcademyRows() {
  if (!realAdminAcademies.length) return `<p class="field-help">Nenhuma academia encontrada.</p>`;
  return realAdminAcademies.map((academy, index) => {
    const errorId = `real-academy-edit-error-${index}`;
    const statusId = `real-academy-edit-status-${index}`;
    const photoErrorId = `real-academy-photo-error-${index}`;
    const photoStatusId = `real-academy-photo-status-${index}`;
    const photoUrl = realAcademyPhotoUrls.get(academy.id);
    return `
      <form class="real-admin-academy-row" data-real-admin-academy-form data-academy-id="${escapeHtml(academy.id)}" data-academy-version="${escapeHtml(String(academy.versao_edicao))}">
        ${photoUrl
          ? `<img class="real-media-preview" src="${escapeHtml(photoUrl)}" alt="Foto da academia ${escapeHtml(academy.nome)}">`
          : '<p class="field-help">Nenhuma foto da academia cadastrada.</p>'}
        <div class="form-grid">
          <div class="field field--wide">
            <label for="real-academy-edit-name-${index}">Nome da academia</label>
            <input id="real-academy-edit-name-${index}" name="nome" value="${escapeHtml(academy.nome)}" autocomplete="organization">
          </div>
          <div class="field field--wide">
            <label for="real-academy-edit-photo-${index}">URL da foto de fundo (opcional)</label>
            <input id="real-academy-edit-photo-${index}" name="foto_fundo_url" value="${escapeHtml(academy.foto_fundo_url || "")}">
          </div>
          <div class="field field--wide">
            <label for="real-academy-edit-upload-${index}">Foto da academia</label>
            <input id="real-academy-edit-upload-${index}" data-real-academy-photo-file type="file" accept="image/jpeg,image/png">
            <small class="field-help">JPG ou PNG, até 5 MiB.</small>
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
        <div class="student-action-control">
          <button class="button button--quiet button--action" type="button" data-real-academy-photo-upload="${escapeHtml(academy.id)}" aria-describedby="${photoErrorId} ${photoStatusId}"><span data-action-label>Enviar foto da academia</span></button>
          <p class="login-action-error student-action-error" id="${photoErrorId}" data-real-academy-photo-error role="alert"></p>
          <p class="field-help" id="${photoStatusId}" data-real-academy-photo-status role="status" aria-live="polite"></p>
        </div>
      </form>
    `;
  }).join("");
}

function renderRealAdminInvitesScreen() {
  return `
    ${heading("VISÃO DO ADM", "Professores convidados", "Os convites cadastrados aparecem aqui. Somente convites pendentes podem ser excluídos.")}
    <div class="content-grid">
      ${panel("Convites cadastrados", `
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
    ${heading("VISÃO DO ADM", "Papéis e autorizações", "Consulte Professores e Instrutores e gerencie os Professores pelo banco.")}
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

function renderRealAdminManagementDetails(academyId, profiles, replacementCandidates, professorPhotoUrls = new Map()) {
  const academy = realAdminAcademies.find((item) => item.id === academyId);
  const academyPhotoUrl = realAcademyPhotoUrls.get(academyId);
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
    const photoUrl = professorPhotoUrls.get(profile.id);
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
        <img class="real-media-avatar real-media-avatar--person" src="${escapeHtml(photoUrl || realPersonAvatarSrc(profile.id))}" alt="${photoUrl ? `Foto de ${escapeHtml(profile.nome || "Professor")}` : ""}"${photoUrl ? "" : ` data-avatar-choice-profile-id="${escapeHtml(profile.id)}" data-avatar-fallback="true" aria-hidden="true"`}>
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
      ${academyPhotoUrl ? `<img class="real-media-preview" src="${escapeHtml(academyPhotoUrl)}" alt="Foto da academia ${escapeHtml(academy.nome)}">` : ""}
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
    const academyPhotoUrl = realAcademyPhotoUrls.get(invite.academia_id);
    return `
      <div class="list-row real-admin-invite-row">
        ${academyPhotoUrl ? `<img class="real-media-avatar" src="${escapeHtml(academyPhotoUrl)}" alt="Foto da academia ${escapeHtml(academyNames.get(invite.academia_id) || "academia")}">` : ""}
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
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration &&
    Boolean(realUser && realUser.id === userId && isRealAdmSession());
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
    if (!isCurrentSession()) return false;
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
      await loadRealAcademyPhotoUrls(realAdminAcademies);
      if (!isCurrentSession()) return false;
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
    if (!isCurrentSession()) return false;
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
    if (!isCurrentSession()) return false;
    if (error) {
      logRealAdminDatabaseError("listar convites de professor", error);
      if (listError) listError.textContent = realAdminDatabaseErrorMessage(error, "read");
      success = false;
    } else if (inviteList) {
      inviteList.innerHTML = renderRealAdminInviteRows(data || []);
      if (listError) listError.textContent = "";
    }
  } catch (error) {
    if (!isCurrentSession()) return false;
    logRealAdminDatabaseError("listar convites de professor", error);
    if (listError) listError.textContent = realAdminDatabaseErrorMessage(error, "read");
    success = false;
  }
  return success;
}

async function loadRealAdminAcademiesForEdit() {
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration &&
    Boolean(realUser && realUser.id === userId && isRealAdmSession());
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
    if (!isCurrentSession()) return false;
    if (error) {
      logRealAdminDatabaseError("listar academias para edição", error);
      if (listError) listError.textContent = realAdminDatabaseErrorMessage(error, "read");
      if (list) list.textContent = "Não foi possível carregar as academias.";
      return false;
    }
    realAdminAcademies = data || [];
    await loadRealAcademyPhotoUrls(realAdminAcademies);
    if (!isCurrentSession()) return false;
    if (listError) listError.textContent = "";
    if (list) list.innerHTML = renderRealAdminAcademyRows();
    return true;
  } catch (error) {
    if (!isCurrentSession()) return false;
    logRealAdminDatabaseError("listar academias para edição", error);
    if (listError) listError.textContent = realAdminDatabaseErrorMessage(error, "read");
    if (list) list.textContent = "Não foi possível carregar as academias.";
    return false;
  }
}

async function loadRealProfessorAcademy() {
  const sequence = ++realProfessorAcademyRequestSequence;
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const academyId = realProfile && realProfile.academia_id;
  const isCurrentSession = () =>
    sequence === realProfessorAcademyRequestSequence &&
    sessionGeneration === realSessionCacheGeneration &&
    Boolean(realUser && realUser.id === userId && isRealActiveProfessor());

  if (!authClient || !userId || !academyId || !isRealActiveProfessor()) {
    realProfessorAcademyState = "error";
    realProfessorAcademyNotice = "Esta tela exige uma conta de Professor ativa vinculada a uma academia.";
    if (currentScreen === "academy") screenContent.innerHTML = renderRealProfessorAcademyScreen();
    return false;
  }

  try {
    const { data, error } = await authClient.from("academias")
      .select("id,nome,foto_fundo_url,versao_edicao")
      .eq("id", academyId)
      .maybeSingle();
    if (!isCurrentSession()) return false;
    if (error) {
      logRealProfileSupabaseError("consultar academia do Professor", error);
      realProfessorAcademyState = "error";
      realProfessorAcademyNotice = realAdminDatabaseErrorMessage(error, "read");
    } else if (!data) {
      realProfessorAcademyState = "empty";
      realProfessorAcademyNotice = "";
      realProfessorAcademy = null;
    } else {
      realProfessorAcademy = data;
      realProfessorAcademyPhotoUrl = await loadRealAcademyPhotoUrl(data.id);
      if (!isCurrentSession()) return false;
      realProfessorAcademyState = "found";
      realProfessorAcademyNotice = "";
    }
  } catch (error) {
    if (!isCurrentSession()) return false;
    logRealProfileSupabaseError("consultar academia do Professor", error);
    realProfessorAcademyState = "error";
    realProfessorAcademyNotice = navigator.onLine === false
      ? "Falha de rede ao consultar a academia. Verifique sua conexão e tente novamente."
      : "Não foi possível consultar a academia. Tente novamente mais tarde.";
  }

  if (isCurrentSession() && currentScreen === "academy") {
    screenContent.innerHTML = renderRealProfessorAcademyScreen();
  }
  return realProfessorAcademyState === "found";
}

async function loadRealAdminManagement() {
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration &&
    Boolean(realUser && realUser.id === userId && isRealAdmSession());
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
    if (!isCurrentSession()) return false;
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
    await loadRealAcademyPhotoUrls(realAdminAcademies);
    if (!isCurrentSession()) return false;
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
    if (!isCurrentSession()) return false;
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
  const sessionGeneration = realSessionCacheGeneration;
  const userId = realUser && realUser.id;
  const isCurrentSession = () =>
    sessionGeneration === realSessionCacheGeneration &&
    Boolean(realUser && realUser.id === userId && isRealAdmSession());
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
    if (!isCurrentSession()) return false;
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
    if (!isCurrentSession()) return false;
    if (invitationError) {
      logRealAdminDatabaseError("listar convites aceitos para troca de Professor", invitationError);
      if (management) management.innerHTML = `<p class="login-action-error" role="alert">${realAdminDatabaseErrorMessage(invitationError, "read")}</p>`;
      return false;
    }
    const acceptedProfileIds = new Set((invitations || []).map((invite) => invite.perfil_id));
    const replacementCandidates = (profiles || []).filter((profile) =>
      profile.papel === "professor" && profile.ativo === false && acceptedProfileIds.has(profile.id)
    );
    await loadRealAvatarPreferences((profiles || []).map((profile) => profile.id));
    if (!isCurrentSession()) return false;
    const professorIds = (profiles || [])
      .filter((profile) => profile.papel === "professor")
      .map((profile) => profile.id)
      .filter((id) => typeof id === "string");
    const professorPhotoUrls = new Map();
    if (professorIds.length) {
      const { data: photos, error: photoError } = await authClient.from("professores_fotos")
        .select("professor_id,caminho_storage")
        .in("professor_id", professorIds);
      if (!isCurrentSession()) return false;
      if (photoError) {
        logRealAdminDatabaseError("listar fotos de Professores", photoError);
      } else {
        for (const photo of photos || []) {
          if (typeof photo.professor_id !== "string" || typeof photo.caminho_storage !== "string") continue;
          const signed = await createStorageSignedUrl("professores", photo.caminho_storage, "foto do Professor");
          if (!isCurrentSession()) return false;
          if (signed.signedUrl) professorPhotoUrls.set(photo.professor_id, signed.signedUrl);
        }
      }
    }
    if (management) management.innerHTML = renderRealAdminManagementDetails(
      academyId, profiles || [], replacementCandidates, professorPhotoUrls
    );
    return true;
  } catch (error) {
    if (!isCurrentSession()) return false;
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
  const photoInput = form.querySelector("#academy-new-photo-file");
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
    const photoFile = photoInput && photoInput.files && photoInput.files[0];
    if (photoFile) {
      const validationError = validateStorageFile(photoFile, ["image/jpeg", "image/png"], 5242880, "a foto da academia");
      if (validationError) return { errorMessage: validationError };
    }
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

    if (photoFile) {
      const photoPath = `${realCreatedAcademyId}/foto`;
      const photoResult = await uploadRegisteredPhoto("academias", photoPath, photoFile, "registrar_foto_academia", {
        p_academia_id: realCreatedAcademyId,
        p_caminho_storage: photoPath,
        p_tipo_mime: photoFile.type
      }, "a foto da academia");
      if (photoResult && photoResult.errorMessage) return photoResult;
      const photoUrl = await loadRealAcademyPhotoUrl(realCreatedAcademyId);
      if (photoUrl) realAcademyPhotoUrls.set(realCreatedAcademyId, photoUrl);
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

function handleRealAcademyPhotoUpload(button) {
  const form = button.closest("form");
  if (!form) return;
  const academyId = button.dataset.realAcademyPhotoUpload;
  const fileInput = form.querySelector("[data-real-academy-photo-file]");
  const error = form.querySelector("[data-real-academy-photo-error]");
  const status = form.querySelector("[data-real-academy-photo-status]");
  runButtonAction(button, {
    feedback: error,
    announcement: status,
    buttons: [button, fileInput],
    loadingText: "Enviando...",
    loadingMessage: "Enviando foto da academia.",
    successMessage: "Foto da academia atualizada.",
    errorMessage: "Não foi possível enviar a foto da academia.",
    successDelay: 0,
    afterSuccess: async () => {
      if (isRealAdmSession()) {
        await loadRealAdminAcademiesForEdit();
      } else if (isRealActiveProfessor()) {
        realProfessorAcademyPhotoUrl = await loadRealAcademyPhotoUrl(academyId);
        if (currentScreen === "academy") screenContent.innerHTML = renderRealProfessorAcademyScreen();
      }
    }
  }, async () => {
    const canEdit = isRealAdmSession() ||
      (isRealActiveProfessor() && realProfile && academyId === realProfile.academia_id);
    if (!authClient || !realUser || !canEdit || !academyId) {
      return { errorMessage: "Somente o Adm ou o Professor ativo da academia pode enviar esta foto." };
    }
    const file = fileInput && fileInput.files && fileInput.files[0];
    const validationError = validateStorageFile(file, ["image/jpeg", "image/png"], 5242880, "a foto da academia");
    if (validationError) return { errorMessage: validationError };
    const path = `${academyId}/foto`;
    return uploadRegisteredPhoto("academias", path, file, "registrar_foto_academia", {
      p_academia_id: academyId,
      p_caminho_storage: path,
      p_tipo_mime: file.type
    }, "a foto da academia");
  });
}

function handleRealProfessorAcademySubmit(form) {
  const button = form.querySelector("[data-real-professor-academy-save]");
  const nameInput = form.querySelector('[name="nome"]');
  const photoInput = form.querySelector('[name="foto_fundo_url"]');
  const name = nameInput.value.trim();
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
    afterSuccess: () => { screenContent.innerHTML = renderRealProfessorAcademyScreen(); }
  }, async () => {
    if (!authClient || !realUser || !isRealActiveProfessor() ||
        form.dataset.academyId !== realProfile.academia_id ||
        !realProfessorAcademy || realProfessorAcademy.id !== form.dataset.academyId) {
      return { errorMessage: "Só é possível editar a academia vinculada ao seu perfil de Professor ativo." };
    }
    if (Array.from(name).length < 2 || Array.from(name).length > 80) {
      return { errorMessage: "Informe um nome com 2 a 80 caracteres." };
    }
    if (!Number.isSafeInteger(version) || version < 1) {
      return { errorMessage: "Não foi possível verificar a versão atual. Recarregue a tela." };
    }

    try {
      const { data, error } = await authClient.rpc("atualizar_academia", {
        p_academia_id: form.dataset.academyId,
        p_nome: name,
        p_foto_fundo_url: photoUrl || null,
        p_versao_esperada: version
      });
      if (error) {
        logRealProfileSupabaseError("atualizar academia do Professor", error);
        return { errorMessage: realAdminDatabaseErrorMessage(error, "updateAcademy") };
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!result || result.codigo !== "ok") {
        return { errorMessage: realAdminAcademyRpcMessage(result && result.codigo) };
      }
      const nextVersion = Number(result.versao);
      if (!Number.isSafeInteger(nextVersion) || nextVersion < 1) {
        return { errorMessage: "A academia foi salva, mas não foi possível confirmar a versão atual. Recarregue a tela." };
      }
      realProfessorAcademy = {
        ...realProfessorAcademy,
        nome: name,
        foto_fundo_url: photoUrl || null,
        versao_edicao: nextVersion
      };
      realProfessorAcademyState = "found";
      realProfessorAcademyNotice = "";
    } catch (error) {
      logRealProfileSupabaseError("atualizar academia do Professor", error);
      return { errorMessage: realAdminDatabaseErrorMessage(error, "updateAcademy") };
    }
  });
}

function handleRealProfessorPhotoSubmit(form) {
  const button = form.querySelector("[data-real-professor-photo-save]");
  const fileInput = form.querySelector('input[type="file"]');
  runButtonAction(button, {
    feedback: form.querySelector("#real-professor-photo-error"),
    announcement: form.querySelector("#real-professor-photo-status"),
    buttons: [button, fileInput],
    loadingText: "Enviando...",
    loadingMessage: "Enviando a foto do Professor.",
    successMessage: "Foto do Professor atualizada.",
    errorMessage: "Não foi possível enviar a foto do Professor.",
    successDelay: 0,
    afterSuccess: async () => {
      await loadRealProfessorPhotoSettings();
      await loadRealUserPanelMedia();
    }
  }, async () => {
    if (!authClient || !realUser || !isRealActiveProfessorAccount() || !realProfile) {
      return { errorMessage: "Somente Professor ativo pode enviar foto pessoal." };
    }
    const file = fileInput.files && fileInput.files[0];
    const validationError = validateStorageFile(file, ["image/jpeg", "image/png"], 5242880, "a foto");
    if (validationError) return { errorMessage: validationError };
    const path = `${realUser.id}/foto`;
    return uploadRegisteredPhoto("professores", path, file, "registrar_foto_professor", {
      p_caminho_storage: path,
      p_tipo_mime: file.type
    }, "a foto do Professor");
  });
}

function handleRealAvatarChoiceSave(button) {
  const controls = button.closest("[data-real-avatar-choice-controls]");
  const feedback = controls && controls.querySelector("#real-avatar-choice-error");
  const announcement = controls && controls.querySelector("#real-avatar-choice-status");
  const radios = controls ? Array.from(controls.querySelectorAll('input[name="real-avatar-choice"]')) : [];
  const selected = radios.find((radio) => radio.checked);
  const userId = realUser && realUser.id;
  runButtonAction(button, {
    feedback,
    announcement,
    buttons: [button, ...radios],
    loadingText: "Salvando...",
    loadingMessage: "Salvando o avatar escolhido.",
    successMessage: "Avatar padrão atualizado.",
    errorMessage: "Não foi possível salvar o avatar escolhido.",
    successDelay: 0
  }, async () => {
    if (!authClient || !userId || !realProfile || realProfile.id !== userId) {
      return { errorMessage: "Não foi possível confirmar o perfil. Recarregue a tela e tente novamente." };
    }
    if (!selected || !Object.prototype.hasOwnProperty.call(REAL_PERSON_AVATARS, selected.value)) {
      return { errorMessage: "Escolha um avatar antes de salvar." };
    }
    try {
      const { data, error } = await authClient.rpc("definir_avatar_escolhido", {
        p_avatar_escolhido: selected.value
      });
      if (error) {
        logRealProfileSupabaseError("salvar avatar escolhido", error);
        return { errorMessage: "Não foi possível salvar o avatar. Tente novamente mais tarde." };
      }
      if (data !== true) {
        return { errorMessage: "O avatar não foi salvo. Confira se sua conta ainda está ativa e tente novamente." };
      }
      realAvatarChoiceByProfile.set(userId, selected.value);
      realAvatarChoiceOwnerId = userId;
      realAvatarChoiceState = "ready";
      updateRealAvatarFallbacks(userId);
      void loadRealUserPanelMedia();
      return {};
    } catch (error) {
      logRealProfileSupabaseError("salvar avatar escolhido", error);
      return { errorMessage: "Não foi possível salvar o avatar. Verifique a conexão e tente novamente." };
    }
  });
}

function handleRealPhotoRemoval(button, isProfessorPhoto) {
  const control = button.closest(".student-action-control");
  const feedback = control && control.querySelector('[role="alert"]');
  const announcement = control && control.querySelector('[role="status"]');
  const userId = realUser && realUser.id;
  const profile = realProfile;
  const path = isProfessorPhoto ? realOwnProfessorPhotoPath : realOwnProfilePhotoPath;
  const bucket = isProfessorPhoto ? "professores" : "perfis";
  const rpcName = isProfessorPhoto
    ? "remover_foto_professor_propria"
    : "remover_foto_perfil_propria";
  const label = isProfessorPhoto ? "foto do Professor" : "foto de perfil";
  if (!window.confirm(`Remover sua ${label}? O avatar escolhido será exibido no lugar.`)) return;

  runButtonAction(button, {
    feedback,
    announcement,
    buttons: [button],
    loadingText: "Removendo...",
    loadingMessage: `Removendo a ${label}.`,
    successMessage: "Foto removida. O avatar escolhido será exibido.",
    errorMessage: `Não foi possível remover a ${label}.`,
    successDelay: 1800,
    afterSuccess: () => {
      realOwnProfilePhotoPath = "";
      realOwnProfessorPhotoPath = "";
      void loadRealUserPanelMedia();
      renderScreen("user-settings");
    }
  }, async () => {
    if (!authClient || !userId || !profile || profile.id !== userId || !path) {
      return { errorMessage: "Não foi possível localizar a foto atual. Atualize as Preferências e tente novamente." };
    }
    if (isProfessorPhoto ? !isRealActiveProfessorAccount() : !canEditRealProfilePhoto(profile)) {
      return { errorMessage: "Este perfil não pode remover a foto enquanto estiver inativo ou sem idade adulta declarada." };
    }
    let storageRemoved = false;
    try {
      const { error: storageError } = await authClient.storage.from(bucket).remove([path]);
      if (storageError) {
        logRealProfileSupabaseError(`remover ${label} do Storage`, storageError);
        return { errorMessage: `Não foi possível apagar a ${label} no armazenamento. Verifique a conexão e tente novamente.` };
      }
      storageRemoved = true;
      const { data, error } = await authClient.rpc(rpcName, {
        p_caminho_storage: path
      });
      if (error) {
        logRealProfileSupabaseError(`limpar o registro da ${label}`, error);
        return { errorMessage: `O arquivo foi removido, mas o registro da ${label} não pôde ser limpo. Tente novamente.` };
      }
      if (data !== true) {
        return { errorMessage: `O arquivo foi removido, mas o registro da ${label} não pôde ser confirmado. Tente novamente.` };
      }
      return {};
    } catch (error) {
      logRealProfileSupabaseError(`remover ${label}`, error);
      return {
        errorMessage: storageRemoved
          ? `O arquivo foi removido, mas o registro da ${label} não pôde ser confirmado. Tente novamente.`
          : `Não foi possível remover a ${label}. Verifique a conexão e tente novamente.`
      };
    }
  });
}

function waitForRealServiceWorkerActivation(registration) {
  const worker = registration.installing || registration.waiting;
  if (!worker || worker.state === "activated") return Promise.resolve();
  if (registration.waiting === worker) worker.postMessage({ type: "TATAME_SKIP_WAITING" });
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.removeEventListener("statechange", checkState);
      reject(new Error("A instalação do service worker demorou demais."));
    }, 15000);
    const checkState = () => {
      if (worker.state === "installed" && registration.waiting === worker) {
        worker.postMessage({ type: "TATAME_SKIP_WAITING" });
      }
      if (worker.state === "activated") {
        window.clearTimeout(timeout);
        worker.removeEventListener("statechange", checkState);
        resolve();
      } else if (worker.state === "redundant") {
        window.clearTimeout(timeout);
        worker.removeEventListener("statechange", checkState);
        reject(new Error("A instalação do service worker não foi concluída."));
      }
    };
    worker.addEventListener("statechange", checkState);
    checkState();
  });
}

function requestRealServiceWorkerCacheRefresh(worker) {
  if (typeof MessageChannel !== "function") {
    return Promise.reject(new Error("O navegador não permite atualizar o cache do app."));
  }
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error("O service worker não respondeu à atualização."));
    }, 20000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      if (event.data && event.data.type === "TATAME_REFRESH_STATIC_ASSETS" &&
          event.data.success === true) {
        resolve();
      } else {
        reject(new Error("O service worker não conseguiu atualizar os arquivos."));
      }
    };
    try {
      worker.postMessage({ type: "TATAME_REFRESH_STATIC_ASSETS" }, [channel.port2]);
    } catch (error) {
      window.clearTimeout(timeout);
      channel.port1.close();
      reject(error);
    }
  });
}

function handleAppUpdate(button) {
  const control = button.closest(".user-panel-action");
  if (!control) return;
  runButtonAction(button, {
    feedback: control.querySelector("#app-update-error"),
    announcement: control.querySelector("#app-update-status"),
    buttons: [button],
    loadingText: "Verificando...",
    loadingMessage: "Verificando atualizações do app.",
    successMessage: "App atualizado. Recarregando...",
    errorMessage: "Não foi possível atualizar o app.",
    successDelay: 0,
    afterSuccess: () => window.setTimeout(() => window.location.reload(), 900)
  }, async () => {
    if (!("serviceWorker" in navigator)) {
      return { errorMessage: "Este navegador não oferece atualização automática do app." };
    }
    window.__tatameUpdatingApp = true;
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return { errorMessage: "O app ainda não tem um service worker ativo. Atualize a página e tente novamente." };
      }
      await registration.update();
      await waitForRealServiceWorkerActivation(registration);
      const refreshedRegistration = await navigator.serviceWorker.getRegistration();
      const worker = refreshedRegistration && refreshedRegistration.active;
      if (!worker) {
        return { errorMessage: "Não foi possível localizar o service worker ativo. Tente novamente." };
      }
      await requestRealServiceWorkerCacheRefresh(worker);
      return {};
    } catch (error) {
      console.warn("Não foi possível atualizar o app.", error);
      return {
        errorMessage: navigator.onLine === false
          ? "Conecte-se à internet e tente novamente para atualizar o app."
          : "Não foi possível verificar a atualização. Tente novamente."
      };
    } finally {
      window.__tatameUpdatingApp = false;
    }
  });
}

function handleRealProfilePhotoSubmit(form) {
  const button = form.querySelector("[data-real-profile-photo-save]");
  const fileInput = form.querySelector("#real-profile-photo-file");
  const userId = realUser && realUser.id;
  runButtonAction(button, {
    feedback: form.querySelector("#real-profile-photo-error"),
    announcement: form.querySelector("#real-profile-photo-status"),
    buttons: [button, fileInput],
    loadingText: "Enviando...",
    loadingMessage: "Enviando a foto de perfil.",
    successMessage: "Foto de perfil atualizada.",
    errorMessage: "Não foi possível enviar a foto de perfil.",
    successDelay: 0,
    afterSuccess: async () => {
      await loadRealProfilePhotoPreview(userId);
      await loadRealUserPanelMedia();
    }
  }, async () => {
    if (!authClient || !userId || !realProfile || realProfile.id !== userId) {
      return { errorMessage: "Não foi possível confirmar o perfil. Recarregue a tela e tente novamente." };
    }
    if (!canShowRealProfilePhotoForm(realProfile)) {
      return {
        errorMessage: realProfile.papel === "aluno"
          ? "Menores de idade usam somente avatar."
          : "Este perfil não pode enviar foto de pessoa."
      };
    }
    if (!canEditRealProfilePhoto(realProfile)) {
      return { errorMessage: "O perfil precisa estar ativo para enviar foto." };
    }
    const file = fileInput.files && fileInput.files[0];
    const validationError = validateStorageFile(file, ["image/jpeg", "image/png"], 5242880, "a foto");
    if (validationError) return { errorMessage: validationError };
    const path = `${userId}/foto`;
    return uploadRegisteredPhoto("perfis", path, file, "registrar_foto_perfil", {
      p_caminho_storage: path,
      p_tipo_mime: file.type
    }, "a foto de perfil");
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
  const describedIds = (button.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
  const [errorId, statusId] = describedIds;
  runButtonAction(button, {
    feedback: errorId ? row.querySelector(`[id="${errorId}"]`) : null,
    announcement: statusId ? row.querySelector(`[id="${statusId}"]`) : null,
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

function syncRealSessionPanel() {
  document.body.dataset.appMode = "real";
  if (!realUser) clearRealUserPanelMedia();
  const realSession = document.querySelector("#real-session");
  realSession.hidden = !realUser;
  document.querySelector("#real-session-email").textContent = realUser ? realUser.email || "E-mail não disponível" : "";
  document.querySelector(".user-panel-links[aria-label='Ajuda']").hidden = !realUser;
  document.querySelector(".user-panel-risk [data-real-only]").hidden = !realUser;
  if (realUser) {
    document.querySelector("#profile-button").hidden = false;
    document.querySelector(".profile-button-copy").innerHTML = "<strong>Conta real</strong><small>Sessão conectada</small>";
    updateUserPanelProfile();
  } else {
    document.querySelector("#profile-button").hidden = true;
    document.querySelector(".sidebar-profile-button").hidden = true;
  }
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

function clearRealAccountCaches() {
  realSessionCacheGeneration += 1;
  realHomeProfileRequestSequence += 1;
  realHomeProfileContext = { academyName: "", academyPhotoUrl: "", professor: null, ownPhotoUrl: "" };
  if (realProofViewerWindow && !realProofViewerWindow.closed) realProofViewerWindow.close();
  realProofViewerWindow = null;
  clearRealUserPanelMedia();
  screenContent.querySelectorAll("img.real-media-preview").forEach((image) => {
    image.removeAttribute("src");
    image.hidden = true;
  });
  realInstructorLinkRequestSequence += 1;
  realTeacherCodeRequestSequence += 1;
  realInstructorInvitesSequence += 1;
  realStudentLinkRequestSequence += 1;
  realTeacherLinkRequestsSequence += 1;
  realUnregisteredStudentsSequence += 1;
  realBillingStudentsRequestSequence += 1;
  realBillingUnregisteredStudentsRequestSequence += 1;
  realInstructorStudentsRequestSequence += 1;
  realBillingRequestSequence += 1;
  realStudentPaymentsRequestSequence += 1;
  realProfessorPaymentsRequestSequence += 1;
  realProfessorGraduationsRequestSequence += 1;
  realStudentGraduationsRequestSequence += 1;
  realAdminStudentsRequestSequence += 1;
  realAdminDashboardRequestSequence += 1;
  realHomeRequestSequence += 1;
  realProfessorAcademyRequestSequence += 1;
  realFeatureRequestSequence += 1;
  realStudentDetailRequestSequence += 1;

  realProfile = null;
  realProfileState = "idle";
  realProfileNotice = "";
  realInstructorLink = null;
  realInstructorLinkState = "idle";
  realInstructorLinkNotice = "";
  realOnboardingHandledSessionUserId = null;
  realOnboardingStage = null;
  realOnboardingAge = null;
  realOnboardingName = "";
  realProfessorActivated = false;
  professorActivationSessionUserId = null;
  professorActivationPromise = null;
  realTeacherCode = null;
  realTeacherCodeState = "idle";
  realTeacherCodeNotice = "";
  realInstructorInvites = [];
  realInstructorInvitesState = "idle";
  realInstructorInvitesNotice = "";
  realInstructorInviteUrl = "";
  realInstructorConsentPending = false;
  realStudentLinkState = "idle";
  realStudentLinkRequest = null;
  realStudentLinkNotice = "";
  realTeacherLinkRequests = [];
  realTeacherLinkRequestsState = "idle";
  realTeacherLinkRequestsNotice = "";
  realUnregisteredStudents = [];
  realUnregisteredStudentsState = "idle";
  realUnregisteredStudentsNotice = "";
  realBillingRules = [];
  realBillingCharges = [];
  realBillingPayments = [];
  realBillingStudentNames = new Map();
  realBillingStudentsState = "idle";
  realBillingStudentsNotice = "";
  realBillingUnregisteredStudents = [];
  realBillingUnregisteredStudentsState = "idle";
  realBillingUnregisteredStudentsNotice = "";
  realInstructorStudents = [];
  realInstructorStudentsState = "idle";
  realInstructorStudentsNotice = "";
  realBillingGraceDays = null;
  realPaymentAcademyName = "";
  realPaymentAcademyPhotoUrl = "";
  realBillingState = "idle";
  realBillingNotice = "";
  realBillingSelectedMonth = realGraduationToday().slice(0, 7);
  realBillingLateOnly = false;
  realStudentPayments = [];
  realStudentCharges = [];
  realStudentPaymentProofs = new Map();
  realPaymentProofsNotice = "";
  realStudentPaymentsState = "idle";
  realStudentPaymentsNotice = "";
  realProfessorPayments = [];
  realProfessorCharges = [];
  realProfessorPaymentProofs = new Map();
  realProfessorPaymentsState = "idle";
  realProfessorPaymentsNotice = "";
  realProofCleanupRunning = false;
  realProofCleanupNotice = "";
  realProfessorGraduationStudents = [];
  realProfessorGraduations = [];
  realProfessorGraduationsState = "idle";
  realProfessorGraduationsNotice = "";
  realSelectedGraduationStudentId = "";
  realStudentGraduations = [];
  realStudentGraduationsState = "idle";
  realStudentGraduationsNotice = "";
  realStudentGraduationsOwnerId = "";
  window.clearTimeout(realPaymentUndoTimer);
  realPaymentUndoTimer = null;
  realPaymentReceiptChargeId = "";
  realProfessorMetricsMonth = realGraduationToday().slice(0, 7);
  realCreatedAcademyId = null;
  realCreatedAcademy = null;
  realAdminAcademies = [];
  realAcademyPhotoUrls = new Map();
  realAdminProfessorPhotoUrls = new Map();
  realAvatarChoiceByProfile = new Map();
  realAvatarChoiceOwnerId = "";
  realAvatarChoiceState = "idle";
  realProfessorAcademy = null;
  realProfessorAcademyPhotoUrl = "";
  realOwnProfessorPhotoUrl = "";
  realOwnProfessorPhotoPath = "";
  realOwnProfilePhotoPath = "";
  realProfessorPhotoNotice = "";
  realProfessorAcademyState = "idle";
  realProfessorAcademyNotice = "";
  realAdminStudents = [];
  realAdminStudentsState = "idle";
  realAdminStudentsNotice = "";
  realAdminDashboardAcademies = [];
  realAdminDashboardProfessors = [];
  realAdminDashboardStudents = 0;
  realAdminDashboardPendingInvites = 0;
  realAdminDashboardState = "idle";
  realAdminDashboardNotice = "";
  realHomeState = "idle";
  realHomeNotice = "";
  realHomeData = null;
  Object.assign(realFeatureData, {
    state: "idle",
    error: "",
    notes: [],
    grades: [],
    notices: [],
    faq: [],
    plans: [],
    themes: [],
    feedbacks: [],
    goals: [],
    conversations: [],
    conversationRecipients: [],
    conversationProfessorId: null,
    delegatedLessons: [],
    linkedInstructors: [],
    linkedStudents: [],
    unregisteredStudents: [],
    unregisteredNotes: [],
    dropIns: []
  });
}

async function updateRealSession(session, updateScreen = true) {
  if (realPasswordRecoveryPending) {
    const previousUser = realUser;
    realUser = session && session.user ? { id: session.user.id, email: session.user.email } : null;
    if (!realUser || (previousUser && previousUser.id !== realUser.id)) clearRealAccountCaches();
    syncRealSessionPanel();
    return;
  }
  const sequence = ++authCheckSequence;
  const previousUser = realUser;
  realUser = session && session.user ? { id: session.user.id, email: session.user.email } : null;
  if (!realUser || (previousUser && previousUser.id !== realUser.id)) clearRealAccountCaches();
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
    realAdminDashboardRequestSequence += 1;
    realHomeRequestSequence += 1;
    realAdminDashboardAcademies = [];
    realAdminDashboardProfessors = [];
    realAdminDashboardStudents = 0;
    realAdminDashboardPendingInvites = 0;
    realAdminDashboardState = "idle";
    realAdminDashboardNotice = "";
    realHomeState = "idle";
    realHomeNotice = "";
    realHomeData = null;
    realProfessorActivated = false;
    professorActivationSessionUserId = null;
    professorActivationPromise = null;
    realAdminAcademies = [];
    realCreatedAcademyId = null;
    realCreatedAcademy = null;
    realInstructorInviteUrl = "";
    realInstructorConsentPending = false;
    if (previousUser) {
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
    realAdminDashboardRequestSequence += 1;
    realHomeRequestSequence += 1;
    realAdminDashboardAcademies = [];
    realAdminDashboardProfessors = [];
    realAdminDashboardStudents = 0;
    realAdminDashboardPendingInvites = 0;
    realAdminDashboardState = "idle";
    realAdminDashboardNotice = "";
    realHomeState = "idle";
    realHomeNotice = "";
    realHomeData = null;
    realProfessorActivated = false;
    professorActivationSessionUserId = null;
    professorActivationPromise = null;
    realInstructorInviteToken = "";
    realInstructorInviteUrl = "";
    realInstructorConsentPending = false;
  }
  realProfileState = "checking";
  realProfile = null;
  if (currentScreen === "teacher-code") {
    realTeacherCodeState = "checking";
    screenContent.innerHTML = renderRealTeacherCodeScreen();
  }
  const isPendingInviteAuthScreen = realInstructorInviteToken &&
    ["instructor-invite", "login", "create-account", "forgot-password"].includes(currentScreen);
  if (updateScreen && (!previousUser || previousUser.id !== realUser.id || currentScreen === "real-account") &&
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
  updateUserPanelProfile();
  renderNavigation();
  if (updateScreen) {
    if (currentScreen === "teacher-code" && isRealProfessorProfile()) {
      loadRealTeacherCode();
      loadRealInstructorInvites();
    }
    else if (currentScreen === "link-teacher" && isRealActiveStudent()) renderScreen("link-teacher");
    else if (currentScreen === "password-recovery") {
      renderScreen(realInstructorInviteToken ? "instructor-invite" : realInitialScreen());
    }
    else if (realInstructorInviteToken &&
        ["login", "create-account", "forgot-password"].includes(currentScreen)) renderScreen("instructor-invite");
    else if (currentScreen === "real-account") renderScreen(realInitialScreen());
    else if (currentScreen === "instructor-invite") renderScreen("instructor-invite");
    else if (currentScreen === "instructor-students" && isRealActiveInstructor()) renderScreen("instructor-students");
    else if (!canViewScreen(currentScreen)) renderScreen(realInitialScreen());
  }
  maybeOpenRealProfileOnboarding();
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
        options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } }
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
  const isLightTheme = document.body.dataset.theme === "light";
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(isLightTheme));
    button.textContent = `Tema: ${isLightTheme ? "claro" : "escuro"}`;
  });
  showToast(`Tema ${isLightTheme ? "claro" : "escuro"} para visualização.`);
}

renderNavigation();
const initialQuery = new URLSearchParams(window.location.search);
removeInstructorInviteTokenFromUrl();
renderScreen(initialQuery.has("convite_instrutor") ? "instructor-invite" : "login");
document.querySelector("#diagnostics-version").textContent = `Versão do app: ${APP_VERSION}`;
syncRealSessionPanel();
initializeRealAuth();
window.addEventListener("resize", updateToastPosition);
window.addEventListener("resize", () => screenContent.querySelectorAll('input[type="email"]').forEach(updateEmailPreview));
if (window.ResizeObserver) {
  new ResizeObserver(updateToastPosition).observe(document.querySelector("#mobile-navigation"));
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

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
      const role = realProfileState === "found" && realProfile ? realProfile.papel : null;
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
        if (!realUser || role === "professor" || realOnboardingStage !== "age") {
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
        if (!realUser || (!role && !isStudentProfileFlow && !realInstructorInviteToken) ||
            realOnboardingStage !== "consent") {
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

});

    async function submitRealFeatureForm(form) {
      const formType = form.dataset.featureForm;
      const button = form.querySelector('button[type="submit"]');
      if (!(button instanceof HTMLButtonElement)) return;
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const text = (name) => String(values.get(name) || "").trim();
      const id = form.dataset.featureId || "";
      const container = form;
      const call = async (functionName, parameters, expectsUuid = false) => {
        const outcome = await runRealFeatureRpc(functionName, parameters, expectsUuid);
        if (outcome.errorMessage) return outcome;
        return { successMessage: "Alterações salvas.", afterSuccess: undefined };
      };
      let functionName = "";
      let parameters = {};
      let expectsUuid = false;
      if (formType === "create-grade") {
        functionName = "criar_grade_semanal";
        parameters = { p_dias: text("dias"), p_horario: text("horario") };
        expectsUuid = true;
      } else if (formType === "edit-grade") {
        functionName = "editar_grade_semanal";
        parameters = { p_grade_id: id, p_dias: text("dias"), p_horario: text("horario") };
      } else if (formType === "create-notice") {
        functionName = "criar_aviso";
        parameters = { p_titulo: text("titulo"), p_texto: text("texto"), p_fixado: values.has("fixado") };
        expectsUuid = true;
      } else if (formType === "edit-notice") {
        functionName = "editar_aviso";
        parameters = { p_aviso_id: id, p_titulo: text("titulo"), p_texto: text("texto"), p_fixado: values.has("fixado") };
      } else if (formType === "create-faq") {
        functionName = "criar_faq";
        parameters = { p_pergunta: text("pergunta"), p_resposta: text("resposta"), p_ordem: Number(text("ordem") || 0) };
        expectsUuid = true;
      } else if (formType === "edit-faq") {
        functionName = "editar_faq";
        parameters = { p_faq_id: id, p_pergunta: text("pergunta"), p_resposta: text("resposta"), p_ordem: Number(text("ordem") || 0) };
      } else if (formType === "create-plan" || formType === "edit-plan") {
        const weekStart = text("semana_inicio");
        const monday = weekStart && new Date(`${weekStart}T12:00:00`).getDay() === 1;
        if (!monday) {
          form.querySelector('[role="alert"]').textContent = "Escolha uma segunda-feira para iniciar a semana.";
          return;
        }
        const items = [...form.querySelectorAll("[data-plan-item]")].map((row) => ({
          dia: Number(row.querySelector('[name="dia"]').value),
          tema: row.querySelector('[name="tema"]').value.trim(),
          descricao: row.querySelector('[name="descricao"]').value.trim()
        }));
        if (items.some((item) => !item.tema || item.tema.length > 80 || item.descricao.length > 300)) {
          form.querySelector('[role="alert"]').textContent = "Confira os temas (1 a 80 caracteres) e descrições (até 300 caracteres).";
          return;
        }
        if (formType === "create-plan") {
          functionName = "criar_plano_semanal";
          parameters = { p_semana_inicio: weekStart, p_itens: items };
          expectsUuid = true;
        } else {
          functionName = "editar_plano_semanal";
          parameters = { p_plano_id: id, p_semana_inicio: weekStart, p_itens: items };
        }
      } else if (formType === "create-theme") {
        functionName = "criar_tema_biblioteca";
        parameters = { p_nome: text("nome"), p_descricao: text("descricao") || null };
        expectsUuid = true;
      } else if (formType === "edit-theme") {
        functionName = "editar_tema_biblioteca";
        parameters = { p_tema_id: id, p_nome: text("nome"), p_descricao: text("descricao") || null, p_arquivado: values.has("arquivado") };
      } else if (formType === "create-note" || formType === "create-feedback" || formType === "create-goal") {
        const selectedStudentId = formType === "create-note" && form.dataset.studentId
          ? form.dataset.studentId
          : realSelectedGraduationStudentId;
        if (!selectedStudentId) {
          form.querySelector('[role="alert"]').textContent = "Selecione um aluno vinculado.";
          return;
        }
        functionName = formType === "create-note" ? "salvar_nota_privada"
          : formType === "create-feedback" ? "criar_feedback" : "criar_meta";
        parameters = formType === "create-note"
          ? form.dataset.studentId
            ? { p_aluno_id: null, p_aluno_sem_conta_id: selectedStudentId, p_texto: text("texto") }
            : { p_aluno_id: selectedStudentId, p_aluno_sem_conta_id: null, p_texto: text("texto") }
          : { p_aluno_id: selectedStudentId, p_texto: text("texto") };
        expectsUuid = true;
      } else if (formType === "create-drop-in") {
        functionName = "criar_aula_avulsa";
        parameters = { p_aluno_sem_conta_id: form.dataset.studentId, p_data_aula: text("data_aula") };
        expectsUuid = true;
      } else if (formType === "create-conversation") {
        functionName = "criar_conversa_professor";
        parameters = { p_destinatario_id: text("destinatario"), p_texto: text("texto") };
        expectsUuid = true;
      } else if (formType === "reply-conversation") {
        functionName = "responder_conversa_professor";
        parameters = { p_conversa_id: id, p_texto: text("texto") };
        expectsUuid = true;
      } else if (formType === "edit-delegated") {
        const mode = text("modo");
        functionName = "editar_aula_delegada";
        parameters = {
          p_instrutor_id: id,
          p_modo: mode,
          p_plano: mode === "plan" ? text("plano") : null
        };
      } else if (formType === "create-delegated") {
        const mode = text("modo");
        const plan = text("plano");
        if (mode === "plan" && !plan) {
          form.querySelector('[role="alert"]').textContent = "Informe o plano da aula ou escolha treino livre.";
          return;
        }
        functionName = "criar_aula_delegada";
        parameters = {
          p_instrutor_id: text("instrutor_id"),
          p_modo: mode,
          p_plano: mode === "plan" ? plan : null
        };
      } else {
        return;
      }
      const feedback = container.querySelector('[role="alert"]');
      const announcement = container.querySelector('[role="status"]');
      await runButtonAction(button, {
        feedback,
        announcement,
        buttons: Array.from(container.querySelectorAll("button, input, textarea, select")),
        loadingText: "Salvando...",
        loadingMessage: "Salvando alterações.",
        successMessage: "Alterações salvas.",
        errorMessage: "Não foi possível salvar. Confira os dados e tente novamente.",
        afterSuccess: async () => {
          if (currentScreen === "student-detail") await loadRealStudentDetailData();
          else await reloadRealFeatureScreen();
        }
      }, async () => call(functionName, parameters, expectsUuid));
    }

    async function runRealFeatureButton(button) {
      const action = button.dataset.featureAction;
      const id = button.dataset.featureId;
      let functionName = "";
      let parameters = {};
      let expectsUuid = false;
      if (action === "archive-grade") {
        functionName = "arquivar_grade_semanal";
        parameters = { p_grade_id: id };
      } else if (action === "publish-grade") {
        functionName = "publicar_grade_semanal";
        parameters = { p_publicada: !realFeatureData.grades.some((grade) => grade.publicada) };
      } else if (action === "archive-notice") {
        functionName = "arquivar_aviso";
        parameters = { p_aviso_id: id };
      } else if (action === "archive-faq") {
        functionName = "arquivar_faq";
        parameters = { p_faq_id: id };
      } else if (action === "share-plan") {
        const plan = realFeatureData.plans.find((item) => item.id === id);
        functionName = "compartilhar_plano_semanal";
        parameters = { p_plano_id: id, p_compartilhado: !(plan && plan.compartilhado) };
      } else if (action === "delete-note") {
        functionName = "excluir_nota_privada";
        parameters = { p_nota_id: id };
      } else if (action === "toggle-goal") {
        const goal = realFeatureData.goals.find((item) => item.id === id);
        functionName = "atualizar_status_meta";
        parameters = { p_meta_id: id, p_status: goal && goal.status === "cumprida" ? "aberta" : "cumprida" };
      } else if (action === "toggle-linked-lock" || action === "toggle-unregistered-lock") {
        const list = action === "toggle-linked-lock" ? realFeatureData.linkedStudents : realFeatureData.unregisteredStudents;
        const student = list.find((item) => item.id === id);
        functionName = action === "toggle-linked-lock" ? "definir_status_aluno_vinculado" : "definir_status_aluno_sem_conta";
        parameters = action === "toggle-linked-lock"
          ? { p_aluno_id: id, p_status: student && student.status === "locked" ? null : "locked" }
          : { p_aluno_sem_conta_id: id, p_status: student && student.status === "locked" ? null : "locked" };
      } else if (action === "delete-drop-in") {
        functionName = "excluir_aula_avulsa";
        parameters = { p_aula_avulsa_id: id };
      } else if (action === "share-delegated") {
        functionName = "compartilhar_aula_delegada";
        parameters = { p_instrutor_id: id };
      } else if (action === "follow-delegated-yes" || action === "follow-delegated-no") {
        functionName = "registrar_seguiu_aula_delegada";
        parameters = { p_seguido: action === "follow-delegated-yes" ? "yes" : "no" };
      } else {
        return;
      }
      const row = button.closest(".student-action-control");
      await runButtonAction(button, {
        feedback: row.querySelector('[role="alert"]'),
        announcement: row.querySelector('[role="status"]'),
        buttons: Array.from(row.querySelectorAll("button")),
        loadingText: "Salvando...",
        loadingMessage: "Salvando alterações.",
        successMessage: "Alterações salvas.",
        errorMessage: "Não foi possível salvar. Tente novamente.",
        afterSuccess: () => reloadRealFeatureScreen()
      }, async () => {
        const result = await runRealFeatureRpc(functionName, parameters, expectsUuid);
        return result.errorMessage ? result : {};
      });
    }

    document.addEventListener("submit", (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches("[data-feature-form]")) return;
      event.preventDefault();
      submitRealFeatureForm(form);
    });

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const addPlanItem = event.target.closest("[data-add-plan-item]");
      if (addPlanItem instanceof HTMLButtonElement) {
        const form = addPlanItem.closest("[data-feature-form]");
        const control = addPlanItem.closest(".student-action-control");
        if (!(form instanceof HTMLFormElement) || !control) return;
        runButtonAction(addPlanItem, {
          feedback: control.querySelector('[role="alert"]'),
          announcement: control.querySelector('[role="status"]'),
          buttons: [addPlanItem],
          loadingText: "Adicionando...",
          loadingMessage: "Adicionando um campo para o treino.",
          successMessage: "Campo de treino adicionado.",
          errorMessage: "Não foi possível adicionar o campo de treino. Tente novamente."
        }, async () => {
          if (!form.isConnected) return { errorMessage: "O formulário não está mais disponível. Atualize a tela." };
          control.insertAdjacentHTML("beforebegin", renderPlanItemEditor());
          return {};
        });
        return;
      }
      const retry = event.target.closest("[data-reload-feature]");
      if (retry instanceof HTMLButtonElement) {
        const control = retry.closest(".student-action-control");
        if (!control) return;
        const screenId = currentScreen;
        runButtonAction(retry, {
          feedback: control.querySelector('[role="alert"]'),
          announcement: control.querySelector('[role="status"]'),
          buttons: [retry],
          loadingText: "Carregando...",
          loadingMessage: "Atualizando os dados desta tela.",
          successMessage: "Dados atualizados.",
          errorMessage: "Não foi possível carregar os dados. Tente novamente.",
          afterSuccess: () => {
            screenContent.innerHTML = screenId === "student-detail"
              ? renderRealProfessorGraduationsScreen()
              : renderRealFeatureScreenById(screenId);
            if (screenId === "student-detail") {
              const selectedStudent = realProfessorGraduationStudents.find((student) =>
                student.id === realSelectedGraduationStudentId
              );
              void loadRealLinkedProfilePhotoAvatars(selectedStudent ? [selectedStudent] : [], screenId);
            } else if (screenId === "students") {
              void loadRealLinkedProfilePhotoAvatars(realFeatureData.linkedStudents, screenId);
            }
          }
        }, async () => {
          if (screenId === "student-detail") await loadRealStudentDetailData(false);
          else await loadRealFeatureScreen(screenId, false);
          if (realFeatureData.state === "error") return { errorMessage: realFeatureData.error };
          if (realFeatureData.state !== "found") {
            return { errorMessage: "Os dados não foram carregados. Tente novamente." };
          }
          return {};
        });
        return;
      }
      const action = event.target.closest("[data-feature-action]");
      if (action instanceof HTMLButtonElement) runRealFeatureButton(action);
    });

    document.addEventListener("input", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
      const parent = input.closest(".field, [data-plan-item]");
      const counter = parent && parent.querySelector(`[data-feature-counter="${input.name}"]`);
      if (counter) counter.textContent = `${input.value.length}/${input.maxLength} caracteres`;
    });

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
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

  const retryProfileButton = target.closest("[data-retry-profile]");
  if (retryProfileButton instanceof HTMLButtonElement && realUser) {
    const control = retryProfileButton.closest(".student-action-control");
    if (!control) return;
    const sessionUser = realUser;
    runButtonAction(retryProfileButton, {
      feedback: control.querySelector('[role="alert"]'),
      announcement: control.querySelector('[role="status"]'),
      buttons: [retryProfileButton],
      loadingText: "Consultando...",
      loadingMessage: "Consultando os dados da conta.",
      successMessage: "Perfil consultado.",
      errorMessage: "Não foi possível consultar o perfil. Tente novamente.",
      afterSuccess: () => renderScreen(currentScreen)
    }, async () => {
      await updateRealSession({ user: sessionUser }, false);
      if (!realUser || realUser.id !== sessionUser.id) {
        return { errorMessage: "A sessão mudou. Entre novamente e tente consultar o perfil." };
      }
      if (realProfileState !== "found") {
        return { errorMessage: realProfileNotice || "O perfil ainda não pôde ser consultado." };
      }
      return {};
    });
    return;
  }

  if (target.closest("[data-close-sidebar]")) {
    closeMobileMenu();
    return;
  }

  const openSidebarButton = target.closest("[data-open-sidebar]");
  if (openSidebarButton instanceof HTMLButtonElement) {
    openMobileMenu(openSidebarButton);
    return;
  }

  if (target.closest("[data-open-tutorial]")) {
    if (userPanel.open) closeUserPanel(openTutorial);
    else openTutorial();
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
    const steps = tutorialStepsByRole[realProfile && realProfile.papel] || [];
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

  const appUpdateButton = target.closest("[data-app-update]");
  if (appUpdateButton instanceof HTMLButtonElement) {
    handleAppUpdate(appUpdateButton);
    return;
  }

  const avatarChoiceButton = target.closest("[data-real-avatar-choice-save]");
  if (avatarChoiceButton instanceof HTMLButtonElement) {
    handleRealAvatarChoiceSave(avatarChoiceButton);
    return;
  }

  const profilePhotoRemoveButton = target.closest("[data-real-profile-photo-remove]");
  if (profilePhotoRemoveButton instanceof HTMLButtonElement) {
    handleRealPhotoRemoval(profilePhotoRemoveButton, false);
    return;
  }

  const professorPhotoRemoveButton = target.closest("[data-real-professor-photo-remove]");
  if (professorPhotoRemoveButton instanceof HTMLButtonElement) {
    handleRealPhotoRemoval(professorPhotoRemoveButton, true);
    return;
  }

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

});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.type === "email") updateEmailPreview(target);
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === "real-admin-academy" && isRealAdmSession()) {
    loadRealAdminManagementForAcademy(target.value);
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement) || !target.matches("[data-real-professor-month-filter]") ||
      currentScreen !== "payment-review" || !isRealActiveProfessor() ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(target.value)) return;
  realProfessorMetricsMonth = target.value;
  screenContent.innerHTML = renderRealProfessorPaymentsScreen();
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-academy-form]")) return;
  event.preventDefault();
  const form = event.target;
  if (isRealAdmSession()) {
    handleRealAdminAcademySubmit(form);
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest("[data-real-academy-photo-upload]");
  if (!(button instanceof HTMLButtonElement)) return;
  event.preventDefault();
  handleRealAcademyPhotoUpload(button);
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
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-professor-academy-form]")) return;
  event.preventDefault();
  handleRealProfessorAcademySubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-professor-photo-form]")) return;
  event.preventDefault();
  handleRealProfessorPhotoSubmit(event.target);
});

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement) || !event.target.matches("[data-real-profile-photo-form]")) return;
  event.preventDefault();
  handleRealProfilePhotoSubmit(event.target);
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
});

menuButton.addEventListener("click", () => openMobileMenu(menuButton));

sidebarBackdrop.addEventListener("click", closeMobileMenu);

document.addEventListener("keydown", (event) => {
  if (!sidebar.classList.contains("is-open")) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeMobileMenu();
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

function updateRealBillingRuleFields(form) {
  const discountType = form.querySelector("#real-billing-discount-type").value;
  const durationType = form.querySelector("#real-billing-duration").value;
  form.querySelector("#real-billing-discount-value").closest(".field").hidden = discountType !== "valor_fixo";
  form.querySelector("#real-billing-discount-percent").closest(".field").hidden = discountType !== "percentual";
  form.querySelector("#real-billing-reason").closest(".field").hidden = discountType !== "isencao";
  form.querySelector("#real-billing-duration-months").closest(".field").hidden = durationType !== "n_meses";
}

function readRealBillingRuleForm(form) {
  const studentId = form.querySelector("#real-billing-student-id").value.trim();
  const startMonth = form.querySelector("#real-billing-start-month").value;
  const baseCents = parseRealBillingCents(form.querySelector("#real-billing-base").value);
  const dueDay = Number(form.querySelector("#real-billing-due-day").value);
  const discountType = form.querySelector("#real-billing-discount-type").value;
  const discountValue = form.querySelector("#real-billing-discount-value").value.trim();
  const percentValue = form.querySelector("#real-billing-discount-percent").value.trim();
  const durationType = form.querySelector("#real-billing-duration").value;
  const durationValue = durationType === "n_meses" ? form.querySelector("#real-billing-duration-months").value.trim() : "";
  const reasonValue = discountType === "isencao" ? form.querySelector("#real-billing-reason").value.trim() : "";

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
  if (Array.from(reasonValue).length > 200) {
    return { errorMessage: "O motivo da isenção deve ter no máximo 200 caracteres." };
  }
  const durationMonths = durationValue === "" ? null : Number(durationValue);
  if (!["este_mes", "n_meses", "ate_remover"].includes(durationType) ||
      (durationType === "n_meses" && (!Number.isInteger(durationMonths) || durationMonths < 1))) {
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
  if (target.matches("#real-billing-discount-type, #real-billing-duration")) {
    const form = target.closest("[data-real-billing-rule-form]");
    if (form) updateRealBillingRuleFields(form);
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "real-student-payment-type") {
    const field = document.querySelector("#real-student-proof-field");
    const fileInput = document.querySelector("#real-student-proof-file");
    if (field) field.hidden = target.value !== "comprovante";
    if (target.value !== "comprovante" && fileInput) fileInput.value = "";
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "real-graduation-student" &&
      currentScreen === "student-detail" && isRealActiveProfessor()) {
    if (realProfessorGraduationStudents.some((student) => student.id === target.value)) {
      realSelectedGraduationStudentId = target.value;
      screenContent.innerHTML = renderRealProfessorGraduationsScreen();
      loadRealStudentDetailData();
    }
    return;
  }
  if (target instanceof HTMLSelectElement && target.id === "real-graduation-belt" &&
      currentScreen === "student-detail" && isRealActiveProfessor()) {
    const form = target.closest("[data-real-graduation-form]");
    const degreeSelect = form && form.querySelector("#real-graduation-degree");
    if (!degreeSelect) return;
    const degrees = beltDegrees(beltOrder.indexOf(target.value));
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
      const beltIndex = beltOrder.indexOf(belt);
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
      const fileInput = form.querySelector("#real-student-proof-file");
      const file = type === "comprovante" && fileInput.files ? fileInput.files[0] : null;
      const balance = charge ? realBillingBalance(charge, realStudentPayments) : 0n;
      if (!charge || charge.status !== "aberta" || balance <= 0n ||
          !amount || BigInt(amount) > balance || !["dinheiro", "comprovante"].includes(type)) {
        return { errorMessage: "Não foi possível registrar. Esta cobrança não está disponível para novo aviso." };
      }
      if (file) {
        const validationError = validateStorageFile(
          file,
          REAL_PAYMENT_PROOF_MIME_TYPES,
          REAL_PAYMENT_PROOF_MAX_BYTES,
          "o comprovante"
        );
        if (validationError) return { errorMessage: validationError };
      }
      const existingPending = realStudentPayments.find((payment) =>
        payment.cobranca_id === chargeId && payment.status === "pendente"
      );
      if (existingPending) {
        if (type !== "comprovante" || !file ||
            realStudentPaymentProofs.has(existingPending.id)) {
          return { errorMessage: "Já existe um aviso pendente para esta cobrança. Aguarde a decisão do Professor." };
        }
        return uploadPaymentProof(existingPending.id, file);
      }
      const result = await callRealPaymentRpc("registrar_aviso_pagamento", {
        p_cobranca_id: chargeId,
        p_valor_centavos: amount,
        p_tipo: type
      }, "student", "Não foi possível registrar. Confira o valor e o saldo.");
      if (result.errorMessage) return result;
      if (typeof result.data !== "string" || !result.data) {
        return { errorMessage: "O aviso não foi registrado porque a RPC não retornou o identificador do pagamento." };
      }
      if (file) {
        const uploadResult = await uploadPaymentProof(result.data, file);
        if (uploadResult.errorMessage) {
          realStudentPayments = [...realStudentPayments, {
            id: result.data,
            cobranca_id: chargeId,
            origem: "aluno",
            tipo: type,
            referencia: null,
            valor_centavos: String(amount),
            status: "pendente",
            criado_em: new Date().toISOString()
          }];
          return uploadResult;
        }
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
      loadingMessage: "Registrando o pagamento recebido.",
      successMessage: "Recebimento lançado.",
      errorMessage: "Não foi possível lançar o pagamento. Confira o valor e o saldo.",
      afterSuccess: () => loadRealProfessorPaymentsData()
    }, async () => {
      const chargeId = form.querySelector("#real-professor-charge").value;
      const charge = realProfessorCharges.find((item) => item.id === chargeId);
      const amount = parseRealBillingCents(form.querySelector("#real-professor-payment-amount").value);
      const type = form.querySelector("#real-professor-payment-type").value;
      const reference = form.querySelector("#real-professor-payment-reference").value.trim();
      const balance = charge ? realBillingBalance(charge, realProfessorPayments) : 0n;
      if (!charge || charge.status !== "aberta" || balance <= 0n ||
          !["Pix", "Dinheiro", "Transferência", "Outro"].includes(type) ||
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

  const lateBillingFilter = target.closest("[data-real-billing-late-filter]");
  if (lateBillingFilter) {
    if (currentScreen !== "monthly-charges" || !isRealActiveProfessor() ||
        realBillingState !== "found" || realBillingStudentsState !== "found") return;
    realBillingLateOnly = !realBillingLateOnly;
    screenContent.innerHTML = renderRealBillingScreen();
    return;
  }

  const retryHome = target.closest("[data-real-home-retry]");
  if (retryHome) {
    if (currentScreen !== "home" ||
        !(isRealActiveProfessor() || isRealActiveStudent() || isRealActiveInstructor())) return;
    const control = retryHome.closest(".student-action-control");
    if (!control) return;
    runButtonAction(retryHome, {
      feedback: control.querySelector("[role='alert']"),
      announcement: control.querySelector("[role='status']"),
      buttons: [retryHome],
      loadingText: "Carregando...",
      loadingMessage: "Atualizando seu resumo.",
      successMessage: "Resumo atualizado.",
      errorMessage: "Não foi possível atualizar o Início. Tente novamente.",
      afterSuccess: () => { screenContent.innerHTML = renderRealHomeScreen(); }
    }, async () => {
      const loaded = await loadRealHomeData(false);
      if (!loaded) return { errorMessage: realHomeNotice };
    });
    return;
  }

  const exportButton = target.closest("[data-real-export]");
  if (exportButton) {
    const control = exportButton.closest(".student-action-control");
    if (!control) return;
    const action = exportButton.dataset.realExport;
    runButtonAction(exportButton, {
      feedback: control.querySelector("[role='alert']"),
      announcement: control.querySelector("[role='status']"),
      buttons: [exportButton],
      loadingText: "Gerando...",
      loadingMessage: "Preparando os arquivos de exportação.",
      successMessage: "Arquivos JSON e CSV gerados.",
      errorMessage: "Não foi possível gerar os arquivos. Tente novamente."
    }, async () => {
      let data;
      let filename;
      if (action === "professor-monthly-charges") {
        if (!isRealActiveProfessor() || currentScreen !== "monthly-charges" ||
            realBillingState !== "found" || realBillingStudentsState !== "found") {
          return { errorMessage: "Carregue as cobranças do mês antes de exportar." };
        }
        const month = realBillingSelectedMonth;
        const charges = realBillingCharges.filter((charge) => String(charge.mes).slice(0, 7) === month);
        const chargeIds = new Set(charges.map((charge) => charge.id));
        const payments = realBillingPayments.filter((payment) => chargeIds.has(payment.cobranca_id));
        if (!charges.length && !payments.length) {
          return { errorMessage: "Não há cobranças nem pagamentos neste mês para exportar." };
        }
        data = {
          mes: month,
          cobrancas: charges.map((charge) => ({
            ...charge,
            aluno_nome: realBillingStudentNames.get(charge.aluno_id) || ""
          })),
          pagamentos: payments
        };
        filename = `tatame-cobrancas-${month}`;
      } else if (action === "professor-payment-review") {
        if (!isRealActiveProfessor() || currentScreen !== "payment-review" ||
            realProfessorPaymentsState !== "found" || realBillingStudentsState !== "found") {
          return { errorMessage: "Carregue os pagamentos do mês antes de exportar." };
        }
        const month = realProfessorMetricsMonth;
        const charges = realProfessorMonthSummary(month).charges;
        const chargeIds = new Set(charges.map((charge) => charge.id));
        const payments = realProfessorPayments.filter((payment) => chargeIds.has(payment.cobranca_id));
        if (!charges.length && !payments.length) {
          return { errorMessage: "Não há cobranças nem pagamentos neste mês para exportar." };
        }
        data = {
          mes: month,
          cobrancas: charges.map((charge) => ({
            ...charge,
            aluno_nome: realBillingStudentNames.get(charge.aluno_id) || ""
          })),
          pagamentos: payments
        };
        filename = `tatame-cobrancas-${month}`;
      } else if (action === "professor-students") {
        if (!isRealActiveProfessor() || currentScreen !== "students" || realFeatureData.state !== "found") {
          return { errorMessage: "Carregue a lista de alunos antes de exportar." };
        }
        const linkedStudents = realFeatureData.linkedStudents || [];
        const unregisteredStudents = realFeatureData.unregisteredStudents || [];
        const students = [
          ...linkedStudents
            .filter((student) => typeof student.nome === "string" && student.nome.trim())
            .map((student) => ({
              nome: student.nome.trim(),
              vinculo: "Vinculado",
              status: student.status === "locked" ? "Trancado" : "Ativo"
            })),
          ...unregisteredStudents
            .filter((student) => typeof student.nome === "string" && student.nome.trim())
            .map((student) => ({
              nome: student.nome.trim(),
              vinculo: "Sem conta",
              status: student.status === "locked" ? "Trancado" : "Ativo"
            }))
        ];
        if (!students.length) return { errorMessage: "Não há alunos carregados para exportar." };
        data = { alunos: students };
        filename = "tatame-alunos";
      } else if (action === "student-data") {
        if (!isRealActiveStudent() || currentScreen !== "student-payments" ||
            realStudentPaymentsState !== "found") {
          return { errorMessage: "Carregue seus pagamentos antes de exportar." };
        }
        if (realStudentGraduationsState !== "found" || realStudentGraduationsOwnerId !== realUser.id) {
          return { errorMessage: "Abra Minhas graduações para carregar o histórico e tente novamente." };
        }
        if (!realStudentCharges.length && !realStudentPayments.length && !realStudentGraduations.length) {
          return { errorMessage: "Não há cobranças, pagamentos ou graduações para exportar." };
        }
        data = {
          cobrancas: realStudentCharges,
          pagamentos: realStudentPayments,
          graduacoes: realStudentGraduations
        };
        filename = "tatame-meus-dados";
      } else {
        return { errorMessage: "Esta exportação não está disponível para esta conta." };
      }

      window.exportarDados(data, filename);
    });
    return;
  }

  const retryAdminDashboard = target.closest("[data-real-admin-dashboard-retry]");
  if (retryAdminDashboard) {
    runButtonAction(retryAdminDashboard, {
      feedback: document.querySelector("#real-admin-dashboard-retry-error"),
      announcement: document.querySelector("#real-admin-dashboard-retry-status"),
      buttons: [retryAdminDashboard],
      loadingText: "Carregando...",
      loadingMessage: "Atualizando o resumo administrativo.",
      successMessage: "Resumo atualizado.",
      errorMessage: "Não foi possível carregar o resumo. Tente novamente.",
      afterSuccess: () => { screenContent.innerHTML = renderRealAdminDashboardScreen(); }
    }, async () => {
      const loaded = await loadRealAdminDashboard(false);
      if (!loaded) return { errorMessage: realAdminDashboardNotice };
    });
    return;
  }

  const receiptButton = target.closest("[data-real-payment-receipt]");
  if (receiptButton) {
    const professorView = currentScreen === "payment-review" && isRealActiveProfessor();
    const studentView = currentScreen === "student-payments" && isRealActiveStudent();
    if (!professorView && !studentView) return;
    const chargeId = receiptButton.dataset.realPaymentReceipt;
    const control = receiptButton.closest(".student-action-control");
    if (!control) return;
    runButtonAction(receiptButton, {
      feedback: control.querySelector("[role='alert']"),
      announcement: control.querySelector("[role='status']"),
      buttons: [receiptButton],
      loadingText: "Abrindo...",
      loadingMessage: "Preparando o recibo.",
      successMessage: "Recibo aberto.",
      successDelay: 0,
      afterSuccess: () => {
        realPaymentReceiptChargeId = chargeId;
        screenContent.innerHTML = professorView
          ? renderRealProfessorPaymentsScreen()
          : renderRealStudentPaymentsScreen();
      }
    }, async () => {
      const charge = professorView
        ? realProfessorCharges.find((item) => item.id === chargeId && item.status === "paga")
        : realStudentCharges.find((item) => item.id === chargeId && item.status === "paga");
      const payments = professorView ? realProfessorPayments : realStudentPayments;
      const hasConfirmedPayment = charge && payments.some((payment) =>
        payment.cobranca_id === charge.id && payment.status === "confirmado"
      );
      return hasConfirmedPayment
        ? {}
        : { errorMessage: "Não há pagamentos confirmados disponíveis para este recibo." };
    });
    return;
  }

  if (target.closest("[data-real-payment-receipt-back]")) {
    if (!(isRealActiveProfessor() && currentScreen === "payment-review") &&
        !(isRealActiveStudent() && currentScreen === "student-payments")) return;
    realPaymentReceiptChargeId = "";
    screenContent.innerHTML = currentScreen === "payment-review"
      ? renderRealProfessorPaymentsScreen()
      : renderRealStudentPaymentsScreen();
    return;
  }

  const cancelLinkRequestButton = target.closest("[data-real-student-link-cancel]");
  if (cancelLinkRequestButton) {
    if (currentScreen !== "link-teacher" || !isRealActiveStudent()) return;
    if (!window.confirm("Cancelar o pedido de vínculo pendente?")) return;
    runButtonAction(cancelLinkRequestButton, {
      feedback: document.querySelector("#real-student-link-cancel-error"),
      announcement: document.querySelector("#real-student-link-cancel-status"),
      buttons: [cancelLinkRequestButton],
      loadingText: "Cancelando...",
      loadingMessage: "Cancelando o pedido de vínculo.",
      successMessage: "Pedido cancelado.",
      errorMessage: "Não foi possível cancelar o pedido. Confira a mensagem e tente novamente.",
      successDelay: 0,
      afterSuccess: loadRealStudentLinkStatus
    }, async () => {
      if (!authClient || !realUser || !isRealActiveStudent()) {
        return { errorMessage: "Esta ação exige uma conta real de Aluno ativa." };
      }
      try {
        const { data, error } = await authClient.rpc("cancelar_pedido");
        if (error) {
          return {
            errorMessage: navigator.onLine === false
              ? "Falha de rede ao cancelar o pedido. Verifique sua conexão e tente novamente."
              : "Não foi possível cancelar o pedido. Tente novamente mais tarde."
          };
        }
        if (data === true) return {};
        if (data === false) {
          await loadRealStudentLinkStatus();
          showToast("Não há pedido pendente para cancelar. O estado do vínculo foi atualizado.", "error");
          return { errorMessage: "Não há pedido pendente para cancelar. O estado do vínculo foi atualizado." };
        }
        return { errorMessage: "O servidor retornou uma resposta inesperada. Tente novamente mais tarde." };
      } catch {
        return {
          errorMessage: navigator.onLine === false
            ? "Falha de rede ao cancelar o pedido. Verifique sua conexão e tente novamente."
            : "Não foi possível cancelar o pedido. Tente novamente mais tarde."
        };
      }
    });
    return;
  }

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
      afterSuccess: () => {
        screenContent.innerHTML = renderRealProfessorGraduationsScreen();
        const selectedStudent = realProfessorGraduationStudents.find((student) =>
          student.id === realSelectedGraduationStudentId
        );
        void loadRealLinkedProfilePhotoAvatars(selectedStudent ? [selectedStudent] : [], "student-detail");
      }
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

  const retryProofButton = target.closest("[data-real-student-proof-upload]");
  if (retryProofButton) {
    if (currentScreen !== "student-payments" || !isRealActiveStudent()) return;
    const paymentId = retryProofButton.dataset.realStudentProofUpload;
    const row = retryProofButton.closest(".student-proof-retry");
    const fileInput = row && row.querySelector('input[type="file"]');
    const payment = realStudentPayments.find((item) =>
      item.id === paymentId && item.status === "pendente" && item.tipo === "comprovante"
    );
    if (!payment || !row || !fileInput) return;
    runButtonAction(retryProofButton, {
      feedback: row.querySelector("[role='alert']"),
      announcement: row.querySelector("[role='status']"),
      buttons: [retryProofButton, fileInput],
      loadingText: "Enviando...",
      loadingMessage: "Enviando o comprovante para o aviso pendente.",
      successMessage: "Comprovante anexado ao aviso.",
      errorMessage: "Não foi possível anexar o comprovante. Tente novamente.",
      afterSuccess: () => loadRealStudentPayments()
    }, async () => {
      if (realPaymentProofsNotice) {
        return { errorMessage: "Não foi possível conferir se já existe um comprovante. Atualize os pagamentos e tente novamente." };
      }
      const file = fileInput.files && fileInput.files[0];
      return uploadPaymentProof(payment.id, file);
    });
    return;
  }

  const viewProofButton = target.closest("[data-real-proof-view]");
  if (viewProofButton) {
    if (currentScreen !== "payment-review" || !isRealActiveProfessor()) return;
    const paymentId = viewProofButton.dataset.realProofView;
    const row = viewProofButton.closest("[data-real-payment-row]");
    if (!paymentId || !row) return;
    runButtonAction(viewProofButton, {
      feedback: row.querySelector("[role='alert']"),
      announcement: row.querySelector("[role='status']"),
      buttons: Array.from(row.querySelectorAll("button")),
      loadingText: "Abrindo...",
      loadingMessage: "Preparando um link temporário para o comprovante.",
      successMessage: "Comprovante aberto. O link expira em 60 segundos.",
      errorMessage: "Não foi possível abrir o comprovante. Tente novamente.",
      successDelay: 0
    }, async () => {
      const proof = realProfessorPaymentProofs.get(paymentId);
      if (!proof || proof.estado_arquivo !== "ativo" ||
          Date.parse(proof.criado_em) <= Date.now() - 30 * 24 * 60 * 60 * 1000) {
        return { errorMessage: "Este comprovante não está mais disponível para consulta." };
      }
      if (realProofViewerWindow && !realProofViewerWindow.closed) realProofViewerWindow.close();
      realProofViewerWindow = null;
      const newTab = window.open("about:blank", "_blank");
      if (!newTab) return { errorMessage: "Permita a abertura de uma nova aba e tente novamente." };
      realProofViewerWindow = newTab;
      newTab.opener = null;
      const userId = realUser && realUser.id;
      const sessionGeneration = realSessionCacheGeneration;
      const signed = await createStorageSignedUrl("comprovantes", proof.caminho_storage, "comprovante");
      if (signed.errorMessage || !realUser || realUser.id !== userId ||
          sessionGeneration !== realSessionCacheGeneration) {
        newTab.close();
        if (realProofViewerWindow === newTab) realProofViewerWindow = null;
        return { errorMessage: signed.errorMessage || "A sessão mudou. Atualize a tela e tente novamente." };
      }
      newTab.location.replace(signed.signedUrl);
      return {};
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
      if (action === "confirmar" || action === "rejeitar") {
        const proof = realProfessorPaymentProofs.get(paymentId);
        if (proof && typeof proof.caminho_storage === "string") {
          const removal = await removeRegisteredPaymentProof(paymentId, proof.caminho_storage, "professor");
          if (removal.errorMessage) {
            recordDiagnostic("Comprovante aguardando remoção");
            setRealProofCleanupNotice("A decisão foi registrada; a remoção do comprovante será tentada novamente ao abrir pagamentos.");
            return {
              successMessage: action === "confirmar"
                ? "Pagamento confirmado. A remoção do comprovante será tentada novamente ao abrir pagamentos."
                : "Aviso rejeitado. A remoção do comprovante será tentada novamente ao abrir pagamentos."
            };
          }
        }
      }
    });
    return;
  }

  const editRuleButton = target.closest("[data-real-billing-edit-rule]");
  if (editRuleButton) {
    const row = editRuleButton.closest("[data-real-billing-rule]");
    runButtonAction(editRuleButton, {
      feedback: row.querySelector("[role='alert']"),
      announcement: row.querySelector("[role='status']"),
      buttons: Array.from(row.querySelectorAll("button")),
      loadingText: "Abrindo...",
      loadingMessage: "Carregando os dados da regra.",
      successMessage: "Regra carregada para edição.",
      errorMessage: "Não foi possível abrir esta regra. Atualize a tela e tente novamente."
    }, async () => {
      const rule = realBillingRules.find((item) => item.id === editRuleButton.dataset.realBillingEditRule);
      const form = document.querySelector("[data-real-billing-rule-form]");
      if (!rule || !form || !realBillingStudentNames.has(rule.aluno_id)) {
        return { errorMessage: "A regra ou o aluno não está mais disponível. Atualize a tela e tente novamente." };
      }
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
      updateRealBillingRuleFields(form);
      form.querySelector("#real-billing-student-id").focus();
      return {};
    });
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
