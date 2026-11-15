-- Permite que a Edge Function apague o histórico de consentimento no fluxo
-- autorizado de exclusão, mantendo bloqueadas as alterações por outros papéis.
begin;

create or replace function public.bloquear_alteracao_consentimento()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE'
     and current_setting('request.jwt.claim.role', true) = 'service_role' then
    return old;
  end if;

  raise exception 'Registros de consentimento não podem ser alterados ou removidos.';
end
$$;

revoke all on function public.bloquear_alteracao_consentimento() from public, anon, authenticated;

commit;
