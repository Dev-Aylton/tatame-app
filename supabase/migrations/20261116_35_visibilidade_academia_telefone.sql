-- Restringe dados e fotos da academia a Alunos vinculados e adiciona telefone institucional.
begin;

alter table public.academias
  add column telefone text
  check (
    telefone is null
    or (
      telefone = btrim(telefone)
      and char_length(telefone) between 7 and 32
      and telefone ~ '^\+?[0-9(). -]+$'
      and char_length(pg_catalog.regexp_replace(telefone, '[^0-9]', '', 'g')) between 7 and 15
    )
  );

alter table public.academias_log_edicao
  drop constraint if exists academias_log_edicao_campos_check;
alter table public.academias_log_edicao
  add constraint academias_log_edicao_campos_check
  check (
    cardinality(campos) > 0
    and campos <@ array['nome', 'foto_fundo_url', 'telefone']::text[]
  );

revoke update (nome, foto_fundo_url, telefone) on public.academias from authenticated;
grant insert (telefone) on public.academias to authenticated;

create function public.aluno_vinculado_a_academia(p_academia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_academia_id is not null
    and (select public.papel_atual()) = 'aluno'
    and exists (
      select 1
      from public.vinculos v
      join public.perfis professor on professor.id = v.professor_id
      where v.aluno_id = (select auth.uid())
        and professor.papel = 'professor'
        and professor.ativo is true
        and professor.academia_id = p_academia_id
    );
$$;

revoke all on function public.aluno_vinculado_a_academia(uuid)
  from public, anon, authenticated;
grant execute on function public.aluno_vinculado_a_academia(uuid)
  to authenticated;

drop policy if exists academias_select on public.academias;
create policy academias_select
  on public.academias for select to authenticated
  using (
    (select public.papel_atual()) in ('adm', 'professor', 'instrutor')
    or (select public.aluno_vinculado_a_academia(id))
  );

drop policy if exists academia_grade_aulas_select on public.academia_grade_aulas;
create policy academia_grade_aulas_select
  on public.academia_grade_aulas for select to authenticated
  using (
    (select public.papel_atual()) in ('adm', 'professor', 'instrutor')
    or (select public.aluno_vinculado_a_academia(academia_id))
  );

create or replace function public.listar_grade_academias(p_academia_id uuid default null)
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
language sql
stable
security definer
set search_path = ''
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
    and (
      (select public.papel_atual()) in ('adm', 'professor', 'instrutor')
      or (select public.aluno_vinculado_a_academia(a.id))
    )
  order by a.nome, g.dia_semana, g.horario_inicio, p.nome
$$;

revoke all on function public.listar_grade_academias(uuid)
  from public, anon, authenticated;
grant execute on function public.listar_grade_academias(uuid)
  to authenticated;

drop policy if exists academias_fotos_select_autenticados on public.academias_fotos;
create policy academias_fotos_select_autenticados
  on public.academias_fotos for select to authenticated
  using (
    (select public.papel_atual()) in ('adm', 'professor', 'instrutor')
    or (select public.aluno_vinculado_a_academia(academia_id))
  );

drop policy if exists academias_storage_select_autenticados on storage.objects;
create policy academias_storage_select_autenticados
  on storage.objects for select to authenticated
  using (
    bucket_id = 'academias'
    and exists (
      select 1
      from public.academias_fotos af
      where af.caminho_storage = storage.objects.name
        and (
          (select public.papel_atual()) in ('adm', 'professor', 'instrutor')
          or (select public.aluno_vinculado_a_academia(af.academia_id))
        )
    )
  );

create function public.atualizar_academia(
  p_academia_id uuid,
  p_nome text,
  p_foto_fundo_url text,
  p_telefone text,
  p_versao_esperada bigint
)
returns table (codigo text, versao bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome_novo text := btrim(coalesce(p_nome, ''));
  v_telefone_novo text := nullif(btrim(coalesce(p_telefone, '')), '');
  v_nome_atual text;
  v_foto_atual text;
  v_telefone_atual text;
  v_versao_atual bigint;
  v_nova_versao bigint;
  v_campos text[] := array[]::text[];
begin
  if v_uid is null then
    return query select 'nao_autenticado'::text, null::bigint;
    return;
  end if;

  if public.papel_atual() is distinct from 'adm' then
    return query select 'sem_permissao'::text, null::bigint;
    return;
  end if;

  if char_length(v_nome_novo) not between 2 and 80 then
    return query select 'nome_invalido'::text, null::bigint;
    return;
  end if;

  if v_telefone_novo is not null and (
    char_length(v_telefone_novo) > 32
    or char_length(v_telefone_novo) < 7
    or v_telefone_novo !~ '^\+?[0-9(). -]+$'
    or char_length(pg_catalog.regexp_replace(v_telefone_novo, '[^0-9]', '', 'g')) not between 7 and 15
  ) then
    return query select 'telefone_invalido'::text, null::bigint;
    return;
  end if;

  if p_academia_id is null then
    return query select 'academia_nao_encontrada'::text, null::bigint;
    return;
  end if;

  if p_versao_esperada is null then
    return query select 'conflito_versao'::text, null::bigint;
    return;
  end if;

  select a.nome, a.foto_fundo_url, a.telefone, a.versao_edicao
    into v_nome_atual, v_foto_atual, v_telefone_atual, v_versao_atual
  from public.academias a
  where a.id = p_academia_id
  for update;

  if not found then
    return query select 'academia_nao_encontrada'::text, null::bigint;
    return;
  end if;

  if v_versao_atual is distinct from p_versao_esperada then
    return query select 'conflito_versao'::text, null::bigint;
    return;
  end if;

  if v_nome_atual is distinct from v_nome_novo then
    v_campos := pg_catalog.array_append(v_campos, 'nome');
  end if;
  if v_foto_atual is distinct from p_foto_fundo_url then
    v_campos := pg_catalog.array_append(v_campos, 'foto_fundo_url');
  end if;
  if v_telefone_atual is distinct from v_telefone_novo then
    v_campos := pg_catalog.array_append(v_campos, 'telefone');
  end if;

  if cardinality(v_campos) = 0 then
    return query select 'ok'::text, v_versao_atual;
    return;
  end if;

  update public.academias
  set nome = v_nome_novo,
      foto_fundo_url = p_foto_fundo_url,
      telefone = v_telefone_novo,
      versao_edicao = versao_edicao + 1
  where id = p_academia_id
    and versao_edicao = p_versao_esperada
  returning versao_edicao into v_nova_versao;

  if not found then
    return query select 'conflito_versao'::text, null::bigint;
    return;
  end if;

  insert into public.academias_log_edicao (academia_id, alterado_por, campos)
  values (p_academia_id, v_uid, v_campos);

  return query select 'ok'::text, v_nova_versao;
end
$$;

revoke all on function public.atualizar_academia(uuid, text, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.atualizar_academia(uuid, text, text, text, bigint)
  to authenticated;

commit;
