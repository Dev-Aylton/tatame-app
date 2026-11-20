-- Converte contas Google de Aluno existentes quando o Adm registra o e-mail.
begin;

create function public.aplicar_convite_professor_existente(
  p_email text,
  p_academia_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil_id uuid;
  v_papel text;
  v_academia_id uuid;
  v_ativo boolean;
  v_google boolean;
begin
  if auth.uid() is not null and public.papel_atual() is distinct from 'adm' then
    raise exception using errcode = '42501', message = 'adm_required';
  end if;

  select u.id,
         exists (
           select 1
           from auth.identities i
           where i.user_id = u.id and i.provider = 'google'
         )
    into v_perfil_id, v_google
  from auth.users u
  where pg_catalog.lower(pg_catalog.btrim(u.email)) = p_email
    and u.email_confirmed_at is not null;

  if v_perfil_id is null then
    return 'conta_inexistente';
  end if;

  select p.papel, p.academia_id, p.ativo
    into v_papel, v_academia_id, v_ativo
  from public.perfis p
  where p.id = v_perfil_id
  for update;

  if not found then
    return 'perfil_inexistente';
  end if;

  if v_google is not true then
    raise exception using errcode = 'P0001', message = 'google_identity_required';
  end if;

  if v_papel = 'aluno' then
    update public.perfis
    set papel = 'professor',
        academia_id = p_academia_id,
        ativo = true
    where id = v_perfil_id;
  elsif v_papel = 'professor' then
    if v_academia_id is distinct from p_academia_id or v_ativo is not true then
      raise exception using errcode = 'P0001', message = 'professor_incompativel';
    end if;
  else
    raise exception using errcode = 'P0001', message = 'papel_incompativel';
  end if;

  update public.professores_convidados
  set status = 'ativo',
      perfil_id = v_perfil_id
  where email = p_email
    and academia_id = p_academia_id
    and status = 'convidado';

  if not found then
    raise exception using errcode = 'P0001', message = 'convite_inexistente';
  end if;

  return 'ativo';
end
$$;

revoke all on function public.aplicar_convite_professor_existente(text, uuid)
  from public, anon, authenticated;

create function public.professores_convidados_ativar_perfil_existente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.aplicar_convite_professor_existente(new.email, new.academia_id);
  return new;
end
$$;

revoke all on function public.professores_convidados_ativar_perfil_existente()
  from public, anon, authenticated;

create trigger professores_convidados_ativar_perfil_existente
after insert on public.professores_convidados
for each row
execute function public.professores_convidados_ativar_perfil_existente();

do $$
declare
  v_convite record;
begin
  for v_convite in
    select c.email, c.academia_id
    from public.professores_convidados c
    join auth.users u
      on pg_catalog.lower(pg_catalog.btrim(u.email)) = c.email
    join public.perfis p on p.id = u.id
    where c.status = 'convidado'
      and u.email_confirmed_at is not null
      and exists (
        select 1
        from auth.identities i
        where i.user_id = u.id and i.provider = 'google'
      )
      and (
        p.papel = 'aluno'
        or (
          p.papel = 'professor'
          and p.academia_id = c.academia_id
          and p.ativo is true
        )
      )
    order by c.criado_em
  loop
    perform public.aplicar_convite_professor_existente(
      v_convite.email,
      v_convite.academia_id
    );
  end loop;
end
$$;

commit;
