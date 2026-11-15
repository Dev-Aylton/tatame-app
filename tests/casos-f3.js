"use strict";

window.CASOS_ACEITE_F3 = [
  {
    id: "F3-CTA-01",
    fase: "F3",
    area: "Conta e privacidade",
    titulo: "Exclusão de conta por aluno e instrutor",
    perfil: "Aluno ou Instrutor",
    regras: "Apenas perfis aluno e instrutor podem solicitar exclusão; Professor e Adm não podem.",
    precondicoes: "Usar o preview local com dados fictícios.",
    passos: ["Abrir o painel do usuário e expandir a Zona de perigo.", "Confirmar que aluno e instrutor veem a ação.", "Repetir com Professor e Adm e conferir que não veem a ação."],
    esperado: "A exclusão só fica disponível para aluno e instrutor; as demais contas recebem uma explicação adequada ao papel."
  },
  {
    id: "F3-CTA-02",
    fase: "F3",
    area: "Conta e privacidade",
    titulo: "Confirmação explícita antes da exclusão",
    perfil: "Aluno ou Instrutor",
    regras: "A exclusão é irreversível e exige confirmação digitada.",
    precondicoes: "Usar o preview local com perfil fictício sem registros compartilhados.",
    passos: ["Abrir a confirmação de exclusão.", "Conferir que o envio fica desabilitado antes de digitar EXCLUIR.", "Digitar EXCLUIR e confirmar."],
    esperado: "O botão apresenta estado de carregamento e sucesso; a sessão local é encerrada e nenhuma conta real é afetada."
  },
  {
    id: "F3-CTA-03",
    fase: "F3",
    area: "Conta e privacidade",
    titulo: "Bloqueio para preservar registros compartilhados",
    perfil: "Aluno ou Instrutor",
    regras: "Registros compartilhados são preservados; vínculos impedem a exclusão.",
    precondicoes: "Usar o preview local com perfil fictício vinculado.",
    passos: ["Abrir a confirmação de exclusão.", "Digitar EXCLUIR e confirmar."],
    esperado: "A solicitação é bloqueada com explicação acessível; a conta e a sessão permanecem ativas."
  },
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
