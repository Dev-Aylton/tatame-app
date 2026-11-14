-- NÃO TESTADO POR EXECUÇÃO
-- Rascunho. Revisar e autorizar antes de aplicar.
-- Versão proposta do termo: final-1.
create or replace function public.registrar_consentimento(p_versao text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_entrada text := pg_catalog.btrim(coalesce(p_versao, ''));
  v_versao text;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if not exists (
    select 1 from public.perfis p where p.id = v_uid
  ) then
    return 'perfil_inexistente';
  end if;

  if p_versao is null
     or pg_catalog.char_length(v_entrada) not between 1 and 40 then
    return 'versao_invalida';
  end if;

  v_versao := case v_entrada
    when 'rascunho-1' then 'final-1'
    else v_entrada
  end;

  insert into public.consentimentos (perfil_id, versao_termo)
  values (v_uid, v_versao)
  on conflict (perfil_id, versao_termo) do nothing;

  return 'ok';
end
$$;

revoke all on function public.registrar_consentimento(text)
  from public, anon, authenticated;
grant execute on function public.registrar_consentimento(text)
  to authenticated;

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
      and c.versao_termo = case
        pg_catalog.btrim(coalesce(p_versao, ''))
        when 'rascunho-1' then 'final-1'
        else pg_catalog.btrim(coalesce(p_versao, ''))
      end
  );
$$;

revoke all on function public.consentimento_atual_aceito(text)
  from public, anon, authenticated;
grant execute on function public.consentimento_atual_aceito(text)
  to authenticated;
