-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 11 · registro imutável de consentimento
begin;

create table public.consentimentos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis (id),
  versao_termo text not null
    check (pg_catalog.char_length(pg_catalog.btrim(versao_termo)) between 1 and 40),
  aceito_em timestamptz not null default pg_catalog.now()
);

create unique index consentimentos_perfil_versao_idx
  on public.consentimentos (perfil_id, versao_termo);

alter table public.consentimentos enable row level security;
-- Leitura sem policy é uma decisão futura.
revoke all on table public.consentimentos from public, anon, authenticated;
-- A retenção após a exclusão da conta é decisão jurídica pendente.

create function public.bloquear_alteracao_consentimento()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  raise exception 'Registros de consentimento não podem ser alterados ou removidos.';
end
$$;

create trigger consentimentos_bloquear_alteracao
before update or delete on public.consentimentos
for each row execute function public.bloquear_alteracao_consentimento();

revoke all on function public.bloquear_alteracao_consentimento() from public, anon, authenticated;

create function public.registrar_consentimento(p_versao text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_versao text := pg_catalog.btrim(coalesce(p_versao, ''));
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if not exists (
    select 1 from public.perfis p where p.id = v_uid
  ) then
    return 'perfil_inexistente';
  end if;

  if p_versao is null
     or pg_catalog.char_length(v_versao) not between 1 and 40 then
    return 'versao_invalida';
  end if;

  insert into public.consentimentos (perfil_id, versao_termo)
  values (v_uid, v_versao)
  on conflict (perfil_id, versao_termo) do nothing;

  return 'ok';
end
$$;

revoke all on function public.registrar_consentimento(text) from public, anon, authenticated;
grant execute on function public.registrar_consentimento(text) to authenticated;

commit;
