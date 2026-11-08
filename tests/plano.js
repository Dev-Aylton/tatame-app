"use strict";

window.PLANO_TATAME = [
  {
    title: "Fundação e Fase 1 — uso diário",
    description: "Base do produto, acesso, permissões e primeiros fluxos de uso diário.",
    tasks: [
      ["validado", "Criar a página visual tests/plano.html para acompanhar fases, tarefas e estados junto ao README. Validada visualmente pelo usuário."],
      ["validado", "Criar a documentação inicial e o painel visual tests/teste.html de acompanhamento dos testes. Painel validado visualmente pelo usuário."],
      ["validado", "Reservar index.html na raiz para a aplicação e nomear a página de testes teste.html. Validado pelo usuário."],
      ["validado", "Validar visualmente os painéis de testes e plano. Usuário aprovou ambos; verificações estruturais do catálogo passaram 5/5. Os casos funcionais continuam pendentes de implementação."],
      ["validado", "Criar o banco de dados Supabase. Confirmado pelo usuário. [REAL]"],
      ["validado", "Criar a primeira suíte de casos de aceite test-first para a F1, com perfis, pré-condições, passos e resultados esperados usando somente fixtures fictícias. Validado pelo usuário."],
      ["validado", "Acrescentar casos de aceite para validar todas as telas/resoluções, sobreposições, textos/campos fora do lugar e modais. Validado pelo usuário."],
      ["validado", "Criar e aprovar o ícone Escudo como única marca e a página local de identidade visual. Validado pelo usuário. [SIMULADO]"],
      ["validado", "Exibir somente o ícone Escudo aprovado no cabeçalho do painel de testes. Implementado e validado visualmente pelo usuário."],
      ["validado", "Aplicar somente o ícone Escudo à identidade da aplicação no cabeçalho web/mobile e na tela de acesso. Validado pelo usuário. [SIMULADO]"],
      ["validado", "Criar dois avatares SVG genéricos (masculino e feminino), com silhuetas definidas e rostos menos arredondados. Aprovados pelo usuário. [SIMULADO]"],
      ["validado", "Ajustar o ícone Escudo: insígnia redonda, T redesenhado e faixa preta com ponteira vermelha e três graus brancos. Correção solicitada aplicada; ícone aprovado pelo usuário. [SIMULADO]"],
      ["pendente", "Preparar o ícone de instalação do iPhone nos formatos e dimensões exigidos pelo PWA e conferir sua leitura na tela inicial. Ícones 180/192 e maskable gerados e declarados; falta conferir no iPhone e validar pelo usuário. [PENDENTE]"],
      ["pendente", "Aprimorar navegação, painel da conta e apresentação instalada no iPhone. Interface ampliada, menus agrupados por assunto, paletas dos dois temas aplicadas e ícones PWA declarados; faltam testes responsivos e validação no iPhone e pelo usuário. [SIMULADO]"],
      ["pendente", "Aplicar estados e mensagens acessíveis aos botões de ação. Padrão reutilizável aplicado aos botões de entrada e saída Google e aos controles reais solicitados neste lote; falta validação pelo usuário. [PENDENTE]"],
      ["feito", "Ícones 192, 180 e maskable gerados e declarados; sem conferência no iPhone."],
      ["feito", "Botões de ação reais: padrão acessível aplicado aos controles solicitados; sem teste com conta real. [REAL]"],
      ["feito", "Regra do navegador ajustada em .github/copilot-instructions.md para conferir a demonstração; sem teste com conta real."],
      ["validado", "Validar os dois avatares placeholder. Aprovados pelo usuário."],
      ["validado", "Exigir testes visuais e funcionais de todas as telas em diferentes tamanhos de viewport a cada lote, incluindo larguras de referência, limites dos breakpoints, retrato/paisagem, altura curta, zoom/texto aumentado, sobreposições, recortes e modais. Critério obrigatório definido pelo usuário; os testes de cada lote devem registrar e passar por essas verificações."],
      ["validado", "Exigir conformidade com a LGPD e confirmar com o usuário informações e decisões sobre dados pessoais, finalidades, hipóteses legais, consentimento, retenção, compartilhamento, direitos dos titulares e declarações da política antes de implementá-las."],
      ["validado", "Acrescentar casos de aceite para o link de privacidade, modal no app, página HTML independente, sincronização do conteúdo e revisão de declarações antes da publicação. Validado pelo usuário."],
      ["pendente", "Confirmar com o usuário os dados pessoais tratados, suas finalidades, hipóteses legais, consentimento, retenção, compartilhamento, atendimento a direitos e conteúdo da política antes de redigi-la. [PENDENTE]"],
      ["pendente", "Criar a página HTML da política e implementar no app o link que abre o modal; manter ambos sincronizados e testar acesso, conteúdo, fechamento, teclado e responsividade. [PENDENTE]"],
      ["validado", "Ampliar o rascunho de privacidade em privacidade.html com seções sobre dados presentes no protótipo, compartilhamento, menores, fotos, exclusão, retenção, direitos e contato. Feito; sem conferência visual e sem revisão jurídica. [SIMULADO]"],
      ["validado", "Sincronizar o rascunho entre privacidade.html, o modal e a tela de privacidade do app; texto posteriormente atualizado para refletir o registro real. Feito; sem conferência visual. [SIMULADO]"],
      ["pendente", "Conferir visualmente a página, o modal e a tela de privacidade em 360, 390, 430 e 768 px, nos temas claro e escuro, sem sobreposições, cortes ou desalinhamentos. [PENDENTE]"],
      ["pendente", "Revisar juridicamente e aprovar a política; confirmar finalidades, hipóteses legais, retenção, compartilhamento, direitos e contato antes da publicação. [PENDENTE]"],
      ["validado", "Aplicar guard de consentimento por papel às contas reais: Adm sem tela; Professor só consentimento; Instrutor e Aluno idade declarada e consentimento; papel ausente/desconhecido segue o fluxo completo. Guard front-end por papel; gravação do aceite descrita no item seguinte; sem teste com conta real. Validado pelo usuário. [REAL]"],
      ["validado", "Ligar consentimento a registrar_consentimento para Professor no aceite e para Instrutor após consumir o convite. Atualizar os avisos, a página de privacidade e os tutoriais dos papéis afetados. Feito; sem teste com conta real. [REAL]"],
      ["validado", "Aluno novo: primeiro acesso real coleta nome e idade declarada; o aceite cria o perfil e registra o consentimento por criar_perfil_aluno. Feito; sem teste com conta real e sem conferência visual. [REAL]"],
      ["validado", "gerar_codigo: retorno nulo tratado sem remover o código anterior; a mensagem de erro aparece na tela. Feito; sem teste com conta real. [REAL]"],
      ["validado", "Atualizar supabase/schema.sql para cobrir as migrations 01 a 12, anexando literalmente _09, _10, _11 e _12 com comentários de origem. Feito; sem executar SQL."],
      ["validado", "Migration _12 aplicada e conferida por leitura, sem teste de comportamento. Validado pelo usuário; sem teste de comportamento. [REAL]"],
      ["validado", "Remover o atraso artificial de 2.500 ms do modal de onboarding no fluxo real, preservando o atraso da demonstração. Feito; sem teste com conta real. [REAL]"],
      ["validado", "Desenvolver o app em branch separada de main; merge na main exige autorização do Aylton e testes validados por ele, enquanto commit ou push da branch feat/telas-iniciais exige pedido do Aylton, sem exigir testes válidos. Pedido de commit ou push da branch feat/telas-iniciais não é bloqueado por estado de lote, teste ou validação."],
      ["validado", "Consultar o usuário quando houver muitos arquivos pendentes sem commit/push, antes de publicar ou iniciar operações de commit, exceto para commit ou push da branch feat/telas-iniciais quando o Aylton pedir. Regra aplicada nesta tarefa: 23 arquivos pendentes foram apresentados ao usuário; ele autorizou prosseguir sem commit/push."],
      ["validado", "Remover do projeto os arquivos, propostas e recursos explicitamente descartados pelo usuário; não arquivar nem manter uma lista de descartes. Regra definida pelo usuário; confirmar antes de excluir itens cujo descarte não esteja explícito."],
      ["validado", "Manter a tela visual correspondente aberta no navegador do VS Code antes e durante cada alteração visual, atualizando-a para acompanhamento do usuário. Regra definida pelo usuário."],
      ["validado", "Encerrar cada prompt executado com um resumo de até 10 linhas sobre alterações, verificações, pendências e erros. Regra definida pelo usuário."],
      ["validado", "Pedir autorização ao usuário quando houver dúvida ou mais de uma interpretação razoável, antes de escolher uma regra de produto ou segurança. Critério de trabalho definido pelo usuário."],
      ["validado", "Adicionar o perfil de Instrutor: é um aluno com função de apoio, autorizado por aula; vê os alunos da turma apenas por nome e graduação atual, segue o conteúdo decidido pelo Professor e registra se seguiu a orientação. Requisitos confirmados pelo usuário. [SIMULADO]"],
      ["validado", "Confirmar que o Adm será somente o usuário proprietário do projeto; a autorização e as permissões serão aplicadas no banco. Confirmado pelo usuário. [SIMULADO]"],
      ["validado", "Acrescentar casos propostos para o perfil, acesso restrito, confirmação de aula, convite por link e sugestões de temas para o professor. Validado pelo usuário."],
      ["pendente", "Revisar e validar os casos de aceite da F1, incluindo as permissões do instrutor; ajustar o escopo e os critérios antes de desenhar banco ou implementar telas."],
      ["validado", "Confirmar o destinatário do convite: o professor principal envia o link ao instrutor, que cria a própria conta. Confirmado pelo usuário."],
      ["pendente", "Definir no banco as regras de autorização, validade e reutilização do convite de instrutor antes de implementar o cadastro; a atribuição do perfil não será confiada ao navegador. [PENDENTE]"],
      ["pendente", "Revisar os limites de leitura dos dados dos alunos necessários durante a aula e confirmar o texto dos casos do instrutor antes de desenhar RLS. [PENDENTE]"],
      ["pendente", "A partir dos casos validados, mapear fluxos de acesso e permissões; definir somente as tabelas e políticas RLS necessárias e respectivos testes positivos/negativos. [PENDENTE]"],
      ["pendente", "Construir um protótipo navegável de todas as telas da F1 do roadmap e dos requisitos confirmados do instrutor (acesso/convites, aluno, professor, Adm, pagamentos, graduações, atalhos e privacidade), mantendo a identidade visual: web otimizada para notebook com sidebar à esquerda e painel do usuário oculto à direita; mobile priorizado para iPhone 13 ou superior com navegação inferior e áreas seguras. Usar fixtures fictícias nesta etapa intermediária; as telas simuladas serão ligadas ao Supabase nos Lotes 1 a 3. Manter termo e política como conteúdo pendente; validar visualmente com o usuário antes da integração dos fluxos reais. No lançamento fictício em dinheiro, foram adicionados busca, confirmação, desfazer e estorno; faltam priorização por cobrança vinculada, testes responsivos e validação do usuário. [SIMULADO]"],
      ["pendente", "Configurar e validar login Google real, recuperação de sessão, consulta de perfil e saída, mantendo a demonstração separada. Integração inicial criada; faltam configuração manual, testes reais, conferência responsiva e validação do usuário. [PENDENTE]"],
      ["validado", "Ativar uma única vez por sessão o perfil de Professor convidado após o retorno do Google; reler papel e nome do banco e explicar a recusa sem revelar qual condição falhou. Validado pelo Aylton. [REAL]"],
      ["validado", "Rascunhar supabase/migrations/20261109_10_definir_nome_professor.sql para o Professor ativo definir o próprio nome; migration aplicada no banco após conferência do desenvolvedor."],
      ["validado", "Ligar ao app o campo para definir o nome do Professor real ativo pela RPC definir_nome_professor; validar a entrada, traduzir os retornos e reler o nome do banco após salvar. Validado pelo usuário; ainda falta teste manual. [REAL]"],
      ["validado", "Acrescentar ao protótipo a graduação manual de faixa superior pelo Professor, com data, confirmação e histórico; fluxo validado pelo usuário; ainda faltam os testes responsivos. [SIMULADO]"],
      ["feito", "Ampliar a simulação de graduação para faixas e graus adultos e cadastro inicial, e o painel com versão, diagnósticos, atualização e sincronização simuladas. Implementação presente; faltam testes funcionais/responsivos completos e validação do usuário. [SIMULADO]"],
      ["feito", "Persistir o estado fictício no navegador. Pagamentos, contas, alunos, vínculos, graduações e conversas com Professor foram implementados, com rollback e mensagens de erro em falha de armazenamento; falta validação do usuário. Arquivos de comprovantes não são armazenados. [SIMULADO]"],
      ["pendente", "Cadastrar e editar academia fictícia por Adm e Professor vinculado, com telefone, e-mail e foto simulada. Persistência local e edições existentes; a conferência deste lote não encontrou falha de estado. Ainda faltam testes completos, validação do usuário e decisões sobre autoria e conflitos. [SIMULADO]"],
      ["validado", "Criar academia no banco pela conta real de Adm, inserindo nome e URL de foto de fundo opcional e lendo o registro criado; Validado pelo Aylton. [REAL]"],
      ["validado", "Convidar Professor pela conta real de Adm, normalizando e-mail, escolhendo academia, listando convites reais e permitindo excluir somente os pendentes; validado pelo usuário; ainda aguardam testes manuais. [REAL]"],
      ["validado", "Ligar ao banco as telas reais do Adm para editar academias, vincular o Adm a Professor, consultar Professores e Instrutores, trocar Professor e desativar/reativar; validado pelo usuário; ainda aguarda teste manual. [REAL]"],
      ["validado", "Conectar ao banco os vínculos reais de Aluno e Professor: Aluno ativo envia código e consulta o último pedido; Professor ativo lista, aprova/recusa pedidos, gera e copia o código e administra alunos sem conta com idade declarada. Manter a demonstração simulada. Validado pelo usuário; ainda aguardam testes reais e conferência responsiva. [REAL]"],
      ["validado", "Vincular o Aluno real pelo código de seis caracteres usando solicitar_vinculo; validado pelo usuário; ainda faltam teste manual com conta real e conferência responsiva. [REAL]"],
      ["validado", "Permitir ao Professor real listar e decidir pedidos de vínculo; validado pelo usuário; ainda faltam testes manuais de aprovação/recusa e conferência responsiva. [REAL]"],
      ["validado", "Gerenciar alunos sem registro pela conta real do Professor, incluindo idade declarada; validado pelo usuário; ainda faltam testes manuais e conferência responsiva. [REAL]"],
      ["validado", "Gerar, listar, revogar e aceitar convites reais de Instrutor, preservando a demonstração simulada; validado pelo usuário; ainda faltam testes com contas reais e conferência responsiva. [REAL]"],
      ["validado", "Simular declaração de idade, consentimento e fotos de perfil, com enquadramento local e permissões por papel. Implementado em memória, sem rede ou armazenamento persistente; inclui classificação pelo Professor de alunos sem registro e restrição de fotos para menores. A cópia Google usa avatar local demonstrativo; o limite de arquivo de 5 MB é provisório. Caso F1-AVATAR-01 ainda aguarda execução; item validado pelo usuário. [SIMULADO]"],
      ["validado", "Substituir os avatares de pessoas do protótipo por fotos JPG locais masculino/feminino, quadradas em 512x512 e com recorte circular centralizado; sem novo campo de gênero/estilo. Validado pelo Aylton. [SIMULADO]"],
      ["feito", "Implementar a exclusão fictícia de conta, apagando dados pessoais e preservando pagamentos, vínculos e graduações da outra parte com identificação anonimizada como Conta excluída. A demonstração remove dados pessoais e fotos locais, apaga as conversas, preserva registros compartilhados anonimizados e encerra a sessão. A exclusão real não existe; faltam testes funcionais completos e validação do usuário. [SIMULADO]"],
      ["pendente", "Investigar e corrigir a rolagem com a roda do mouse em telas largas, sem alterar o layout do celular; ajustado o bloqueio de encadeamento no body para tela larga. Faltam reprodução com roda, confirmação da causa e testes em telas, papéis e modais."],
      ["pendente", "Revisar com o usuário o desenho do Lote 1; só depois criar migrations incrementais, sem executá-las. A aplicação não dependerá delas até o desenvolvedor confirmar que foram revisadas e aplicadas."],
      ["pendente", "Após aprovação do desenho e confirmação de que o esquema necessário está aplicado, implementar o primeiro fluxo vertical: login, convite/liberação de professor, cadastro/convite de aluno e consentimento (RN01–RN04, RN25), com seus testes. [SIMULADO]"],
      ["pendente", "Executar testes do Lote 1, corrigir falhas e apresentar o resultado para validação do usuário antes de iniciar o próximo lote."],
      ["feito", "Avisos de pagamento e lançamentos fictícios: aluno informa pagamento em dinheiro ou comprovante e o Professor confirma/recusa; sem movimentação financeira. Implementado; falta validação do usuário e teste funcional completo. [SIMULADO]"],
      ["feito", "Painel do Professor por mês: mostrar previsto, confirmado, aguardando confirmação, em aberto, atrasado e isento. A carência inicia em 5 dias, é ajustável de 0 a 30 e o atraso é calculado quando hoje ultrapassa vencimento + carência, nunca gravado; falta validação do usuário e regressão funcional/responsiva completa. [SIMULADO]"],
      ["feito", "WhatsApp manual: link abre o WhatsApp sem destinatário ou mensagem preenchidos e sem envio automático. Implementado; falta validação do usuário e ainda dependem de decisão o conteúdo e o destinatário do lembrete. [SIMULADO]"],
      ["feito", "Lote 2 — Alunos e pagamentos: mensalidade por aluno com valor-base e vencimento de 1 a 28; lotes limitados a 24; estados aberta, paga, isenta ou cancelada; desconto em R$ ou %, isenção opcional e duração de um mês, N meses (incluindo o mês inicial) ou até remoção; cobranças guardam valor-base, desconto e total, e pagamentos parciais só reduzem saldo após confirmação. Implementado na demonstração local, sem gateway; falta validação do usuário e regressão funcional/responsiva completa. [SIMULADO]"],
      ["feito", "Cancelar cobrança aberta: ação exclusiva do Professor e somente para status aberta, com confirmação; bloquear aviso pendente ou pagamento confirmado até rejeição ou estorno; manter no histórico e excluir do painel e de atrasos. Implementado; falta validação do usuário e regressão completa. [SIMULADO]"],
      ["feito", "Corrigir o travamento da demonstração em “Carregando telas do protótipo…”: corrigidos erros de sintaxe no renderizador do Instrutor e o vínculo demonstrativo do aviso de pagamento do Aluno, usando a relação já presente na turma. [SIMULADO]"],
      ["pendente", "Lote 3 — Painel e graduações: cobranças mensais e atrasos calculados foram implementados; continuam pendentes regressão completa e validação. WhatsApp permanece manual e não foi alterado neste lote; o histórico manual de graduações já existe (RN12–RN13, RN15–RN16). [SIMULADO]"],
      ["pendente", "Fechar a F1: completar as telas, versão/atualização e regressão; validar a fase com o usuário. [SIMULADO]"]
    ]
  },
  {
    title: "Fase 2 — operação completa",
    description: "Rotinas administrativas, comunicação e planejamento de aulas.",
    tasks: [
      ["pendente", "Implementar e testar importação de extrato Pix e conciliação com confirmação manual (RN07). [SIMULADO]"],
      ["pendente", "Implementar e testar mural, grade semanal, avisos e perguntas frequentes (RN22–RN24)."],
      ["pendente", "Implementar e testar feedbacks, metas, notas privadas e conversa individual (RN19–RN21). [SIMULADO]"],
      ["pendente", "Implementar e testar aniversários, alunos avulsos/diárias e alunos trancados (RN05, RN11, RN18). [SIMULADO]"],
      ["pendente", "Implementar e testar configurações, tutorial, ajuda e modo simples (RN26, RN34–RN35). [SIMULADO]"],
      ["pendente", "Implementar e testar painel administrativo, suporte auditado, diagnóstico e avisos globais (RN27–RN32). [SIMULADO]"],
      ["pendente", "Implementar e testar plano semanal, biblioteca/cobertura de temas, sugestões para o Professor e delegação de aula ao Instrutor (RN36–RN42 e requisito adicional). O Professor decide o conteúdo; pode compartilhar o plano ou deixar o treino livre. [SIMULADO]"],
      ["pendente", "Executar e aprovar os testes de regressão da F1 e F2; validar a fase com o usuário."]
    ]
  },
  {
    title: "Fase 3 — refinamentos e conclusão",
    description: "Recursos finais, validação completa, segurança e autorização de publicação.",
    tasks: [
      ["pendente", "Implementar e testar métricas de graduação e recibos (RN14, RN17). [SIMULADO]"],
      ["pendente", "Implementar e testar exportação, backup e consulta offline (RN33). [PENDENTE]"],
      ["validado", "Registrar a regra de segurança: interromper e consultar o usuário se uma publicação Git aparentar conter dado sensível. Regra confirmada pelo usuário."],
      ["validado", "Especificar casos de aceite para bloquear publicação Git diante de suspeita de dado sensível. Validado pelo usuário."],
      ["pendente", "Executar os testes de publicação segura; suspeita de dado sensível bloqueia a ação até orientação do usuário."],
      ["pendente", "Executar a suíte completa: funcionalidades, permissões/RLS, regressão, PWA/offline, responsividade e revisão manual."],
      ["pendente", "Confirmar funcionamento ponta a ponta e obter validação do usuário para todos os lotes."],
      ["pendente", "Solicitar autorização explícita antes de qualquer commit ou push; não publicar a partir da main enquanto houver teste pendente ou falho, sem aplicar esse bloqueio ao push da branch feat/telas-iniciais."],
      ["feito", "copilot-instructions.md com regras de config.js, comandos em loop e navegador. Feito; também inclui regras para perguntas e dúvidas de escopo."],
      ["feito", "contato de privacidade preenchido nos 3 textos. Feito; modal e tela do app usam a renderização compartilhada."]
    ]
  }
];

const phaseList = document.querySelector("#phase-list");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const showValidatedControl = document.querySelector("#show-validated");
let currentFilter = "todos";
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

function renderPhases(filter = currentFilter) {
  currentFilter = filter;
  phaseList.replaceChildren();

  window.PLANO_TATAME.forEach((phase, phaseIndex) => {
    const visibleTasks = phase.tasks
      .map((task, taskIndex) => ({ status: task[0], title: task[1], taskIndex }))
      .filter((task) => {
        if (filter === "todos") return showValidatedControl.checked || task.status !== "validado";
        if (filter === "validado") return showValidatedControl.checked && task.status === "validado";
        return task.status === filter;
      });

    if (!visibleTasks.length) return;

    const section = document.createElement("details");
    section.className = "phase-card";
    section.open = phase.tasks.some((task) => task[0] === "feito" || task[0] === "pendente");
    const heading = document.createElement("summary");
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
    if (button.dataset.filter === "validado") showValidatedControl.checked = true;
    filterButtons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    renderPhases(button.dataset.filter);
  });
});

showValidatedControl.addEventListener("change", () => {
  if (!showValidatedControl.checked && currentFilter === "validado") {
    currentFilter = "todos";
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === currentFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  renderPhases();
});

updateSummary();
renderPhases();
