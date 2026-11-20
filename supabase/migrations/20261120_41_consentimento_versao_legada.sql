-- Migração 41: compatibilidade entre as versões legadas do termo.
-- Aplicada pelo desenvolvedor; manter antes da migração 42 na ordem do banco.
-- rascunho-1 e final-1 são aliases definidos em 20261111_28_versao_termo.sql.
begin;

create or replace function public.consentimento_atual_aceito(p_versao text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.consentimentos c
    where c.perfil_id = (select auth.uid())
      and (
        c.versao_termo = pg_catalog.btrim(coalesce(p_versao, ''))
        or (
          pg_catalog.btrim(coalesce(p_versao, '')) in ('rascunho-1', 'final-1')
          and c.versao_termo in ('rascunho-1', 'final-1')
        )
      )
  );
$$;

revoke all on function public.consentimento_atual_aceito(text)
  from public, anon, authenticated;
grant execute on function public.consentimento_atual_aceito(text)
  to authenticated;

commit;
