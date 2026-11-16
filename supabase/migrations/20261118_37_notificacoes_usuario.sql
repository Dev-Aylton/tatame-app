-- NÃO EXECUTADA — aplicar somente após revisão do desenvolvedor.
-- Reúne avisos internos de mensagens não lidas e cobranças em atraso.
begin;

create table public.notificacoes_usuario_estado (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references public.perfis (id) on delete cascade,
  tipo text not null
    check (tipo in ('mensagem', 'cobranca_atrasada')),
  mensagem_id uuid
    references public.mensagens_professor (id) on delete cascade,
  cobranca_id uuid
    references public.cobrancas_mensais (id) on delete cascade,
  lida_em timestamptz,
  dispensada_em timestamptz,
  criada_em timestamptz not null default now(),
  constraint notificacoes_usuario_estado_origem_check check (
    (tipo = 'mensagem' and mensagem_id is not null and cobranca_id is null)
    or (tipo = 'cobranca_atrasada' and mensagem_id is null and cobranca_id is not null)
  ),
  constraint notificacoes_usuario_estado_mensagem_unique
    unique (usuario_id, mensagem_id),
  constraint notificacoes_usuario_estado_cobranca_unique
    unique (usuario_id, cobranca_id)
);

create index notificacoes_usuario_estado_usuario_idx
  on public.notificacoes_usuario_estado (usuario_id, criada_em desc)
  where dispensada_em is null;

alter table public.notificacoes_usuario_estado enable row level security;
revoke all on table public.notificacoes_usuario_estado
  from public, anon, authenticated;

create function public.marcar_notificacoes_conversa_lidas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.ultima_leitura_em is null then
    return new;
  end if;

  update public.notificacoes_usuario_estado estado
  set lida_em = coalesce(estado.lida_em, now())
  from public.mensagens_professor mensagem
  where estado.usuario_id = new.usuario_id
    and estado.tipo = 'mensagem'
    and estado.mensagem_id = mensagem.id
    and mensagem.conversa_id = new.conversa_id
    and (mensagem.enviado_em, mensagem.id)
      <= (new.ultima_leitura_em, new.ultima_leitura_id);

  return new;
end
$$;

create trigger conversas_professor_estado_notificacoes_lidas
after insert or update of ultima_leitura_em, ultima_leitura_id
on public.conversas_professor_estado
for each row execute function public.marcar_notificacoes_conversa_lidas();
revoke all on function public.marcar_notificacoes_conversa_lidas()
  from public, anon, authenticated;

create function public.listar_notificacoes_usuario()
returns table (
  id uuid,
  tipo text,
  titulo text,
  mensagem text,
  destino text,
  destino_id uuid,
  criada_em timestamptz,
  lida_em timestamptz,
  vencimento date,
  saldo_centavos bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
  v_aluno boolean := public.tem_acesso_aluno();
begin
  if v_uid is null then
    return;
  end if;

  insert into public.notificacoes_usuario_estado (
    usuario_id, tipo, mensagem_id
  )
  select v_uid, 'mensagem', resumo.ultima_mensagem_id
  from public.resumo_conversas_nao_lidas() resumo
  on conflict do nothing;

  if v_papel = 'professor' then
    insert into public.notificacoes_usuario_estado (
      usuario_id, tipo, cobranca_id
    )
    select v_uid, 'cobranca_atrasada', cobranca.id
    from public.cobrancas_mensais cobranca
    join public.academias academia on academia.id = cobranca.academia_id
    where cobranca.professor_id = v_uid
      and cobranca.academia_id = public.academia_atual()
      and cobranca.enviada_em is not null
      and cobranca.status = 'aberta'
      and cobranca.vencimento + academia.dias_carencia < current_date
      and cobranca.valor_final_centavos > coalesce((
        select sum(pagamento.valor_centavos)
        from public.pagamentos pagamento
        where pagamento.cobranca_id = cobranca.id
          and pagamento.status = 'confirmado'
      ), 0)
    on conflict do nothing;
  elsif (v_papel = 'aluno' or v_aluno)
      and public.perfil_aluno_habilitado(v_uid) then
    insert into public.notificacoes_usuario_estado (
      usuario_id, tipo, cobranca_id
    )
    select v_uid, 'cobranca_atrasada', cobranca.id
    from public.cobrancas_mensais cobranca
    join public.academias academia on academia.id = cobranca.academia_id
    where cobranca.aluno_id = v_uid
      and cobranca.enviada_em is not null
      and cobranca.status = 'aberta'
      and cobranca.vencimento + academia.dias_carencia < current_date
      and cobranca.valor_final_centavos > coalesce((
        select sum(pagamento.valor_centavos)
        from public.pagamentos pagamento
        where pagamento.cobranca_id = cobranca.id
          and pagamento.status = 'confirmado'
      ), 0)
    on conflict do nothing;
  end if;

  return query
  select estado.id,
         estado.tipo,
         case when estado.tipo = 'mensagem'
           then 'Nova mensagem'::text
           else 'Cobrança em atraso'::text
         end,
         case when estado.tipo = 'mensagem'
           then coalesce(resumo.outra_pessoa_nome, 'Pessoa vinculada')
             || ' enviou uma nova mensagem.'
           else 'Há um saldo em aberto após o vencimento.'
         end::text,
         case when estado.tipo = 'mensagem'
           then case
             when v_papel = 'professor' then 'teacher-chat'
             when v_papel = 'instrutor' then 'instructor-chat'
             else 'student-chat'
           end
           when v_papel = 'professor' then 'monthly-charges'
           else 'student-payments'
         end::text,
         case when estado.tipo = 'mensagem' then mensagem.conversa_id
           else cobranca.id
         end,
         coalesce(mensagem.enviado_em, cobranca.criado_em),
         estado.lida_em,
         cobranca.vencimento,
         case when estado.tipo = 'cobranca_atrasada'
           then cobranca.valor_final_centavos - coalesce(pagamentos.confirmados, 0)
           else null
         end
  from public.notificacoes_usuario_estado estado
  left join public.mensagens_professor mensagem
    on mensagem.id = estado.mensagem_id
  left join public.resumo_conversas_nao_lidas() resumo
    on resumo.ultima_mensagem_id = mensagem.id
  left join public.cobrancas_mensais cobranca
    on cobranca.id = estado.cobranca_id
  left join public.academias academia
    on academia.id = cobranca.academia_id
  left join lateral (
    select coalesce(sum(pagamento.valor_centavos), 0)::bigint as confirmados
    from public.pagamentos pagamento
    where pagamento.cobranca_id = cobranca.id
      and pagamento.status = 'confirmado'
  ) pagamentos on true
  where estado.usuario_id = v_uid
    and estado.dispensada_em is null
    and (
      (
        estado.tipo = 'mensagem'
        and mensagem.apagada_em is null
        and resumo.ultima_mensagem_id = mensagem.id
      )
      or (
        estado.tipo = 'cobranca_atrasada'
        and cobranca.status = 'aberta'
        and cobranca.enviada_em is not null
        and cobranca.vencimento + academia.dias_carencia < current_date
        and cobranca.valor_final_centavos > pagamentos.confirmados
        and (
          (
            v_papel = 'professor'
            and cobranca.professor_id = v_uid
            and cobranca.academia_id = public.academia_atual()
          )
          or (
            (v_papel = 'aluno' or v_aluno)
            and public.perfil_aluno_habilitado(v_uid)
            and cobranca.aluno_id = v_uid
          )
        )
      )
    )
  order by coalesce(mensagem.enviado_em, cobranca.criado_em) desc;
end
$$;

create function public.atualizar_estado_notificacao_usuario(
  p_notificacao_id uuid,
  p_acao text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tipo text;
  v_mensagem_id uuid;
  v_conversa_id uuid;
  v_leituras_atualizadas integer;
  v_atualizadas integer := 0;
begin
  if v_uid is null or p_notificacao_id is null or p_acao is null
      or p_acao not in ('lida', 'dispensada') then
    return false;
  end if;

  select estado.tipo, estado.mensagem_id
    into v_tipo, v_mensagem_id
  from public.notificacoes_usuario_estado estado
  where estado.id = p_notificacao_id
    and estado.usuario_id = v_uid;
  if not found then
    return false;
  end if;

  if p_acao = 'lida' and v_tipo = 'mensagem' then
    select mensagem.conversa_id into v_conversa_id
    from public.mensagens_professor mensagem
    where mensagem.id = v_mensagem_id;
    if v_conversa_id is not null then
      v_leituras_atualizadas := public.marcar_conversas_lidas(
        pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object(
            'conversa_id', v_conversa_id,
            'mensagem_id', v_mensagem_id
          )
        )
      );
      if v_leituras_atualizadas < 0 then
        return false;
      end if;
    end if;
  end if;

  update public.notificacoes_usuario_estado
  set lida_em = case when p_acao = 'lida'
        then coalesce(lida_em, now()) else lida_em end,
      dispensada_em = case when p_acao = 'dispensada'
        then coalesce(dispensada_em, now()) else dispensada_em end
  where id = p_notificacao_id
    and usuario_id = v_uid;

  get diagnostics v_atualizadas = row_count;
  return v_atualizadas = 1;
end
$$;

revoke all on function public.listar_notificacoes_usuario()
  from public, anon, authenticated;
revoke all on function public.atualizar_estado_notificacao_usuario(uuid, text)
  from public, anon, authenticated;
grant execute on function public.listar_notificacoes_usuario()
  to authenticated;
grant execute on function public.atualizar_estado_notificacao_usuario(uuid, text)
  to authenticated;

do $$
begin
  if exists (
    select 1 from pg_catalog.pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cobrancas_mensais'
    ) then
      alter publication supabase_realtime
        add table public.cobrancas_mensais;
    end if;
    if not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'pagamentos'
    ) then
      alter publication supabase_realtime
        add table public.pagamentos;
    end if;
  end if;
end
$$;

commit;
