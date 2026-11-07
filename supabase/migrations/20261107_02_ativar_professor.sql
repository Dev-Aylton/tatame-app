-- TATAME · SQL parte 2A · ativação do professor (só conta Google com e-mail confirmado)
begin;

create function public.ativar_professor()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_academia uuid;
begin
  if v_uid is null then
    return false;
  end if;

  select lower(btrim(u.email)) into v_email
  from auth.users u
  where u.id = v_uid
    and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
    );

  if v_email is null then
    return false;
  end if;

  if exists (select 1 from public.perfis p where p.id = v_uid) then
    return false;
  end if;

  select c.academia_id into v_academia
  from public.professores_convidados c
  where c.email = v_email and c.status = 'convidado'
  for update;

  if v_academia is null then
    return false;
  end if;

  insert into public.perfis (id, papel, academia_id)
  values (v_uid, 'professor', v_academia);

  update public.professores_convidados
  set status = 'ativo', perfil_id = v_uid
  where email = v_email;

  return true;
end
$$;

revoke all on function public.ativar_professor() from public, anon, authenticated;
grant execute on function public.ativar_professor() to authenticated;

commit;
