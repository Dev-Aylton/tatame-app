-- Cadastro público da academia, grade estruturada e múltiplos Professores ativos.
-- Não altera a tabela grade_semanal usada pelo fluxo atual de Mural e grade.
begin;

drop policy if exists academias_select on public.academias;
create policy academias_select
  on public.academias for select to authenticated
  using (true);

drop index if exists public.perfis_um_professor_ativo_por_academia_idx;

create or replace function public.ativar_professor()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_academia uuid;
  v_academia_bloqueada uuid;
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

  if v_email is null
     or exists (select 1 from public.perfis p where p.id = v_uid) then
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

  insert into public.perfis (id, papel, academia_id, ativo)
  values (v_uid, 'professor', v_academia, true);

  update public.professores_convidados
  set status = 'ativo', perfil_id = v_uid
  where email = v_email;

  return true;
end
$$;

revoke all on function public.ativar_professor() from public, anon, authenticated;
grant execute on function public.ativar_professor() to authenticated;

create or replace function public.reativar_professor(p_professor uuid)
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

  update public.perfis
  set ativo = true
  where id = p_professor;

  insert into public.academia_professor_log (academia_id, executado_por, professor_id, acao)
  values (v_academia, v_uid, p_professor, 'reativar_professor');

  return 'ok';
end
$$;

revoke all on function public.reativar_professor(uuid) from public, anon, authenticated;
grant execute on function public.reativar_professor(uuid) to authenticated;

alter function public.trocar_professor_academia(uuid, uuid)
  rename to trocar_professor_academia_exclusiva_legado;

revoke all on function public.trocar_professor_academia_exclusiva_legado(uuid, uuid)
  from public, anon, authenticated;

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
  v_contagem_professores integer;
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

  select count(*) into v_contagem_professores
  from public.perfis p
  where p.academia_id = p_academia
    and p.papel = 'professor'
    and p.ativo is true;

  if v_contagem_professores <> 1 then
    return 'troca_ambigua_multiplos_professores';
  end if;

  return public.trocar_professor_academia_exclusiva_legado(p_academia, p_novo_professor);
end
$$;

revoke all on function public.trocar_professor_academia(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.trocar_professor_academia(uuid, uuid)
  to authenticated;

create table public.academia_grade_aulas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null
    references public.academias (id) on delete cascade,
  professor_id uuid not null
    references public.perfis (id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 1 and 7),
  horario_inicio time not null,
  horario_fim time not null check (horario_fim > horario_inicio),
  criado_em timestamptz not null default now(),
  constraint academia_grade_aulas_unica
    unique (academia_id, dia_semana, professor_id, horario_inicio, horario_fim)
);

comment on table public.academia_grade_aulas is
  'Grade estruturada da academia; independente da grade livre do Mural.';
comment on column public.academia_grade_aulas.dia_semana is
  'Dia ISO da semana: 1 segunda-feira até 7 domingo.';

create index academia_grade_aulas_consulta_idx
  on public.academia_grade_aulas (academia_id, dia_semana, horario_inicio);

create function public.validar_professor_grade_academia()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.perfis p
    where p.id = new.professor_id
      and p.papel = 'professor'
      and p.ativo is true
      and p.academia_id = new.academia_id
  ) then
    raise exception using
      errcode = '23514',
      message = 'O Professor precisa estar ativo e vinculado à academia da aula.';
  end if;

  return new;
end
$$;

revoke all on function public.validar_professor_grade_academia() from public, anon, authenticated;

create trigger academia_grade_aulas_validar_professor
  before insert or update of academia_id, professor_id
  on public.academia_grade_aulas
  for each row execute function public.validar_professor_grade_academia();

alter table public.academia_grade_aulas enable row level security;
revoke all on table public.academia_grade_aulas from anon, authenticated;
grant select, insert, update, delete on table public.academia_grade_aulas to authenticated;

create policy academia_grade_aulas_select
  on public.academia_grade_aulas for select to authenticated
  using (true);
create policy academia_grade_aulas_insert_adm
  on public.academia_grade_aulas for insert to authenticated
  with check ((select public.papel_atual()) = 'adm');
create policy academia_grade_aulas_update_adm
  on public.academia_grade_aulas for update to authenticated
  using ((select public.papel_atual()) = 'adm')
  with check ((select public.papel_atual()) = 'adm');
create policy academia_grade_aulas_delete_adm
  on public.academia_grade_aulas for delete to authenticated
  using ((select public.papel_atual()) = 'adm');

create function public.listar_grade_academias(p_academia_id uuid default null)
returns table (
  academia_id uuid,
  academia_nome text,
  academia_foto_fundo_url text,
  dia_semana smallint,
  horario_inicio time,
  horario_fim time,
  professor_id uuid,
  professor_nome text
)
language sql stable security definer set search_path = ''
as $$
  select
    a.id,
    a.nome,
    a.foto_fundo_url,
    g.dia_semana,
    g.horario_inicio,
    g.horario_fim,
    p.id,
    p.nome
  from public.academia_grade_aulas g
  join public.academias a on a.id = g.academia_id
  join public.perfis p
    on p.id = g.professor_id
   and p.academia_id = g.academia_id
   and p.papel = 'professor'
   and p.ativo is true
  where auth.uid() is not null
    and (p_academia_id is null or a.id = p_academia_id)
  order by a.nome, g.dia_semana, g.horario_inicio, p.nome
$$;

revoke all on function public.listar_grade_academias(uuid) from public, anon, authenticated;
grant execute on function public.listar_grade_academias(uuid) to authenticated;

commit;
