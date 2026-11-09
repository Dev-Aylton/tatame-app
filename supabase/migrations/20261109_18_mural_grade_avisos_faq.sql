-- RASCUNHO — NÃO EXECUTADA; aguarda revisão do Claude e autorização do Aylton
begin;

create table public.grade_semanal (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  dias text not null check (pg_catalog.char_length(pg_catalog.btrim(dias)) between 1 and 500),
  horario text not null check (pg_catalog.char_length(pg_catalog.btrim(horario)) between 1 and 500),
  arquivado boolean not null default false
);

create index grade_semanal_professor_idx
  on public.grade_semanal (professor_id, arquivado);

create table public.grade_semanal_publicacao (
  professor_id uuid primary key references public.perfis (id) on delete cascade,
  publicada boolean not null default false
);

alter table public.grade_semanal enable row level security;
alter table public.grade_semanal_publicacao enable row level security;
revoke all on table public.grade_semanal, public.grade_semanal_publicacao
  from public, anon, authenticated;
grant select on table public.grade_semanal, public.grade_semanal_publicacao
  to authenticated;

create policy grade_semanal_select
  on public.grade_semanal for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      not arquivado
      and exists (
        select 1
        from public.grade_semanal_publicacao gp
        where gp.professor_id = grade_semanal.professor_id
          and gp.publicada is true
      )
      and (
        (
          (select public.papel_atual()) = 'aluno'
          and exists (
            select 1
            from public.vinculos v
            join public.perfis professor on professor.id = v.professor_id
            where v.aluno_id = (select auth.uid())
              and v.professor_id = grade_semanal.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
        or (
          (select public.papel_atual()) = 'instrutor'
          and exists (
            select 1
            from public.instrutores_professor ip
            join public.perfis professor on professor.id = ip.professor_id
            where ip.instrutor_id = (select auth.uid())
              and ip.professor_id = grade_semanal.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
      )
    )
  );

create policy grade_semanal_publicacao_select
  on public.grade_semanal_publicacao for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      publicada is true
      and (
        (
          (select public.papel_atual()) = 'aluno'
          and exists (
            select 1
            from public.vinculos v
            join public.perfis professor on professor.id = v.professor_id
            where v.aluno_id = (select auth.uid())
              and v.professor_id = grade_semanal_publicacao.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
        or (
          (select public.papel_atual()) = 'instrutor'
          and exists (
            select 1
            from public.instrutores_professor ip
            join public.perfis professor on professor.id = ip.professor_id
            where ip.instrutor_id = (select auth.uid())
              and ip.professor_id = grade_semanal_publicacao.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
      )
    )
  );

create function public.criar_grade_semanal(p_dias text, p_horario text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_dias text := pg_catalog.btrim(coalesce(p_dias, ''));
  v_horario text := pg_catalog.btrim(coalesce(p_horario, ''));
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or pg_catalog.char_length(v_dias) not between 1 and 500
     or pg_catalog.char_length(v_horario) not between 1 and 500 then
    return null;
  end if;

  insert into public.grade_semanal (professor_id, dias, horario)
  values (v_uid, v_dias, v_horario)
  returning id into v_id;

  return v_id;
end
$$;

create function public.editar_grade_semanal(
  p_grade_id uuid,
  p_dias text,
  p_horario text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_dias text := pg_catalog.btrim(coalesce(p_dias, ''));
  v_horario text := pg_catalog.btrim(coalesce(p_horario, ''));
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_grade_id is null
     or pg_catalog.char_length(v_dias) not between 1 and 500
     or pg_catalog.char_length(v_horario) not between 1 and 500 then
    return false;
  end if;

  update public.grade_semanal
  set dias = v_dias,
      horario = v_horario
  where id = p_grade_id
    and professor_id = v_uid
    and arquivado is false;

  return found;
end
$$;

create function public.arquivar_grade_semanal(p_grade_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.papel_atual() is distinct from 'professor' then
    return false;
  end if;

  update public.grade_semanal
  set arquivado = true
  where id = p_grade_id
    and professor_id = auth.uid()
    and arquivado is false;

  return found;
end
$$;

create function public.publicar_grade_semanal(p_publicada boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null
     or p_publicada is null then
    return false;
  end if;

  insert into public.grade_semanal_publicacao (professor_id, publicada)
  values (auth.uid(), p_publicada)
  on conflict (professor_id)
  do update set publicada = excluded.publicada;

  return true;
end
$$;

create function public.listar_grade_semanal()
returns table (
  id uuid,
  professor_id uuid,
  dias text,
  horario text,
  arquivado boolean,
  publicada boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id,
         g.professor_id,
         g.dias,
         g.horario,
         g.arquivado,
         coalesce(gp.publicada, false)
  from public.grade_semanal g
  left join public.grade_semanal_publicacao gp
    on gp.professor_id = g.professor_id
  where (
    (
      g.professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      g.arquivado is false
      and gp.publicada is true
      and (
        (
          (select public.papel_atual()) = 'aluno'
          and exists (
            select 1
            from public.vinculos v
            join public.perfis professor on professor.id = v.professor_id
            where v.aluno_id = (select auth.uid())
              and v.professor_id = g.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
        or (
          (select public.papel_atual()) = 'instrutor'
          and exists (
            select 1
            from public.instrutores_professor ip
            join public.perfis professor on professor.id = ip.professor_id
            where ip.instrutor_id = (select auth.uid())
              and ip.professor_id = g.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
      )
    )
  );
$$;

create table public.avisos (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  titulo text not null
    check (pg_catalog.char_length(pg_catalog.btrim(titulo)) between 1 and 80),
  texto text not null
    check (pg_catalog.char_length(pg_catalog.btrim(texto)) between 1 and 500),
  fixado boolean not null default false,
  arquivado boolean not null default false,
  criado_em timestamptz not null default pg_catalog.now()
);

create index avisos_professor_idx
  on public.avisos (professor_id, criado_em desc);

create table public.faq (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  pergunta text not null
    check (pg_catalog.char_length(pg_catalog.btrim(pergunta)) between 1 and 200),
  resposta text not null
    check (pg_catalog.char_length(pg_catalog.btrim(resposta)) between 1 and 500),
  ordem integer not null default 0,
  arquivado boolean not null default false,
  criado_em timestamptz not null default pg_catalog.now()
);

create index faq_professor_ordem_idx
  on public.faq (professor_id, ordem, criado_em);

alter table public.avisos enable row level security;
alter table public.faq enable row level security;
revoke all on table public.avisos, public.faq from public, anon, authenticated;
grant select on table public.avisos, public.faq to authenticated;

create policy avisos_select_vinculados
  on public.avisos for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      arquivado is false
      and (
        (
          (select public.papel_atual()) = 'aluno'
          and exists (
            select 1
            from public.vinculos v
            join public.perfis professor on professor.id = v.professor_id
            where v.aluno_id = (select auth.uid())
              and v.professor_id = avisos.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
        or (
          (select public.papel_atual()) = 'instrutor'
          and exists (
            select 1
            from public.instrutores_professor ip
            join public.perfis professor on professor.id = ip.professor_id
            where ip.instrutor_id = (select auth.uid())
              and ip.professor_id = avisos.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
      )
    )
  );

create policy faq_select_vinculados
  on public.faq for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      arquivado is false
      and (
        (
          (select public.papel_atual()) = 'aluno'
          and exists (
            select 1
            from public.vinculos v
            join public.perfis professor on professor.id = v.professor_id
            where v.aluno_id = (select auth.uid())
              and v.professor_id = faq.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
        or (
          (select public.papel_atual()) = 'instrutor'
          and exists (
            select 1
            from public.instrutores_professor ip
            join public.perfis professor on professor.id = ip.professor_id
            where ip.instrutor_id = (select auth.uid())
              and ip.professor_id = faq.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
      )
    )
  );

create function public.criar_aviso(
  p_titulo text,
  p_texto text,
  p_fixado boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_titulo text := pg_catalog.btrim(coalesce(p_titulo, ''));
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_fixado is null
     or pg_catalog.char_length(v_titulo) not between 1 and 80
     or pg_catalog.char_length(v_texto) not between 1 and 500 then
    return null;
  end if;

  insert into public.avisos (professor_id, titulo, texto, fixado)
  values (v_uid, v_titulo, v_texto, p_fixado)
  returning id into v_id;

  return v_id;
end
$$;

create function public.editar_aviso(
  p_aviso_id uuid,
  p_titulo text,
  p_texto text,
  p_fixado boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_titulo text := pg_catalog.btrim(coalesce(p_titulo, ''));
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_aviso_id is null
     or p_fixado is null
     or pg_catalog.char_length(v_titulo) not between 1 and 80
     or pg_catalog.char_length(v_texto) not between 1 and 500 then
    return false;
  end if;

  update public.avisos
  set titulo = v_titulo,
      texto = v_texto,
      fixado = p_fixado
  where id = p_aviso_id
    and professor_id = v_uid
    and arquivado is false;

  return found;
end
$$;

create function public.arquivar_aviso(p_aviso_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.papel_atual() is distinct from 'professor' then
    return false;
  end if;

  update public.avisos
  set arquivado = true
  where id = p_aviso_id
    and professor_id = auth.uid()
    and arquivado is false;

  return found;
end
$$;

create function public.listar_avisos()
returns table (
  id uuid,
  professor_id uuid,
  titulo text,
  texto text,
  fixado boolean,
  arquivado boolean,
  criado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
begin
  if v_uid is null or v_papel not in ('professor', 'aluno', 'instrutor') then
    return;
  end if;

  return query
  select a.id, a.professor_id, a.titulo, a.texto, a.fixado, a.arquivado, a.criado_em
  from public.avisos a
  where (
    (v_papel = 'professor' and a.professor_id = v_uid)
    or (
      v_papel in ('aluno', 'instrutor')
      and a.arquivado is false
      and (
        exists (
          select 1
          from public.vinculos v
          join public.perfis professor on professor.id = v.professor_id
          where v_papel = 'aluno'
            and v.aluno_id = v_uid
            and v.professor_id = a.professor_id
            and professor.papel = 'professor'
            and professor.ativo is true
        )
        or exists (
          select 1
          from public.instrutores_professor ip
          join public.perfis professor on professor.id = ip.professor_id
          where v_papel = 'instrutor'
            and ip.instrutor_id = v_uid
            and ip.professor_id = a.professor_id
            and professor.papel = 'professor'
            and professor.ativo is true
        )
      )
    )
  )
  order by a.fixado desc, a.criado_em desc, a.id;
end
$$;

create function public.criar_faq(
  p_pergunta text,
  p_resposta text,
  p_ordem integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_pergunta text := pg_catalog.btrim(coalesce(p_pergunta, ''));
  v_resposta text := pg_catalog.btrim(coalesce(p_resposta, ''));
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_ordem is null
     or pg_catalog.char_length(v_pergunta) not between 1 and 200
     or pg_catalog.char_length(v_resposta) not between 1 and 500 then
    return null;
  end if;

  insert into public.faq (professor_id, pergunta, resposta, ordem)
  values (v_uid, v_pergunta, v_resposta, p_ordem)
  returning id into v_id;

  return v_id;
end
$$;

create function public.editar_faq(
  p_faq_id uuid,
  p_pergunta text,
  p_resposta text,
  p_ordem integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_pergunta text := pg_catalog.btrim(coalesce(p_pergunta, ''));
  v_resposta text := pg_catalog.btrim(coalesce(p_resposta, ''));
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_faq_id is null
     or p_ordem is null
     or pg_catalog.char_length(v_pergunta) not between 1 and 200
     or pg_catalog.char_length(v_resposta) not between 1 and 500 then
    return false;
  end if;

  update public.faq
  set pergunta = v_pergunta,
      resposta = v_resposta,
      ordem = p_ordem
  where id = p_faq_id
    and professor_id = v_uid
    and arquivado is false;

  return found;
end
$$;

create function public.arquivar_faq(p_faq_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.papel_atual() is distinct from 'professor' then
    return false;
  end if;

  update public.faq
  set arquivado = true
  where id = p_faq_id
    and professor_id = auth.uid()
    and arquivado is false;

  return found;
end
$$;

create function public.listar_faq()
returns table (
  id uuid,
  professor_id uuid,
  pergunta text,
  resposta text,
  ordem integer,
  arquivado boolean,
  criado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
begin
  if v_uid is null or v_papel not in ('professor', 'aluno', 'instrutor') then
    return;
  end if;

  return query
  select f.id, f.professor_id, f.pergunta, f.resposta, f.ordem, f.arquivado, f.criado_em
  from public.faq f
  where (
    (v_papel = 'professor' and f.professor_id = v_uid)
    or (
      v_papel in ('aluno', 'instrutor')
      and f.arquivado is false
      and (
        exists (
          select 1
          from public.vinculos v
          join public.perfis professor on professor.id = v.professor_id
          where v_papel = 'aluno'
            and v.aluno_id = v_uid
            and v.professor_id = f.professor_id
            and professor.papel = 'professor'
            and professor.ativo is true
        )
        or exists (
          select 1
          from public.instrutores_professor ip
          join public.perfis professor on professor.id = ip.professor_id
          where v_papel = 'instrutor'
            and ip.instrutor_id = v_uid
            and ip.professor_id = f.professor_id
            and professor.papel = 'professor'
            and professor.ativo is true
        )
      )
    )
  )
  order by f.ordem, f.criado_em, f.id;
end
$$;

revoke all on function public.criar_grade_semanal(text, text) from public, anon, authenticated;
revoke all on function public.editar_grade_semanal(uuid, text, text) from public, anon, authenticated;
revoke all on function public.arquivar_grade_semanal(uuid) from public, anon, authenticated;
revoke all on function public.publicar_grade_semanal(boolean) from public, anon, authenticated;
revoke all on function public.listar_grade_semanal() from public, anon, authenticated;
grant execute on function public.criar_grade_semanal(text, text) to authenticated;
grant execute on function public.editar_grade_semanal(uuid, text, text) to authenticated;
grant execute on function public.arquivar_grade_semanal(uuid) to authenticated;
grant execute on function public.publicar_grade_semanal(boolean) to authenticated;
grant execute on function public.listar_grade_semanal() to authenticated;
revoke all on function public.criar_aviso(text, text, boolean) from public, anon, authenticated;
revoke all on function public.editar_aviso(uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function public.arquivar_aviso(uuid) from public, anon, authenticated;
revoke all on function public.listar_avisos() from public, anon, authenticated;
revoke all on function public.criar_faq(text, text, integer) from public, anon, authenticated;
revoke all on function public.editar_faq(uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.arquivar_faq(uuid) from public, anon, authenticated;
revoke all on function public.listar_faq() from public, anon, authenticated;
grant execute on function public.criar_aviso(text, text, boolean) to authenticated;
grant execute on function public.editar_aviso(uuid, text, text, boolean) to authenticated;
grant execute on function public.arquivar_aviso(uuid) to authenticated;
grant execute on function public.listar_avisos() to authenticated;
grant execute on function public.criar_faq(text, text, integer) to authenticated;
grant execute on function public.editar_faq(uuid, text, text, integer) to authenticated;
grant execute on function public.arquivar_faq(uuid) to authenticated;
grant execute on function public.listar_faq() to authenticated;

commit;
