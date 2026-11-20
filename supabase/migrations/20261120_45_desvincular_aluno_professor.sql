-- NÃO EXECUTAR PELO COPILOT; revisar e aplicar manualmente.
-- Preserva o estado do vínculo antes de removê-lo, sem apagar os históricos
-- de cobranças, pagamentos, graduações, conversas, feedbacks ou metas.
begin;

create table public.historico_vinculos (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  aluno_id uuid not null,
  professor_id uuid not null,
  academia_id uuid,
  vinculo_criado_em timestamptz not null,
  status text check (status is null or status = 'locked'),
  trancado_desde date,
  trancado_ate date,
  executado_por uuid not null,
  desvinculado_em timestamptz not null default pg_catalog.now()
);

create index historico_vinculos_aluno_idx
  on public.historico_vinculos (aluno_id, desvinculado_em desc);

create index historico_vinculos_professor_idx
  on public.historico_vinculos (professor_id, desvinculado_em desc);

alter table public.historico_vinculos enable row level security;
revoke all on table public.historico_vinculos from public, anon, authenticated;

create function public.desvincular_aluno_professor(p_aluno_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_academia_id uuid;
  v_vinculo_criado_em timestamptz;
  v_status text;
  v_trancado_desde date;
  v_trancado_ate date;
begin
  if v_uid is null
     or p_aluno_id is null
     or public.papel_atual() is distinct from 'professor' then
    return false;
  end if;

  select professor.academia_id
    into v_academia_id
  from public.perfis professor
  where professor.id = v_uid
    and professor.papel = 'professor'
    and professor.ativo is true
    and professor.academia_id is not null;

  if not found then
    return false;
  end if;

  select vinculo.criado_em,
         vinculo.status,
         vinculo.trancado_desde,
         vinculo.trancado_ate
    into v_vinculo_criado_em,
         v_status,
         v_trancado_desde,
         v_trancado_ate
  from public.vinculos vinculo
  join public.perfis aluno on aluno.id = vinculo.aluno_id
  where vinculo.aluno_id = p_aluno_id
    and vinculo.professor_id = v_uid
    and aluno.papel = 'aluno'
    and aluno.ativo is true
  for update of vinculo, aluno;

  if not found then
    return false;
  end if;

  delete from public.vinculos vinculo
  where vinculo.aluno_id = p_aluno_id
    and vinculo.professor_id = v_uid;

  if not found then
    return false;
  end if;

  insert into public.historico_vinculos (
    aluno_id,
    professor_id,
    academia_id,
    vinculo_criado_em,
    status,
    trancado_desde,
    trancado_ate,
    executado_por
  )
  values (
    p_aluno_id,
    v_uid,
    v_academia_id,
    v_vinculo_criado_em,
    v_status,
    v_trancado_desde,
    v_trancado_ate,
    v_uid
  );

  update public.perfis aluno
  set academia_id = null
  where aluno.id = p_aluno_id
    and aluno.papel = 'aluno'
    and not exists (
      select 1
      from public.vinculos vinculo
      where vinculo.aluno_id = p_aluno_id
    );

  return true;
end
$$;

revoke all on function public.desvincular_aluno_professor(uuid)
  from public, anon, authenticated;
grant execute on function public.desvincular_aluno_professor(uuid)
  to authenticated;

commit;
