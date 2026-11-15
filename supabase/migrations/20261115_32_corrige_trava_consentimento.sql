-- Corrige a identificação do papel service_role na trava de consentimento.
begin;

create or replace function public.bloquear_alteracao_consentimento()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
     and coalesce(
       nullif(current_setting('request.jwt.claim.role', true), ''),
       (nullif(current_setting('request.jwt.claims', true), '')::jsonb) ->> 'role'
     ) = 'service_role' then
    return old;
  end if;

  raise exception 'Registros de consentimento não podem ser alterados ou removidos.';
end
$$;

revoke all on function public.bloquear_alteracao_consentimento() from public, anon, authenticated;

commit;
