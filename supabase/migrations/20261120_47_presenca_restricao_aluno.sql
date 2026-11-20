begin;

create or replace function public.marcar_presenca_aluno(p_data_aula date default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_professor_id uuid;
  v_data_aula date := coalesce(p_data_aula, current_date);
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'aluno'
     or v_data_aula is distinct from current_date then
    return null;
  end if;

  select vinculo.professor_id
    into v_professor_id
  from public.vinculos vinculo
  join public.perfis aluno on aluno.id = vinculo.aluno_id
  where vinculo.aluno_id = v_uid
    and aluno.papel = 'aluno'
    and aluno.ativo is true;

  if v_professor_id is null then
    return null;
  end if;

  insert into public.presencas (aluno_id, professor_id, data_aula)
  values (v_uid, v_professor_id, v_data_aula)
  on conflict (aluno_id, professor_id, data_aula) do nothing;

  select presenca.id
    into v_id
  from public.presencas presenca
  where presenca.aluno_id = v_uid
    and presenca.professor_id = v_professor_id
    and presenca.data_aula = v_data_aula;

  return v_id;
end
$$;

create or replace function public.listar_presencas_aluno()
returns table (
  id uuid,
  data_aula date,
  marcado_em timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select presenca.id, presenca.data_aula, presenca.marcado_em
  from public.presencas presenca
  where presenca.aluno_id = (select auth.uid())
    and (select public.papel_atual()) = 'aluno'
  order by presenca.data_aula desc, presenca.marcado_em desc;
$$;

revoke all on function public.marcar_presenca_aluno(date) from public, anon, authenticated;
revoke all on function public.listar_presencas_aluno() from public, anon, authenticated;
grant execute on function public.marcar_presenca_aluno(date) to authenticated;
grant execute on function public.listar_presencas_aluno() to authenticated;

commit;
