-- Migração 42: consentimento vigente obrigatório antes de liberar dados do app.
-- Aplicada pelo desenvolvedor; manter após a migração 41 na ordem do banco.
-- Exige consentimento vigente antes de liberar dados do app.
begin;

create or replace function public.usuario_pode_acessar_dados()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = (select auth.uid())
      and p.ativo is true
      and (
        p.papel = 'adm'
        or public.consentimento_atual_aceito('rascunho-1')
      )
  );
$$;

revoke all on function public.usuario_pode_acessar_dados()
  from public, anon, authenticated;
grant execute on function public.usuario_pode_acessar_dados()
  to authenticated;

create or replace function public.perfil_aluno_habilitado(p_perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.usuario_pode_acessar_dados())
    and exists (
      select 1
      from public.perfis p
      where p.id = p_perfil_id
        and p.ativo is true
        and (
          p.papel = 'aluno'
          or (
            p.papel = 'adm'
            and exists (
              select 1
              from public.acessos_aluno_adm acesso
              where acesso.perfil_id = p.id
            )
            and exists (
              select 1
              from public.vinculos v
              join public.perfis professor on professor.id = v.professor_id
              where v.aluno_id = p.id
                and professor.papel = 'professor'
                and professor.ativo is true
            )
          )
        )
        and (
          p.id = (select auth.uid())
          or (
            (select public.papel_atual()) = 'professor'
            and exists (
              select 1
              from public.vinculos v
              where v.aluno_id = p.id
                and v.professor_id = (select auth.uid())
            )
          )
        )
    );
$$;

create or replace function public.tem_acesso_aluno()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.perfil_aluno_habilitado((select auth.uid()));
$$;

create or replace function public.pode_editar_foto_perfil(p_perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.usuario_pode_acessar_dados())
    and p_perfil_id = (select auth.uid())
    and exists (
      select 1
      from public.perfis p
      where p.id = p_perfil_id
        and p.ativo is true
        and (
          p.papel in ('adm', 'professor', 'instrutor')
          or (p.papel = 'aluno' and p.idade_declarada = 'adulto')
        )
    );
$$;

create or replace function public.pode_ler_foto_perfil(p_perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.usuario_pode_acessar_dados())
    and exists (
      select 1
      from public.perfis alvo
      where alvo.id = p_perfil_id
        and (alvo.papel <> 'aluno' or alvo.idade_declarada = 'adulto')
        and exists (
          select 1
          from public.perfis_fotos pf
          where pf.perfil_id = p_perfil_id
        )
        and (
          alvo.id = (select auth.uid())
          or (
            alvo.papel in ('aluno', 'instrutor')
            and (select public.papel_atual()) = 'professor'
            and exists (
              select 1
              from public.vinculos v
              where v.professor_id = (select auth.uid())
                and v.aluno_id = alvo.id
            )
          )
        )
    );
$$;

create or replace function public.papel_atual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.papel
  from public.perfis p
  where p.id = (select auth.uid())
    and p.ativo is true
    and (
      p.papel = 'adm'
      or public.consentimento_atual_aceito('rascunho-1')
    );
$$;

create or replace function public.academia_atual()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.academia_id
  from public.perfis p
  where p.id = (select auth.uid())
    and p.ativo is true
    and (
      p.papel = 'adm'
      or public.consentimento_atual_aceito('rascunho-1')
    );
$$;

revoke all on function public.papel_atual()
  from public, anon, authenticated;
revoke all on function public.academia_atual()
  from public, anon, authenticated;
grant execute on function public.papel_atual() to authenticated;
grant execute on function public.academia_atual() to authenticated;

do $$
declare
  v_tabela text;
begin
  for v_tabela in
    select c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity is true
      and c.relname <> 'consentimentos'
  loop
    execute pg_catalog.format(
      'drop policy if exists %I on public.%I',
      'tatame_consent_gate',
      v_tabela
    );
    execute pg_catalog.format(
      'create policy %I on public.%I as restrictive for all to authenticated using ((select public.usuario_pode_acessar_dados())) with check ((select public.usuario_pode_acessar_dados()))',
      'tatame_consent_gate',
      v_tabela
    );
  end loop;
end
$$;

-- O Supabase ja habilita RLS em storage.objects; nao alterar a tabela gerenciada.
drop policy if exists tatame_consent_gate on storage.objects;
create policy tatame_consent_gate
  on storage.objects as restrictive for all to authenticated
  using ((select public.usuario_pode_acessar_dados()))
  with check ((select public.usuario_pode_acessar_dados()));

create or replace function public.definir_idade_adulta_por_papel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.papel in ('adm', 'professor') then
    new.idade_declarada := 'adulto';
  end if;
  return new;
end
$$;

revoke all on function public.definir_idade_adulta_por_papel()
  from public, anon, authenticated;
drop trigger if exists perfis_idade_adulta_por_papel on public.perfis;
create trigger perfis_idade_adulta_por_papel
before insert or update of papel on public.perfis
for each row execute function public.definir_idade_adulta_por_papel();

update public.perfis
set idade_declarada = 'adulto'
where papel in ('adm', 'professor')
  and idade_declarada is distinct from 'adulto';

drop function if exists public.criar_perfil_aluno(text, text, text);
create function public.criar_perfil_aluno(
  p_nome text,
  p_idade_declarada text,
  p_versao text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := pg_catalog.btrim(coalesce(p_nome, ''));
  v_entrada text := pg_catalog.btrim(coalesce(p_versao, ''));
  v_versao text;
  v_idade text := coalesce(p_idade_declarada, 'nao_declarada');
  v_email_confirmado_em timestamptz;
  v_email text;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if p_nome is null or pg_catalog.char_length(v_nome) not between 1 and 80 then
    return 'nome_invalido';
  end if;

  if v_idade not in ('adulto', 'menor', 'nao_declarada') then
    return 'idade_invalida';
  end if;

  if p_versao is null
     or pg_catalog.char_length(v_entrada) not between 1 and 40
     or v_entrada not in ('rascunho-1', 'final-1') then
    return 'versao_invalida';
  end if;
  v_versao := case v_entrada when 'rascunho-1' then 'final-1' else v_entrada end;

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
    select 1
    from public.professores_convidados c
    where c.email = v_email and c.status = 'convidado'
  ) then
    return 'email_convidado_professor';
  end if;

  insert into public.perfis (id, papel, nome, idade_declarada)
  values (v_uid, 'aluno', v_nome, v_idade);

  insert into public.consentimentos (perfil_id, versao_termo)
  values (v_uid, v_versao)
  on conflict (perfil_id, versao_termo) do nothing;

  return 'ok';
end
$$;

revoke all on function public.criar_perfil_aluno(text, text, text)
  from public, anon, authenticated;
grant execute on function public.criar_perfil_aluno(text, text, text)
  to authenticated;

create or replace function public.ativar_professor()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select false;
$$;

revoke all on function public.ativar_professor()
  from public, anon, authenticated;

create function public.ativar_professor_com_consentimento(p_versao text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_entrada text := pg_catalog.btrim(coalesce(p_versao, ''));
  v_versao text;
  v_academia uuid;
  v_academia_bloqueada uuid;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if p_versao is null
     or pg_catalog.char_length(v_entrada) not between 1 and 40
     or v_entrada not in ('rascunho-1', 'final-1') then
    return 'versao_invalida';
  end if;
  v_versao := case v_entrada when 'rascunho-1' then 'final-1' else v_entrada end;

  select pg_catalog.lower(pg_catalog.btrim(u.email))
    into v_email
  from auth.users u
  where u.id = v_uid
    and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
    );

  if v_email is null then
    return 'email_nao_confirmado';
  end if;

  if exists (select 1 from public.perfis p where p.id = v_uid) then
    return 'perfil_ja_existe';
  end if;

  select c.academia_id into v_academia
  from public.professores_convidados c
  where c.email = v_email and c.status = 'convidado'
  for update;

  if not found then
    return 'convite_inexistente';
  end if;

  select a.id into v_academia_bloqueada
  from public.academias a
  where a.id = v_academia
  for update;

  if not found then
    return 'convite_inexistente';
  end if;

  insert into public.perfis (id, papel, academia_id, ativo)
  values (v_uid, 'professor', v_academia, true);

  insert into public.consentimentos (perfil_id, versao_termo)
  values (v_uid, v_versao)
  on conflict (perfil_id, versao_termo) do nothing;

  update public.professores_convidados
  set status = 'ativo', perfil_id = v_uid
  where email = v_email and status = 'convidado';

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'convite_inexistente';
  end if;

  return 'ok';
end
$$;

revoke all on function public.ativar_professor_com_consentimento(text)
  from public, anon, authenticated;
grant execute on function public.ativar_professor_com_consentimento(text)
  to authenticated;

revoke all on function public.consumir_convite_instrutor(text, text, text)
  from public, anon, authenticated;
drop function public.consumir_convite_instrutor(text, text, text);

create function public.consumir_convite_instrutor(
  p_token text,
  p_nome text,
  p_idade_declarada text,
  p_versao text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := pg_catalog.btrim(coalesce(p_nome, ''));
  v_entrada text := pg_catalog.btrim(coalesce(p_versao, ''));
  v_versao text;
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
  v_professor_instrutor uuid;
  v_instrutor_existe boolean := false;
  v_resultado_erro text;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if p_versao is null
     or pg_catalog.char_length(v_entrada) not between 1 and 40
     or v_entrada not in ('rascunho-1', 'final-1') then
    return 'versao_invalida';
  end if;
  v_versao := case v_entrada when 'rascunho-1' then 'final-1' else v_entrada end;

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

  if v_perfil_existe and v_papel_conta not in ('aluno', 'instrutor') then
    return 'papel_nao_permitido';
  end if;
  if (v_perfil_existe and v_idade_conta is distinct from 'adulto')
     or p_idade_declarada is distinct from 'adulto' then
    return 'idade_nao_adulta';
  end if;
  if v_perfil_existe
     and not public.consentimento_atual_aceito('rascunho-1') then
    return 'consentimento_pendente';
  end if;
  if not v_perfil_existe and pg_catalog.char_length(v_nome) not between 1 and 80 then
    return 'nome_invalido';
  end if;
  if p_token is null or pg_catalog.char_length(p_token) <> 64 then
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
  if v_expira_em <= pg_catalog.now() then
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
    select ip.professor_id
      into v_professor_instrutor
    from public.instrutores_professor ip
    where ip.instrutor_id = v_uid
    for update;
    v_instrutor_existe := found;

    if v_instrutor_existe and v_professor_instrutor is distinct from v_professor then
      return 'ja_e_instrutor_de_outro_professor';
    end if;
  end if;

  begin
    if not v_perfil_existe then
      insert into public.perfis (id, papel, nome, academia_id, idade_declarada)
      values (v_uid, 'instrutor', v_nome, v_academia, 'adulto');

      insert into public.consentimentos (perfil_id, versao_termo)
      values (v_uid, v_versao)
      on conflict (perfil_id, versao_termo) do nothing;
    end if;

    if not v_instrutor_existe then
      insert into public.instrutores_professor (instrutor_id, professor_id)
      values (v_uid, v_professor)
      on conflict (instrutor_id) do nothing
      returning professor_id into v_professor_instrutor;

      if not found then
        select ip.professor_id
          into v_professor_instrutor
        from public.instrutores_professor ip
        where ip.instrutor_id = v_uid
        for update;

        if v_professor_instrutor is distinct from v_professor then
          v_resultado_erro := 'ja_e_instrutor_de_outro_professor';
          raise exception using errcode = 'P0001';
        end if;
      end if;
    end if;

    update public.convites_instrutor
    set consumido_em = pg_catalog.now()
    where id = v_convite_id
      and expira_em > pg_catalog.now()
      and consumido_em is null
      and revogado_em is null;

    if not found then
      if v_expira_em <= pg_catalog.now() then
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

revoke all on function public.consumir_convite_instrutor(text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.consumir_convite_instrutor(text, text, text, text)
  to authenticated;

create or replace function public.atualizar_estado_notificacao_usuario(
  p_notificacao_id uuid,
  p_acao text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tipo text;
  v_mensagem_id uuid;
  v_conversa_id uuid;
  v_leituras_atualizadas integer;
  v_atualizadas integer := 0;
begin
  if v_uid is null
     or not public.usuario_pode_acessar_dados()
     or p_notificacao_id is null
     or p_acao is null
     or p_acao not in ('lida', 'dispensada') then
    return false;
  end if;

  select estado.tipo, estado.mensagem_id
    into v_tipo, v_mensagem_id
  from public.notificacoes_usuario_estado estado
  where estado.id = p_notificacao_id
    and estado.usuario_id = v_uid;
  if not found then
    return false;
  end if;

  if p_acao = 'lida' and v_tipo = 'mensagem' then
    select mensagem.conversa_id into v_conversa_id
    from public.mensagens_professor mensagem
    where mensagem.id = v_mensagem_id;
    if v_conversa_id is not null then
      v_leituras_atualizadas := public.marcar_conversas_lidas(
        pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object(
            'conversa_id', v_conversa_id,
            'mensagem_id', v_mensagem_id
          )
        )
      );
      if v_leituras_atualizadas < 0 then
        return false;
      end if;
    end if;
  end if;

  update public.notificacoes_usuario_estado
  set lida_em = case when p_acao = 'lida'
        then coalesce(lida_em, pg_catalog.now()) else lida_em end,
      dispensada_em = case when p_acao = 'dispensada'
        then coalesce(dispensada_em, pg_catalog.now()) else dispensada_em end
  where id = p_notificacao_id
    and usuario_id = v_uid;

  get diagnostics v_atualizadas = row_count;
  return v_atualizadas = 1;
end
$$;

commit;
