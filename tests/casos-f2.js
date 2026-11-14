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
    id: "F2-HELP-01",
    fase: "F2",
    area: "Ajuda e tutoriais",
    titulo: "Tutoriais por tópico ficam no painel do usuário",
    perfil: "Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "RN26 e tutorial contextual",
    precondicoes: "Cada tipo de conta possui tópicos de tutorial com ilustrações SVG inline e controles acessíveis.",
    passos: ["Abrir o painel do usuário em cada tipo de conta.", "Expandir os tópicos e selecionar um de cada vez.", "Fechar o modal por botão e Escape; conferir foco e conteúdo."],
    esperado: "Os tópicos correspondem às telas acessíveis pelo papel e aparecem somente no painel do usuário; cada escolha abre um único modal, mantém o foco e fecha com Escape."
  }
];
