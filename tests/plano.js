"use strict";

window.PLANO_TATAME = [
  {
    title: "Fundação e Fase 1 — uso diário",
    description: "Base do produto, acesso, permissões e primeiros fluxos de uso diário.",
    tasks: [
      ["validado", "Criar a página visual tests/plano.html para acompanhar fases, tarefas e estados junto ao README. Validada visualmente pelo usuário."],
      ["validado", "Criar a documentação inicial e o painel visual tests/teste.html de acompanhamento dos testes. Painel validado visualmente pelo usuário."],
      ["feito", "Reservar index.html na raiz para a aplicação e nomear a página de testes teste.html. Feito nesta tarefa; aguardando validação do usuário."],
      ["validado", "Validar visualmente os painéis de testes e plano. Usuário aprovou ambos; verificações estruturais do catálogo passaram 5/5. Os casos funcionais continuam pendentes de implementação."],
      ["validado", "Criar o banco de dados Supabase. Confirmado pelo usuário."],
      ["feito", "Criar a primeira suíte de casos de aceite test-first para a F1, com perfis, pré-condições, passos e resultados esperados usando somente fixtures fictícias. Feito nesta tarefa; aguardando revisão e validação do usuário."],
      ["feito", "Acrescentar casos de aceite para validar todas as telas/resoluções, sobreposições, textos/campos fora do lugar e modais. Feito nesta tarefa; aguardando validação do usuário."],
      ["validado", "Criar e aprovar o ícone Escudo como única marca e a página local de identidade visual. Validado pelo usuário."],
      ["validado", "Exibir somente o ícone Escudo aprovado no cabeçalho do painel de testes. Implementado e validado visualmente pelo usuário."],
      ["feito", "Aplicar somente o ícone Escudo à identidade da aplicação no cabeçalho web/mobile e na tela de acesso. Feito nesta tarefa; aguardando validação visual do usuário."],
      ["validado", "Criar dois avatares SVG genéricos (masculino e feminino), com silhuetas definidas e rostos menos arredondados. Aprovados pelo usuário."],
      ["validado", "Ajustar o ícone Escudo: insígnia redonda, T redesenhado e faixa preta com ponteira vermelha e três graus brancos. Correção solicitada aplicada; ícone aprovado pelo usuário."],
      ["pendente", "Preparar o ícone de instalação do iPhone nos formatos e dimensões exigidos pelo PWA e conferir sua leitura na tela inicial."],
      ["pendente", "Aprimorar navegação, painel da conta e apresentação instalada no iPhone. Interface ampliada, menus agrupados por assunto, paletas dos dois temas aplicadas e logo existente configurado; faltam ícones 180/192 e versão maskable, testes responsivos e validação no iPhone e pelo usuário."],
      ["pendente", "Aplicar estados e mensagens acessíveis aos botões de ação. Padrão reutilizável aplicado aos dois botões de login simulado; faltam os demais controles listados no README e a validação pelo usuário."],
      ["validado", "Validar os dois avatares placeholder. Aprovados pelo usuário."],
      ["validado", "Exigir testes visuais e funcionais de todas as telas em diferentes tamanhos de viewport a cada lote, incluindo larguras de referência, limites dos breakpoints, retrato/paisagem, altura curta, zoom/texto aumentado, sobreposições, recortes e modais. Critério obrigatório definido pelo usuário; os testes de cada lote devem registrar e passar por essas verificações."],
      ["validado", "Exigir conformidade com a LGPD e confirmar com o usuário informações e decisões sobre dados pessoais, finalidades, hipóteses legais, consentimento, retenção, compartilhamento, direitos dos titulares e declarações da política antes de implementá-las."],
      ["feito", "Acrescentar casos de aceite para o link de privacidade, modal no app, página HTML independente, sincronização do conteúdo e revisão de declarações antes da publicação. Feito nesta tarefa; aguardando revisão/validação do usuário."],
      ["pendente", "Confirmar com o usuário os dados pessoais tratados, suas finalidades, hipóteses legais, consentimento, retenção, compartilhamento, atendimento a direitos e conteúdo da política antes de redigi-la."],
      ["pendente", "Criar a página HTML da política e implementar no app o link que abre o modal; manter ambos sincronizados e testar acesso, conteúdo, fechamento, teclado e responsividade."],
      ["validado", "Desenvolver o app em branch separada de main; merge na main exige autorização do Aylton e testes validados por ele, enquanto commit ou push da branch feat/telas-iniciais exige pedido do Aylton, sem exigir testes válidos. Pedido de commit ou push da branch feat/telas-iniciais não é bloqueado por estado de lote, teste ou validação."],
      ["validado", "Consultar o usuário quando houver muitos arquivos pendentes sem commit/push, antes de publicar ou iniciar operações de commit, exceto para commit ou push da branch feat/telas-iniciais quando o Aylton pedir. Regra aplicada nesta tarefa: 23 arquivos pendentes foram apresentados ao usuário; ele autorizou prosseguir sem commit/push."],
      ["validado", "Remover do projeto os arquivos, propostas e recursos explicitamente descartados pelo usuário; não arquivar nem manter uma lista de descartes. Regra definida pelo usuário; confirmar antes de excluir itens cujo descarte não esteja explícito."],
      ["validado", "Manter a tela visual correspondente aberta no navegador do VS Code antes e durante cada alteração visual, atualizando-a para acompanhamento do usuário. Regra definida pelo usuário."],
      ["validado", "Encerrar cada prompt executado com um resumo de até 10 linhas sobre alterações, verificações, pendências e erros. Regra definida pelo usuário."],
      ["validado", "Pedir autorização ao usuário quando houver dúvida ou mais de uma interpretação razoável, antes de escolher uma regra de produto ou segurança. Critério de trabalho definido pelo usuário."],
      ["validado", "Adicionar o perfil de Instrutor: é um aluno com função de apoio, autorizado por aula; vê os alunos da turma apenas por nome e graduação atual, segue o conteúdo decidido pelo Professor e registra se seguiu a orientação. Requisitos confirmados pelo usuário."],
      ["validado", "Confirmar que o Adm será somente o usuário proprietário do projeto; a autorização e as permissões serão aplicadas no banco. Confirmado pelo usuário."],
      ["feito", "Acrescentar casos propostos para o perfil, acesso restrito, confirmação de aula, convite por link e sugestões de temas para o professor. Feito nesta tarefa; aguardando revisão do usuário."],
      ["pendente", "Revisar e validar os casos de aceite da F1, incluindo as permissões do instrutor; ajustar o escopo e os critérios antes de desenhar banco ou implementar telas."],
      ["validado", "Confirmar o destinatário do convite: o professor principal envia o link ao instrutor, que cria a própria conta. Confirmado pelo usuário."],
      ["pendente", "Definir no banco as regras de autorização, validade e reutilização do convite de instrutor antes de implementar o cadastro; a atribuição do perfil não será confiada ao navegador."],
      ["pendente", "Revisar os limites de leitura dos dados dos alunos necessários durante a aula e confirmar o texto dos casos do instrutor antes de desenhar RLS."],
      ["pendente", "A partir dos casos validados, mapear fluxos de acesso e permissões; definir somente as tabelas e políticas RLS necessárias e respectivos testes positivos/negativos."],
      ["pendente", "Construir um protótipo navegável de todas as telas da F1 do roadmap e dos requisitos confirmados do instrutor (acesso/convites, aluno, professor, Adm, pagamentos, graduações, atalhos e privacidade), mantendo a identidade visual: web otimizada para notebook com sidebar à esquerda e painel do usuário oculto à direita; mobile priorizado para iPhone 13 ou superior com navegação inferior e áreas seguras. Usar fixtures fictícias, sem integração ou lógica funcional. Manter termo e política como conteúdo pendente; validar visualmente com o usuário antes de iniciar as funções. No lançamento fictício em dinheiro, foram adicionados busca, confirmação, desfazer e estorno; faltam priorização por cobrança vinculada, testes responsivos e validação do usuário."],
      ["feito", "Acrescentar ao protótipo a graduação manual de faixa superior pelo Professor, com data, confirmação e histórico; falta conferir os testes responsivos e validar o fluxo com o usuário."],
      ["pendente", "Ampliar a simulação de graduação para faixas e graus adultos e cadastro inicial, e o painel com versão, diagnósticos, atualização e sincronização simuladas. Implementação parcial; faltam testes funcionais e responsivos completos e validação do usuário."],
      ["pendente", "Persistir o estado fictício no navegador. Pagamentos, contas, alunos, vínculos e graduações implementados; faltam conversas, testes de falhas de armazenamento e validação. Arquivos de comprovantes não são armazenados."],
      ["pendente", "Implementar e testar a exclusão fictícia de conta, apagando dados pessoais e preservando pagamentos, vínculos e graduações da outra parte com identificação anonimizada como Conta excluída. Persistência após recarregar confirmada pelo usuário; caso de aceite e área de risco recolhível acrescentados. Faltam persistência integrada, exclusão, testes funcionais e validação."],
      ["pendente", "Investigar e corrigir a rolagem com a roda do mouse em telas largas, sem alterar o layout do celular; falta reproduzir o problema e identificar sua causa."],
      ["pendente", "Revisar com o usuário o desenho do Lote 1; só depois criar migrations incrementais, sem executá-las. A aplicação não dependerá delas até o desenvolvedor confirmar que foram revisadas e aplicadas."],
      ["pendente", "Após aprovação do desenho e confirmação de que o esquema necessário está aplicado, implementar o primeiro fluxo vertical: login, convite/liberação de professor, cadastro/convite de aluno e consentimento (RN01–RN04, RN25), com seus testes."],
      ["pendente", "Executar testes do Lote 1, corrigir falhas e apresentar o resultado para validação do usuário antes de iniciar o próximo lote."],
      ["pendente", "Lote 2 — Alunos e pagamentos: implementar e testar cobranças, descontos/isenções, aviso de pagamento e confirmação pelo professor (RN06, RN08–RN11)."],
      ["pendente", "Lote 3 — Painel e graduações: implementar e testar painel do professor, pendências, atrasos, cobrança manual por WhatsApp e histórico de graduações (RN12–RN13, RN15–RN16)."],
      ["pendente", "Fechar a F1: completar as telas, versão/atualização e regressão; validar a fase com o usuário."]
    ]
  },
  {
    title: "Fase 2 — operação completa",
    description: "Rotinas administrativas, comunicação e planejamento de aulas.",
    tasks: [
      ["pendente", "Implementar e testar importação de extrato Pix e conciliação com confirmação manual (RN07)."],
      ["pendente", "Implementar e testar mural, grade semanal, avisos e perguntas frequentes (RN22–RN24)."],
      ["pendente", "Implementar e testar feedbacks, metas, notas privadas e conversa individual (RN19–RN21)."],
      ["pendente", "Implementar e testar aniversários, alunos avulsos/diárias e alunos trancados (RN05, RN11, RN18)."],
      ["pendente", "Implementar e testar configurações, tutorial, ajuda e modo simples (RN26, RN34–RN35)."],
      ["pendente", "Implementar e testar painel administrativo, suporte auditado, diagnóstico e avisos globais (RN27–RN32)."],
      ["pendente", "Implementar e testar plano semanal, biblioteca/cobertura de temas, sugestões para o Professor e delegação de aula ao Instrutor (RN36–RN42 e requisito adicional). O Professor decide o conteúdo; pode compartilhar o plano ou deixar o treino livre."],
      ["pendente", "Executar e aprovar os testes de regressão da F1 e F2; validar a fase com o usuário."]
    ]
  },
  {
    title: "Fase 3 — refinamentos e conclusão",
    description: "Recursos finais, validação completa, segurança e autorização de publicação.",
    tasks: [
      ["pendente", "Implementar e testar métricas de graduação e recibos (RN14, RN17)."],
      ["pendente", "Implementar e testar exportação, backup e consulta offline (RN33)."],
      ["feito", "Registrar a regra de segurança: interromper e consultar o usuário se uma publicação Git aparentar conter dado sensível. Regra confirmada pelo usuário."],
      ["feito", "Especificar casos de aceite para bloquear publicação Git diante de suspeita de dado sensível. Feito nesta tarefa; aguardando validação do usuário."],
      ["pendente", "Executar os testes de publicação segura; suspeita de dado sensível bloqueia a ação até orientação do usuário."],
      ["pendente", "Executar a suíte completa: funcionalidades, permissões/RLS, regressão, PWA/offline, responsividade e revisão manual."],
      ["pendente", "Confirmar funcionamento ponta a ponta e obter validação do usuário para todos os lotes."],
      ["pendente", "Solicitar autorização explícita antes de qualquer commit ou push; não publicar a partir da main enquanto houver teste pendente ou falho, sem aplicar esse bloqueio ao push da branch feat/telas-iniciais."]
    ]
  }
];

const phaseList = document.querySelector("#phase-list");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const tasks = window.PLANO_TATAME.flatMap((phase, phaseIndex) =>
  phase.tasks.map((task, taskIndex) => ({
    phaseIndex,
    taskIndex,
    status: task[0],
    title: task[1]
  }))
);

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function updateSummary() {
  const total = tasks.length;
  const validated = tasks.filter((task) => task.status === "validado").length;
  const done = tasks.filter((task) => task.status === "feito").length;
  const pending = tasks.filter((task) => task.status === "pendente").length;
  const validatedPercent = total ? (validated / total) * 100 : 0;
  const donePercent = total ? (done / total) * 100 : 0;
  const completedPercent = validatedPercent + donePercent;

  document.querySelector("#validated-count").textContent = String(validated);
  document.querySelector("#done-count").textContent = String(done);
  document.querySelector("#pending-count").textContent = String(pending);
  document.querySelector("#progress-percent").textContent = `${Math.round(completedPercent)}%`;
  document.querySelector("#validated-bar").style.width = `${validatedPercent}%`;
  document.querySelector("#done-bar").style.width = `${donePercent}%`;
  document.querySelector("#progress-track").setAttribute("aria-valuenow", String(Math.round(completedPercent)));
  document.querySelector("#progress-note").textContent = `${validated + done} de ${total} itens feitos ou validados; ${validated} validados por você. Itens feitos aguardam sua validação.`;
}

function renderPhases(filter = "todos") {
  phaseList.replaceChildren();

  window.PLANO_TATAME.forEach((phase, phaseIndex) => {
    const visibleTasks = phase.tasks
      .map((task, taskIndex) => ({ status: task[0], title: task[1], taskIndex }))
      .filter((task) => filter === "todos" || task.status === filter);

    if (!visibleTasks.length) return;

    const section = document.createElement("section");
    section.className = "phase-card";
    const heading = document.createElement("div");
    heading.className = "phase-heading";
    const titleGroup = document.createElement("div");
    titleGroup.append(
      createTextElement("p", "eyebrow", `FASE ${String(phaseIndex + 1).padStart(2, "0")}`),
      createTextElement("h3", "phase-title", phase.title),
      createTextElement("p", "phase-description", phase.description)
    );
    const phaseCounts = phase.tasks.reduce((counts, task) => {
      counts[task[0]] += 1;
      return counts;
    }, { pendente: 0, feito: 0, validado: 0 });
    const countLabel = `${phaseCounts.validado} / ${phase.tasks.length} validados`;
    heading.append(titleGroup, createTextElement("span", "phase-count", countLabel));
    section.append(heading);

    const list = document.createElement("ol");
    list.className = "task-list";
    visibleTasks.forEach((task) => {
      const item = document.createElement("li");
      item.className = `task-item task-item--${task.status}`;
      const marker = document.createElement("span");
      marker.className = "task-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = task.status === "validado" ? "✓" : task.status === "feito" ? "×" : "";
      const body = document.createElement("div");
      body.className = "task-body";
      body.append(createTextElement("p", "task-title", task.title));
      const statusText = task.status === "validado" ? "Validado por você" :
        task.status === "feito" ? "Feito · aguarda validação" : "Pendente";
      body.append(createTextElement("span", "task-status", statusText));
      item.append(marker, body);
      list.append(item);
    });
    section.append(list);
    phaseList.append(section);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    renderPhases(button.dataset.filter);
  });
});

updateSummary();
renderPhases();
