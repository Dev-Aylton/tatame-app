-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 05 · alunos sem conta
-- Suposições não confirmadas:
-- - Cada aluno sem conta pertence a um único Professor ativo.
-- - A idade usa apenas nao_declarada, adulto ou menor; não se armazena data de nascimento.
-- - O Professor consulta seus próprios registros; toda escrita passa por funções.
-- - A role proprietária das funções SECURITY DEFINER pode escrever na tabela, sem RLS forçada.
begin;

create table public.alunos_sem_conta (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 80),
  idade_declarada text not null default 'nao_declarada'
    check (idade_declarada in ('nao_declarada', 'adulto', 'menor')),
  criado_em timestamptz not null default now()
);

create index alunos_sem_conta_professor_idx
  on public.alunos_sem_conta (professor_id, criado_em desc);

alter table public.alunos_sem_conta enable row level security;

create policy alunos_sem_conta_select_professor
  on public.alunos_sem_conta for select to authenticated
  using (
    professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
  );

revoke all on table public.alunos_sem_conta from anon, authenticated;
grant select on table public.alunos_sem_conta to authenticated;

create function public.criar_aluno_sem_conta(
  p_nome text,
  p_idade_declarada text default 'nao_declarada'
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_nome text := btrim(coalesce(p_nome, ''));
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or char_length(v_nome) not between 1 and 80
     or p_idade_declarada is null
     or p_idade_declarada not in ('nao_declarada', 'adulto', 'menor') then
    return null;
  end if;

  insert into public.alunos_sem_conta (professor_id, nome, idade_declarada)
  values (v_uid, v_nome, p_idade_declarada)
  returning id into v_id;

  return v_id;
end
$$;

create function public.atualizar_idade_aluno_sem_conta(
  p_aluno_id uuid,
  p_idade_declarada text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or p_idade_declarada is null
     or p_idade_declarada not in ('nao_declarada', 'adulto', 'menor') then
    return false;
  end if;

  update public.alunos_sem_conta
  set idade_declarada = p_idade_declarada
  where id = p_aluno_id and professor_id = auth.uid();

  return found;
end
$$;

revoke all on function public.criar_aluno_sem_conta(text, text) from public, anon, authenticated;
revoke all on function public.atualizar_idade_aluno_sem_conta(uuid, text) from public, anon, authenticated;
grant execute on function public.criar_aluno_sem_conta(text, text) to authenticated;
grant execute on function public.atualizar_idade_aluno_sem_conta(uuid, text) to authenticated;

commit;
