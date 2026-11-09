-- RASCUNHO — NÃO EXECUTADA; aguarda revisão do Claude e autorização do Aylton
begin;

create table public.conversas_professor (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  participante_id uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default pg_catalog.now(),
  constraint conversas_professor_participantes_check
    check (professor_id <> participante_id),
  constraint conversas_professor_participantes_unique
    unique (professor_id, participante_id)
);

create index conversas_professor_professor_idx
  on public.conversas_professor (professor_id, criado_em desc);

create table public.mensagens_professor (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  conversa_id uuid not null
    references public.conversas_professor (id) on delete cascade,
  remetente_id uuid not null references public.perfis (id) on delete cascade,
  texto text not null check (pg_catalog.char_length(pg_catalog.btrim(texto)) > 0),
  enviado_em timestamptz not null default pg_catalog.now()
);

create index mensagens_professor_conversa_idx
  on public.mensagens_professor (conversa_id, enviado_em, id);

alter table public.conversas_professor enable row level security;
alter table public.mensagens_professor enable row level security;
revoke all on table public.conversas_professor, public.mensagens_professor
  from public, anon, authenticated;
grant select on table public.conversas_professor, public.mensagens_professor
  to authenticated;

create policy conversas_professor_select_participantes
  on public.conversas_professor for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
      and (
        exists (
          select 1
          from public.vinculos v
          join public.perfis aluno on aluno.id = v.aluno_id
          where v.professor_id = conversas_professor.professor_id
            and v.aluno_id = conversas_professor.participante_id
            and aluno.papel = 'aluno'
            and aluno.ativo is true
        )
        or exists (
          select 1
          from public.instrutores_professor ip
          join public.perfis instrutor on instrutor.id = ip.instrutor_id
          where ip.professor_id = conversas_professor.professor_id
            and ip.instrutor_id = conversas_professor.participante_id
            and instrutor.papel = 'instrutor'
            and instrutor.ativo is true
        )
      )
    )
    or (
      participante_id = (select auth.uid())
      and (
        (
          (select public.papel_atual()) = 'aluno'
          and exists (
            select 1
            from public.vinculos v
            join public.perfis professor on professor.id = v.professor_id
            where v.aluno_id = conversas_professor.participante_id
              and v.professor_id = conversas_professor.professor_id
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
            where ip.instrutor_id = conversas_professor.participante_id
              and ip.professor_id = conversas_professor.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
      )
    )
  );

create policy mensagens_professor_select_participantes
  on public.mensagens_professor for select to authenticated
  using (
    remetente_id in (
      select c.professor_id
      from public.conversas_professor c
      where c.id = mensagens_professor.conversa_id
      union
      select c.participante_id
      from public.conversas_professor c
      where c.id = mensagens_professor.conversa_id
    )
    and exists (
      select 1
      from public.conversas_professor c
      where c.id = mensagens_professor.conversa_id
        and (
          c.professor_id = (select auth.uid())
          or c.participante_id = (select auth.uid())
        )
    )
  );

create function public.criar_conversa_professor(
  p_destinatario_id uuid,
  p_texto text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
  v_professor_id uuid;
  v_participante_id uuid;
  v_conversa_id uuid;
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
begin
  if v_uid is null or pg_catalog.char_length(v_texto) = 0 then
    return null;
  end if;

  if v_papel = 'professor' then
    v_professor_id := v_uid;
    v_participante_id := p_destinatario_id;
  elsif v_papel in ('aluno', 'instrutor') then
    v_professor_id := p_destinatario_id;
    v_participante_id := v_uid;
  else
    return null;
  end if;

  if not (
    exists (
      select 1
      from public.vinculos v
      join public.perfis professor on professor.id = v.professor_id
      join public.perfis aluno on aluno.id = v.aluno_id
      where v.professor_id = v_professor_id
        and v.aluno_id = v_participante_id
        and professor.papel = 'professor'
        and professor.ativo is true
        and aluno.papel = 'aluno'
        and aluno.ativo is true
    )
    or exists (
      select 1
      from public.instrutores_professor ip
      join public.perfis professor on professor.id = ip.professor_id
      join public.perfis instrutor on instrutor.id = ip.instrutor_id
      where ip.professor_id = v_professor_id
        and ip.instrutor_id = v_participante_id
        and professor.papel = 'professor'
        and professor.ativo is true
        and instrutor.papel = 'instrutor'
        and instrutor.ativo is true
    )
  ) then
    return null;
  end if;

  insert into public.conversas_professor (professor_id, participante_id)
  values (v_professor_id, v_participante_id)
  on conflict (professor_id, participante_id)
  do update set professor_id = excluded.professor_id
  returning id into v_conversa_id;

  insert into public.mensagens_professor (conversa_id, remetente_id, texto)
  values (v_conversa_id, v_uid, v_texto);

  return v_conversa_id;
end
$$;

create function public.responder_conversa_professor(
  p_conversa_id uuid,
  p_texto text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
  v_professor_id uuid;
  v_participante_id uuid;
  v_mensagem_id uuid;
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
begin
  if v_uid is null or pg_catalog.char_length(v_texto) = 0 then
    return null;
  end if;

  select c.professor_id, c.participante_id
    into v_professor_id, v_participante_id
  from public.conversas_professor c
  where c.id = p_conversa_id
    and (c.professor_id = v_uid or c.participante_id = v_uid)
  for update;

  if not found
     or not (
       (v_papel = 'professor' and v_uid = v_professor_id)
       or (v_papel in ('aluno', 'instrutor') and v_uid = v_participante_id)
     )
     or not (
       exists (
         select 1
         from public.vinculos v
         join public.perfis professor on professor.id = v.professor_id
         join public.perfis aluno on aluno.id = v.aluno_id
         where v.professor_id = v_professor_id
           and v.aluno_id = v_participante_id
           and professor.papel = 'professor'
           and professor.ativo is true
           and aluno.papel = 'aluno'
           and aluno.ativo is true
       )
       or exists (
         select 1
         from public.instrutores_professor ip
         join public.perfis professor on professor.id = ip.professor_id
         join public.perfis instrutor on instrutor.id = ip.instrutor_id
         where ip.professor_id = v_professor_id
           and ip.instrutor_id = v_participante_id
           and professor.papel = 'professor'
           and professor.ativo is true
           and instrutor.papel = 'instrutor'
           and instrutor.ativo is true
       )
     ) then
    return null;
  end if;

  insert into public.mensagens_professor (conversa_id, remetente_id, texto)
  values (p_conversa_id, v_uid, v_texto)
  returning id into v_mensagem_id;

  return v_mensagem_id;
end
$$;

create function public.listar_conversas_professor()
returns table (
  conversa_id uuid,
  professor_id uuid,
  participante_id uuid,
  participante_nome text,
  mensagem_id uuid,
  remetente_id uuid,
  texto text,
  enviado_em timestamptz
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
  if v_uid is null or v_papel is null or v_papel not in ('professor', 'aluno', 'instrutor') then
    return;
  end if;

  return query
  select c.id,
         c.professor_id,
         c.participante_id,
         coalesce(participante.nome, 'Aluno sem nome')::text,
         m.id,
         m.remetente_id,
         m.texto,
         m.enviado_em
  from public.conversas_professor c
  join public.perfis participante on participante.id = c.participante_id
  join public.mensagens_professor m on m.conversa_id = c.id
  where (
    (v_papel = 'professor' and c.professor_id = v_uid)
    or (v_papel in ('aluno', 'instrutor') and c.participante_id = v_uid)
  )
    and (
      exists (
        select 1
        from public.vinculos v
        join public.perfis professor on professor.id = v.professor_id
        join public.perfis aluno on aluno.id = v.aluno_id
        where v.professor_id = c.professor_id
          and v.aluno_id = c.participante_id
          and professor.papel = 'professor'
          and professor.ativo is true
          and aluno.papel = 'aluno'
          and aluno.ativo is true
      )
      or exists (
        select 1
        from public.instrutores_professor ip
        join public.perfis professor on professor.id = ip.professor_id
        join public.perfis instrutor on instrutor.id = ip.instrutor_id
        where ip.professor_id = c.professor_id
          and ip.instrutor_id = c.participante_id
          and professor.papel = 'professor'
          and professor.ativo is true
          and instrutor.papel = 'instrutor'
          and instrutor.ativo is true
      )
    )
  order by c.criado_em desc, m.enviado_em, m.id;
end
$$;

revoke all on function public.criar_conversa_professor(uuid, text) from public, anon, authenticated;
revoke all on function public.responder_conversa_professor(uuid, text) from public, anon, authenticated;
revoke all on function public.listar_conversas_professor() from public, anon, authenticated;
grant execute on function public.criar_conversa_professor(uuid, text) to authenticated;
grant execute on function public.responder_conversa_professor(uuid, text) to authenticated;
grant execute on function public.listar_conversas_professor() to authenticated;

create table public.feedbacks (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  texto text not null
    check (pg_catalog.char_length(pg_catalog.btrim(texto)) between 1 and 500),
  criado_em timestamptz not null default pg_catalog.now()
);

create index feedbacks_professor_aluno_idx
  on public.feedbacks (professor_id, aluno_id, criado_em desc);

create table public.metas (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  texto text not null
    check (pg_catalog.char_length(pg_catalog.btrim(texto)) between 1 and 200),
  status text not null default 'aberta'
    check (status in ('aberta', 'cumprida')),
  criado_em timestamptz not null default pg_catalog.now(),
  atualizado_em timestamptz not null default pg_catalog.now()
);

create index metas_professor_aluno_idx
  on public.metas (professor_id, aluno_id, criado_em desc);

alter table public.feedbacks enable row level security;
alter table public.metas enable row level security;
revoke all on table public.feedbacks, public.metas from public, anon, authenticated;
grant select on table public.feedbacks, public.metas to authenticated;

create policy feedbacks_select_professor_aluno
  on public.feedbacks for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      aluno_id = (select auth.uid())
      and (select public.papel_atual()) = 'aluno'
    )
  );

create policy metas_select_professor_aluno
  on public.metas for select to authenticated
  using (
    (
      professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      aluno_id = (select auth.uid())
      and (select public.papel_atual()) = 'aluno'
    )
  );

create function public.criar_feedback(p_aluno_id uuid, p_texto text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_aluno_id is null
     or pg_catalog.char_length(v_texto) not between 1 and 500
     or not exists (
       select 1
       from public.vinculos v
       join public.perfis aluno on aluno.id = v.aluno_id
       where v.professor_id = v_uid
         and v.aluno_id = p_aluno_id
         and aluno.papel = 'aluno'
         and aluno.ativo is true
     ) then
    return null;
  end if;

  insert into public.feedbacks (professor_id, aluno_id, texto)
  values (v_uid, p_aluno_id, v_texto)
  returning id into v_id;

  return v_id;
end
$$;

create function public.listar_feedbacks(p_aluno_id uuid default null)
returns table (
  id uuid,
  professor_id uuid,
  aluno_id uuid,
  texto text,
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
  if v_uid is null or v_papel is null or v_papel not in ('professor', 'aluno') then
    return;
  end if;

  return query
  select f.id, f.professor_id, f.aluno_id, f.texto, f.criado_em
  from public.feedbacks f
  where (
    (v_papel = 'professor' and f.professor_id = v_uid
      and (p_aluno_id is null or f.aluno_id = p_aluno_id))
    or (v_papel = 'aluno' and f.aluno_id = v_uid)
  )
  order by f.criado_em, f.id;
end
$$;

create function public.criar_meta(p_aluno_id uuid, p_texto text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_aluno_id is null
     or pg_catalog.char_length(v_texto) not between 1 and 200
     or not exists (
       select 1
       from public.vinculos v
       join public.perfis aluno on aluno.id = v.aluno_id
       where v.professor_id = v_uid
         and v.aluno_id = p_aluno_id
         and aluno.papel = 'aluno'
         and aluno.ativo is true
     ) then
    return null;
  end if;

  insert into public.metas (professor_id, aluno_id, texto)
  values (v_uid, p_aluno_id, v_texto)
  returning id into v_id;

  return v_id;
end
$$;

create function public.atualizar_status_meta(p_meta_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or p_meta_id is null
     or p_status is null
     or p_status not in ('aberta', 'cumprida') then
    return false;
  end if;

  update public.metas
  set status = p_status,
      atualizado_em = pg_catalog.now()
  where id = p_meta_id
    and professor_id = auth.uid();

  return found;
end
$$;

create function public.listar_metas(p_aluno_id uuid default null)
returns table (
  id uuid,
  professor_id uuid,
  aluno_id uuid,
  texto text,
  status text,
  criado_em timestamptz,
  atualizado_em timestamptz
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
  if v_uid is null or v_papel is null or v_papel not in ('professor', 'aluno') then
    return;
  end if;

  return query
  select m.id, m.professor_id, m.aluno_id, m.texto, m.status, m.criado_em, m.atualizado_em
  from public.metas m
  where (
    (v_papel = 'professor' and m.professor_id = v_uid
      and (p_aluno_id is null or m.aluno_id = p_aluno_id))
    or (v_papel = 'aluno' and m.aluno_id = v_uid)
  )
  order by m.criado_em, m.id;
end
$$;

revoke all on function public.criar_feedback(uuid, text) from public, anon, authenticated;
revoke all on function public.listar_feedbacks(uuid) from public, anon, authenticated;
revoke all on function public.criar_meta(uuid, text) from public, anon, authenticated;
revoke all on function public.atualizar_status_meta(uuid, text) from public, anon, authenticated;
revoke all on function public.listar_metas(uuid) from public, anon, authenticated;
grant execute on function public.criar_feedback(uuid, text) to authenticated;
grant execute on function public.listar_feedbacks(uuid) to authenticated;
grant execute on function public.criar_meta(uuid, text) to authenticated;
grant execute on function public.atualizar_status_meta(uuid, text) to authenticated;
grant execute on function public.listar_metas(uuid) to authenticated;

commit;
