-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 07 · convites de Instrutor por link
-- Suposições não confirmadas:
-- - pgcrypto está disponível no schema extensions.
-- - Aplicar 20261108_06_idade_declarada_perfis.sql antes desta migration.
-- - O convidado autentica antes de validar/consumir o token; pode não ter perfil ou ser aluno adulto.
-- - Para conta sem perfil, a idade é declarada no aceite por p_idade_declarada.
-- HIPÓTESE: p_idade_declarada é declaração do convidado, não prova de idade.
-- HIPÓTESE: para conta sem perfil, validar o convite não aceita o convite; a idade é exigida no consumo.
-- HIPÓTESE: auth.users.email_confirmed_at é a coluna de confirmação de e-mail desta instância.
-- - Cada token é destinado a um Instrutor; o Professor gera um token distinto para cada pessoa.
-- - Consumir o convite cria ou atualiza o perfil para Instrutor e mantém ou cria o vínculo com o Professor que o gerou.
-- - A validação de nome existente também retorna nome_invalido para manter sua distinção.
-- - A role proprietária das funções SECURITY DEFINER pode escrever nas tabelas, sem RLS forçada.
begin;

create extension if not exists pgcrypto with schema extensions;

create table public.convites_instrutor (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  consumido_em timestamptz,
  revogado_em timestamptz,
  check (expira_em > criado_em),
  check (not (consumido_em is not null and revogado_em is not null))
);

create index convites_instrutor_professor_idx
  on public.convites_instrutor (professor_id, criado_em desc);
create index convites_instrutor_expiracao_idx
  on public.convites_instrutor (expira_em)
  where consumido_em is null and revogado_em is null;

alter table public.convites_instrutor enable row level security;
revoke all on table public.convites_instrutor from anon, authenticated;

create function public.gerar_convite_instrutor()
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_token text;
  v_hash text;
  v_tentativa integer;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null then
    return null;
  end if;

  for v_tentativa in 1..3 loop
    v_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
    v_hash := pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(v_token, 'UTF8'), 'sha256'),
      'hex'
    );
    insert into public.convites_instrutor (professor_id, token_hash, expira_em)
    values (v_uid, v_hash, now() + interval '3 days')
    on conflict (token_hash) do nothing;
    if found then
      return v_token;
    end if;
  end loop;

  return null;
end
$$;

create function public.listar_convites_instrutor()
returns table (
  convite_id uuid,
  criado_em timestamptz,
  expira_em timestamptz,
  consumido_em timestamptz,
  revogado_em timestamptz
)
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null then
    return;
  end if;

  return query
    select c.id, c.criado_em, c.expira_em, c.consumido_em, c.revogado_em
    from public.convites_instrutor c
    where c.professor_id = auth.uid()
    order by c.criado_em desc;
end
$$;

create function public.validar_convite_instrutor(p_token text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  v_papel_conta text;
  v_idade_conta text;
  v_perfil_existe boolean;
  v_professor_id uuid;
  v_expira_em timestamptz;
  v_consumido_em timestamptz;
  v_revogado_em timestamptz;
  v_papel_professor text;
  v_professor_ativo boolean;
  v_academia uuid;
  v_professor_vinculado uuid;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if p_token is null or char_length(p_token) <> 64 then
    return 'convite_invalido_ou_expirado';
  end if;

  select p.papel, p.idade_declarada
    into v_papel_conta, v_idade_conta
  from public.perfis p
  where p.id = v_uid;
  v_perfil_existe := found;

  if v_perfil_existe and v_papel_conta is distinct from 'aluno' then
    return 'papel_nao_permitido';
  end if;
  if v_perfil_existe and v_idade_conta is distinct from 'adulto' then
    return 'idade_nao_adulta';
  end if;

  v_hash := pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(p_token, 'UTF8'), 'sha256'),
    'hex'
  );

  select c.professor_id, c.expira_em, c.consumido_em, c.revogado_em
    into v_professor_id, v_expira_em, v_consumido_em, v_revogado_em
  from public.convites_instrutor c
  where c.token_hash = v_hash;

  if not found then
    return 'convite_invalido_ou_expirado';
  end if;
  if v_consumido_em is not null or v_revogado_em is not null then
    return 'convite_ja_usado_ou_revogado';
  end if;
  if v_expira_em <= now() then
    return 'convite_invalido_ou_expirado';
  end if;

  select p.papel, p.ativo, p.academia_id
    into v_papel_professor, v_professor_ativo, v_academia
  from public.perfis p
  where p.id = v_professor_id;

  if not found
     or v_papel_professor is distinct from 'professor'
     or v_professor_ativo is not true
     or v_academia is null then
    return 'convite_invalido_ou_expirado';
  end if;

  if v_perfil_existe then
    select v.professor_id
      into v_professor_vinculado
    from public.vinculos v
    where v.aluno_id = v_uid;

    if found and v_professor_vinculado is distinct from v_professor_id then
      return 'vinculado_outro_professor';
    end if;
  end if;

  return 'ok';
end
$$;

create function public.consumir_convite_instrutor(
  p_token text,
  p_nome text,
  p_idade_declarada text
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := btrim(coalesce(p_nome, ''));
  v_email_confirmado_em timestamptz;
  v_hash text;
  v_convite_id uuid;
  v_professor uuid;
  v_academia uuid;
  v_expira_em timestamptz;
  v_consumido_em timestamptz;
  v_revogado_em timestamptz;
  v_papel_conta text;
  v_idade_conta text;
  v_papel_professor text;
  v_professor_ativo boolean;
  v_perfil_existe boolean;
  v_professor_vinculado uuid;
  v_vinculo_existe boolean := false;
  v_resultado_erro text;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select u.email_confirmed_at
    into v_email_confirmado_em
  from auth.users u
  where u.id = v_uid
  for update;

  if not found or v_email_confirmado_em is null then
    return 'email_nao_confirmado';
  end if;

  select p.papel, p.idade_declarada
    into v_papel_conta, v_idade_conta
  from public.perfis p
  where p.id = v_uid
  for update;
  v_perfil_existe := found;

  if v_perfil_existe and v_papel_conta is distinct from 'aluno' then
    return 'papel_nao_permitido';
  end if;
  if (v_perfil_existe and v_idade_conta is distinct from 'adulto')
     or p_idade_declarada is distinct from 'adulto' then
    return 'idade_nao_adulta';
  end if;
  if not v_perfil_existe and char_length(v_nome) not between 1 and 80 then
    return 'nome_invalido';
  end if;
  if p_token is null or char_length(p_token) <> 64 then
    return 'convite_invalido_ou_expirado';
  end if;

  v_hash := pg_catalog.encode(
    extensions.digest(pg_catalog.convert_to(p_token, 'UTF8'), 'sha256'),
    'hex'
  );

  select c.id, c.professor_id, c.expira_em, c.consumido_em, c.revogado_em
    into v_convite_id, v_professor, v_expira_em, v_consumido_em, v_revogado_em
  from public.convites_instrutor c
  where c.token_hash = v_hash
  for update;

  if not found then
    return 'convite_invalido_ou_expirado';
  end if;
  if v_consumido_em is not null or v_revogado_em is not null then
    return 'convite_ja_usado_ou_revogado';
  end if;
  if v_expira_em <= now() then
    return 'convite_invalido_ou_expirado';
  end if;

  select p.papel, p.ativo, p.academia_id
    into v_papel_professor, v_professor_ativo, v_academia
  from public.perfis p
  where p.id = v_professor;

  if not found
     or v_papel_professor is distinct from 'professor'
     or v_professor_ativo is not true
     or v_academia is null then
    return 'convite_invalido_ou_expirado';
  end if;

  if v_perfil_existe then
    select v.professor_id
      into v_professor_vinculado
    from public.vinculos v
    where v.aluno_id = v_uid
    for update;
    v_vinculo_existe := found;

    if v_vinculo_existe and v_professor_vinculado is distinct from v_professor then
      return 'vinculado_outro_professor';
    end if;
  end if;

  begin
    if v_perfil_existe then
      update public.perfis
      set papel = 'instrutor', academia_id = v_academia
      where id = v_uid
        and papel = 'aluno'
        and idade_declarada = 'adulto';
      if not found then
        v_resultado_erro := 'papel_nao_permitido';
        raise exception using errcode = 'P0001';
      end if;
    else
      insert into public.perfis (id, papel, nome, academia_id, idade_declarada)
      values (v_uid, 'instrutor', v_nome, v_academia, p_idade_declarada);
    end if;

    if not v_vinculo_existe then
      insert into public.vinculos (aluno_id, professor_id)
      values (v_uid, v_professor)
      on conflict (aluno_id) do nothing
      returning professor_id into v_professor_vinculado;

      if not found then
        select v.professor_id
          into v_professor_vinculado
        from public.vinculos v
        where v.aluno_id = v_uid
        for update;

        if v_professor_vinculado is distinct from v_professor then
          v_resultado_erro := 'vinculado_outro_professor';
          raise exception using errcode = 'P0001';
        end if;
      end if;
    end if;

    update public.convites_instrutor
    set consumido_em = now()
    where id = v_convite_id
      and expira_em > now()
      and consumido_em is null
      and revogado_em is null;

    if not found then
      if v_expira_em <= now() then
        v_resultado_erro := 'convite_invalido_ou_expirado';
      else
        v_resultado_erro := 'convite_ja_usado_ou_revogado';
      end if;
      raise exception using errcode = 'P0001';
    end if;
  exception
    when sqlstate 'P0001' then
      return v_resultado_erro;
    when unique_violation then
      return 'papel_nao_permitido';
  end;

  return 'ok';
end
$$;

create function public.revogar_convite_instrutor(p_convite_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null then
    return false;
  end if;

  update public.convites_instrutor
  set revogado_em = now()
  where id = p_convite_id
    and professor_id = auth.uid()
    and expira_em > now()
    and consumido_em is null
    and revogado_em is null;

  return found;
end
$$;

revoke all on function public.gerar_convite_instrutor() from public, anon, authenticated;
revoke all on function public.listar_convites_instrutor() from public, anon, authenticated;
revoke all on function public.validar_convite_instrutor(text) from public, anon, authenticated;
revoke all on function public.consumir_convite_instrutor(text, text, text) from public, anon, authenticated;
revoke all on function public.revogar_convite_instrutor(uuid) from public, anon, authenticated;
grant execute on function public.gerar_convite_instrutor() to authenticated;
grant execute on function public.listar_convites_instrutor() to authenticated;
grant execute on function public.validar_convite_instrutor(text) to authenticated;
grant execute on function public.consumir_convite_instrutor(text, text, text) to authenticated;
grant execute on function public.revogar_convite_instrutor(uuid) to authenticated;

commit;
