-- TATAME · SQL parte 2B · código da turma, pedidos e vínculo aluno-professor
begin;

create table public.turmas (
  professor_id uuid primary key references public.perfis (id) on delete cascade,
  codigo text not null unique check (codigo ~ '^[0-9A-F]{6}$'),
  criado_em timestamptz not null default now()
);

create table public.vinculos (
  aluno_id uuid primary key references public.perfis (id) on delete cascade,
  professor_id uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index vinculos_professor_idx on public.vinculos (professor_id);

create table public.pedidos_vinculo (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  professor_id uuid not null references public.perfis (id) on delete cascade,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'recusado', 'cancelado')),
  criado_em timestamptz not null default now(),
  decidido_em timestamptz
);
create unique index pedidos_um_pendente_idx on public.pedidos_vinculo (aluno_id) where status = 'pendente';
create index pedidos_professor_idx on public.pedidos_vinculo (professor_id, status);

create table public.tentativas_codigo (
  aluno_id uuid primary key references public.perfis (id) on delete cascade,
  erros integer not null default 0,
  bloqueado_ate timestamptz
);

alter table public.turmas enable row level security;
alter table public.vinculos enable row level security;
alter table public.pedidos_vinculo enable row level security;
alter table public.tentativas_codigo enable row level security;

create policy turmas_select_proprio on public.turmas for select to authenticated
  using (professor_id = (select auth.uid()));
create policy vinculos_select on public.vinculos for select to authenticated
  using (aluno_id = (select auth.uid()) or professor_id = (select auth.uid()));
create policy pedidos_select on public.pedidos_vinculo for select to authenticated
  using (aluno_id = (select auth.uid()) or professor_id = (select auth.uid()));

create policy perfis_select_professor on public.perfis for select to authenticated
  using (
    exists (select 1 from public.vinculos v
            where v.aluno_id = perfis.id and v.professor_id = (select auth.uid()))
    or exists (select 1 from public.pedidos_vinculo p
               where p.aluno_id = perfis.id and p.professor_id = (select auth.uid())
                 and p.status = 'pendente')
  );

revoke all on table public.turmas, public.vinculos, public.pedidos_vinculo, public.tentativas_codigo
  from anon, authenticated;
grant select on public.turmas, public.vinculos, public.pedidos_vinculo to authenticated;

-- interna: confere o código, conta erros, bloqueia 15 min após 5 erros
create function public.resolver_codigo(p_codigo text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_t public.tentativas_codigo;
  v_erros integer;
  v_prof uuid;
begin
  if v_uid is null then
    return null;
  end if;

  insert into public.tentativas_codigo (aluno_id) values (v_uid) on conflict do nothing;
  select * into v_t from public.tentativas_codigo where aluno_id = v_uid for update;

  if v_t.bloqueado_ate is not null and v_t.bloqueado_ate > now() then
    return null;
  end if;
  v_erros := case when v_t.bloqueado_ate is not null then 0 else v_t.erros end;

  select t.professor_id into v_prof
  from public.turmas t
  join public.perfis p on p.id = t.professor_id
    and p.ativo and p.papel = 'professor' and p.academia_id is not null
  where t.codigo = upper(btrim(p_codigo));

  if v_prof is null then
    v_erros := v_erros + 1;
    if v_erros >= 5 then
      update public.tentativas_codigo
      set erros = 0, bloqueado_ate = now() + interval '15 minutes'
      where aluno_id = v_uid;
    else
      update public.tentativas_codigo
      set erros = v_erros, bloqueado_ate = null
      where aluno_id = v_uid;
    end if;
    return null;
  end if;

  update public.tentativas_codigo set erros = 0, bloqueado_ate = null where aluno_id = v_uid;
  return v_prof;
end
$$;

create function public.criar_perfil_aluno(p_nome text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := btrim(coalesce(p_nome, ''));
begin
  if v_uid is null or char_length(v_nome) not between 1 and 80 then
    return false;
  end if;
  if exists (select 1 from public.perfis where id = v_uid) then
    return false;
  end if;
  insert into public.perfis (id, papel, nome) values (v_uid, 'aluno', v_nome);
  return true;
end
$$;

create function public.gerar_codigo()
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cod text;
  i integer;
begin
  if public.papel_atual() is distinct from 'professor' or public.academia_atual() is null then
    return null;
  end if;
  for i in 1..5 loop
    v_cod := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.turmas (professor_id, codigo) values (v_uid, v_cod)
      on conflict (professor_id) do update set codigo = excluded.codigo, criado_em = now();
      return v_cod;
    exception when unique_violation then
      null;
    end;
  end loop;
  return null;
end
$$;

create function public.previa_codigo(p_codigo text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_prof uuid;
  v_res jsonb;
begin
  if public.papel_atual() not in ('aluno', 'instrutor') then
    return jsonb_build_object('ok', false);
  end if;
  v_prof := public.resolver_codigo(p_codigo);
  if v_prof is null then
    if exists (select 1 from public.tentativas_codigo
               where aluno_id = v_uid and bloqueado_ate > now()) then
      return jsonb_build_object('ok', false, 'bloqueado', true);
    end if;
    return jsonb_build_object('ok', false);
  end if;
  select jsonb_build_object('ok', true, 'professor', p.nome, 'academia', a.nome)
  into v_res
  from public.perfis p join public.academias a on a.id = p.academia_id
  where p.id = v_prof;
  return v_res;
end
$$;

create function public.solicitar_vinculo(p_codigo text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_prof uuid;
  v_id uuid;
begin
  if public.papel_atual() not in ('aluno', 'instrutor') then
    return jsonb_build_object('ok', false);
  end if;
  v_prof := public.resolver_codigo(p_codigo);
  if v_prof is null then
    if exists (select 1 from public.tentativas_codigo
               where aluno_id = v_uid and bloqueado_ate > now()) then
      return jsonb_build_object('ok', false, 'bloqueado', true);
    end if;
    return jsonb_build_object('ok', false);
  end if;
  if exists (select 1 from public.vinculos where aluno_id = v_uid and professor_id = v_prof) then
    return jsonb_build_object('ok', false);
  end if;
  insert into public.pedidos_vinculo (aluno_id, professor_id) values (v_uid, v_prof)
  on conflict (aluno_id) where status = 'pendente' do nothing
  returning id into v_id;
  return jsonb_build_object('ok', v_id is not null);
end
$$;

create function public.cancelar_pedido()
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.pedidos_vinculo
  set status = 'cancelado', decidido_em = now()
  where aluno_id = auth.uid() and status = 'pendente';
  return found;
end
$$;

create function public.decidir_pedido(p_pedido uuid, p_aprovar boolean)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_academia uuid := public.academia_atual();
  v_aluno uuid;
begin
  if public.papel_atual() is distinct from 'professor' or v_academia is null then
    return false;
  end if;
  select p.aluno_id into v_aluno
  from public.pedidos_vinculo p
  where p.id = p_pedido and p.professor_id = v_uid and p.status = 'pendente'
  for update;
  if v_aluno is null then
    return false;
  end if;

  update public.pedidos_vinculo
  set status = case when p_aprovar then 'aprovado' else 'recusado' end, decidido_em = now()
  where id = p_pedido;

  if p_aprovar then
    insert into public.vinculos (aluno_id, professor_id) values (v_aluno, v_uid)
    on conflict (aluno_id) do update set professor_id = excluded.professor_id, criado_em = now();
    update public.perfis set academia_id = v_academia
    where id = v_aluno and papel in ('aluno', 'instrutor');
  end if;
  return true;
end
$$;

revoke all on function public.resolver_codigo(text) from public, anon, authenticated;
revoke all on function public.criar_perfil_aluno(text) from public, anon, authenticated;
revoke all on function public.gerar_codigo() from public, anon, authenticated;
revoke all on function public.previa_codigo(text) from public, anon, authenticated;
revoke all on function public.solicitar_vinculo(text) from public, anon, authenticated;
revoke all on function public.cancelar_pedido() from public, anon, authenticated;
revoke all on function public.decidir_pedido(uuid, boolean) from public, anon, authenticated;

grant execute on function public.criar_perfil_aluno(text) to authenticated;
grant execute on function public.gerar_codigo() to authenticated;
grant execute on function public.previa_codigo(text) to authenticated;
grant execute on function public.solicitar_vinculo(text) to authenticated;
grant execute on function public.cancelar_pedido() to authenticated;
grant execute on function public.decidir_pedido(uuid, boolean) to authenticated;

commit;
