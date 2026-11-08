-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 12 · criação de perfil de aluno e consentimento
begin;

drop function if exists public.criar_perfil_aluno(text);

create function public.criar_perfil_aluno(
  p_nome text,
  p_idade_declarada text,
  p_versao text
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := pg_catalog.btrim(coalesce(p_nome, ''));
  v_versao text := pg_catalog.btrim(coalesce(p_versao, ''));
  v_email_confirmado_em timestamptz;
  v_email text;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if p_nome is null or pg_catalog.char_length(v_nome) not between 1 and 80 then
    return 'nome_invalido';
  end if;

  if p_idade_declarada is null
     or p_idade_declarada not in ('adulto', 'menor') then
    return 'idade_invalida';
  end if;

  if p_versao is null
     or pg_catalog.char_length(v_versao) not between 1 and 40 then
    return 'versao_invalida';
  end if;

  if exists (
    select 1 from public.perfis p where p.id = v_uid
  ) then
    return 'perfil_ja_existe';
  end if;

  select u.email_confirmed_at
    into v_email_confirmado_em
  from auth.users u
  where u.id = v_uid
  for update;

  if not found or v_email_confirmado_em is null then
    return 'email_nao_confirmado';
  end if;

  select pg_catalog.lower(pg_catalog.btrim(u.email))
    into v_email
  from auth.users u
  where u.id = v_uid;

  if v_email is not null and exists (
    select 1 from public.professores_convidados c
    where c.email = v_email and c.status = 'convidado'
  ) then
    return 'email_convidado_professor';
  end if;

  insert into public.perfis (id, papel, nome, idade_declarada)
  values (v_uid, 'aluno', v_nome, p_idade_declarada);

  insert into public.consentimentos (perfil_id, versao_termo)
  values (v_uid, v_versao)
  on conflict (perfil_id, versao_termo) do nothing;

  return 'ok';
end
$$;

revoke all on function public.criar_perfil_aluno(text, text, text) from public, anon, authenticated;
grant execute on function public.criar_perfil_aluno(text, text, text) to authenticated;

commit;
