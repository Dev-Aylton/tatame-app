-- RASCUNHO — NÃO EXECUTADA; aguarda revisão do Claude e autorização do Aylton
begin;

create table public.aulas_delegadas (
  instrutor_id uuid primary key
    references public.instrutores_professor (instrutor_id) on delete cascade,
  professor_id uuid not null
    references public.perfis (id) on delete cascade,
  modo text not null check (modo in ('plan', 'free')),
  plano text not null default '',
  compartilhada boolean not null default false,
  seguido text check (seguido in ('yes', 'no')),
  constraint aulas_delegadas_professor_instrutor_check
    check (professor_id <> instrutor_id),
  constraint aulas_delegadas_modo_plano_check
    check (
      (modo = 'plan' and pg_catalog.char_length(pg_catalog.btrim(plano)) > 0)
      or (modo = 'free' and plano = '')
    )
);

alter table public.aulas_delegadas enable row level security;
revoke all on table public.aulas_delegadas from public, anon, authenticated;
grant select on table public.aulas_delegadas to authenticated;

create policy aulas_delegadas_select_professor
  on public.aulas_delegadas for select to authenticated
  using (
    professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
    and exists (
      select 1
      from public.instrutores_professor ip
      where ip.instrutor_id = aulas_delegadas.instrutor_id
        and ip.professor_id = (select auth.uid())
    )
  );

create policy aulas_delegadas_select_instrutor
  on public.aulas_delegadas for select to authenticated
  using (
    instrutor_id = (select auth.uid())
    and compartilhada is true
    and (select public.papel_atual()) = 'instrutor'
    and exists (
      select 1
      from public.instrutores_professor ip
      where ip.instrutor_id = (select auth.uid())
        and ip.professor_id = aulas_delegadas.professor_id
    )
  );

create function public.criar_aula_delegada(
  p_instrutor_id uuid,
  p_modo text,
  p_plano text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_plano text := pg_catalog.btrim(coalesce(p_plano, ''));
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_instrutor_id is null
     or p_modo is null
     or p_modo not in ('plan', 'free')
     or (p_modo = 'plan' and pg_catalog.char_length(v_plano) = 0)
     or not exists (
       select 1
       from public.instrutores_professor ip
       join public.perfis instrutor on instrutor.id = ip.instrutor_id
       where ip.instrutor_id = p_instrutor_id
         and ip.professor_id = v_uid
         and instrutor.papel = 'instrutor'
         and instrutor.ativo is true
     ) then
    return false;
  end if;

  insert into public.aulas_delegadas (
    instrutor_id, professor_id, modo, plano
  )
  values (
    p_instrutor_id,
    v_uid,
    p_modo,
    case when p_modo = 'plan' then v_plano else '' end
  )
  on conflict (instrutor_id) do nothing;

  return found;
end
$$;

create function public.editar_aula_delegada(
  p_instrutor_id uuid,
  p_modo text,
  p_plano text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_plano text := pg_catalog.btrim(coalesce(p_plano, ''));
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_instrutor_id is null
     or p_modo is null
     or p_modo not in ('plan', 'free')
     or (p_modo = 'plan' and pg_catalog.char_length(v_plano) = 0) then
    return false;
  end if;

  update public.aulas_delegadas d
  set modo = p_modo,
      plano = case when p_modo = 'plan' then v_plano else '' end,
      seguido = null
  where d.instrutor_id = p_instrutor_id
    and d.professor_id = v_uid
    and exists (
      select 1
      from public.instrutores_professor ip
      join public.perfis instrutor on instrutor.id = ip.instrutor_id
      where ip.instrutor_id = d.instrutor_id
        and ip.professor_id = v_uid
        and instrutor.papel = 'instrutor'
        and instrutor.ativo is true
    );

  return found;
end
$$;

create function public.compartilhar_aula_delegada(p_instrutor_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.papel_atual() is distinct from 'professor' then
    return false;
  end if;

  update public.aulas_delegadas d
  set compartilhada = true
  where d.instrutor_id = p_instrutor_id
    and d.professor_id = auth.uid()
    and exists (
      select 1
      from public.instrutores_professor ip
      where ip.instrutor_id = d.instrutor_id
        and ip.professor_id = auth.uid()
    );

  return found;
end
$$;

create function public.registrar_seguiu_aula_delegada(p_seguido text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'instrutor'
     or p_seguido is null
     or p_seguido not in ('yes', 'no') then
    return false;
  end if;

  update public.aulas_delegadas d
  set seguido = p_seguido
  where d.instrutor_id = auth.uid()
    and d.compartilhada is true
    and d.seguido is null
    and exists (
      select 1
      from public.instrutores_professor ip
      where ip.instrutor_id = d.instrutor_id
        and ip.professor_id = d.professor_id
    );

  return found;
end
$$;

create function public.listar_aulas_delegadas()
returns table (
  instrutor_id uuid,
  professor_id uuid,
  modo text,
  plano text,
  compartilhada boolean,
  seguido text
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.instrutor_id, d.professor_id, d.modo, d.plano, d.compartilhada, d.seguido
  from public.aulas_delegadas d
  where (
    (
      d.professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      d.instrutor_id = (select auth.uid())
      and d.compartilhada is true
      and (select public.papel_atual()) = 'instrutor'
    )
  )
    and exists (
      select 1
      from public.instrutores_professor ip
      where ip.instrutor_id = d.instrutor_id
        and ip.professor_id = d.professor_id
    );
$$;

revoke all on function public.criar_aula_delegada(uuid, text, text) from public, anon, authenticated;
revoke all on function public.editar_aula_delegada(uuid, text, text) from public, anon, authenticated;
revoke all on function public.compartilhar_aula_delegada(uuid) from public, anon, authenticated;
revoke all on function public.registrar_seguiu_aula_delegada(text) from public, anon, authenticated;
revoke all on function public.listar_aulas_delegadas() from public, anon, authenticated;
grant execute on function public.criar_aula_delegada(uuid, text, text) to authenticated;
grant execute on function public.editar_aula_delegada(uuid, text, text) to authenticated;
grant execute on function public.compartilhar_aula_delegada(uuid) to authenticated;
grant execute on function public.registrar_seguiu_aula_delegada(text) to authenticated;
grant execute on function public.listar_aulas_delegadas() to authenticated;

create table public.planos_semana (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  semana_inicio date not null,
  compartilhado boolean not null default false,
  criado_em timestamptz not null default pg_catalog.now(),
  constraint planos_semana_inicio_segunda_check
    check (extract(isodow from semana_inicio) = 1),
  constraint planos_semana_professor_semana_unique unique (professor_id, semana_inicio)
);

create table public.plano_itens (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  plano_id uuid not null references public.planos_semana (id) on delete cascade,
  dia smallint not null check (dia between 0 and 6),
  tema text not null
    check (pg_catalog.char_length(pg_catalog.btrim(tema)) between 1 and 80),
  descricao text
    check (descricao is null or pg_catalog.char_length(pg_catalog.btrim(descricao)) <= 300)
);

create index plano_itens_plano_dia_idx on public.plano_itens (plano_id, dia, id);

create table public.biblioteca_temas (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  nome text not null
    check (pg_catalog.char_length(pg_catalog.btrim(nome)) between 1 and 80),
  descricao text
    check (descricao is null or pg_catalog.char_length(pg_catalog.btrim(descricao)) <= 300),
  arquivado boolean not null default false,
  criado_em timestamptz not null default pg_catalog.now()
);

create index biblioteca_temas_professor_idx
  on public.biblioteca_temas (professor_id, arquivado, nome);

alter table public.planos_semana enable row level security;
alter table public.plano_itens enable row level security;
alter table public.biblioteca_temas enable row level security;
revoke all on table public.planos_semana, public.plano_itens, public.biblioteca_temas
  from public, anon, authenticated;
grant select on table public.planos_semana, public.plano_itens, public.biblioteca_temas
  to authenticated;

create policy planos_semana_select_professor_instrutor
  on public.planos_semana for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      compartilhado is true
      and (select public.papel_atual()) = 'instrutor'
      and exists (
        select 1
        from public.instrutores_professor ip
        where ip.professor_id = planos_semana.professor_id
          and ip.instrutor_id = (select auth.uid())
      )
    )
  );

create policy plano_itens_select_professor_instrutor
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
            p.compartilhado is true
            and (select public.papel_atual()) = 'instrutor'
            and exists (
              select 1
              from public.instrutores_professor ip
              where ip.professor_id = p.professor_id
                and ip.instrutor_id = (select auth.uid())
            )
          )
        )
    )
  );

create policy biblioteca_temas_select_professor
  on public.biblioteca_temas for select to authenticated
  using (
    professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
  );

create function public.criar_plano_semanal(
  p_semana_inicio date,
  p_itens jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_plano_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_semana_inicio is null
     or p_itens is null
     or pg_catalog.jsonb_typeof(p_itens) <> 'array' then
    return null;
  end if;

  insert into public.planos_semana (professor_id, semana_inicio)
  values (v_uid, p_semana_inicio)
  returning id into v_plano_id;

  insert into public.plano_itens (plano_id, dia, tema, descricao)
  select v_plano_id, item.dia, item.tema, item.descricao
  from pg_catalog.jsonb_to_recordset(p_itens)
    as item(dia smallint, tema text, descricao text);

  return v_plano_id;
end
$$;

create function public.editar_plano_semanal(
  p_plano_id uuid,
  p_semana_inicio date,
  p_itens jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or p_plano_id is null
     or p_semana_inicio is null
     or p_itens is null
     or pg_catalog.jsonb_typeof(p_itens) <> 'array' then
    return false;
  end if;

  update public.planos_semana
  set semana_inicio = p_semana_inicio
  where id = p_plano_id
    and professor_id = auth.uid();

  if not found then
    return false;
  end if;

  delete from public.plano_itens where plano_id = p_plano_id;

  insert into public.plano_itens (plano_id, dia, tema, descricao)
  select p_plano_id, item.dia, item.tema, item.descricao
  from pg_catalog.jsonb_to_recordset(p_itens)
    as item(dia smallint, tema text, descricao text);

  return true;
end
$$;

create function public.compartilhar_plano_semanal(
  p_plano_id uuid,
  p_compartilhado boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or p_plano_id is null
     or p_compartilhado is null then
    return false;
  end if;

  update public.planos_semana
  set compartilhado = p_compartilhado
  where id = p_plano_id
    and professor_id = auth.uid();

  return found;
end
$$;

create function public.listar_planos_semanais()
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
  where (
    (p.professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor')
    or (
      p.compartilhado is true
      and (select public.papel_atual()) = 'instrutor'
      and exists (
        select 1
        from public.instrutores_professor ip
        where ip.professor_id = p.professor_id
          and ip.instrutor_id = (select auth.uid())
      )
    )
  )
  order by p.semana_inicio desc, i.dia, i.id;
$$;

create function public.criar_tema_biblioteca(
  p_nome text,
  p_descricao text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := pg_catalog.btrim(coalesce(p_nome, ''));
  v_descricao text := nullif(pg_catalog.btrim(coalesce(p_descricao, '')), '');
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or pg_catalog.char_length(v_nome) not between 1 and 80
     or (v_descricao is not null and pg_catalog.char_length(v_descricao) > 300) then
    return null;
  end if;

  insert into public.biblioteca_temas (professor_id, nome, descricao)
  values (v_uid, v_nome, v_descricao)
  returning id into v_id;

  return v_id;
end
$$;

create function public.editar_tema_biblioteca(
  p_tema_id uuid,
  p_nome text,
  p_descricao text,
  p_arquivado boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text := pg_catalog.btrim(coalesce(p_nome, ''));
  v_descricao text := nullif(pg_catalog.btrim(coalesce(p_descricao, '')), '');
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or p_tema_id is null
     or p_arquivado is null
     or pg_catalog.char_length(v_nome) not between 1 and 80
     or (v_descricao is not null and pg_catalog.char_length(v_descricao) > 300) then
    return false;
  end if;

  update public.biblioteca_temas
  set nome = v_nome,
      descricao = v_descricao,
      arquivado = p_arquivado
  where id = p_tema_id
    and professor_id = auth.uid();

  return found;
end
$$;

create function public.listar_temas_biblioteca()
returns table (
  id uuid,
  nome text,
  descricao text,
  arquivado boolean,
  criado_em timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.nome, t.descricao, t.arquivado, t.criado_em
  from public.biblioteca_temas t
  where t.professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
  order by t.arquivado, t.nome, t.id;
$$;

revoke all on function public.criar_plano_semanal(date, jsonb) from public, anon, authenticated;
revoke all on function public.editar_plano_semanal(uuid, date, jsonb) from public, anon, authenticated;
revoke all on function public.compartilhar_plano_semanal(uuid, boolean) from public, anon, authenticated;
revoke all on function public.listar_planos_semanais() from public, anon, authenticated;
revoke all on function public.criar_tema_biblioteca(text, text) from public, anon, authenticated;
revoke all on function public.editar_tema_biblioteca(uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function public.listar_temas_biblioteca() from public, anon, authenticated;
grant execute on function public.criar_plano_semanal(date, jsonb) to authenticated;
grant execute on function public.editar_plano_semanal(uuid, date, jsonb) to authenticated;
grant execute on function public.compartilhar_plano_semanal(uuid, boolean) to authenticated;
grant execute on function public.listar_planos_semanais() to authenticated;
grant execute on function public.criar_tema_biblioteca(text, text) to authenticated;
grant execute on function public.editar_tema_biblioteca(uuid, text, text, boolean) to authenticated;
grant execute on function public.listar_temas_biblioteca() to authenticated;

commit;
