-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 40 · remoção do consentimento com a conta
-- UPDATE continua bloqueado; DELETE é permitido para a exclusão da conta.
begin;

drop trigger if exists consentimentos_bloquear_alteracao
  on public.consentimentos;

create trigger consentimentos_bloquear_alteracao
before update on public.consentimentos
for each row execute function public.bloquear_alteracao_consentimento();

commit;
