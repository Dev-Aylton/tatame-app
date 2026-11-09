begin;

create table public.instrutores_professor (
  instrutor_id uuid primary key references public.perfis (id) on delete cascade,
  professor_id uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.instrutores_professor enable row level security;
revoke all on table public.instrutores_professor from public, anon, authenticated;
grant select on table public.instrutores_professor to authenticated;

create policy instrutores_professor_select_proprio
  on public.instrutores_professor for select to authenticated
  using (instrutor_id = (select auth.uid()));

create policy instrutores_professor_select_professor
  on public.instrutores_professor for select to authenticated
  using (
    professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
  );

insert into public.instrutores_professor (instrutor_id, professor_id)
select v.aluno_id, v.professor_id
from public.vinculos v
join public.perfis p on p.id = v.aluno_id
where p.papel = 'instrutor'
on conflict (instrutor_id) do nothing;

create or replace function public.validar_convite_instrutor(p_token text)
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
  v_professor_instrutor uuid;
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

  if v_perfil_existe and v_papel_conta not in ('aluno', 'instrutor') then
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
    select ip.professor_id
      into v_professor_instrutor
    from public.instrutores_professor ip
    where ip.instrutor_id = v_uid;

    if found and v_professor_instrutor is distinct from v_professor_id then
      return 'ja_e_instrutor_de_outro_professor';
    end if;
  end if;

  return 'ok';
end
$$;

revoke all on function public.validar_convite_instrutor(text)
  from public, anon, authenticated;
grant execute on function public.validar_convite_instrutor(text)
  to authenticated;

create or replace function public.consumir_convite_instrutor(
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
  v_professor_instrutor uuid;
  v_instrutor_existe boolean := false;
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

  if v_perfil_existe and v_papel_conta not in ('aluno', 'instrutor') then
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
      values (v_uid, 'instrutor', v_nome, v_academia, p_idade_declarada);
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

revoke all on function public.consumir_convite_instrutor(text, text, text)
  from public, anon, authenticated;
grant execute on function public.consumir_convite_instrutor(text, text, text)
  to authenticated;

drop function public.listar_alunos_do_instrutor();

create function public.listar_alunos_do_instrutor()
returns table (aluno_id uuid, nome text, faixa text, grau integer)
language sql
stable
security definer
set search_path = ''
as $$
  select aluno_vinculo.aluno_id,
         coalesce(aluno.nome, 'Aluno sem nome')::text,
         graduacao_atual.faixa,
         graduacao_atual.grau
  from public.instrutores_professor as instrutor
  join public.vinculos as aluno_vinculo
    on aluno_vinculo.professor_id = instrutor.professor_id
  join public.perfis as aluno
    on aluno.id = aluno_vinculo.aluno_id
  left join lateral (
    select g.faixa, g.grau
    from public.graduacoes as g
    where g.aluno_id = aluno.id
    order by g.data_graduacao desc, g.criado_em desc
    limit 1
  ) as graduacao_atual on true
  where instrutor.instrutor_id = (select auth.uid())
    and aluno.papel = 'aluno'
    and aluno.ativo is true
  order by coalesce(aluno.nome, 'Aluno sem nome');
$$;

revoke all on function public.listar_alunos_do_instrutor()
  from public, anon, authenticated;
grant execute on function public.listar_alunos_do_instrutor()
  to authenticated;

create function public.listar_alunos_para_adm()
returns table (aluno_id uuid, nome text, faixa text, grau integer)
language sql
stable
security definer
set search_path = ''
as $$
  select aluno.id,
         coalesce(aluno.nome, 'Aluno sem nome')::text,
         graduacao_atual.faixa,
         graduacao_atual.grau
  from public.perfis as aluno
  left join lateral (
    select g.faixa, g.grau
    from public.graduacoes as g
    where g.aluno_id = aluno.id
    order by g.data_graduacao desc, g.criado_em desc
    limit 1
  ) as graduacao_atual on true
  where (select public.papel_atual()) = 'adm'
    and aluno.papel = 'aluno'
    and aluno.ativo is true
  order by coalesce(aluno.nome, 'Aluno sem nome');
$$;

revoke all on function public.listar_alunos_para_adm()
  from public, anon, authenticated;
grant execute on function public.listar_alunos_para_adm()
  to authenticated;

commit;
