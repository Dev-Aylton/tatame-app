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
    titulo: "Tutorial explica as telas próprias de cada tipo de conta",
    perfil: "Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro",
    regras: "RN26 e tutorial contextual",
    precondicoes: "Cada tipo de conta possui um tutorial com passos, ilustrações SVG inline e controles acessíveis.",
    passos: ["Acessar cada tipo de conta pela primeira vez.", "Avançar, voltar e pular os passos.", "Reabrir o tutorial pelo painel do usuário."],
    esperado: "Cada tutorial cobre as telas e funcionalidades de roleScreens daquele tipo de conta; o do Professor explica o papel e os limites do Instrutor. O modal funciona por toque e teclado, mantém foco, fecha com Escape e não corta conteúdo."
  }
];
