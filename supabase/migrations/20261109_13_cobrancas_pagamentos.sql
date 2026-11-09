-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 13 · cobranças mensais e pagamentos
-- A migration deve ser revisada antes de qualquer execução.
-- Pressupõe que a role proprietária das funções SECURITY DEFINER pode escrever
-- nas tabelas sem RLS forçada, conforme os rascunhos anteriores.
begin;

alter table public.academias
  add column dias_carencia smallint not null default 5
  constraint academias_dias_carencia_check check (dias_carencia between 0 and 30);

comment on column public.academias.dias_carencia is
  'Carência em dias para cálculo de atraso no aplicativo; o atraso não é armazenado.';

create table public.regras_cobranca (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id) on delete restrict,
  professor_id uuid not null references public.perfis (id) on delete restrict,
  aluno_id uuid not null references public.perfis (id) on delete restrict,
  valor_base_centavos bigint not null check (valor_base_centavos >= 0),
  dia_vencimento smallint not null check (dia_vencimento between 1 and 28),
  tipo_desconto text not null check (tipo_desconto in ('nenhum', 'valor_fixo', 'percentual', 'isencao')),
  desconto_centavos bigint,
  desconto_percentual numeric(5, 2),
  motivo_isencao text check (
    motivo_isencao is null or pg_catalog.char_length(motivo_isencao) <= 200
  ),
  duracao_tipo text not null check (duracao_tipo in ('este_mes', 'n_meses', 'ate_remover')),
  mes_inicio date not null check (mes_inicio = pg_catalog.date_trunc('month', mes_inicio)::date),
  duracao_meses integer,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint regras_cobranca_desconto_check check (
    (tipo_desconto = 'nenhum'
      and desconto_centavos is null
      and desconto_percentual is null
      and motivo_isencao is null)
    or (tipo_desconto = 'valor_fixo'
      and desconto_centavos is not null
      and desconto_centavos >= 0
      and desconto_percentual is null
      and motivo_isencao is null)
    or (tipo_desconto = 'percentual'
      and desconto_centavos is null
      and desconto_percentual is not null
      and desconto_percentual between 0 and 100
      and motivo_isencao is null)
    or (tipo_desconto = 'isencao'
      and desconto_centavos is null
      and desconto_percentual is null)
  ),
  constraint regras_cobranca_duracao_check check (
    (duracao_tipo = 'n_meses' and duracao_meses is not null and duracao_meses > 0)
    or (duracao_tipo <> 'n_meses' and duracao_meses is null)
  ),
  constraint regras_cobranca_professor_aluno_unique unique (professor_id, aluno_id)
);

create index regras_cobranca_ativas_idx
  on public.regras_cobranca (professor_id, mes_inicio)
  where ativa;

create table public.cobrancas_mensais (
  id uuid primary key default gen_random_uuid(),
  regra_id uuid not null references public.regras_cobranca (id) on delete restrict,
  academia_id uuid not null references public.academias (id) on delete restrict,
  professor_id uuid not null references public.perfis (id) on delete restrict,
  aluno_id uuid not null references public.perfis (id) on delete restrict,
  mes date not null check (mes = pg_catalog.date_trunc('month', mes)::date),
  vencimento date not null,
  valor_base_centavos bigint not null check (valor_base_centavos >= 0),
  tipo_desconto text not null check (tipo_desconto in ('nenhum', 'valor_fixo', 'percentual', 'isencao')),
  desconto_centavos bigint not null check (desconto_centavos >= 0),
  desconto_percentual numeric(5, 2),
  motivo_isencao text check (
    motivo_isencao is null or pg_catalog.char_length(motivo_isencao) <= 200
  ),
  valor_final_centavos bigint not null check (valor_final_centavos >= 0),
  status text not null check (status in ('aberta', 'paga', 'isenta', 'cancelada')),
  enviada_em timestamptz,
  reenviada_em timestamptz,
  cancelada_em timestamptz,
  criado_em timestamptz not null default now(),
  constraint cobrancas_vencimento_mes_check check (
    vencimento >= mes
    and vencimento < (mes + interval '1 month')
    and pg_catalog.date_part('day', vencimento) between 1 and 28
  ),
  constraint cobrancas_valores_check check (
    desconto_centavos <= valor_base_centavos
    and valor_final_centavos = greatest(0, valor_base_centavos - desconto_centavos)
    and (
      (tipo_desconto in ('nenhum', 'valor_fixo', 'isencao') and desconto_percentual is null)
      or (tipo_desconto = 'percentual'
        and desconto_percentual is not null
        and desconto_percentual between 0 and 100)
    )
    and (tipo_desconto <> 'isencao' or valor_final_centavos = 0)
    and (
      (valor_final_centavos = 0 and status = 'isenta')
      or (valor_final_centavos > 0 and status <> 'isenta')
    )
  ),
  constraint cobrancas_envio_check check (
    reenviada_em is null or enviada_em is not null
  ),
  constraint cobrancas_cancelamento_check check (
    (status = 'cancelada' and cancelada_em is not null)
    or (status <> 'cancelada' and cancelada_em is null)
  ),
  constraint cobrancas_aluno_mes_unique unique (aluno_id, mes)
);

create index cobrancas_professor_mes_idx
  on public.cobrancas_mensais (professor_id, mes desc);
create index cobrancas_aluno_mes_idx
  on public.cobrancas_mensais (aluno_id, mes desc);

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  cobranca_id uuid not null references public.cobrancas_mensais (id) on delete restrict,
  origem text not null check (origem in ('aluno', 'professor')),
  tipo text not null check (pg_catalog.char_length(pg_catalog.btrim(tipo)) between 1 and 80),
  referencia text check (
    referencia is null
    or pg_catalog.char_length(pg_catalog.btrim(referencia)) between 1 and 120
  ),
  valor_centavos bigint not null check (valor_centavos > 0),
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmado', 'rejeitado', 'estornado', 'desfeito')),
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz,
  rejeitado_em timestamptz,
  estornado_em timestamptz,
  desfeito_em timestamptz,
  constraint pagamentos_tipo_origem_check check (
    (origem = 'aluno' and tipo in ('dinheiro', 'comprovante'))
    or origem = 'professor'
  ),
  constraint pagamentos_decisao_check check (
    (status = 'pendente'
      and confirmado_em is null and rejeitado_em is null and estornado_em is null and desfeito_em is null)
    or (status = 'confirmado'
      and confirmado_em is not null and rejeitado_em is null and estornado_em is null and desfeito_em is null)
    or (status = 'rejeitado'
      and confirmado_em is null and rejeitado_em is not null and estornado_em is null and desfeito_em is null)
    or (status = 'estornado'
      and confirmado_em is not null and rejeitado_em is null and estornado_em is not null and desfeito_em is null)
    or (status = 'desfeito'
      and confirmado_em is not null and rejeitado_em is null and estornado_em is null and desfeito_em is not null)
  )
);

create index pagamentos_cobranca_criado_idx
  on public.pagamentos (cobranca_id, criado_em);

alter table public.regras_cobranca enable row level security;
alter table public.cobrancas_mensais enable row level security;
alter table public.pagamentos enable row level security;

create policy regras_cobranca_select_professor
  on public.regras_cobranca for select to authenticated
  using (
    professor_id = (select auth.uid())
    and academia_id = (select public.academia_atual())
    and (select public.papel_atual()) = 'professor'
  );

create policy cobrancas_select_professor
  on public.cobrancas_mensais for select to authenticated
  using (
    professor_id = (select auth.uid())
    and academia_id = (select public.academia_atual())
    and (select public.papel_atual()) = 'professor'
  );

create policy cobrancas_select_aluno_enviadas
  on public.cobrancas_mensais for select to authenticated
  using (
    aluno_id = (select auth.uid())
    and enviada_em is not null
    and status <> 'cancelada'
    and (select public.papel_atual()) = 'aluno'
  );

create policy pagamentos_select_professor
  on public.pagamentos for select to authenticated
  using (
    (select public.papel_atual()) = 'professor'
    and exists (
      select 1
      from public.cobrancas_mensais c
      where c.id = cobranca_id
        and c.professor_id = (select auth.uid())
        and c.academia_id = (select public.academia_atual())
    )
  );

create policy pagamentos_select_aluno
  on public.pagamentos for select to authenticated
  using (
    (select public.papel_atual()) = 'aluno'
    and exists (
      select 1
      from public.cobrancas_mensais c
      where c.id = cobranca_id
        and c.aluno_id = (select auth.uid())
        and c.enviada_em is not null
        and c.status <> 'cancelada'
    )
  );

revoke all on table public.regras_cobranca, public.cobrancas_mensais, public.pagamentos
  from anon, authenticated;
grant select on public.regras_cobranca, public.cobrancas_mensais, public.pagamentos
  to authenticated;

create function public.definir_carencia_cobranca(p_dias smallint)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_academia uuid := public.academia_atual();
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or v_academia is null
     or p_dias is null
     or p_dias not between 0 and 30
     or not exists (select 1 from public.turmas t where t.professor_id = v_uid) then
    return false;
  end if;

  update public.academias
  set dias_carencia = p_dias
  where id = v_academia;

  return found;
end
$$;

create function public.lancar_pagamento_professor(
  p_cobranca_id uuid,
  p_valor_centavos bigint,
  p_tipo text,
  p_referencia text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cobranca public.cobrancas_mensais%rowtype;
  v_pagamento_id uuid;
  v_confirmado numeric;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null
     or p_valor_centavos is null
     or p_valor_centavos <= 0
     or p_tipo is null
     or pg_catalog.char_length(pg_catalog.btrim(p_tipo)) not between 1 and 80
     or p_referencia is null
     or pg_catalog.char_length(pg_catalog.btrim(p_referencia)) not between 1 and 120 then
    return null;
  end if;

  select c.* into v_cobranca
  from public.cobrancas_mensais c
  where c.id = p_cobranca_id
    and c.professor_id = v_uid
    and c.academia_id = public.academia_atual()
    and c.status = 'aberta'
  for update;

  if not found then
    return null;
  end if;

  select coalesce(pg_catalog.sum(p.valor_centavos), 0)
    into v_confirmado
  from public.pagamentos p
  where p.cobranca_id = v_cobranca.id and p.status = 'confirmado';

  if p_valor_centavos > v_cobranca.valor_final_centavos - v_confirmado then
    return null;
  end if;

  insert into public.pagamentos (
    cobranca_id, origem, tipo, referencia, valor_centavos, status, confirmado_em
  )
  values (
    v_cobranca.id, 'professor', pg_catalog.btrim(p_tipo),
    pg_catalog.btrim(p_referencia), p_valor_centavos, 'confirmado', now()
  )
  returning id into v_pagamento_id;

  select coalesce(pg_catalog.sum(p.valor_centavos), 0)
    into v_confirmado
  from public.pagamentos p
  where p.cobranca_id = v_cobranca.id and p.status = 'confirmado';

  if v_confirmado = v_cobranca.valor_final_centavos then
    update public.cobrancas_mensais
    set status = 'paga'
    where id = v_cobranca.id;
  end if;

  return v_pagamento_id;
end
$$;

create function public.desfazer_lancamento_professor(p_pagamento_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cobranca_id uuid;
  v_cobranca public.cobrancas_mensais%rowtype;
  v_pagamento public.pagamentos%rowtype;
  v_confirmado numeric;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null then
    return false;
  end if;

  select p.cobranca_id into v_cobranca_id
  from public.pagamentos p
  where p.id = p_pagamento_id and p.origem = 'professor';
  if not found then
    return false;
  end if;

  select c.* into v_cobranca
  from public.cobrancas_mensais c
  where c.id = v_cobranca_id
    and c.professor_id = v_uid
    and c.academia_id = public.academia_atual()
  for update;
  if not found then
    return false;
  end if;

  select p.* into v_pagamento
  from public.pagamentos p
  where p.id = p_pagamento_id
    and p.cobranca_id = v_cobranca_id
    and p.origem = 'professor'
  for update;
  if not found
     or v_pagamento.status <> 'confirmado'
     or v_pagamento.confirmado_em is null
     or now() > v_pagamento.confirmado_em + interval '120 seconds' then
    return false;
  end if;

  update public.pagamentos
  set status = 'desfeito', desfeito_em = now()
  where id = p_pagamento_id;

  if v_cobranca.status = 'paga' then
    select coalesce(pg_catalog.sum(p.valor_centavos), 0)
      into v_confirmado
    from public.pagamentos p
    where p.cobranca_id = v_cobranca_id and p.status = 'confirmado';
    update public.cobrancas_mensais
    set status = case
      when v_confirmado >= v_cobranca.valor_final_centavos then 'paga'
      else 'aberta'
    end
    where id = v_cobranca_id;
  end if;

  return true;
end
$$;

create function public.salvar_regra_cobranca(
  p_aluno_id uuid,
  p_valor_base_centavos bigint,
  p_dia_vencimento smallint,
  p_tipo_desconto text,
  p_desconto_centavos bigint,
  p_desconto_percentual numeric,
  p_motivo_isencao text,
  p_duracao_tipo text,
  p_mes_inicio date,
  p_duracao_meses integer
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_academia uuid := public.academia_atual();
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or v_academia is null
     or p_aluno_id is null
     or p_valor_base_centavos is null
     or p_valor_base_centavos < 0
     or p_dia_vencimento is null
     or p_dia_vencimento not between 1 and 28
     or p_tipo_desconto is null
     or p_tipo_desconto not in ('nenhum', 'valor_fixo', 'percentual', 'isencao')
     or p_duracao_tipo is null
     or p_duracao_tipo not in ('este_mes', 'n_meses', 'ate_remover')
     or p_mes_inicio is null
     or p_mes_inicio <> pg_catalog.date_trunc('month', p_mes_inicio)::date
     or (p_duracao_tipo = 'n_meses' and (p_duracao_meses is null or p_duracao_meses < 1))
     or (p_duracao_tipo <> 'n_meses' and p_duracao_meses is not null)
     or (p_tipo_desconto = 'nenhum'
       and (p_desconto_centavos is not null or p_desconto_percentual is not null or p_motivo_isencao is not null))
     or (p_tipo_desconto = 'valor_fixo'
       and (p_desconto_centavos is null or p_desconto_centavos < 0
         or p_desconto_percentual is not null or p_motivo_isencao is not null))
     or (p_tipo_desconto = 'percentual'
       and (p_desconto_centavos is not null
         or p_desconto_percentual is null or p_desconto_percentual not between 0 and 100
         or p_motivo_isencao is not null))
     or (p_tipo_desconto = 'isencao'
       and (p_desconto_centavos is not null or p_desconto_percentual is not null))
     or (p_motivo_isencao is not null and pg_catalog.char_length(p_motivo_isencao) > 200)
     or not exists (select 1 from public.turmas t where t.professor_id = v_uid)
     or not exists (
       select 1
       from public.vinculos v
       join public.perfis a on a.id = v.aluno_id
       where v.professor_id = v_uid
         and v.aluno_id = p_aluno_id
         and a.papel = 'aluno'
         and a.ativo
         and a.academia_id = v_academia
     ) then
    return null;
  end if;

  insert into public.regras_cobranca (
    academia_id, professor_id, aluno_id, valor_base_centavos, dia_vencimento,
    tipo_desconto, desconto_centavos, desconto_percentual, motivo_isencao,
    duracao_tipo, mes_inicio, duracao_meses, ativa
  )
  values (
    v_academia, v_uid, p_aluno_id, p_valor_base_centavos, p_dia_vencimento,
    p_tipo_desconto, p_desconto_centavos, p_desconto_percentual, p_motivo_isencao,
    p_duracao_tipo, p_mes_inicio, p_duracao_meses, true
  )
  on conflict (professor_id, aluno_id) do update
  set academia_id = excluded.academia_id,
      valor_base_centavos = excluded.valor_base_centavos,
      dia_vencimento = excluded.dia_vencimento,
      tipo_desconto = excluded.tipo_desconto,
      desconto_centavos = excluded.desconto_centavos,
      desconto_percentual = excluded.desconto_percentual,
      motivo_isencao = excluded.motivo_isencao,
      duracao_tipo = excluded.duracao_tipo,
      mes_inicio = excluded.mes_inicio,
      duracao_meses = excluded.duracao_meses,
      ativa = true,
      atualizado_em = now()
  returning id into v_id;

  return v_id;
end
$$;

create function public.remover_regra_cobranca(p_regra_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null then
    return false;
  end if;

  update public.regras_cobranca
  set ativa = false, atualizado_em = now()
  where id = p_regra_id
    and professor_id = auth.uid()
    and academia_id = public.academia_atual()
    and ativa;

  return found;
end
$$;

create function public.gerar_cobrancas_mensais(p_mes date)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_academia uuid := public.academia_atual();
  r public.regras_cobranca%rowtype;
  v_desconto bigint;
  v_valor_final bigint;
  v_status text;
  v_inseridas integer;
  v_total integer := 0;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or v_academia is null
     or p_mes is null
     or p_mes <> pg_catalog.date_trunc('month', p_mes)::date
     or not exists (select 1 from public.turmas t where t.professor_id = v_uid) then
    return 0;
  end if;

  for r in
    select rc.*
    from public.regras_cobranca rc
    join public.vinculos v
      on v.aluno_id = rc.aluno_id and v.professor_id = v_uid
    join public.perfis a
      on a.id = rc.aluno_id and a.papel = 'aluno' and a.ativo
    where rc.professor_id = v_uid
      and rc.academia_id = v_academia
      and a.academia_id = v_academia
      and rc.ativa
      and p_mes >= rc.mes_inicio
      and (
        rc.duracao_tipo = 'ate_remover'
        or (rc.duracao_tipo = 'este_mes' and p_mes = rc.mes_inicio)
        or (rc.duracao_tipo = 'n_meses'
          and p_mes < rc.mes_inicio + pg_catalog.make_interval(months => rc.duracao_meses))
      )
  loop
    v_desconto := case r.tipo_desconto
      when 'valor_fixo' then least(r.valor_base_centavos, r.desconto_centavos)
      when 'percentual' then least(
        r.valor_base_centavos,
        pg_catalog.round(r.valor_base_centavos * r.desconto_percentual / 100)::bigint
      )
      when 'isencao' then r.valor_base_centavos
      else 0
    end;
    v_valor_final := greatest(0, r.valor_base_centavos - v_desconto);
    v_status := case when v_valor_final = 0 then 'isenta' else 'aberta' end;

    insert into public.cobrancas_mensais (
      regra_id, academia_id, professor_id, aluno_id, mes, vencimento,
      valor_base_centavos, tipo_desconto, desconto_centavos, desconto_percentual,
      motivo_isencao, valor_final_centavos, status
    )
    values (
      r.id, r.academia_id, r.professor_id, r.aluno_id, p_mes,
      pg_catalog.make_date(
        pg_catalog.date_part('year', p_mes)::integer,
        pg_catalog.date_part('month', p_mes)::integer,
        r.dia_vencimento
      ),
      r.valor_base_centavos, r.tipo_desconto, v_desconto,
      case when r.tipo_desconto = 'percentual' then r.desconto_percentual else null end,
      case when r.tipo_desconto = 'isencao' then r.motivo_isencao else null end,
      v_valor_final, v_status
    )
    on conflict (aluno_id, mes) do nothing;

    get diagnostics v_inseridas = row_count;
    v_total := v_total + v_inseridas;
  end loop;

  return v_total;
end
$$;

create function public.enviar_cobranca(p_cobranca_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cobranca public.cobrancas_mensais%rowtype;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null then
    return 'sem_permissao';
  end if;

  select c.* into v_cobranca
  from public.cobrancas_mensais c
  where c.id = p_cobranca_id
  for update;

  if not found
     or v_cobranca.professor_id <> v_uid
     or v_cobranca.academia_id <> public.academia_atual() then
    return 'cobranca_indisponivel';
  end if;
  if v_cobranca.status <> 'aberta' then
    return 'cobranca_fechada';
  end if;

  if v_cobranca.enviada_em is null then
    update public.cobrancas_mensais
    set enviada_em = now()
    where id = p_cobranca_id;
  else
    update public.cobrancas_mensais
    set reenviada_em = now()
    where id = p_cobranca_id;
  end if;

  return 'ok';
end
$$;

create function public.cancelar_cobranca(p_cobranca_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cobranca public.cobrancas_mensais%rowtype;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null then
    return false;
  end if;

  select c.* into v_cobranca
  from public.cobrancas_mensais c
  where c.id = p_cobranca_id
  for update;

  if not found
     or v_cobranca.professor_id <> v_uid
     or v_cobranca.academia_id <> public.academia_atual()
     or v_cobranca.status <> 'aberta'
     or exists (
       select 1
       from public.pagamentos p
       where p.cobranca_id = p_cobranca_id
         and p.status in ('pendente', 'confirmado')
     ) then
    return false;
  end if;

  update public.cobrancas_mensais
  set status = 'cancelada', cancelada_em = now()
  where id = p_cobranca_id
    and status = 'aberta';

  return found;
end
$$;

create function public.registrar_aviso_pagamento(
  p_cobranca_id uuid,
  p_valor_centavos bigint,
  p_tipo text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cobranca public.cobrancas_mensais%rowtype;
  v_pagamento_id uuid;
  v_confirmado numeric;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'aluno'
     or p_valor_centavos is null
     or p_valor_centavos <= 0
     or p_tipo is null
     or p_tipo not in ('dinheiro', 'comprovante') then
    return null;
  end if;

  select c.* into v_cobranca
  from public.cobrancas_mensais c
  where c.id = p_cobranca_id
    and c.aluno_id = v_uid
    and c.enviada_em is not null
    and c.status = 'aberta'
  for update;

  if not found then
    return null;
  end if;

  select coalesce(pg_catalog.sum(p.valor_centavos), 0)
    into v_confirmado
  from public.pagamentos p
  where p.cobranca_id = v_cobranca.id and p.status = 'confirmado';

  if p_valor_centavos > v_cobranca.valor_final_centavos - v_confirmado
     or exists (
       select 1
       from public.pagamentos p
       where p.cobranca_id = v_cobranca.id
         and p.status = 'pendente'
     ) then
    return null;
  end if;

  insert into public.pagamentos (cobranca_id, origem, tipo, valor_centavos)
  values (v_cobranca.id, 'aluno', p_tipo, p_valor_centavos)
  returning id into v_pagamento_id;

  return v_pagamento_id;
end
$$;

create function public.decidir_pagamento(
  p_pagamento_id uuid,
  p_acao text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cobranca_id uuid;
  v_cobranca public.cobrancas_mensais%rowtype;
  v_pagamento public.pagamentos%rowtype;
  v_confirmado numeric;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or public.academia_atual() is null
     or p_acao is null
     or p_acao not in ('confirmar', 'rejeitar', 'estornar') then
    return false;
  end if;

  select p.cobranca_id into v_cobranca_id
  from public.pagamentos p
  where p.id = p_pagamento_id;
  if not found then
    return false;
  end if;

  select c.* into v_cobranca
  from public.cobrancas_mensais c
  where c.id = v_cobranca_id
    and c.professor_id = v_uid
    and c.academia_id = public.academia_atual()
  for update;
  if not found then
    return false;
  end if;

  select p.* into v_pagamento
  from public.pagamentos p
  where p.id = p_pagamento_id
    and p.cobranca_id = v_cobranca_id
  for update;
  if not found then
    return false;
  end if;

  if p_acao = 'confirmar' then
    if v_pagamento.status <> 'pendente' or v_cobranca.status <> 'aberta' then
      return false;
    end if;

    select coalesce(pg_catalog.sum(p.valor_centavos), 0)
      into v_confirmado
    from public.pagamentos p
    where p.cobranca_id = v_cobranca_id and p.status = 'confirmado';

    if v_pagamento.valor_centavos > v_cobranca.valor_final_centavos - v_confirmado then
      return false;
    end if;

    update public.pagamentos
    set status = 'confirmado', confirmado_em = now()
    where id = p_pagamento_id;

    select coalesce(pg_catalog.sum(p.valor_centavos), 0)
      into v_confirmado
    from public.pagamentos p
    where p.cobranca_id = v_cobranca_id and p.status = 'confirmado';
    if v_confirmado = v_cobranca.valor_final_centavos then
      update public.cobrancas_mensais
      set status = 'paga'
      where id = v_cobranca_id;
    end if;
    return true;
  elsif p_acao = 'rejeitar' then
    if v_pagamento.status <> 'pendente' then
      return false;
    end if;
    update public.pagamentos
    set status = 'rejeitado', rejeitado_em = now()
    where id = p_pagamento_id;
    return true;
  end if;

  if v_pagamento.status <> 'confirmado' then
    return false;
  end if;
  update public.pagamentos
  set status = 'estornado', estornado_em = now()
  where id = p_pagamento_id;

  if v_cobranca.status = 'paga' then
    select coalesce(pg_catalog.sum(p.valor_centavos), 0)
      into v_confirmado
    from public.pagamentos p
    where p.cobranca_id = v_cobranca_id and p.status = 'confirmado';
    update public.cobrancas_mensais
    set status = case
      when v_confirmado >= v_cobranca.valor_final_centavos then 'paga'
      else 'aberta'
    end
    where id = v_cobranca_id;
  end if;

  return true;
end
$$;

revoke all on function public.definir_carencia_cobranca(smallint) from public, anon, authenticated;
revoke all on function public.salvar_regra_cobranca(uuid, bigint, smallint, text, bigint, numeric, text, text, date, integer) from public, anon, authenticated;
revoke all on function public.remover_regra_cobranca(uuid) from public, anon, authenticated;
revoke all on function public.gerar_cobrancas_mensais(date) from public, anon, authenticated;
revoke all on function public.enviar_cobranca(uuid) from public, anon, authenticated;
revoke all on function public.cancelar_cobranca(uuid) from public, anon, authenticated;
revoke all on function public.registrar_aviso_pagamento(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.decidir_pagamento(uuid, text) from public, anon, authenticated;
revoke all on function public.lancar_pagamento_professor(uuid, bigint, text, text) from public, anon, authenticated;
revoke all on function public.desfazer_lancamento_professor(uuid) from public, anon, authenticated;

grant execute on function public.definir_carencia_cobranca(smallint) to authenticated;
grant execute on function public.salvar_regra_cobranca(uuid, bigint, smallint, text, bigint, numeric, text, text, date, integer) to authenticated;
grant execute on function public.remover_regra_cobranca(uuid) to authenticated;
grant execute on function public.gerar_cobrancas_mensais(date) to authenticated;
grant execute on function public.enviar_cobranca(uuid) to authenticated;
grant execute on function public.cancelar_cobranca(uuid) to authenticated;
grant execute on function public.registrar_aviso_pagamento(uuid, bigint, text) to authenticated;
grant execute on function public.decidir_pagamento(uuid, text) to authenticated;
grant execute on function public.lancar_pagamento_professor(uuid, bigint, text, text) to authenticated;
grant execute on function public.desfazer_lancamento_professor(uuid) to authenticated;

commit;
