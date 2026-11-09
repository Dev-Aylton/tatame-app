begin;

create function public.listar_alunos_do_instrutor()
returns table (aluno_id uuid, nome text)
language sql
stable
security definer
set search_path = ''
as $$
  select aluno_vinculo.aluno_id,
         coalesce(aluno.nome, 'Aluno sem nome')::text
  from public.vinculos as vinculo_instrutor
  join public.vinculos as aluno_vinculo
    on aluno_vinculo.professor_id = vinculo_instrutor.professor_id
  join public.perfis as aluno
    on aluno.id = aluno_vinculo.aluno_id
  where vinculo_instrutor.aluno_id = (select auth.uid())
    and (select public.papel_atual()) = 'instrutor'
    and aluno.papel = 'aluno'
    and aluno.ativo is true
  order by coalesce(aluno.nome, 'Aluno sem nome');
$$;

revoke all on function public.listar_alunos_do_instrutor() from public, anon, authenticated;
grant execute on function public.listar_alunos_do_instrutor() to authenticated;

commit;
