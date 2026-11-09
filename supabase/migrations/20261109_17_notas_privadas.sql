-- RASCUNHO — NÃO EXECUTADA; aguarda revisão do Claude e autorização do Aylton
begin;

create table public.notas_privadas (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  aluno_id uuid references public.perfis (id) on delete cascade,
  aluno_sem_conta_id uuid references public.alunos_sem_conta (id) on delete cascade,
  texto text not null check (pg_catalog.char_length(pg_catalog.btrim(texto)) between 1 and 500),
  criado_em date not null default current_date,
  constraint notas_privadas_alvo_check
    check ((aluno_id is not null) <> (aluno_sem_conta_id is not null))
);

create index notas_privadas_professor_aluno_idx
  on public.notas_privadas (professor_id, aluno_id, criado_em desc);
create index notas_privadas_professor_sem_conta_idx
  on public.notas_privadas (professor_id, aluno_sem_conta_id, criado_em desc);

alter table public.notas_privadas enable row level security;
revoke all on table public.notas_privadas from public, anon, authenticated;
grant select on table public.notas_privadas to authenticated;

create policy notas_privadas_select_professor
  on public.notas_privadas for select to authenticated
  using (
    professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
  );

create function public.salvar_nota_privada(
  p_aluno_id uuid,
  p_aluno_sem_conta_id uuid,
  p_texto text
)
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
     or (p_aluno_id is null) = (p_aluno_sem_conta_id is null)
     or pg_catalog.char_length(v_texto) not between 1 and 500 then
    return null;
  end if;

  if p_aluno_id is not null and not exists (
    select 1
    from public.vinculos v
    join public.perfis aluno on aluno.id = v.aluno_id
    where v.aluno_id = p_aluno_id
      and v.professor_id = v_uid
      and aluno.papel = 'aluno'
      and aluno.ativo is true
  ) then
    return null;
  end if;

  if p_aluno_sem_conta_id is not null and not exists (
    select 1
    from public.alunos_sem_conta a
    where a.id = p_aluno_sem_conta_id
      and a.professor_id = v_uid
  ) then
    return null;
  end if;

  insert into public.notas_privadas (
    professor_id, aluno_id, aluno_sem_conta_id, texto
  )
  values (
    v_uid, p_aluno_id, p_aluno_sem_conta_id, v_texto
  )
  returning id into v_id;

  return v_id;
end
$$;

create function public.excluir_nota_privada(p_nota_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.papel_atual() is distinct from 'professor' then
    return false;
  end if;

  delete from public.notas_privadas n
  where n.id = p_nota_id
    and n.professor_id = auth.uid();

  return found;
end
$$;

create function public.listar_notas_privadas(
  p_aluno_id uuid,
  p_aluno_sem_conta_id uuid
)
returns table (
  id uuid,
  aluno_id uuid,
  aluno_sem_conta_id uuid,
  nome_aluno text,
  texto text,
  criado_em date
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or (p_aluno_id is null) = (p_aluno_sem_conta_id is null) then
    return;
  end if;

  return query
  select n.id,
         n.aluno_id,
         n.aluno_sem_conta_id,
         coalesce(p.nome, a.nome, 'Aluno sem nome')::text,
         n.texto,
         n.criado_em
  from public.notas_privadas n
  left join public.perfis p
    on p.id = n.aluno_id
  left join public.alunos_sem_conta a
    on a.id = n.aluno_sem_conta_id
  where n.professor_id = v_uid
    and (
      (n.aluno_id = p_aluno_id and p.id is not null)
      or (n.aluno_sem_conta_id = p_aluno_sem_conta_id and a.id is not null)
    )
  order by n.criado_em desc, n.id desc;
end
$$;

revoke all on function public.salvar_nota_privada(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.excluir_nota_privada(uuid) from public, anon, authenticated;
revoke all on function public.listar_notas_privadas(uuid, uuid) from public, anon, authenticated;
grant execute on function public.salvar_nota_privada(uuid, uuid, text) to authenticated;
grant execute on function public.excluir_nota_privada(uuid) to authenticated;
grant execute on function public.listar_notas_privadas(uuid, uuid) to authenticated;

commit;
