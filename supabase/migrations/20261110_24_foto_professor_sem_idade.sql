-- RASCUNHO - NÃO EXECUTAR; aguarda revisão e autorização do Aylton.
begin;

create or replace function public.pode_editar_foto_professor(p_professor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
    and exists (
      select 1
      from public.perfis p
      where p.id = p_professor_id
        and p.papel = 'professor'
        and p.ativo
    );
$$;

revoke all on function public.pode_editar_foto_professor(uuid)
  from public, anon, authenticated;
grant execute on function public.pode_editar_foto_professor(uuid) to authenticated;

commit;
