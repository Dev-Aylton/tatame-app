-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 09 · troca e ativação exclusiva de Professor por academia
-- A criação do índice falha explicitamente se já houver mais de um Professor
-- ativo na mesma academia. Corrigir os dados antes de aplicar; esta migration
-- não escolhe nem desativa perfis automaticamente.
-- Para uma academia que já tenha ou tenha tido Professor, ativar_professor()
-- registra o perfil aceito como inativo até a transferência feita pelo Adm.
-- Sem Professor ativo, a origem é o Professor inativo do registro de desativação
-- mais recente no log, se o perfil ainda pertencer à academia.
begin;

do $$
begin
  if exists (
    select 1
    from public.perfis p
    where p.papel = 'professor'
      and p.ativo is true
      and p.academia_id is not null
    group by p.academia_id
    having count(*) > 1
  ) then
    raise exception
      'Há mais de um Professor ativo em uma academia; resolva os dados antes de aplicar esta migration.';
  end if;
end
$$;

create unique index perfis_um_professor_ativo_por_academia_idx
  on public.perfis (academia_id)
  where papel = 'professor' and ativo is true and academia_id is not null;

create table public.academia_professor_log (
  academia_id uuid not null
    references public.academias (id) on delete restrict,
  executado_por uuid not null,
  professor_id uuid not null,
  acao text not null
    check (acao in ('trocar_professor_academia', 'desativar_professor', 'reativar_professor')),
  criado_em timestamptz not null default pg_catalog.now()
);

alter table public.academia_professor_log enable row level security;
revoke all on table public.academia_professor_log from public, anon, authenticated;

create or replace function public.ativar_professor()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_academia uuid;
  v_academia_bloqueada uuid;
  v_ja_teve_professor boolean;
begin
  if v_uid is null then
    return false;
  end if;

  select lower(btrim(u.email)) into v_email
  from auth.users u
  where u.id = v_uid
    and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
    );

  if v_email is null then
    return false;
  end if;

  if exists (select 1 from public.perfis p where p.id = v_uid) then
    return false;
  end if;

  select c.academia_id into v_academia
  from public.professores_convidados c
  where c.email = v_email and c.status = 'convidado'
  for update;

  if not found then
    return false;
  end if;

  select a.id into v_academia_bloqueada
  from public.academias a
  where a.id = v_academia
  for update;

  if not found then
    return false;
  end if;

  select exists (
    select 1 from public.perfis p
    where p.academia_id = v_academia
      and p.papel = 'professor'
  ) into v_ja_teve_professor;

  insert into public.perfis (id, papel, academia_id, ativo)
  values (v_uid, 'professor', v_academia, not v_ja_teve_professor);

  update public.professores_convidados
  set status = 'ativo', perfil_id = v_uid
  where email = v_email;

  return true;
end
$$;

revoke all on function public.ativar_professor() from public, anon, authenticated;
grant execute on function public.ativar_professor() to authenticated;

create function public.trocar_professor_academia(
  p_academia uuid,
  p_novo_professor uuid
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text;
  v_ativo boolean;
  v_professor_atual uuid;
  v_professor_candidato uuid;
  v_papel_atual text;
  v_ativo_atual boolean;
  v_academia_atual uuid;
  v_papel_novo text;
  v_ativo_novo boolean;
  v_novo_encontrado boolean;
  v_academia_nova uuid;
  v_turma_professor uuid;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select p.papel, p.ativo into v_papel, v_ativo
  from public.perfis p
  where p.id = v_uid;

  if v_papel is distinct from 'adm' or v_ativo is not true then
    return 'sem_permissao';
  end if;

  if p_academia is null then
    return 'academia_nao_encontrada';
  end if;

  perform 1
  from public.academias a
  where a.id = p_academia
  for update;

  if not found then
    return 'academia_nao_encontrada';
  end if;

  if p_novo_professor is null then
    return 'professor_invalido';
  end if;

  select p.id into v_professor_atual
  from public.perfis p
  where p.academia_id = p_academia
    and p.papel = 'professor'
    and p.ativo is true
  for update;

  if not found then
    select l.professor_id into v_professor_candidato
    from public.academia_professor_log l
    where l.acao = 'desativar_professor'
      and l.academia_id = p_academia
      and l.professor_id <> p_novo_professor
      and exists (
        select 1 from public.perfis perfil
        where perfil.id = l.professor_id
          and perfil.papel = 'professor'
          and perfil.ativo is false
          and perfil.academia_id = p_academia
      )
    order by l.criado_em desc
    limit 1;

    if not found then
      return 'sem_professor_atual';
    end if;

    select p.id, p.papel, p.ativo, p.academia_id
      into v_professor_atual, v_papel_atual, v_ativo_atual, v_academia_atual
    from public.perfis p
    where p.id = v_professor_candidato
    for update;

    if not found
       or v_papel_atual is distinct from 'professor'
       or v_ativo_atual is not false
       or v_academia_atual is distinct from p_academia then
      return 'sem_professor_atual';
    end if;
  end if;

  select p.papel, p.ativo, p.academia_id
    into v_papel_novo, v_ativo_novo, v_academia_nova
  from public.perfis p
  where p.id = p_novo_professor
  for update;
  v_novo_encontrado := found;

  if v_professor_atual is not null then
    select t.professor_id into v_turma_professor
    from public.turmas t
    where t.professor_id = v_professor_atual
    for update;
  end if;

  if v_professor_atual is not null
     and p_novo_professor = v_professor_atual then
    return 'mesmo_professor';
  end if;

  if not v_novo_encontrado
     or v_papel_novo is distinct from 'professor'
     or v_ativo_novo is not false
     or v_academia_nova is distinct from p_academia
     or not exists (
       select 1 from public.professores_convidados c
       where c.perfil_id = p_novo_professor
         and c.academia_id = p_academia
         and c.status = 'ativo'
     ) then
    return 'professor_invalido';
  end if;

  if v_professor_atual is null then
    return 'sem_professor_atual';
  end if;

  if exists (
       select 1 from public.turmas t
       where t.professor_id = p_novo_professor
     )
     or exists (
       select 1 from public.vinculos v
       where v.professor_id = p_novo_professor or v.aluno_id = p_novo_professor
     )
     or exists (
       select 1 from public.pedidos_vinculo p
       where p.professor_id = p_novo_professor or p.aluno_id = p_novo_professor
     )
     or exists (
       select 1 from public.alunos_sem_conta a
       where a.professor_id = p_novo_professor
     ) then
    return 'novo_professor_com_dados_proprios';
  end if;

  update public.perfis
  set ativo = false
  where id = v_professor_atual;

  update public.perfis
  set ativo = true
  where id = p_novo_professor;

  update public.vinculos
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual;

  update public.pedidos_vinculo
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual
    and status = 'pendente';

  update public.alunos_sem_conta
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual;

  update public.convites_instrutor
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual;

  -- professor_id é a chave primária; a atualização preserva o código da turma.
  update public.turmas
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual;

  insert into public.academia_professor_log (academia_id, executado_por, professor_id, acao)
  values (p_academia, v_uid, p_novo_professor, 'trocar_professor_academia');

  return 'ok';
end
$$;

create function public.desativar_professor(p_professor uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text;
  v_ativo_adm boolean;
  v_academia uuid;
  v_academia_bloqueada uuid;
  v_papel_professor text;
  v_professor_ativo boolean;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select p.papel, p.ativo into v_papel, v_ativo_adm
  from public.perfis p
  where p.id = v_uid;

  if v_papel is distinct from 'adm' or v_ativo_adm is not true then
    return 'sem_permissao';
  end if;

  if p_professor = v_uid then
    return 'nao_pode_desativar_a_si_mesmo';
  end if;

  select p.academia_id into v_academia
  from public.perfis p
  where p.id = p_professor and p.papel = 'professor';

  if not found or v_academia is null then
    return 'professor_invalido';
  end if;

  select a.id into v_academia_bloqueada
  from public.academias a
  where a.id = v_academia
  for update;

  if not found then
    return 'professor_invalido';
  end if;

  select p.papel, p.ativo, p.academia_id
    into v_papel_professor, v_professor_ativo, v_academia
  from public.perfis p
  where p.id = p_professor
  for update;

  if not found
     or v_papel_professor is distinct from 'professor'
     or v_academia is null then
    return 'professor_invalido';
  end if;

  if v_professor_ativo is not true then
    return 'professor_ja_inativo';
  end if;

  update public.perfis
  set ativo = false
  where id = p_professor;

  insert into public.academia_professor_log (academia_id, executado_por, professor_id, acao)
  values (v_academia, v_uid, p_professor, 'desativar_professor');

  return 'ok';
end
$$;

create function public.reativar_professor(p_professor uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text;
  v_ativo_adm boolean;
  v_academia uuid;
  v_academia_bloqueada uuid;
  v_papel_professor text;
  v_professor_ativo boolean;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select p.papel, p.ativo into v_papel, v_ativo_adm
  from public.perfis p
  where p.id = v_uid;

  if v_papel is distinct from 'adm' or v_ativo_adm is not true then
    return 'sem_permissao';
  end if;

  select p.academia_id into v_academia
  from public.perfis p
  where p.id = p_professor and p.papel = 'professor';

  if not found or v_academia is null then
    return 'professor_invalido';
  end if;

  select a.id into v_academia_bloqueada
  from public.academias a
  where a.id = v_academia
  for update;

  if not found then
    return 'professor_invalido';
  end if;

  select p.papel, p.ativo, p.academia_id
    into v_papel_professor, v_professor_ativo, v_academia
  from public.perfis p
  where p.id = p_professor
  for update;

  if not found
     or v_papel_professor is distinct from 'professor'
     or v_academia is null then
    return 'professor_invalido';
  end if;

  if v_professor_ativo is true then
    return 'professor_ja_ativo';
  end if;

  if exists (
    select 1 from public.perfis p
    where p.academia_id = v_academia
      and p.papel = 'professor'
      and p.ativo is true
      and p.id <> p_professor
  ) then
    return 'professor_ativo_na_academia';
  end if;

  update public.perfis
  set ativo = true
  where id = p_professor;

  insert into public.academia_professor_log (academia_id, executado_por, professor_id, acao)
  values (v_academia, v_uid, p_professor, 'reativar_professor');

  return 'ok';
end
$$;

revoke all on function public.trocar_professor_academia(uuid, uuid) from public, anon, authenticated;
revoke all on function public.desativar_professor(uuid) from public, anon, authenticated;
revoke all on function public.reativar_professor(uuid) from public, anon, authenticated;
grant execute on function public.trocar_professor_academia(uuid, uuid) to authenticated;
grant execute on function public.desativar_professor(uuid) to authenticated;
grant execute on function public.reativar_professor(uuid) to authenticated;

commit;
