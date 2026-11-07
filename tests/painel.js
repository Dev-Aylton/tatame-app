"use strict";

const runButton = document.querySelector("#run-tests");
const results = document.querySelector("#results");
const panelCount = document.querySelector("#panel-count");
const panelNote = document.querySelector("#panel-note");
const caseList = document.querySelector("#case-list");
const casesF1 = window.CASOS_ACEITE_F1;
const casesF2 = window.CASOS_ACEITE_F2;
const casesF3 = window.CASOS_ACEITE_F3;
const cases = Array.isArray(casesF1) && Array.isArray(casesF2) && Array.isArray(casesF3)
  ? [...casesF1, ...casesF2, ...casesF3]
  : null;

const checks = [
  {
    name: "Catálogo de casos disponível",
    detail: "Os casos de aceite planejados são carregados e a página mostra a lista.",
    run() {
      return Boolean(
        document.querySelector("#page-title") &&
        document.querySelector(".summary-grid") &&
        document.querySelector("#coverage-title") &&
        runButton &&
        caseList &&
        Array.isArray(cases) &&
        casesF1.length > 0 &&
        casesF2.length > 0 &&
        casesF3.length > 0
      );
    }
  },
  {
    name: "Casos aguardam validação ou execução",
    detail: "Nenhuma especificação aparece como teste funcional executado ou aprovado.",
    run() {
      return document.querySelector("#executed-count")?.textContent.trim() === "0" &&
        document.querySelector("#case-status")?.textContent.includes("AGUARDAM IMPLEMENTAÇÃO") &&
        Array.isArray(cases) &&
        caseList.children.length === cases.length &&
        [...caseList.querySelectorAll(".case-status")].every((status) =>
          status.textContent === "PENDENTE" || status.textContent === "REVISAR COM USUÁRIO"
        );
    }
  },
  {
    name: "Identificadores dos casos são únicos",
    detail: "Cada caso possui um ID não vazio e sem duplicidade.",
    run() {
      const ids = cases.map((testCase) => testCase.id);
      return ids.every(Boolean) && new Set(ids).size === ids.length;
    }
  },
  {
    name: "Casos cobrem passos e resultados esperados",
    detail: "Cada cenário especifica perfil, regras, pré-condições, passos e resultado verificável.",
    run() {
      return cases.every((testCase) =>
        testCase.area &&
        testCase.titulo &&
        testCase.perfil &&
        testCase.regras &&
        testCase.precondicoes &&
        Array.isArray(testCase.passos) &&
        testCase.passos.length > 0 &&
        testCase.esperado
      );
    }
  },
  {
    name: "Cobertura inclui perfis e regras centrais",
    detail: "A suíte cobre acesso, pagamentos, privacidade, graduações e o instrutor (aluno com função de apoio).",
    run() {
      const areas = new Set(cases.map((testCase) => testCase.area));
      return areas.has("Autenticação") &&
        areas.has("Acesso e permissões") &&
        areas.has("Pagamentos") &&
        areas.has("Consentimento") &&
        areas.has("Graduações") &&
        areas.has("Interface responsiva") &&
        areas.has("Privacidade e LGPD") &&
        areas.has("Instrutor") &&
        areas.has("Segurança e publicação") &&
        casesF1.length === 53 &&
        casesF2.length === 3 &&
        casesF3.length === 1 &&
        cases.some((testCase) => testCase.id === "F1-ACC-06") &&
        cases.some((testCase) => testCase.id === "F1-PRIV-01") &&
        cases.some((testCase) => testCase.id === "F1-PRIV-02") &&
        cases.some((testCase) => testCase.id === "F1-PRIV-03") &&
        cases.some((testCase) => testCase.id === "F1-PAG-08") &&
        cases.filter((testCase) => testCase.area === "Instrutor" && testCase.revisao).length === 5 &&
        cases.some((testCase) => testCase.id === "F2-INST-01" && testCase.fase === "F2") &&
        cases.some((testCase) => testCase.id === "F3-REL-01");
    }
  }
];

function addTextElement(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderCases() {
  if (!Array.isArray(cases)) {
    caseList.textContent = "Falha ao carregar uma ou mais listas de casos de aceite.";
    return;
  }

  document.querySelector("#product-count").textContent = String(cases.length);
  caseList.replaceChildren();

  for (const testCase of cases) {
    const details = document.createElement("details");
    details.className = "case-item";

    const summary = document.createElement("summary");
    const identity = document.createElement("span");
    identity.className = "case-identity";
    addTextElement(identity, "span", "case-id", testCase.id);
    addTextElement(identity, "span", "case-title", testCase.titulo);
    summary.append(identity);
    const status = addTextElement(
      summary,
      "span",
      `case-status${testCase.revisao ? " case-status--review" : ""}`,
      testCase.revisao ? "REVISAR COM USUÁRIO" : "PENDENTE"
    );
    if (testCase.revisao) {
      status.title = "Proposta de critério de aceite aguardando revisão do usuário.";
    }
    details.append(summary);

    const body = document.createElement("div");
    body.className = "case-body";
    addTextElement(body, "p", "case-meta", `Fase: ${testCase.fase || "F1"} · Área: ${testCase.area} · Perfil: ${testCase.perfil} · Regras: ${testCase.regras}`);
    addTextElement(body, "h3", "case-heading", "Pré-condições");
    addTextElement(body, "p", "case-copy", testCase.precondicoes);
    addTextElement(body, "h3", "case-heading", "Passos");

    const steps = document.createElement("ol");
    steps.className = "case-steps";
    for (const step of testCase.passos) {
      addTextElement(steps, "li", "", step);
    }
    body.append(steps);
    addTextElement(body, "h3", "case-heading", "Resultado esperado");
    addTextElement(body, "p", "case-copy", testCase.esperado);
    details.append(body);
    caseList.append(details);
  }
}

function renderResults(outcomes) {
  results.replaceChildren();

  for (const outcome of outcomes) {
    const row = document.createElement("article");
    row.className = `result-row${outcome.passed ? "" : " result-row--failed"}`;

    const icon = document.createElement("span");
    icon.className = "result-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = outcome.passed ? "✓" : "!";

    const copy = document.createElement("div");
    copy.className = "result-copy";

    const title = document.createElement("strong");
    title.textContent = outcome.check.name;

    const detail = document.createElement("span");
    detail.textContent = outcome.passed ? outcome.check.detail : outcome.error || "A verificação não passou.";

    const status = document.createElement("span");
    status.className = "result-status";
    status.textContent = outcome.passed ? "PASSOU" : "FALHOU";

    copy.append(title, detail);
    row.append(icon, copy, status);
    results.append(row);
  }
}

function runChecks() {
  runButton.disabled = true;
  runButton.textContent = "Executando...";

  const outcomes = checks.map((check) => {
    try {
      return { check, passed: check.run() };
    } catch (error) {
      return {
        check,
        passed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  renderResults(outcomes);

  const passed = outcomes.filter((outcome) => outcome.passed).length;
  panelCount.textContent = `${passed}/${checks.length}`;
  panelNote.textContent = passed === checks.length ? "todas passaram" : `${checks.length - passed} falharam`;
  runButton.disabled = false;
  runButton.innerHTML = '<span aria-hidden="true">↻</span> Executar novamente';
}

renderCases();
runButton.addEventListener("click", runChecks);
