-- Aplicada no banco verificado; preservar como histórico.
-- Preserva reemissões e disponibiliza ao Aluno cobranças abertas de regras ativas.
begin;

alter table public.cobrancas_mensais
  drop constraint if exists cobrancas_aluno_mes_unique;

create unique index cobrancas_aluno_mes_nao_cancelada_unique
  on public.cobrancas_mensais (aluno_id, mes)
  where status <> 'cancelada';

update public.cobrancas_mensais
set enviada_em = pg_catalog.now()
where status = 'aberta'
  and enviada_em is null;

create or replace function public.gerar_cobrancas_mensais(p_mes date)
returns integer
language plpgsql
security definer
set search_path = ''
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
      on a.id = rc.aluno_id and a.ativo is true
    where rc.professor_id = v_uid
      and rc.academia_id = v_academia
      and a.academia_id = v_academia
      and v.status is distinct from 'locked'
      and rc.ativa
      and public.perfil_aluno_habilitado(a.id)
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
      motivo_isencao, valor_final_centavos, status, enviada_em
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
      v_valor_final, v_status,
      case when v_status = 'aberta' then pg_catalog.now() else null end
    )
    on conflict do nothing;

    get diagnostics v_inseridas = row_count;
    v_total := v_total + v_inseridas;
  end loop;

  return v_total;
end
$$;

create or replace function public.salvar_regra_cobranca(
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
language plpgsql
security definer
set search_path = ''
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
         and a.ativo is true
         and a.academia_id = v_academia
         and public.perfil_aluno_habilitado(a.id)
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
      atualizado_em = pg_catalog.now()
  returning id into v_id;

  perform public.gerar_cobrancas_mensais(
    pg_catalog.date_trunc('month', current_date)::date
  );

  return v_id;
end
$$;

revoke all on function public.salvar_regra_cobranca(uuid, bigint, smallint, text, bigint, numeric, text, text, date, integer)
  from public, anon, authenticated;
grant execute on function public.salvar_regra_cobranca(uuid, bigint, smallint, text, bigint, numeric, text, text, date, integer)
  to authenticated;

revoke all on function public.gerar_cobrancas_mensais(date) from public, anon, authenticated;
grant execute on function public.gerar_cobrancas_mensais(date) to authenticated;

commit;
