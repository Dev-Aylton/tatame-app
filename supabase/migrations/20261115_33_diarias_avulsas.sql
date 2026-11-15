-- NÃO EXECUTADA: revisar antes de aplicar.
-- Diárias sem identificação de visitantes, acessíveis apenas ao Professor.
begin;

create table public.autorizacoes_diarias_avulsas (
  professor_id uuid primary key references public.perfis (id) on delete cascade,
  autorizada_em timestamptz not null default pg_catalog.now()
);

create table public.diarias_avulsas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.perfis (id) on delete cascade,
  valor_centavos bigint not null check (valor_centavos > 0),
  tipo text not null check (tipo in ('Dinheiro', 'Pix')),
  criado_em timestamptz not null default pg_catalog.now()
);

create index diarias_avulsas_professor_criado_idx
  on public.diarias_avulsas (professor_id, criado_em desc);

alter table public.autorizacoes_diarias_avulsas enable row level security;
alter table public.diarias_avulsas enable row level security;

create policy autorizacoes_diarias_avulsas_select_professor
  on public.autorizacoes_diarias_avulsas for select to authenticated
  using (professor_id = (select auth.uid()) and public.papel_atual() = 'professor');

create policy diarias_avulsas_select_professor
  on public.diarias_avulsas for select to authenticated
  using (professor_id = (select auth.uid()) and public.papel_atual() = 'professor');

revoke all on table public.autorizacoes_diarias_avulsas, public.diarias_avulsas
  from public, anon, authenticated;
grant select on table public.autorizacoes_diarias_avulsas, public.diarias_avulsas
  to authenticated;

create function public.autorizar_diarias_avulsas()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  perform 1 from public.perfis p
  where p.id = v_uid and p.papel = 'professor' and p.ativo
  for update;
  if not found then
    raise exception 'Professor ativo não encontrado.';
  end if;

  insert into public.autorizacoes_diarias_avulsas (professor_id)
  values (v_uid)
  on conflict (professor_id) do nothing;
  return true;
end
$$;

create function public.revogar_diarias_avulsas()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  perform 1 from public.perfis p
  where p.id = v_uid and p.papel = 'professor' and p.ativo
  for update;
  if not found then
    raise exception 'Professor ativo não encontrado.';
  end if;

  delete from public.diarias_avulsas where professor_id = v_uid;
  delete from public.autorizacoes_diarias_avulsas where professor_id = v_uid;
  return true;
end
$$;

create function public.registrar_diaria_avulsa(p_valor_centavos bigint, p_tipo text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  perform 1 from public.perfis p
  where p.id = v_uid and p.papel = 'professor' and p.ativo
  for update;
  if not found then
    raise exception 'Professor ativo não encontrado.';
  end if;
  if not exists (
    select 1 from public.autorizacoes_diarias_avulsas a where a.professor_id = v_uid
  ) then
    raise exception 'A autorização para registrar diárias é necessária.';
  end if;
  if p_valor_centavos is null or p_valor_centavos <= 0
     or p_tipo is null or p_tipo not in ('Dinheiro', 'Pix') then
    raise exception 'Valor ou tipo de recebimento inválido.';
  end if;

  insert into public.diarias_avulsas (professor_id, valor_centavos, tipo)
  values (v_uid, p_valor_centavos, p_tipo)
  returning id into v_id;
  return v_id;
end
$$;

create function public.excluir_diaria_avulsa(p_diaria_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  perform 1 from public.perfis p
  where p.id = v_uid and p.papel = 'professor' and p.ativo
  for update;
  if not found then
    raise exception 'Professor ativo não encontrado.';
  end if;

  delete from public.diarias_avulsas
  where id = p_diaria_id and professor_id = v_uid;
  if not found then
    raise exception 'Diária não encontrada.';
  end if;
  return true;
end
$$;

create function public.limpar_diarias_professor_desativado()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.diarias_avulsas where professor_id = new.id;
  delete from public.autorizacoes_diarias_avulsas where professor_id = new.id;
  return new;
end
$$;

create trigger perfis_limpar_diarias_desativacao
after update of ativo on public.perfis
for each row
when (old.ativo is true and new.ativo is false)
execute function public.limpar_diarias_professor_desativado();

revoke all on function public.autorizar_diarias_avulsas() from public, anon, authenticated;
revoke all on function public.revogar_diarias_avulsas() from public, anon, authenticated;
revoke all on function public.registrar_diaria_avulsa(bigint, text) from public, anon, authenticated;
revoke all on function public.excluir_diaria_avulsa(uuid) from public, anon, authenticated;
revoke all on function public.limpar_diarias_professor_desativado() from public, anon, authenticated;

grant execute on function public.autorizar_diarias_avulsas() to authenticated;
grant execute on function public.revogar_diarias_avulsas() to authenticated;
grant execute on function public.registrar_diaria_avulsa(bigint, text) to authenticated;
grant execute on function public.excluir_diaria_avulsa(uuid) to authenticated;

commit;
