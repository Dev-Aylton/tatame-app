-- Rascunho. Não aplicar sem autorização.
create function public.consentimento_atual_aceito(p_versao text)
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
      and c.versao_termo = pg_catalog.btrim(coalesce(p_versao, ''))
  );
$$;

revoke all on function public.consentimento_atual_aceito(text)
  from public, anon, authenticated;
grant execute on function public.consentimento_atual_aceito(text)
  to authenticated;
