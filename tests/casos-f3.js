"use strict";

window.CASOS_ACEITE_F3 = [
  {
    id: "F3-REL-01",
    fase: "F3",
    area: "Segurança e publicação",
    titulo: "Suspeita de dado sensível bloqueia o Git push",
    perfil: "Responsável pela publicação",
    regras: "Princípio de segurança confirmado pelo usuário e autorização explícita de publicação",
    precondicoes: "A revisão local do conteúdo a publicar sinalizou possível credencial, dado pessoal ou informação sensível.",
    passos: ["Interromper a publicação antes do push.", "Não enviar o conteúdo sinalizado a serviços externos.", "Informar o motivo e solicitar orientação explícita do usuário."],
    esperado: "Nenhum push é realizado enquanto houver suspeita não resolvida; a publicação só pode ser retomada após orientação e nova revisão segura."
  }
];
