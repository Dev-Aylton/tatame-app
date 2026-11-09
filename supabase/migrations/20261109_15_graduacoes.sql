begin;

create table public.graduacoes (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  aluno_id uuid not null references public.perfis (id) on delete restrict,
  professor_id uuid not null references public.perfis (id) on delete restrict,
  faixa text not null,
  grau integer not null,
  data_graduacao date not null,
  observacao text,
  criado_em timestamptz not null default pg_catalog.now(),
  constraint graduacoes_faixa_grau_check check (
    (faixa in ('Branca', 'Azul', 'Roxa', 'Marrom') and grau between 0 and 4)
    or (faixa = 'Preta' and grau between 0 and 6)
    or (faixa = 'Coral vermelha e preta' and grau = 7)
    or (faixa = 'Coral vermelha e branca' and grau = 8)
    or (faixa = 'Vermelha' and grau between 9 and 10)
  ),
  constraint graduacoes_observacao_check check (
    observacao is null or pg_catalog.char_length(observacao) <= 200
  )
);

alter table public.graduacoes enable row level security;

revoke all on table public.graduacoes from public, anon, authenticated;
grant select on table public.graduacoes to authenticated;

create policy graduacoes_select_aluno on public.graduacoes
  for select to authenticated
  using (
    aluno_id = (select auth.uid())
    and (select public.papel_atual()) = 'aluno'
  );

create policy graduacoes_select_professor on public.graduacoes
  for select to authenticated
  using (
    (select public.papel_atual()) = 'professor'
    and exists (
      select 1
      from public.vinculos as v
      where v.aluno_id = graduacoes.aluno_id
        and v.professor_id = (select auth.uid())
    )
  );

create function public.atribuir_graduacao(
  p_aluno_id uuid,
  p_faixa text,
  p_grau integer,
  p_data_graduacao date,
  p_observacao text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_graduacao_id uuid;
begin
  if v_uid is null or public.papel_atual() is distinct from 'professor' then
    raise exception 'Somente Professor ativo pode atribuir graduações.';
  end if;

  if p_aluno_id is null then
    raise exception 'Informe um aluno válido.';
  end if;

  if p_faixa is null or p_grau is null or not (
    (p_faixa in ('Branca', 'Azul', 'Roxa', 'Marrom') and p_grau between 0 and 4)
    or (p_faixa = 'Preta' and p_grau between 0 and 6)
    or (p_faixa = 'Coral vermelha e preta' and p_grau = 7)
    or (p_faixa = 'Coral vermelha e branca' and p_grau = 8)
    or (p_faixa = 'Vermelha' and p_grau between 9 and 10)
  ) then
    raise exception 'Faixa ou grau inválido.';
  end if;

  if p_data_graduacao is null or p_data_graduacao > current_date then
    raise exception 'A data da graduação não pode ser futura.';
  end if;

  if p_observacao is not null and pg_catalog.char_length(p_observacao) > 200 then
    raise exception 'A observação deve ter no máximo 200 caracteres.';
  end if;

  if not exists (
    select 1
    from public.vinculos as v
    join public.perfis as professor on professor.id = v.professor_id
    join public.perfis as aluno on aluno.id = v.aluno_id
    where v.aluno_id = p_aluno_id
      and v.professor_id = v_uid
      and professor.papel = 'professor'
      and professor.ativo is true
      and aluno.papel = 'aluno'
  ) then
    raise exception 'O aluno não está vinculado a este Professor ativo.';
  end if;

  insert into public.graduacoes (
    aluno_id,
    professor_id,
    faixa,
    grau,
    data_graduacao,
    observacao
  )
  values (
    p_aluno_id,
    v_uid,
    p_faixa,
    p_grau,
    p_data_graduacao,
    p_observacao
  )
  returning id into v_graduacao_id;

  return v_graduacao_id;
end;
$$;

revoke all on function public.atribuir_graduacao(uuid, text, integer, date, text)
  from public, anon, authenticated;
grant execute on function public.atribuir_graduacao(uuid, text, integer, date, text)
  to authenticated;

commit;
