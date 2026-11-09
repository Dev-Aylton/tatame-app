-- RASCUNHO — NÃO EXECUTADA; aguarda revisão do Claude e autorização do Aylton
-- DEPENDE DE supabase/migrations/20261109_20_avulsos_trancados.sql (vinculos.status).
begin;

create or replace function public.gerar_cobrancas_mensais(p_mes date)
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
      and v.status is distinct from 'locked'
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

revoke all on function public.gerar_cobrancas_mensais(date) from public, anon, authenticated;
grant execute on function public.gerar_cobrancas_mensais(date) to authenticated;

commit;
