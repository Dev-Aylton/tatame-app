"use strict";

window.CASOS_ACEITE_F2 = [
  {
    id: "F2-INST-01",
    fase: "F2",
    area: "Planejamento de aulas",
    titulo: "Professor decide o conteúdo da aula delegada",
    perfil: "Professor principal",
    regras: "RN36–RN38 e novo requisito de instrutor",
    precondicoes: "Há histórico fictício dos temas ensinados, uma aula da turma única e um Instrutor autorizado.",
    passos: ["Abrir as sugestões de planejamento.", "Analisar as opções sugeridas.", "Escolher e delegar um plano ou marcar “Treino livre”."],
    esperado: "As sugestões seguem critérios explicáveis; só o Professor escolhe o conteúdo. O Instrutor recebe o plano ou a indicação “Treino livre” e não escolhe nem altera a aula.",
    revisao: true
  },
  {
    id: "F2-INST-02",
    fase: "F2",
    area: "Delegação de aula",
    titulo: "Aula delegada exibe plano ou treino livre sem feedback",
    perfil: "Professor e Instrutor",
    regras: "RN36–RN42 e decisões definitivas do Instrutor",
    precondicoes: "Há uma turma única, uma aula delegada e um Instrutor autorizado.",
    passos: ["Como Professor, delegar a aula e escolher plano ou treino livre.", "Como Instrutor, abrir a aula e registrar “Segui” ou “Não segui”."],
    esperado: "O Instrutor só vê a aula delegada e a lista da turma com nome e graduação atual; não escolhe conteúdo, não envia feedback e não vê pagamentos, notas privadas ou conversas de terceiros."
  },
  {
    id: "F2-PLAN-01",
    fase: "F2",
    area: "Plano semanal",
    titulo: "Professor remove treino antes de salvar o plano",
    perfil: "Professor",
    regras: "A remoção de itens só é aplicada ao salvar o plano",
    precondicoes: "Usar um plano de demonstração com mais de um treino.",
    passos: ["Abrir o plano semanal.", "Marcar um treino para remoção e salvar.", "Reabrir o plano e conferir os itens restantes."],
    esperado: "O treino marcado deixa de constar no plano após salvar; os demais itens permanecem e o estado de compartilhamento não muda."
  },
  {
    id: "F2-HELP-01",
    fase: "F2",
    area: "Ajuda e tutoriais",
    titulo: "Tutoriais por tópico ficam no painel do usuário",
    perfil: "Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "RN26 e tutorial contextual",
    precondicoes: "Cada tipo de conta possui tópicos de tutorial com ilustrações SVG inline e controles acessíveis.",
    passos: ["Abrir o painel do usuário em cada tipo de conta.", "Expandir os tópicos e selecionar um de cada vez.", "Fechar o modal por botão e Escape; conferir foco e conteúdo."],
    esperado: "Os tópicos correspondem às telas acessíveis pelo papel e aparecem somente no painel do usuário; cada escolha abre um único modal, mantém o foco e fecha com Escape."
  },
  {
    id: "F2-DIARIA-01",
    fase: "F2",
    area: "Pagamentos",
    titulo: "Diárias avulsas sem identificação de visitantes",
    perfil: "Professor",
    regras: "Autorização opcional e controle pessoal",
    precondicoes: "Usar somente dados fictícios e Professor ativo.",
    passos: ["No primeiro acesso, recusar a autorização opcional e continuar usando o app.", "No painel da conta, expandir a autorização, ler o texto e marcar a caixa para autorizar; registrar diárias em Dinheiro e Pix, inclusive sem cobranças abertas.", "Conferir valor, tipo, data e total; excluir uma diária e conferir o total.", "Verificar que não há campo de identificação de visitante e que os demais perfis não acessam as diárias."],
    esperado: "A autorização é opcional; os registros e o total pertencem ao Professor, sem referência ou identificação de visitante. A exclusão individual atualiza o total."
  },
  {
    id: "F2-DIARIA-02",
    fase: "F2",
    area: "Conta e privacidade",
    titulo: "Revogação e nova autorização para diárias",
    perfil: "Professor",
    regras: "Revogação exclui lançamentos; nova autorização não os recupera",
    precondicoes: "Usar somente dados fictícios, com autorização ativa e diárias registradas.",
    passos: ["No painel, expandir a autorização, desmarcar a caixa e cancelar a confirmação; verificar que continua marcada.", "Desmarcar novamente, confirmar e verificar que as diárias foram excluídas.", "Marcar a caixa para autorizar novamente e conferir que o histórico continua vazio.", "Comparar página e modal de privacidade; conferir painel, consentimento e pagamentos em 360, 390, 430 e 768 px nos temas claro e escuro."],
    esperado: "Cancelar preserva os lançamentos; confirmar exclui todos. A nova autorização não recupera registros excluídos. Política, modal e telas permanecem legíveis e acessíveis."
  }
];
