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
    id: "F1-AUTH-04",
    area: "Autenticação",
    titulo: "Login Google real, sessão e ausência de perfil",
    perfil: "Pessoa de teste sem perfil",
    regras: "RN01–RN03",
    precondicoes: "Ambiente de teste configurado com chave pública e provedor Google, conta de teste autorizada sem perfil e migration de perfis aplicada.",
    passos: ["Testar chave vazia e erro simulado sem iniciar login.", "Entrar com Google e retornar ao app no Live Server e no Pages configurados.", "Conferir a mensagem de perfil ausente, o e-mail no painel e a persistência após recarregar.", "Sair da conta Google, recarregar e verificar o encerramento.", "Testar cancelamento, falha de rede e falha na consulta de perfil."],
    esperado: "O retorno usa a página atual, a sessão é recuperada e nenhum perfil é criado. Falhas são informadas sem confundi-las com perfil ausente; a saída encerra a sessão local. O caso permanece pendente de execução e validação."
  },
  {
    id: "F1-DEMO-01",
    area: "",
    titulo: "",
    perfil: "Visitante",
    regras: "",
    precondicoes: "Aplicativo aberto na tela de acesso.",
    passos: [],
    esperado: ""
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
    passos: ["Na simulação, pesquisar um aluno da turma sem acentos e com maiúsculas diferentes; conferir a graduação nas sugestões.", "Informar valor, data, tipo e referência; conferir os dados na confirmação e cancelar uma vez antes de confirmar.", "Recarregar e conferir o registro; antes e depois do prazo, verificar as opções Desfazer e Estornar.", "Desfazer um lançamento em até 10 segundos; em outro, aguardar o prazo e estornar.", "Repetir com ?erro-simulado=professor-pagamento-dinheiro-desfazer e ?erro-simulado=professor-pagamento-dinheiro-estornar; conferir o alerta e a nova tentativa.", "Consultar o pagamento e o resumo financeiro."],
    esperado: "A simulação identifica o aluno da turma, confirma os dados antes de lançar e mantém os registros desfeitos ou estornados no histórico. O recebimento fica confirmado na hora e vinculado ao aluno, ao valor, à data e ao Professor que o lançou; não há movimentação de dinheiro pelo app."
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
    precondicoes: "Professor da turma com regras de cobrança disponíveis e mês selecionado.",
    passos: ["Definir valor-base e vencimento de um aluno.", "Aplicar desconto fixo e percentual com duração de um mês e de N meses; testar também até remover.", "Gerar cobranças e conferir os valores-base, descontos e valores finais no histórico.", "Aplicar isenção com e sem motivo; conferir o alerta para não registrar dados sensíveis."],
    esperado: "Desconto fixo ou percentual reduz o valor-base sem valor final negativo; a duração segue o mês inicial selecionado e as regras não alteram cobranças já geradas. A isenção zera a cobrança sem criar recebimento."
  },
  {
    id: "F1-PAG-06",
    area: "Pagamentos",
    titulo: "Pagamento parcial mantém o saldo em aberto",
    perfil: "Professor",
    regras: "RN09",
    precondicoes: "Cobrança fictícia aberta com saldo devido maior que zero.",
    passos: ["Vincular aviso em dinheiro ou comprovante à cobrança com valor inferior ao saldo.", "Conferir que o aviso fica pendente e o saldo só muda depois da confirmação do Professor.", "Registrar outro pagamento parcial confirmado e conferir o saldo final."],
    esperado: "Avisos pendentes não marcam a cobrança como paga. Pagamentos parciais confirmados reduzem o saldo e a cobrança só passa a paga quando o total confirmado cobre o valor final."
  },
  {
    id: "F1-PAG-07",
    area: "Pagamentos",
    titulo: "Status de vencimento respeita carência configurada",
    perfil: "Professor",
    regras: "RN10",
    precondicoes: "Cobrança fictícia aberta, vencimento de 1 a 28 e carência configurável entre 0 e 30 dias.",
    passos: ["Consultar antes e no dia do vencimento.", "Consultar durante a carência e no dia exato de vencimento + carência.", "Consultar depois desse limite.", "Recarregar e conferir que o atraso continua calculado, sem campo de atraso gravado."],
    esperado: "A cobrança só fica atrasada quando hoje é maior que vencimento + carência. O padrão é 5 dias; carência e status atrasado não são gravados como estado da cobrança."
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
    esperado: "Aluno marcado trancado não pode ser selecionado para o lote; cobranças anteriores preservam seu histórico."
  },
  {
    id: "F1-FIN-01",
    area: "Painel financeiro",
    titulo: "Resumo mensal separa os seis estados financeiros",
    perfil: "Professor",
    regras: "RN13",
    precondicoes: "Conjunto fictício de cobranças e pagamentos com estados conhecidos.",
    passos: ["Abrir o painel do Professor e selecionar o mês.", "Comparar previsto, confirmado, aguardando confirmação, em aberto, atrasado e isento aos registros de teste."],
    esperado: "Os seis indicadores correspondem às cobranças e pagamentos do mês selecionado; atrasos seguem vencimento + carência e o estado de Instrutor nunca exibe valores."
  },
  {
    id: "F1-PAG-10",
    area: "Pagamentos",
    titulo: "Instrutor não vê valores de cobrança",
    perfil: "Instrutor",
    regras: "RN11",
    precondicoes: "Instrutor vinculado a uma academia com cobrança fictícia própria.",
    passos: ["Abrir Início e Meus pagamentos.", "Consultar status e vencimento da própria cobrança."],
    esperado: "O Instrutor vê somente o status e o vencimento próprios; nenhum valor ou pagamento de outros alunos aparece."
  },
  {
    id: "F1-PAG-11",
    area: "Pagamentos",
    titulo: "Cancelamento mantém histórico e exclui a cobrança dos indicadores",
    perfil: "Professor",
    regras: "RN10, RN13",
    precondicoes: "Há cobranças fictícias abertas do Professor, incluindo uma com aviso pendente ou pagamento confirmado.",
    passos: ["Tentar cancelar a cobrança com aviso/pagamento associado e conferir o bloqueio com instrução para rejeitar ou estornar.", "Rejeitar o aviso ou estornar o pagamento e tentar novamente.", "Confirmar o cancelamento de uma cobrança sem pagamento ativo.", "Consultar o painel, atrasos e histórico após recarregar."],
    esperado: "A ação aparece somente ao Professor e apenas para cobranças abertas, após confirmação. Avisos pendentes e pagamentos confirmados bloqueiam a ação até rejeição ou estorno; a cobrança cancelada permanece no histórico e não entra no painel nem em atrasos."
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
    passos: ["Na ficha, selecionar um aluno da própria turma e registrar uma graduação superior, por faixa ou grau, com data fictícia após confirmar.", "Reabrir o histórico e conferir a graduação atual, os graus visuais e a ordem cronológica.", "Verificar que graduação igual ou inferior não é aceita e que a vermelha com 10 graus não oferece promoção.", "Repetir com ?erro-simulado=professor-graduacao e conferir o alerta e a nova tentativa."],
    esperado: "A graduação fica associada ao aluno e Professor corretos, atualiza faixa e grau e aparece no histórico. Na simulação, os dados permanecem neste navegador após recarregar."
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
    passos: ["Percorrer todas as telas principais nas larguras de referência de celular, tablet e notebook: 320 px, 360 px, 390 px, 430 px, 768 px, 1024 px, 1280 px, 1440 px e 1920 px.", "Verificar iPhone 13 (390 × 844 CSS px) e iPhone 13 Pro Max (428 × 926 CSS px), incluindo áreas seguras e navegação inferior.", "Testar também 1 px abaixo, no breakpoint e 1 px acima de cada breakpoint responsivo definido.", "Repetir em retrato e paisagem e com altura curta de viewport; redimensionar continuamente dentro da faixa suportada.", "Conferir sidebar à esquerda e painel de usuário oculto à direita na web; no mobile, navegação inferior e acesso ao menu, sem perder funcionalidades.", "Abrir o painel do usuário pelo cabeçalho web e pelo atalho Perfil mobile; navegar a uma opção e fechar por botão, fundo e tecla Esc.", "Em notebook e dois navegadores, usar a roda do mouse em todas as telas, login, cada papel, sidebar, painel e modais com conteúdo rolável; fechar os modais e repetir na página."],
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
    id: "F1-PRIV-03",
    area: "Privacidade e LGPD",
    titulo: "Exclusão simulada preserva registros compartilhados sem dados pessoais",
    perfil: "Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "Decisão do usuário para a simulação: exclusão persistente no navegador e identificação Conta excluída",
    precondicoes: "Há contas fictícias e, quando aplicável, pagamentos, vínculos e graduações compartilhados.",
    passos: ["Para cada tipo de conta, abrir a área de risco e verificar aviso, descrição e confirmação digitada EXCLUIR.", "Acionar a exclusão, tentar toque duplo e verificar Excluindo..., ✓ Concluído e retorno à entrada.", "Recarregar e conferir que a conta excluída, seus dados pessoais, mensagens e conversas não retornam, inclusive por convite já usado.", "Entrar na conta da outra parte e verificar pagamentos, vínculos e graduações preservados com Conta excluída, inclusive após recarregar.", "Repetir com erro simulado e verificar Tentar de novo, alerta próximo ao botão e preservação dos dados.", "Simular falha de armazenamento durante a exclusão e verificar que o erro é informado sem indicar sucesso.", "Conferir área de risco e confirmação nos temas claro e escuro, sem corte ou sobreposição."],
    esperado: "A exclusão simulada não acontece sem a confirmação; em sucesso, os dados pessoais deixam de estar disponíveis, os registros compartilhados permanecem anonimizados após recarregar e o usuário retorna à entrada. Em erro, nenhum dado é apagado."
  },
  {
    id: "F1-PRIV-04",
    area: "Privacidade e LGPD",
    titulo: "",
    perfil: "Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "",
    precondicoes: "",
    passos: [],
    esperado: ""
  },
  {
    id: "F1-COM-01",
    area: "Conversas",
    titulo: "",
    perfil: "Aluno, Instrutor e Professor",
    regras: "",
    precondicoes: "",
    passos: [],
    esperado: ""
  },
  {
    id: "F1-ACAD-01",
    area: "Academia",
    titulo: "Adm cadastra academia e grade visível aos usuários",
    perfil: "Adm, Professor, Instrutor e Aluno",
    regras: "Somente Adm cadastra e edita; perfis autenticados consultam academias e grade; vários Professores por academia",
    precondicoes: "Contas fictícias dos quatro perfis, duas academias e Professores convidados para uma delas.",
    passos: ["Como Adm, cadastrar uma academia com nome e foto opcional.", "Convidar mais de um Professor para a mesma academia e confirmar a aceitação com contas fictícias.", "Como Adm, cadastrar horários em dias diferentes e associar cada linha ao Professor correspondente; remover um horário.", "Como Adm, Professor, Instrutor e Aluno autenticados, abrir Academia e conferir que nome, foto e grade são exibidos sem controles de edição para não-Adm.", "Conferir que a grade antiga de Mural e grade continua independente e que perfis não autenticados não acessam a listagem."],
    esperado: "O Adm administra nome, foto e grade; vários Professores ativos podem ser vinculados à mesma academia e associados a horários. Todos os perfis autenticados consultam as academias e a grade, sem poder alterá-las. Mural e grade permanece inalterado."
  },
  {
    id: "F1-AVATAR-01",
    area: "Fotos e avatar",
    titulo: "Consentimento, idade e fotos respeitam as permissões",
    perfil: "Adm, Professor, Instrutor, Aluno e aluno sem registro",
    regras: "Foto própria e de vinculados conforme papel e idade; menor ou idade não declarada usa avatar",
    precondicoes: "Contas e alunos fictícios.",
    passos: ["No primeiro acesso, declarar adulto, menor de idade ou idade não declarada, sem solicitar data de nascimento; para adulto, aceitar ou recusar o consentimento com texto provisório.", "Conferir que recusa mantém avatar e que menor ou idade não declarada não tem controle para enviar foto.", "Como Aluno adulto, enviar e substituir a foto própria; conferir leitura pelo próprio Aluno e pelo Professor vinculado, e bloqueio para Professor sem vínculo, outro Aluno, Instrutor e Adm.", "Como Instrutor, enviar a foto própria; conferir leitura pelo próprio Instrutor e pelo Professor vinculado, e bloqueio para outros Instrutores e perfis sem vínculo.", "Como Adm, enviar a foto própria e conferir que somente o próprio Adm consegue lê-la.", "Como Professor, enviar a foto própria e conferir leitura pelo próprio, pelo Adm e por Alunos/Instrutores vinculados; bloquear perfis sem vínculo.", "Conferir que menor ou idade não declarada permanece com avatar e que a foto da academia pode ser lida por todos os perfis autenticados."],
    esperado: "A declaração de idade não solicita data de nascimento. Aluno adulto e Instrutor têm foto visível apenas a si mesmos e ao Professor vinculado; Adm vê somente a própria foto; foto do Professor é visível ao próprio, ao Adm e a perfis vinculados; fotos de academia são visíveis a todos os perfis autenticados. Menores e idade não declarada usam somente avatar."
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
    id: "F1-PAG-12",
    area: "Pagamentos",
    titulo: "Comprovante é apagado após confirmação do Professor",
    perfil: "Professor",
    regras: "Retenção mínima de comprovante",
    precondicoes: "Há um comprovante fictício pendente com valor e data lidos.",
    passos: ["Confirmar o recebimento.", "Consultar o histórico do pagamento."],
    esperado: "O arquivo/foto do comprovante deixa de existir após a confirmação; somente valor e data de recebimento permanecem no histórico."
  },
  {
    id: "F1-PAG-13",
    area: "Pagamentos",
    titulo: "Professor lê o valor do comprovante sem confirmar automaticamente",
    perfil: "Professor",
    regras: "Conferência local de comprovante",
    precondicoes: "Há comprovantes fictícios pendentes em JPG, PNG, PDF com texto e PDF digitalizado; cobranças com saldo total e parcial conhecido.",
    passos: ["Acionar “Ler valor” em cada formato e conferir o estado de carregamento e o bloqueio contra toque duplo.", "Comparar valores lidos iguais, parciais, divergentes, ambíguos e de baixa confiança com o aviso e o saldo.", "Recarregar a tela e conferir que o resultado não foi salvo; verificar que o Professor precisa conferir o comprovante e o próprio banco antes de confirmar ou rejeitar.", "Testar PDF corrompido e com mais de 10 páginas."],
    esperado: "O valor é processado localmente, exibido só durante a revisão e comparado com o aviso e o saldo atual; falhas e leituras incertas são explicadas. Nenhum resultado altera o pagamento ou é persistido, não há envio a serviço externo e a confirmação continua manual."
  },
  {
    id: "F1-UX-07",
    area: "Ajuda e acessibilidade",
    titulo: "Tutoriais ficam no painel e abrem por tópico",
    perfil: "Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "Tutorial contextual e acessibilidade",
    precondicoes: "Há contas fictícias dos tipos suportados e tópicos de tutorial próprios para cada papel.",
    passos: ["Abrir o painel do usuário e conferir que os tópicos estão recolhidos.", "Expandir a lista e escolher tópicos diferentes.", "Fechar cada modal por botão e Escape; conferir o foco ao retornar à lista."],
    esperado: "Os tutoriais aparecem apenas no painel do usuário, ficam recolhidos até a escolha e cada tópico abre sozinho em modal acessível; não há abertura automática nem tutorial em Preferências."
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
    titulo: "Estados e mensagens de entrada e conversa",
    perfil: "Visitante e aluno",
    regras: "Ações com foco, processamento, bloqueio contra toque duplo e mensagens acessíveis de resultado.",
    precondicoes: "Protótipo local aberto na tela de entrada; usar apenas dados fictícios e repetir com teclado e leitor de tela.",
    passos: ["Acionar Entrar por e-mail e observar indicador e texto de processamento no botão, anúncio acessível e botões desabilitados durante a simulação.", "Tentar um segundo acionamento durante o processamento e conferir que não há nova operação.", "Ao concluir a simulação, verificar ✓ Concluído por 2 a 3 segundos no botão, sem caixa de sucesso, e depois o rótulo original; trocar de tela durante a conclusão e conferir o aviso global.", "Abrir index.html?erro-simulado=entrada e acionar Google e Entrar; conferir Tentar de novo e mensagem em role=alert perto de cada botão. A autenticação real é tratada no caso F1-AUTH-04.", "Na conversa do aluno, verificar os mesmos estados em Enviar e repetir com ?erro-simulado=aluno-mensagem."],
    esperado: "Cada ação informa processamento, conclusão ou erro sem depender apenas de cor; os estados são anunciados, o erro aparece perto do botão, toques duplicados são evitados e a entrada por e-mail e a conversa permanecem simuladas."
  },
  {
    id: "F1-FOTO-01",
    area: "Perfil e fotos",
    titulo: "Enquadrar foto antes de enviar",
    perfil: "Adm, Professor, Instrutor e Aluno adulto",
    regras: "Prévia local, ajuste de zoom e foco antes de aplicar; sem envio de foto não confirmada.",
    precondicoes: "Contas fictícias e arquivos de imagem de teste sem dados pessoais; não usar conta nem foto real.",
    passos: ["Escolher JPG e PNG nos fluxos de foto pessoal e de academia, onde disponíveis, e conferir que a prévia abre antes do envio.", "Ajustar zoom, arrastar a imagem, usar as setas por toque e teclado e confirmar o enquadramento.", "Repetir cancelando a prévia e conferir que nenhuma foto é enviada; selecionar novamente o mesmo arquivo.", "Testar tipo inválido, arquivo acima de 5 MiB e imagem não decodificável; conferir mensagens acessíveis e claras.", "Conferir foco, leitor de tela, tema claro/escuro e larguras de 360, 390, 430 e 768 px. Verificar que comprovantes não abrem o enquadrador."],
    esperado: "Só a imagem enquadrada e confirmada pode ser enviada; o recorte quadrado respeita o zoom e a região escolhida. Cancelamento e falhas não aplicam a foto, os comprovantes mantêm o arquivo original, o controle funciona por toque e teclado e não aparecem avisos genéricos de elegibilidade junto ao envio."
  }
];
