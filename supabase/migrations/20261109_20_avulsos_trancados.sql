-- RASCUNHO — NÃO EXECUTADA; aguarda revisão do Claude e autorização do Aylton
begin;

alter table public.vinculos
  add column if not exists status text default null
  check (status is null or status = 'locked');

alter table public.vinculos
  add column if not exists trancado_desde date,
  add column if not exists trancado_ate date;

alter table public.alunos_sem_conta
  add column if not exists status text default null
  check (status is null or status = 'locked');

alter table public.alunos_sem_conta
  add column if not exists trancado_desde date,
  add column if not exists trancado_ate date;

create or replace function public.definir_status_aluno_vinculado(
  p_aluno_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or (p_status is not null and p_status is distinct from 'locked') then
    return false;
  end if;

  update public.vinculos v
  set status = p_status,
      trancado_desde = case
        when p_status = 'locked' and v.status is distinct from 'locked'
          then current_date
        else v.trancado_desde
      end,
      trancado_ate = case
        when p_status = 'locked' and v.status is distinct from 'locked'
          then null
        when p_status is null and v.status = 'locked'
          then current_date
        else v.trancado_ate
      end
  from public.perfis aluno
  where v.aluno_id = p_aluno_id
    and v.professor_id = v_uid
    and aluno.id = v.aluno_id
    and aluno.papel = 'aluno'
    and aluno.ativo is true;

  return found;
end
$$;

create function public.definir_status_aluno_sem_conta(
  p_aluno_sem_conta_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or (p_status is not null and p_status is distinct from 'locked') then
    return false;
  end if;

  update public.alunos_sem_conta
  set status = p_status,
      trancado_desde = case
        when p_status = 'locked' and status is distinct from 'locked'
          then current_date
        else trancado_desde
      end,
      trancado_ate = case
        when p_status = 'locked' and status is distinct from 'locked'
          then null
        when p_status is null and status = 'locked'
          then current_date
        else trancado_ate
      end
  where id = p_aluno_sem_conta_id
    and professor_id = auth.uid();

  return found;
end
$$;

create table public.aulas_avulsas (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  aluno_sem_conta_id uuid not null
    references public.alunos_sem_conta (id) on delete cascade,
  data_aula date not null,
  criado_em timestamptz not null default pg_catalog.now()
);

create index aulas_avulsas_professor_aluno_data_idx
  on public.aulas_avulsas (professor_id, aluno_sem_conta_id, data_aula);

alter table public.aulas_avulsas enable row level security;
revoke all on table public.aulas_avulsas from public, anon, authenticated;
grant select on table public.aulas_avulsas to authenticated;

create policy aulas_avulsas_select_professor
  on public.aulas_avulsas for select to authenticated
  using (
    professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
  );

create function public.criar_aula_avulsa(
  p_aluno_sem_conta_id uuid,
  p_data_aula date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_aluno_sem_conta_id is null
     or p_data_aula is null
     or not exists (
       select 1
       from public.alunos_sem_conta a
       where a.id = p_aluno_sem_conta_id
         and a.professor_id = v_uid
     ) then
    return null;
  end if;

  insert into public.aulas_avulsas (
    professor_id, aluno_sem_conta_id, data_aula
  )
  values (v_uid, p_aluno_sem_conta_id, p_data_aula)
  returning id into v_id;

  return v_id;
end
$$;

create function public.excluir_aula_avulsa(p_aula_avulsa_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.papel_atual() is distinct from 'professor' then
    return false;
  end if;

  delete from public.aulas_avulsas
  where id = p_aula_avulsa_id
    and professor_id = auth.uid();

  return found;
end
$$;

create function public.listar_aulas_avulsas()
returns table (
  id uuid,
  aluno_sem_conta_id uuid,
  data_aula date,
  criado_em timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.aluno_sem_conta_id, a.data_aula, a.criado_em
  from public.aulas_avulsas a
  where a.professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
  order by a.data_aula desc, a.id;
$$;

revoke all on function public.definir_status_aluno_vinculado(uuid, text) from public, anon, authenticated;
revoke all on function public.definir_status_aluno_sem_conta(uuid, text) from public, anon, authenticated;
revoke all on function public.criar_aula_avulsa(uuid, date) from public, anon, authenticated;
revoke all on function public.excluir_aula_avulsa(uuid) from public, anon, authenticated;
revoke all on function public.listar_aulas_avulsas() from public, anon, authenticated;
grant execute on function public.definir_status_aluno_vinculado(uuid, text) to authenticated;
grant execute on function public.definir_status_aluno_sem_conta(uuid, text) to authenticated;
grant execute on function public.criar_aula_avulsa(uuid, date) to authenticated;
grant execute on function public.excluir_aula_avulsa(uuid) to authenticated;
grant execute on function public.listar_aulas_avulsas() to authenticated;

commit;
