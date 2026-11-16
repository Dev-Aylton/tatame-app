-- PENDENTE: revisar e aplicar manualmente antes de publicar a versão correspondente do app.
begin;

alter table public.planos_semana
  add column periodo_tipo text not null default 'semanal',
  add column compartilhado_alunos boolean not null default false;

alter table public.planos_semana
  drop constraint planos_semana_inicio_segunda_check,
  drop constraint planos_semana_professor_semana_unique,
  add constraint planos_semana_periodo_tipo_check
    check (periodo_tipo in ('semanal', 'mensal')),
  add constraint planos_semana_inicio_periodo_check
    check (
      (periodo_tipo = 'semanal' and extract(isodow from semana_inicio) = 1)
      or (periodo_tipo = 'mensal' and extract(day from semana_inicio) = 1)
    ),
  add constraint planos_semana_professor_periodo_unique
    unique (professor_id, periodo_tipo, semana_inicio);

alter table public.plano_itens add column data date;

update public.plano_itens i
set data = p.semana_inicio + i.dia
from public.planos_semana p
where p.id = i.plano_id
  and i.data is null;

create index plano_itens_plano_data_idx
  on public.plano_itens (plano_id, data, id);

drop policy planos_semana_select_professor_instrutor on public.planos_semana;
drop policy plano_itens_select_professor_instrutor on public.plano_itens;

create policy planos_semana_select_professor_aluno
  on public.planos_semana for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      compartilhado_alunos is true
      and (select public.papel_atual()) in ('aluno', 'adm')
      and (select public.tem_acesso_aluno())
      and exists (
        select 1
        from public.vinculos v
        join public.perfis professor on professor.id = v.professor_id
        where v.aluno_id = (select auth.uid())
          and v.professor_id = planos_semana.professor_id
          and professor.papel = 'professor'
          and professor.ativo is true
      )
    )
  );

create policy plano_itens_select_professor_aluno
  on public.plano_itens for select to authenticated
  using (
    exists (
      select 1
      from public.planos_semana p
      where p.id = plano_itens.plano_id
        and (
          (
            p.professor_id = (select auth.uid())
            and (select public.papel_atual()) = 'professor'
          )
          or (
            p.compartilhado_alunos is true
            and (select public.papel_atual()) in ('aluno', 'adm')
            and (select public.tem_acesso_aluno())
            and exists (
              select 1
              from public.vinculos v
              join public.perfis professor on professor.id = v.professor_id
              where v.aluno_id = (select auth.uid())
                and v.professor_id = p.professor_id
                and professor.papel = 'professor'
                and professor.ativo is true
            )
          )
        )
    )
  );

create or replace function public.listar_planos_semanais()
returns table (
  id uuid,
  professor_id uuid,
  semana_inicio date,
  compartilhado boolean,
  criado_em timestamptz,
  dia smallint,
  tema text,
  descricao text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.professor_id, p.semana_inicio, p.compartilhado, p.criado_em,
         i.dia, i.tema, i.descricao
  from public.planos_semana p
  left join public.plano_itens i on i.plano_id = p.id
  where p.periodo_tipo = 'semanal'
    and p.professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
  order by p.semana_inicio desc, i.dia, i.id;
$$;

create function public.listar_planos_treino()
returns table (
  id uuid,
  professor_id uuid,
  periodo_tipo text,
  periodo_inicio date,
  compartilhado_alunos boolean,
  criado_em timestamptz,
  data date,
  tema text,
  descricao text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.professor_id, p.periodo_tipo, p.semana_inicio,
         p.compartilhado_alunos, p.criado_em,
         coalesce(i.data, p.semana_inicio + i.dia), i.tema, i.descricao
  from public.planos_semana p
  left join public.plano_itens i on i.plano_id = p.id
  where (
    (
      p.professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      p.compartilhado_alunos is true
      and (select public.papel_atual()) in ('aluno', 'adm')
      and (select public.tem_acesso_aluno())
      and exists (
        select 1
        from public.vinculos v
        join public.perfis professor on professor.id = v.professor_id
        where v.aluno_id = (select auth.uid())
          and v.professor_id = p.professor_id
          and professor.papel = 'professor'
          and professor.ativo is true
      )
    )
  )
  order by p.semana_inicio desc, coalesce(i.data, p.semana_inicio + i.dia), i.id;
$$;

create function public.criar_plano_treino(
  p_periodo_tipo text,
  p_periodo_inicio date,
  p_itens jsonb,
  p_compartilhado_alunos boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_periodo_fim date;
  v_plano_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_periodo_tipo is null
     or p_periodo_tipo not in ('semanal', 'mensal')
     or p_periodo_inicio is null
     or p_itens is null
     or p_compartilhado_alunos is null
     or (
       p_periodo_tipo = 'semanal'
       and extract(isodow from p_periodo_inicio) <> 1
     )
     or (
       p_periodo_tipo = 'mensal'
       and extract(day from p_periodo_inicio) <> 1
     )
  then
    return null;
  end if;

  if pg_catalog.jsonb_typeof(p_itens) is distinct from 'array' then
    return null;
  end if;

  if pg_catalog.jsonb_array_length(p_itens) = 0 then
    return null;
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_itens) as elementos(item)
    where pg_catalog.jsonb_typeof(elementos.item) is distinct from 'object'
  ) then
    return null;
  end if;

  v_periodo_fim := case
    when p_periodo_tipo = 'semanal' then p_periodo_inicio + 6
    else (p_periodo_inicio + interval '1 month' - interval '1 day')::date
  end;

  if exists (
    select 1
    from pg_catalog.jsonb_to_recordset(p_itens)
      as item(data date, tema text, descricao text)
    where item.data is null
       or item.data not between p_periodo_inicio and v_periodo_fim
       or pg_catalog.char_length(pg_catalog.btrim(coalesce(item.tema, ''))) not between 1 and 80
       or (
         item.descricao is not null
         and pg_catalog.char_length(pg_catalog.btrim(item.descricao)) > 300
       )
  ) then
    return null;
  end if;

  insert into public.planos_semana (
    professor_id, semana_inicio, periodo_tipo, compartilhado_alunos
  )
  values (
    v_uid, p_periodo_inicio, p_periodo_tipo, p_compartilhado_alunos
  )
  returning id into v_plano_id;

  insert into public.plano_itens (plano_id, dia, tema, descricao, data)
  select v_plano_id,
         pg_catalog.mod(item.data - p_periodo_inicio, 7)::smallint,
         pg_catalog.btrim(item.tema),
         nullif(pg_catalog.btrim(coalesce(item.descricao, '')), ''),
         item.data
  from pg_catalog.jsonb_to_recordset(p_itens)
    as item(data date, tema text, descricao text);

  return v_plano_id;
end
$$;

create function public.editar_plano_treino(
  p_plano_id uuid,
  p_periodo_tipo text,
  p_periodo_inicio date,
  p_itens jsonb,
  p_compartilhado_alunos boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_periodo_fim date;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_plano_id is null
     or p_periodo_tipo is null
     or p_periodo_tipo not in ('semanal', 'mensal')
     or p_periodo_inicio is null
     or p_itens is null
     or p_compartilhado_alunos is null
     or (
       p_periodo_tipo = 'semanal'
       and extract(isodow from p_periodo_inicio) <> 1
     )
     or (
       p_periodo_tipo = 'mensal'
       and extract(day from p_periodo_inicio) <> 1
     )
  then
    return false;
  end if;

  if pg_catalog.jsonb_typeof(p_itens) is distinct from 'array' then
    return false;
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_itens) as elementos(item)
    where pg_catalog.jsonb_typeof(elementos.item) is distinct from 'object'
  ) then
    return false;
  end if;

  v_periodo_fim := case
    when p_periodo_tipo = 'semanal' then p_periodo_inicio + 6
    else (p_periodo_inicio + interval '1 month' - interval '1 day')::date
  end;

  if exists (
    select 1
    from pg_catalog.jsonb_to_recordset(p_itens)
      as item(data date, tema text, descricao text)
    where item.data is null
       or item.data not between p_periodo_inicio and v_periodo_fim
       or pg_catalog.char_length(pg_catalog.btrim(coalesce(item.tema, ''))) not between 1 and 80
       or (
         item.descricao is not null
         and pg_catalog.char_length(pg_catalog.btrim(item.descricao)) > 300
       )
  ) then
    return false;
  end if;

  update public.planos_semana
  set semana_inicio = p_periodo_inicio,
      periodo_tipo = p_periodo_tipo,
      compartilhado_alunos = p_compartilhado_alunos
  where id = p_plano_id
    and professor_id = v_uid;

  if not found then
    return false;
  end if;

  delete from public.plano_itens where plano_id = p_plano_id;

  insert into public.plano_itens (plano_id, dia, tema, descricao, data)
  select p_plano_id,
         pg_catalog.mod(item.data - p_periodo_inicio, 7)::smallint,
         pg_catalog.btrim(item.tema),
         nullif(pg_catalog.btrim(coalesce(item.descricao, '')), ''),
         item.data
  from pg_catalog.jsonb_to_recordset(p_itens)
    as item(data date, tema text, descricao text);

  return true;
end
$$;

revoke all on function public.listar_planos_treino() from public, anon, authenticated;
revoke all on function public.criar_plano_treino(text, date, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.editar_plano_treino(uuid, text, date, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.listar_planos_treino() to authenticated;
grant execute on function public.criar_plano_treino(text, date, jsonb, boolean) to authenticated;
grant execute on function public.editar_plano_treino(uuid, text, date, jsonb, boolean) to authenticated;

commit;
