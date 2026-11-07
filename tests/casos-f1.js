"use strict";

window.CASOS_ACEITE_F1 = [
  {
    id: "F1-AUTH-01",
    area: "Autenticação",
    titulo: "Login válido abre sessão com o perfil carregado do banco",
    perfil: "Adm, professor ou aluno",
    regras: "RN01–RN03",
    precondicoes: "Há uma conta fictícia ativa e um provedor de login habilitado no ambiente de teste.",
    passos: ["Entrar com a conta de teste pelo método habilitado.", "Abrir a área inicial do perfil."],
    esperado: "A sessão é criada e o papel vem do banco; a navegação corresponde ao perfil sem confiar em papel informado pelo navegador."
  },
  {
    id: "F1-AUTH-02",
    area: "Autenticação",
    titulo: "Credenciais inválidas não abrem sessão",
    perfil: "Pessoa sem sessão",
    regras: "RN01–RN03",
    precondicoes: "Ambiente de teste sem sessão autenticada.",
    passos: ["Tentar entrar com credencial fictícia inválida.", "Tentar abrir diretamente uma área protegida."],
    esperado: "O login é recusado, nenhuma sessão ou dado protegido é disponibilizado e a mensagem não revela se uma conta real existe."
  },
  {
    id: "F1-AUTH-03",
    area: "Autenticação",
    titulo: "Sair encerra a sessão e protege a navegação posterior",
    perfil: "Usuário autenticado",
    regras: "RN01–RN03",
    precondicoes: "Conta fictícia autenticada em uma área protegida.",
    passos: ["Sair da conta.", "Usar voltar/atualizar e tentar abrir novamente a área protegida."],
    esperado: "A sessão é encerrada; conteúdo protegido não reaparece e o usuário precisa autenticar-se novamente."
  },
  {
    id: "F1-ACC-01",
    area: "Acesso e convites",
    titulo: "Professor convidado consegue entrar",
    perfil: "Professor convidado",
    regras: "RN01–RN02",
    precondicoes: "O Adm cadastrou previamente o identificador fictício do professor como convidado.",
    passos: ["Criar a conta usando o mesmo identificador convidado.", "Iniciar uma sessão."],
    esperado: "O acesso é liberado com o perfil de professor e sem privilégios de Adm."
  },
  {
    id: "F1-ACC-02",
    area: "Acesso e convites",
    titulo: "Professor não convidado não recebe acesso",
    perfil: "Pessoa sem convite",
    regras: "RN02",
    precondicoes: "O identificador fictício não consta na lista de convidados.",
    passos: ["Tentar criar uma conta de professor.", "Tentar abrir as áreas protegidas diretamente."],
    esperado: "O acesso é negado; nenhuma tela ou dado de professor fica disponível."
  },
  {
    id: "F1-ACC-03",
    area: "Acesso e convites",
    titulo: "Convite válido vincula o aluno correto",
    perfil: "Aluno convidado",
    regras: "RN03",
    precondicoes: "Existe um convite fictício válido, ainda não utilizado e associado ao ALUNO_A.",
    passos: ["Criar a conta de aluno.", "Informar o convite.", "Abrir o perfil e o histórico."],
    esperado: "A conta fica vinculada somente ao ALUNO_A e mantém os dados e o histórico já cadastrados."
  },
  {
    id: "F1-ACC-04",
    area: "Acesso e convites",
    titulo: "Convite inválido, expirado ou reutilizado é recusado",
    perfil: "Aluno convidado",
    regras: "RN03",
    precondicoes: "Há convites fictícios inválidos, expirados e já consumidos.",
    passos: ["Tentar concluir o cadastro uma vez com cada convite e conferir o aviso abaixo de Validar convite.", "Usar ?erro-simulado=cadastro com campos fictícios preenchidos; observar Enviando..., bloqueio de toque duplo, Tentar de novo e alerta, que desaparece ao repetir.", "Com convite válido, conferir ✓ Concluído por 2 a 3 segundos e o resultado original."],
    esperado: "Cada tentativa inválida é recusada com mensagem clara; nenhum vínculo ou conta indevida é criado. Os estados são anunciados e o resultado bem-sucedido não muda."
  },
  {
    id: "F1-ACC-05",
    area: "Acesso e permissões",
    titulo: "Adm define Professores e Professor promove somente alunos próprios",
    perfil: "Adm, Professor e aluno",
    regras: "RN01–RN02",
    precondicoes: "Há contas fictícias sem papel de Professor, alunos de dois Professores e uma academia sem Professor vinculado.",
    passos: ["Como Adm, atribuir o papel de Professor e vincular uma academia.", "Como Professor, tentar promover aluno de outra turma e graduar um Instrutor a Professor.", "Tentar alterar o próprio papel diretamente."],
    esperado: "Só o Adm define Professores e os vincula à academia; o Professor promove somente os próprios alunos a Instrutor. Só o Adm gradua Instrutores a Professor; faixa e histórico permanecem com a pessoa. Instrutor e aluno não elevam o próprio papel; o servidor/RLS nega alterações fora dessas permissões."
  },
  {
    id: "F1-ACC-06",
    area: "Acesso e permissões",
    titulo: "Professor não acessa alunos de outro professor",
    perfil: "Professor",
    regras: "RN02; RLS por perfil",
    precondicoes: "PROFESSOR_A e PROFESSOR_B têm alunos fictícios separados.",
    passos: ["Entrar como PROFESSOR_A.", "Tentar consultar e alterar o aluno de PROFESSOR_B por tela e por chamada direta."],
    esperado: "Leitura e alteração fora do vínculo são negadas pelas políticas do banco."
  },
  {
    id: "F1-ACC-07",
    area: "Acesso e permissões",
    titulo: "Aluno acessa somente os próprios dados",
    perfil: "Aluno",
    regras: "RLS por perfil",
    precondicoes: "ALUNO_A e ALUNO_B possuem perfis e registros fictícios distintos.",
    passos: ["Entrar como ALUNO_A.", "Tentar consultar ou alterar dados identificados como pertencentes ao ALUNO_B."],
    esperado: "O aluno só consulta os próprios registros; leitura e alteração de dados alheios são negadas no banco."
  },
  {
    id: "F1-INST-01",
    area: "Instrutor",
    titulo: "Instrutor tem perfil distinto de professor",
    perfil: "Instrutor",
    regras: "Papel definido pelo servidor; permissões por RLS",
    precondicoes: "Há uma conta fictícia de instrutor, autorizada conforme o fluxo definido no banco.",
    passos: ["Entrar com a conta de instrutor.", "Tentar abrir áreas de gestão exclusivas do professor principal e do Adm.", "Tentar alterar o próprio papel."],
    esperado: "O papel de instrutor é carregado do banco, não equivale a Adm nem a professor principal e não pode ser elevado pelo próprio usuário.",
    revisao: true
  },
  {
    id: "F1-INST-02",
    area: "Instrutor",
    titulo: "Professor decide o plano e o Instrutor não escolhe conteúdo",
    perfil: "Instrutor",
    regras: "Novo requisito; autorização por aula",
    precondicoes: "O Professor delegou uma aula fictícia e escolheu compartilhar um plano ou deixar o treino livre.",
    passos: ["Entrar como Instrutor.", "Abrir a única aula delegada.", "Conferir o plano ou a indicação “Treino livre” e registrar “Segui” ou “Não segui”."],
    esperado: "O Instrutor não escolhe nem altera o conteúdo; a indicação de treino livre também é decidida pelo Professor. O Instrutor só registra se seguiu a orientação da aula delegada.",
    revisao: true
  },
  {
    id: "F1-INST-03",
    area: "Instrutor",
    titulo: "Instrutor vê somente a turma e a aula delegada",
    perfil: "Instrutor",
    regras: "Novo requisito; acesso restrito por aula e RLS",
    precondicoes: "A turma única do Professor contém alunos fictícios; existem também pagamentos, notas privadas e conversas alheias.",
    passos: ["Entrar como Instrutor.", "Consultar os alunos da turma e a aula delegada.", "Tentar abrir pagamentos de outras pessoas, notas privadas, conversas de terceiros ou outra turma por tela e chamada direta."],
    esperado: "O Instrutor vê somente nome e graduação atual dos alunos da turma e o plano delegado ou “Treino livre”; não vê pagamentos alheios, notas privadas, conversas de terceiros ou outra turma.",
    revisao: true
  },
  {
    id: "F1-INST-04",
    area: "Instrutor",
    titulo: "Instrutor registra se seguiu a aula delegada",
    perfil: "Instrutor",
    regras: "Novo requisito; confirmação restrita à aula autorizada",
    precondicoes: "Há uma aula delegada pelo Professor à sua turma única.",
    passos: ["Marcar “Segui” ou “Não segui” na aula delegada.", "Tentar alterar o plano, a delegação ou registrar feedback."],
    esperado: "O Instrutor registra apenas se seguiu a orientação; não escolhe conteúdo, não altera a delegação e não envia feedback.",
    revisao: true
  },
  {
    id: "F1-INST-05",
    area: "Instrutor",
    titulo: "Link autorizado inicia a criação da conta de instrutor",
    perfil: "Instrutor",
    regras: "Novo requisito; convite do professor principal e perfil atribuído pelo banco",
    precondicoes: "O Professor gerou, para uma pessoa pré-cadastrada, um link fictício válido por três dias e de uso único.",
    passos: ["Abrir o link de convite.", "Criar a conta.", "Tentar usar novamente o mesmo convite."],
    esperado: "O link válido é consumido uma única vez dentro de três dias; expirado ou reutilizado não cria conta nem vínculo. O Adm define o papel de Professor; o Instrutor não se promove.",
    revisao: true
  },
  {
    id: "F1-PRV-01",
    area: "Consentimento",
    titulo: "Consentimento é exigido antes do primeiro acesso aos dados",
    perfil: "Novo usuário",
    regras: "RN25",
    precondicoes: "Conta fictícia recém-criada sem aceite registrado.",
    passos: ["Entrar pela primeira vez.", "Tentar abrir o perfil e as áreas com dados pessoais sem aceitar o termo."],
    esperado: "As áreas ficam bloqueadas até o aceite; a recusa não registra consentimento."
  },
  {
    id: "F1-PRV-02",
    area: "Consentimento",
    titulo: "Aceite registra versão e data/hora",
    perfil: "Novo usuário",
    regras: "RN25",
    precondicoes: "Conta fictícia ainda sem consentimento e versão vigente do termo configurada.",
    passos: ["Aceitar o termo.", "Consultar o registro do aceite usando o contexto autorizado de teste."],
    esperado: "O registro associa o usuário, a versão exibida e a data/hora do aceite; o aceite não pode ser atribuído a outro usuário."
  },
  {
    id: "F1-ALU-01",
    area: "Cadastro de alunos",
    titulo: "Professor cadastra aluno fixo",
    perfil: "Professor",
    regras: "RN03",
    precondicoes: "Professor fictício autorizado e formulário de cadastro disponível.",
    passos: ["Preencher os campos previstos para aluno fixo com dados fictícios.", "Salvar e reabrir o cadastro."],
    esperado: "O cadastro é persistido, vinculado ao professor correto e exibido com os mesmos dados válidos."
  },
  {
    id: "F1-ALU-02",
    area: "Cadastro de alunos",
    titulo: "Aluno sem telefone permanece gerenciado pelo professor",
    perfil: "Professor",
    regras: "RN04",
    precondicoes: "Professor autorizado; fixture de aluno sem telefone.",
    passos: ["Cadastrar o aluno sem informar telefone.", "Consultar seu perfil e histórico."],
    esperado: "O cadastro é permitido sem criar acesso ou exigir telefone; o professor gerencia o perfil e os registros."
  },
  {
    id: "F1-ALU-03",
    area: "Cadastro de alunos",
    titulo: "Campos inválidos não criam cadastro parcial",
    perfil: "Professor",
    regras: "RN03",
    precondicoes: "Formulário de aluno disponível e fixture com campo obrigatório ausente ou formato inválido.",
    passos: ["Tentar salvar o formulário inválido.", "Corrigir os campos e salvar novamente."],
    esperado: "A tentativa inválida mostra o que corrigir e não cria registro incompleto; o cadastro válido pode ser salvo."
  },
  {
    id: "F1-PAG-01",
    area: "Pagamentos",
    titulo: "Professor lança recebimento em dinheiro já confirmado",
    perfil: "Professor",
    regras: "RN06",
    precondicoes: "Aluno e cobrança fictícios ativos, associados ao professor autenticado.",
    passos: ["Lançar o recebimento em dinheiro.", "Consultar o pagamento e o resumo financeiro."],
    esperado: "O recebimento fica confirmado na hora e vinculado ao aluno, ao valor, à data e ao Professor que o lançou; não há movimentação de dinheiro pelo app."
  },
  {
    id: "F1-PAG-02",
    area: "Pagamentos",
    titulo: "Aviso de pagamento do aluno fica pendente de confirmação",
    perfil: "Aluno",
    regras: "RN06",
    precondicoes: "Aluno autenticado com cobrança própria em aberto.",
    passos: ["Usar as ações Paguei em dinheiro e Enviar comprovante com dados fictícios; conferir Enviando..., bloqueio de toque duplo e ✓ Concluído por 2 a 3 segundos.", "Consultar o status como aluno e como professor.", "Repetir com ?erro-simulado=aluno-dinheiro e ?erro-simulado=aluno-comprovante; conferir Tentar de novo, alerta abaixo do botão e remoção do aviso ao repetir."],
    esperado: "O aviso aparece na fila real do Professor responsável com nome do aluno, valor e data; fica pendente até confirmação ou recusa e não é contado como recebido antes da confirmação."
  },
  {
    id: "F1-PAG-03",
    area: "Pagamentos",
    titulo: "Professor responsável confirma o pagamento pendente",
    perfil: "Professor",
    regras: "RN06",
    precondicoes: "Pagamento fictício pendente de aluno do professor autenticado.",
    passos: ["Confirmar o pagamento.", "Reabrir a cobrança e os totais do período."],
    esperado: "O pagamento passa a confirmado uma única vez e os totais refletem o valor confirmado."
  },
  {
    id: "F1-PAG-04",
    area: "Pagamentos",
    titulo: "Professor responsável recusa o pagamento informado",
    perfil: "Professor",
    regras: "RN06",
    precondicoes: "Pagamento fictício pendente de aluno do professor autenticado.",
    passos: ["Recusar o pagamento.", "Consultar o status como professor e como aluno."],
    esperado: "O pagamento não é considerado recebido; o resultado da recusa aparece sem marcar a cobrança como paga."
  },
  {
    id: "F1-PAG-05",
    area: "Pagamentos",
    titulo: "Desconto e isenção são aplicados à cobrança",
    perfil: "Professor",
    regras: "RN08–RN09",
    precondicoes: "Aluno fictício e cobrança com valor-base simbólico V; desconto ou isenção configurados.",
    passos: ["Gerar a cobrança com desconto.", "Gerar outra cobrança com isenção.", "Conferir os valores apresentados."],
    esperado: "O valor devido corresponde à regra configurada; a isenção resulta em valor devido zero sem criar recebimento fictício."
  },
  {
    id: "F1-PAG-06",
    area: "Pagamentos",
    titulo: "Pagamento parcial mantém o saldo em aberto",
    perfil: "Professor",
    regras: "RN09",
    precondicoes: "Cobrança fictícia com saldo devido maior que zero.",
    passos: ["Registrar um pagamento parcial válido.", "Consultar pagamentos associados e saldo restante."],
    esperado: "O valor pago fica registrado, o saldo restante é calculado corretamente e a cobrança não aparece integralmente paga."
  },
  {
    id: "F1-PAG-07",
    area: "Pagamentos",
    titulo: "Status de vencimento respeita carência configurada",
    perfil: "Professor",
    regras: "RN10",
    precondicoes: "Cobrança fictícia em aberto, data de vencimento e carência configuráveis no ambiente de teste.",
    passos: ["Consultar antes do vencimento.", "Consultar no vencimento e durante a carência.", "Avançar o relógio de teste além da carência."],
    esperado: "O status segue pendente/a vencer antes do atraso e só passa a atrasado depois da carência definida."
  },
  {
    id: "F1-PAG-08",
    area: "Pagamentos",
    titulo: "Aluno não confirma o próprio pagamento",
    perfil: "Aluno",
    regras: "RN06",
    precondicoes: "Aluno autenticado com pagamento próprio pendente.",
    passos: ["Tentar acionar uma confirmação de pagamento pela interface.", "Tentar confirmar diretamente por chamada ao banco/API."],
    esperado: "A confirmação é negada; somente o professor responsável pode confirmar ou recusar."
  },
  {
    id: "F1-PAG-09",
    area: "Pagamentos",
    titulo: "Aluno trancado não recebe cobrança no período",
    perfil: "Professor",
    regras: "RN11",
    precondicoes: "Aluno fictício com status trancado e período de trancamento registrado.",
    passos: ["Executar o fluxo de geração de cobranças do período.", "Consultar as cobranças do aluno."],
    esperado: "Nenhuma cobrança é gerada para o período trancado; cobranças anteriores preservam seu histórico."
  },
  {
    id: "F1-FIN-01",
    area: "Painel financeiro",
    titulo: "Resumo separa previsto, recebido, pendente e atrasado",
    perfil: "Professor",
    regras: "RN13",
    precondicoes: "Conjunto fictício de cobranças e pagamentos com estados conhecidos.",
    passos: ["Abrir o painel do professor.", "Comparar os indicadores aos registros de teste."],
    esperado: "Cada indicador corresponde aos registros do período e distingue valores previstos, confirmados, pendentes e atrasados."
  },
  {
    id: "F1-FIN-02",
    area: "Painel financeiro",
    titulo: "Pagamento pendente ou recusado não aumenta o recebido",
    perfil: "Professor",
    regras: "RN06, RN13",
    precondicoes: "Conjunto fictício com pagamentos confirmados, pendentes e recusados.",
    passos: ["Abrir os totais antes e depois de informar, confirmar e recusar pagamentos de teste."],
    esperado: "Apenas pagamentos confirmados entram no total recebido, sem duplicidade após atualização ou reabertura."
  },
  {
    id: "F1-GRAD-01",
    area: "Graduações",
    titulo: "Professor registra promoção manual",
    perfil: "Professor",
    regras: "RN15",
    precondicoes: "Aluno fictício vinculado ao professor autenticado.",
    passos: ["Registrar faixa, grau, data e responsável fictícios.", "Abrir novamente o histórico do aluno."],
    esperado: "A graduação fica salva com os campos informados e associada ao aluno e professor corretos."
  },
  {
    id: "F1-GRAD-02",
    area: "Graduações",
    titulo: "Linha do tempo mantém ordem e histórico de faixas",
    perfil: "Professor e aluno",
    regras: "RN16",
    precondicoes: "Aluno fictício com início de treino e mais de uma graduação em datas distintas.",
    passos: ["Abrir o histórico.", "Comparar a sequência exibida às datas dos registros."],
    esperado: "A linha do tempo começa no início dos treinos e apresenta as graduações em ordem cronológica, com graus e responsável."
  },
  {
    id: "F1-GRAD-03",
    area: "Graduações",
    titulo: "Aluno consulta somente o próprio histórico",
    perfil: "Aluno",
    regras: "RN15–RN16; RLS por perfil",
    precondicoes: "ALUNO_A e ALUNO_B possuem históricos fictícios diferentes.",
    passos: ["Entrar como ALUNO_A e consultar o histórico.", "Tentar abrir o histórico de ALUNO_B e alterar qualquer graduação."],
    esperado: "ALUNO_A visualiza apenas seu próprio histórico e não consegue alterar graduações."
  },
  {
    id: "F1-UX-01",
    area: "Interface e acessibilidade",
    titulo: "Fluxos principais são claros em celular e desktop",
    perfil: "Professor e aluno",
    regras: "Princípios de simplicidade e modo simples",
    precondicoes: "Build candidata do lote disponível e viewport móvel e desktop.",
    passos: ["Percorrer login, ação principal e retorno de resultado em ambas as larguras.", "Usar teclado e verificar foco e rótulos."],
    esperado: "Ações essenciais têm rótulos claros em PT-BR, são operáveis por toque/teclado e não exigem rolagem horizontal."
  },
  {
    id: "F1-UX-03",
    area: "Interface responsiva",
    titulo: "Telas principais oferecem experiências para notebook e iPhone",
    perfil: "Professor e aluno",
    regras: "Novo requisito de compatibilidade visual",
    precondicoes: "Build candidata, layouts para notebook e iPhone 13 ou superior, menor largura suportada (mínimo 320 px) e breakpoints responsivos do lote documentados.",
    passos: ["Percorrer todas as telas principais nas larguras de referência de celular, tablet e notebook: 320 px, 360 px, 390 px, 768 px, 1024 px, 1280 px, 1440 px e 1920 px.", "Verificar iPhone 13 (390 × 844 CSS px) e iPhone 13 Pro Max (428 × 926 CSS px), incluindo áreas seguras e navegação inferior.", "Testar também 1 px abaixo, no breakpoint e 1 px acima de cada breakpoint responsivo definido.", "Repetir em retrato e paisagem e com altura curta de viewport; redimensionar continuamente dentro da faixa suportada.", "Conferir sidebar à esquerda e painel de usuário oculto à direita na web; no mobile, navegação inferior e acesso ao menu, sem perder funcionalidades.", "Abrir o painel do usuário pelo cabeçalho web e pelo atalho Perfil mobile; navegar a uma opção e fechar por botão, fundo e tecla Esc."],
    esperado: "Notebook oferece layout otimizado com sidebar e painel de usuário oculto; iPhone oferece composição móvel própria com navegação inferior e áreas seguras. As mesmas funcionalidades permanecem disponíveis em toda a faixa suportada e nos limites dos breakpoints, sem elementos inacessíveis, layout quebrado ou rolagem horizontal inesperada."
  },
  {
    id: "F1-UX-04",
    area: "Interface responsiva",
    titulo: "Componentes não se sobrepõem nem saem de posição",
    perfil: "Professor e aluno",
    regras: "Novo requisito de inspeção visual",
    precondicoes: "Build candidata com telas principais, barras de navegação, cartões, botões e avisos carregados.",
    passos: ["Inspecionar cada tela nas resoluções de referência e nos limites de cada breakpoint.", "Verificar barras fixas, cartões, botões, selos, ícones e indicadores durante a rolagem, em retrato, paisagem e altura curta.", "Repetir com texto aumentado e conteúdo longo."],
    esperado: "Nenhum componente cobre outro ou fica cortado/fora da viewport; espaçamento e ordem de leitura continuam consistentes."
  },
  {
    id: "F1-UX-05",
    area: "Interface responsiva",
    titulo: "Textos, campos e mensagens cabem sem clipping",
    perfil: "Professor e aluno",
    regras: "Novo requisito de inspeção visual",
    precondicoes: "Fixtures fictícias com nomes e mensagens curtas e longas, erros, estados vazios e rótulos de campo.",
    passos: ["Percorrer listas, formulários e telas de detalhe nas larguras de referência e nos limites de cada breakpoint.", "Verificar rótulos, placeholders, textos longos, mensagens de erro, botões e estados vazios.", "Testar zoom/tamanho de texto aumentado e altura curta de viewport."],
    esperado: "Textos são legíveis e não truncam informação essencial; caixas e campos acomodam o conteúdo, mantêm rótulos associados e permitem concluir as ações."
  },
  {
    id: "F1-UX-06",
    area: "Interface responsiva",
    titulo: "Modais e caixas de diálogo funcionam em telas pequenas",
    perfil: "Professor e aluno",
    regras: "Novo requisito de inspeção visual e operação",
    precondicoes: "Build candidata com cada modal, confirmação e caixa de diálogo implementados.",
    passos: ["Abrir cada modal nas larguras de referência e nos limites de cada breakpoint, inclusive na menor largura suportada.", "Percorrer conteúdo maior que a altura visível em retrato e paisagem.", "Testar fechar, cancelar, confirmar, foco de teclado e retorno à tela anterior."],
    esperado: "Modal cabe na viewport, seu conteúdo pode ser percorrido, ações não ficam encobertas, foco permanece utilizável e fechar/cancelar não salva alterações."
  },
  {
    id: "F1-UX-02",
    area: "Interface e acessibilidade",
    titulo: "Falhas e estados vazios não parecem sucesso",
    perfil: "Professor e aluno",
    regras: "Princípios de simplicidade e confiabilidade",
    precondicoes: "Build candidata e fixtures para lista vazia e falha de conexão/autorização.",
    passos: ["Abrir uma lista vazia.", "Simular falha ao carregar e falha ao salvar.", "Repetir após recuperar a conexão."],
    esperado: "Estados vazios, carregamento e erros são distintos; erros são informados e nenhuma falha é apresentada como gravação bem-sucedida."
  },
  {
    id: "F1-PRIV-01",
    area: "Privacidade e LGPD",
    titulo: "Link de privacidade abre uma política legível no modal e na página própria",
    perfil: "Pessoa sem sessão e usuário autenticado",
    regras: "Novo requisito LGPD; conteúdo aprovado pelo usuário",
    precondicoes: "Há conteúdo de política de privacidade confirmado pelo usuário, uma página HTML própria e links de privacidade nos contextos pertinentes do app.",
    passos: ["Abrir o link de privacidade antes da autenticação e em uma área autenticada.", "Ler a política no modal; testar rolagem, botão de fechar, Escape, foco de teclado e retorno ao ponto anterior.", "Abrir a página HTML independente.", "Comparar se os dois formatos apresentam a mesma versão e conteúdo confirmado.", "Repetir em larguras responsivas de referência, orientação retrato/paisagem e viewport de pouca altura."],
    esperado: "O link abre um modal acessível sem impedir a leitura; o modal pode ser fechado e a navegação retomada; a página própria permanece acessível; conteúdo e versão correspondem entre os formatos e cabem nos tamanhos testados."
  },
  {
    id: "F1-PRIV-02",
    area: "Privacidade e LGPD",
    titulo: "Política não declara práticas de dados sem confirmação do usuário",
    perfil: "Equipe responsável pela publicação",
    regras: "Novo requisito LGPD; aprovação explícita de conteúdo e práticas",
    precondicoes: "Há uma versão candidata da política e um registro das práticas de dados confirmadas pelo usuário.",
    passos: ["Conferir cada tipo de dado, finalidade, hipótese legal, consentimento, retenção, compartilhamento, canal de atendimento e declaração de segurança contra as informações confirmadas.", "Alterar uma prática no produto e verificar a revisão correspondente da política.", "Tentar publicar texto com informação ainda não confirmada ou divergente."],
    esperado: "A política corresponde às práticas efetivas e aprovadas; alterações relevantes exigem atualização dos dois formatos; conteúdo não confirmado ou divergente bloqueia a publicação e é encaminhado ao usuário para decisão."
  },
  {
    id: "F1-ACC-08",
    area: "Acesso e convites",
    titulo: "Código mostra prévia sem expor outros dados e bloqueia tentativas",
    perfil: "Aluno registrado ou sem registro",
    regras: "Vínculo por código; limitação de tentativas",
    precondicoes: "Há um código fictício associado a Professor com academia e um Professor sem academia.",
    passos: ["Consultar um código válido e conferir a prévia antes de confirmar.", "Consultar um código inexistente e um código de Professor sem academia.", "Errar o código cinco vezes e tentar novamente antes de 15 minutos.", "Verificar Enviando..., bloqueio de toque duplo e ✓ Concluído por 2 a 3 segundos em Consultar código; repetir com ?erro-simulado=vinculo-consulta e conferir Tentar de novo e o alerta abaixo do botão."],
    esperado: "A prévia válida mostra somente nome do Professor e da academia, sem foto; código inexistente ou sem academia responde com mensagem genérica. Após cinco erros seguidos, novas tentativas ficam bloqueadas por 15 minutos."
  },
  {
    id: "F1-ACC-09",
    area: "Acesso e convites",
    titulo: "Aluno pode cancelar vínculo pendente e Professor decide o pedido",
    perfil: "Aluno e Professor",
    regras: "Vínculo por código e aprovação",
    precondicoes: "Um aluno fictício enviou um pedido de vínculo para a academia do Professor.",
    passos: ["Como aluno, cancelar o pedido pendente.", "Criar outro pedido.", "Como Professor, aprovar ou recusar o pedido.", "Em Solicitar vínculo e Cancelar pedido, verificar Enviando..., bloqueio de toque duplo e ✓ Concluído por 2 a 3 segundos; repetir respectivamente com ?erro-simulado=vinculo-solicitacao e ?erro-simulado=vinculo-cancelamento e conferir Tentar de novo e o alerta abaixo do botão."],
    esperado: "O aluno cancela o próprio pedido; pedidos ativos aparecem na fila do Professor, que pode aprovar ou recusar. Sem aprovação não há novo vínculo."
  },
  {
    id: "F1-ACC-10",
    area: "Acesso e convites",
    titulo: "Professor sem academia não aceita vínculo pelo código",
    perfil: "Aluno e Professor",
    regras: "Vínculo de Professor definido pelo Adm",
    precondicoes: "Há uma conta fictícia com papel de Professor ainda sem vínculo a uma academia.",
    passos: ["Abrir o código desse Professor como aluno.", "Tentar solicitar vínculo."],
    esperado: "A tela do Professor informa “Professor sem academia”; ao aluno, o código responde com a mesma mensagem genérica usada para código inexistente."
  },
  {
    id: "F1-INST-06",
    area: "Instrutor",
    titulo: "Professor delega a aula e escolhe plano compartilhado ou treino livre",
    perfil: "Professor e Instrutor",
    regras: "Uma turma por Professor; decisão de conteúdo pelo Professor",
    precondicoes: "O Professor tem uma única turma e um Instrutor autorizado.",
    passos: ["Delegar a aula ao Instrutor.", "Escolher compartilhar o plano ou marcar “Treino livre”.", "Abrir a aula como Instrutor."],
    esperado: "A delegação se limita à turma única; o Instrutor vê o plano compartilhado ou “Treino livre” e só pode registrar se seguiu a orientação."
  },
  {
    id: "F1-INST-07",
    area: "Instrutor",
    titulo: "Instrutor consulta somente os próprios pagamentos",
    perfil: "Instrutor",
    regras: "Dados próprios do aluno separados da turma apoiada",
    precondicoes: "O Instrutor tem cobranças próprias e existem cobranças de outros alunos da turma.",
    passos: ["Abrir “Meus pagamentos” como Instrutor.", "Tentar acessar a cobrança de outro aluno."],
    esperado: "O Instrutor pode consultar apenas suas próprias cobranças; pagamentos de alunos da turma não aparecem nem podem ser acessados."
  },
  {
    id: "F1-PAG-10",
    area: "Pagamentos",
    titulo: "Comprovante é apagado após confirmação do Professor",
    perfil: "Professor",
    regras: "Retenção mínima de comprovante",
    precondicoes: "Há um comprovante fictício pendente com valor e data lidos.",
    passos: ["Confirmar o recebimento.", "Consultar o histórico do pagamento."],
    esperado: "O arquivo/foto do comprovante deixa de existir após a confirmação; somente valor e data de recebimento permanecem no histórico."
  },
  {
    id: "F1-UX-07",
    area: "Ajuda e acessibilidade",
    titulo: "Tutorial acompanha o tipo de conta e pode ser reaberto",
    perfil: "Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "Tutorial contextual e acessibilidade",
    precondicoes: "Há contas fictícias dos cinco tipos e tutorial com passos próprios.",
    passos: ["Entrar pela primeira vez em cada conta.", "Usar Voltar, Próximo e Pular.", "Reabrir Tutorial pelo painel do usuário e operar por toque, teclado e Escape."],
    esperado: "O primeiro acesso abre o tutorial correspondente; os passos explicam as funcionalidades disponíveis, têm ilustração SVG inline, foco acessível e não cortam texto. Pular fecha o tutorial e o painel permite reabri-lo."
  },
  {
    id: "F1-UX-08",
    area: "Interface responsiva",
    titulo: "Contraste dos temas conferido no iPhone",
    perfil: "Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "Acessibilidade: contraste mínimo de 4,5:1 para texto e 3:1 para texto grande, ícones e bordas de campos; estados de alerta acompanhados de ícone e texto.",
    precondicoes: "iPhone com a versão atual do protótipo e brilho em nível normal; repetir nos temas claro e escuro e em ambiente com luz forte.",
    passos: ["Em cada conta fictícia, percorrer todas as telas do menu e a barra inferior, o tutorial, o painel do usuário e os modais de privacidade e termo de consentimento.", "Conferir títulos, rótulos, textos de apoio, placeholders, links, abas, filtros, bordas dos campos, avisos e selos de status; verificar ícone e texto nos alertas, atrasos e ações de perigo.", "Conferir botão primário e itens ativos dourados no escuro e azuis no claro; verificar que o botão Google permanece neutro e o logo mantém suas cores.", "Aumentar o tamanho do texto do iPhone e repetir nas telas de login, pagamentos e vínculo."],
    esperado: "Texto comum atinge 4,5:1 e texto grande, ícone e bordas de campos atingem 3:1 sobre os fundos adjacentes; estados de alerta não dependem apenas de cor. A navegação e os controles permanecem legíveis nos dois temas."
  },
  {
    id: "F1-UX-09",
    area: "Interface responsiva",
    titulo: "Navegação e conta em telas responsivas e no iPhone instalado",
    perfil: "Visitante, Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "Destinos e permissões preservados, acessibilidade e áreas seguras",
    precondicoes: "Protótipo atualizado, contas fictícias disponíveis e iPhone com o app adicionado à tela de início; verificar também com teclado e leitor de tela.",
    passos: ["Em cada perfil, percorrer os atalhos inferiores, o menu lateral e o painel de conta; conferir destinos, rótulos, item ativo, ícones de 24 px e áreas de toque de pelo menos 48 × 48 px.", "Abrir e fechar menu e painel pelo botão, toque fora, deslizamento e Escape; conferir foco, leitura e acesso às ações permitidas.", "No iPhone, remover o atalho antigo, reinstalar e conferir o logo; testar retrato e paisagem, rolagem, teclado, campos, áreas seguras e retorno ao app instalado; repetir nos temas claro e escuro e com texto aumentado.", "Verificar também as larguras e limites responsivos previstos no plano, incluindo 430 px, sem cortes nem rolagem horizontal inesperada."],
    esperado: "Cada perfil conserva os mesmos destinos e permissões; os atalhos têm ícones de 24 px e rótulos de pelo menos 12 px, o estado ativo não depende só de cor, menus operam com toque e teclado, o foco retorna ao controle de abertura e nenhuma área segura ou barra fixa encobre conteúdo. O logo instalado corresponde ao projeto e campos não provocam zoom automático no iPhone."
  },
  {
    id: "F1-UX-10",
    area: "Interface responsiva",
    titulo: "Estados e mensagens de entrada e conversa simuladas",
    perfil: "Visitante e aluno",
    regras: "Ações com foco, processamento, bloqueio contra toque duplo e mensagens acessíveis de resultado.",
    precondicoes: "Protótipo local aberto na tela de entrada, sem conexão real de login; repetir com teclado e leitor de tela.",
    passos: ["Acionar Fazer login com o Google e Entrar separadamente; observar indicador e texto de processamento no botão, anúncio acessível e ambos os botões desabilitados durante a simulação.", "Tentar um segundo acionamento durante o processamento e conferir que não há nova operação.", "Ao concluir, verificar ✓ Concluído por 2 a 3 segundos no botão, sem caixa de sucesso, e depois o rótulo original; trocar de tela durante a conclusão e conferir o aviso global.", "Abrir index.html?erro-simulado=entrada e acionar cada botão; conferir Tentar de novo, mensagem abaixo do botão em role=alert sem mudança de layout, e desaparecimento da mensagem ao tentar novamente. Remover o parâmetro e conferir o sucesso.", "Na conversa do aluno, verificar os mesmos estados em Enviar e repetir com ?erro-simulado=aluno-mensagem."],
    esperado: "Cada ação informa processamento, conclusão ou erro sem depender apenas de cor; os estados são anunciados, o erro aparece abaixo do botão sem deslocar o conteúdo, toques duplicados são evitados e nenhum login ou envio é realizado."
  }
];
