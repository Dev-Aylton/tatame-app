-- Aplicada no banco verificado; preservar como histórico.
-- Organiza conversas por participante e habilita avisos internos sem notificações push.
begin;

alter table public.mensagens_professor
  add column apagada_em timestamptz;

alter table public.mensagens_professor
  alter column texto drop not null,
  drop constraint if exists mensagens_professor_texto_check;

alter table public.mensagens_professor
  add constraint mensagens_professor_conteudo_check check (
    (apagada_em is null
      and texto is not null
      and pg_catalog.char_length(pg_catalog.btrim(texto)) > 0)
    or (apagada_em is not null and texto is null)
  );

create table public.conversas_professor_estado (
  conversa_id uuid not null
    references public.conversas_professor (id) on delete cascade,
  usuario_id uuid not null
    references public.perfis (id) on delete cascade,
  ultima_leitura_em timestamptz,
  ultima_leitura_id uuid,
  arquivada_em timestamptz,
  primary key (conversa_id, usuario_id),
  constraint conversas_professor_estado_leitura_check check (
    (ultima_leitura_em is null) = (ultima_leitura_id is null)
  )
);

create index conversas_professor_estado_usuario_idx
  on public.conversas_professor_estado (usuario_id, arquivada_em, conversa_id);

create table public.mensagens_professor_ocultas (
  mensagem_id uuid not null
    references public.mensagens_professor (id) on delete cascade,
  usuario_id uuid not null
    references public.perfis (id) on delete cascade,
  ocultada_em timestamptz not null default pg_catalog.now(),
  primary key (mensagem_id, usuario_id)
);

alter table public.conversas_professor_estado enable row level security;
alter table public.mensagens_professor_ocultas enable row level security;
revoke all on table public.conversas_professor_estado,
  public.mensagens_professor_ocultas from public, anon, authenticated;

create function public.usuario_pode_acessar_conversa_professor(p_conversa_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
  v_aluno boolean := public.tem_acesso_aluno();
begin
  if v_uid is null or p_conversa_id is null then
    return false;
  end if;

  return exists (
    select 1
    from public.conversas_professor c
    where c.id = p_conversa_id
      and (
        (
          c.professor_id = v_uid
          and v_papel = 'professor'
          and (
            exists (
              select 1
              from public.vinculos v
              join public.perfis professor on professor.id = v.professor_id
              join public.perfis aluno on aluno.id = v.aluno_id
              where v.professor_id = c.professor_id
                and v.aluno_id = c.participante_id
                and professor.papel = 'professor'
                and professor.ativo is true
                and public.perfil_aluno_habilitado(aluno.id)
            )
            or exists (
              select 1
              from public.instrutores_professor ip
              join public.perfis professor on professor.id = ip.professor_id
              join public.perfis instrutor on instrutor.id = ip.instrutor_id
              where ip.professor_id = c.professor_id
                and ip.instrutor_id = c.participante_id
                and professor.papel = 'professor'
                and professor.ativo is true
                and instrutor.papel = 'instrutor'
                and instrutor.ativo is true
            )
          )
        )
        or (
          c.participante_id = v_uid
          and (
            (
              (v_papel = 'aluno' or v_aluno)
              and exists (
                select 1
                from public.vinculos v
                join public.perfis professor on professor.id = v.professor_id
                join public.perfis aluno on aluno.id = v.aluno_id
                where v.professor_id = c.professor_id
                  and v.aluno_id = c.participante_id
                  and professor.papel = 'professor'
                  and professor.ativo is true
                  and public.perfil_aluno_habilitado(aluno.id)
              )
            )
            or (
              v_papel = 'instrutor'
              and exists (
                select 1
                from public.instrutores_professor ip
                join public.perfis professor on professor.id = ip.professor_id
                join public.perfis instrutor on instrutor.id = ip.instrutor_id
                where ip.professor_id = c.professor_id
                  and ip.instrutor_id = c.participante_id
                  and professor.papel = 'professor'
                  and professor.ativo is true
                  and instrutor.papel = 'instrutor'
                  and instrutor.ativo is true
              )
            )
          )
        )
      )
  );
end
$$;

create function public.usuario_pode_ver_mensagem_professor(
  p_mensagem_id uuid,
  p_conversa_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.usuario_pode_acessar_conversa_professor(p_conversa_id)
    and not exists (
      select 1
      from public.mensagens_professor_ocultas o
      where o.mensagem_id = p_mensagem_id
        and o.usuario_id = auth.uid()
    )
$$;

revoke all on function public.usuario_pode_acessar_conversa_professor(uuid)
  from public, anon, authenticated;
revoke all on function public.usuario_pode_ver_mensagem_professor(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.usuario_pode_acessar_conversa_professor(uuid)
  to authenticated;
grant execute on function public.usuario_pode_ver_mensagem_professor(uuid, uuid)
  to authenticated;

drop policy if exists conversas_professor_select_participantes
  on public.conversas_professor;
create policy conversas_professor_select_participantes
  on public.conversas_professor for select to authenticated
  using (public.usuario_pode_acessar_conversa_professor(id));

drop policy if exists mensagens_professor_select_participantes
  on public.mensagens_professor;
create policy mensagens_professor_select_participantes
  on public.mensagens_professor for select to authenticated
  using (
    public.usuario_pode_ver_mensagem_professor(id, conversa_id)
  );

insert into public.conversas_professor_estado (
  conversa_id, usuario_id, ultima_leitura_em, ultima_leitura_id
)
select c.id, participantes.usuario_id, ultima.enviado_em, ultima.id
from public.conversas_professor c
cross join lateral (
  values (c.professor_id), (c.participante_id)
) as participantes(usuario_id)
left join lateral (
  select m.id, m.enviado_em
  from public.mensagens_professor m
  where m.conversa_id = c.id
  order by m.enviado_em desc, m.id desc
  limit 1
) ultima on true
on conflict (conversa_id, usuario_id) do nothing;

create function public.atualizar_estado_conversa_apos_mensagem()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.conversas_professor_estado as estado (
    conversa_id, usuario_id, ultima_leitura_em, ultima_leitura_id, arquivada_em
  )
  select c.id,
         participantes.usuario_id,
         case when participantes.usuario_id = new.remetente_id then new.enviado_em else null end,
         case when participantes.usuario_id = new.remetente_id then new.id else null end,
         null
  from public.conversas_professor c
  cross join lateral (
    values (c.professor_id), (c.participante_id)
  ) as participantes(usuario_id)
  where c.id = new.conversa_id
  on conflict (conversa_id, usuario_id) do update
  set ultima_leitura_em = case
        when excluded.usuario_id = new.remetente_id
          and (
            estado.ultima_leitura_em is null
            or (estado.ultima_leitura_em, estado.ultima_leitura_id)
              <= (excluded.ultima_leitura_em, excluded.ultima_leitura_id)
          )
        then excluded.ultima_leitura_em
        else estado.ultima_leitura_em
      end,
      ultima_leitura_id = case
        when excluded.usuario_id = new.remetente_id
          and (
            estado.ultima_leitura_em is null
            or (estado.ultima_leitura_em, estado.ultima_leitura_id)
              <= (excluded.ultima_leitura_em, excluded.ultima_leitura_id)
          )
        then excluded.ultima_leitura_id
        else estado.ultima_leitura_id
      end,
      arquivada_em = null;

  return new;
end
$$;

create trigger mensagens_professor_atualiza_estado_conversa
after insert on public.mensagens_professor
for each row execute function public.atualizar_estado_conversa_apos_mensagem();
revoke all on function public.atualizar_estado_conversa_apos_mensagem()
  from public, anon, authenticated;

drop function if exists public.listar_conversas_professor();
create function public.listar_conversas_professor()
returns table (
  conversa_id uuid,
  professor_id uuid,
  participante_id uuid,
  participante_nome text,
  mensagem_id uuid,
  remetente_id uuid,
  texto text,
  enviado_em timestamptz,
  apagada_em timestamptz,
  arquivada_em timestamptz,
  nao_lidas integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  return query
  select c.id,
         c.professor_id,
         c.participante_id,
         coalesce(participante.nome, 'Aluno sem nome')::text,
         m.id,
         m.remetente_id,
         m.texto,
         m.enviado_em,
         m.apagada_em,
         estado.arquivada_em,
         nao_lidas.total
  from public.conversas_professor c
  join public.perfis participante on participante.id = c.participante_id
  left join public.conversas_professor_estado estado
    on estado.conversa_id = c.id and estado.usuario_id = v_uid
  left join lateral (
    select mensagem.id, mensagem.remetente_id, mensagem.texto,
           mensagem.enviado_em, mensagem.apagada_em
    from public.mensagens_professor mensagem
    where mensagem.conversa_id = c.id
      and not exists (
        select 1
        from public.mensagens_professor_ocultas ocultas
        where ocultas.mensagem_id = mensagem.id
          and ocultas.usuario_id = v_uid
      )
  ) m on true
  cross join lateral (
    select count(*)::integer as total
    from public.mensagens_professor mensagem
    where mensagem.conversa_id = c.id
      and mensagem.remetente_id <> v_uid
      and mensagem.apagada_em is null
      and not exists (
        select 1
        from public.mensagens_professor_ocultas ocultas
        where ocultas.mensagem_id = mensagem.id
          and ocultas.usuario_id = v_uid
      )
      and (
        estado.ultima_leitura_em is null
        or (mensagem.enviado_em, mensagem.id)
          > (estado.ultima_leitura_em, estado.ultima_leitura_id)
      )
  ) nao_lidas
  where public.usuario_pode_acessar_conversa_professor(c.id)
  order by (estado.arquivada_em is not null),
           (
             select max(atividade.enviado_em)
             from public.mensagens_professor atividade
             where atividade.conversa_id = c.id
           ) desc nulls last,
           m.enviado_em nulls last,
           m.id nulls last;
end
$$;

create function public.resumo_conversas_nao_lidas()
returns table (
  conversa_id uuid,
  quantidade integer,
  outra_pessoa_nome text,
  ultima_mensagem_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  return query
  select c.id,
         nao_lidas.total,
         case when c.professor_id = v_uid
           then coalesce(participante.nome, 'Pessoa vinculada')
           else coalesce(professor.nome, 'Professor')
         end::text,
         nao_lidas.ultima_mensagem_id
  from public.conversas_professor c
  join public.perfis participante on participante.id = c.participante_id
  join public.perfis professor on professor.id = c.professor_id
  cross join lateral (
    select count(*)::integer as total,
           (pg_catalog.array_agg(m.id order by m.enviado_em desc, m.id desc))[1]
             as ultima_mensagem_id
    from public.mensagens_professor m
    where m.conversa_id = c.id
      and m.remetente_id <> v_uid
      and m.apagada_em is null
      and not exists (
        select 1
        from public.mensagens_professor_ocultas ocultas
        where ocultas.mensagem_id = m.id
          and ocultas.usuario_id = v_uid
      )
      and (
        not exists (
          select 1
          from public.conversas_professor_estado estado
          where estado.conversa_id = c.id
            and estado.usuario_id = v_uid
            and estado.ultima_leitura_em is not null
        )
        or (m.enviado_em, m.id) > (
          select estado.ultima_leitura_em, estado.ultima_leitura_id
          from public.conversas_professor_estado estado
          where estado.conversa_id = c.id
            and estado.usuario_id = v_uid
        )
      )
  ) nao_lidas
  where public.usuario_pode_acessar_conversa_professor(c.id)
    and nao_lidas.total > 0
  order by nao_lidas.ultima_mensagem_id;
end
$$;

create function public.marcar_conversas_lidas(p_lidos jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_atualizadas integer := 0;
begin
  if v_uid is null or pg_catalog.jsonb_typeof(p_lidos) is distinct from 'array' then
    return -1;
  end if;

  insert into public.conversas_professor_estado as estado (
    conversa_id, usuario_id, ultima_leitura_em, ultima_leitura_id
  )
  select validos.conversa_id, v_uid, validos.enviado_em, validos.mensagem_id
  from (
    select distinct on (c.id)
           c.id as conversa_id, m.enviado_em, m.id as mensagem_id
    from pg_catalog.jsonb_to_recordset(p_lidos) as pedido(
      conversa_id uuid, mensagem_id uuid
    )
    join public.conversas_professor c on c.id = pedido.conversa_id
    join public.mensagens_professor m
      on m.id = pedido.mensagem_id and m.conversa_id = c.id
    where public.usuario_pode_acessar_conversa_professor(c.id)
    order by c.id, m.enviado_em desc, m.id desc
  ) validos
  on conflict (conversa_id, usuario_id) do update
  set ultima_leitura_em = case
        when estado.ultima_leitura_em is null
          or (estado.ultima_leitura_em, estado.ultima_leitura_id)
            <= (excluded.ultima_leitura_em, excluded.ultima_leitura_id)
        then excluded.ultima_leitura_em
        else estado.ultima_leitura_em
      end,
      ultima_leitura_id = case
        when estado.ultima_leitura_em is null
          or (estado.ultima_leitura_em, estado.ultima_leitura_id)
            <= (excluded.ultima_leitura_em, excluded.ultima_leitura_id)
        then excluded.ultima_leitura_id
        else estado.ultima_leitura_id
      end;

  get diagnostics v_atualizadas = row_count;
  return v_atualizadas;
end
$$;

create function public.definir_arquivo_conversa_professor(
  p_conversa_id uuid,
  p_arquivada boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_arquivada is null
     or not public.usuario_pode_acessar_conversa_professor(p_conversa_id) then
    return false;
  end if;

  insert into public.conversas_professor_estado (
    conversa_id, usuario_id, arquivada_em
  )
  values (
    p_conversa_id, auth.uid(),
    case when p_arquivada then pg_catalog.now() else null end
  )
  on conflict (conversa_id, usuario_id) do update
  set arquivada_em = excluded.arquivada_em;

  return true;
end
$$;

create function public.gerenciar_mensagem_professor(
  p_mensagem_id uuid,
  p_escopo text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_conversa_id uuid;
  v_remetente_id uuid;
  v_apagada_em timestamptz;
begin
  if v_uid is null or p_escopo is null or p_escopo not in ('todos', 'mim') then
    return false;
  end if;

  select mensagem.conversa_id, mensagem.remetente_id, mensagem.apagada_em
    into v_conversa_id, v_remetente_id, v_apagada_em
  from public.mensagens_professor mensagem
  where mensagem.id = p_mensagem_id
  for update;

  if not found
     or not public.usuario_pode_acessar_conversa_professor(v_conversa_id) then
    return false;
  end if;

  if p_escopo = 'todos' then
    if v_remetente_id <> v_uid or v_apagada_em is not null then
      return false;
    end if;

    update public.mensagens_professor
    set texto = null,
        apagada_em = pg_catalog.now()
    where id = p_mensagem_id;

    return found;
  end if;

  if v_remetente_id = v_uid then
    return false;
  end if;

  insert into public.mensagens_professor_ocultas (mensagem_id, usuario_id)
  values (p_mensagem_id, v_uid)
  on conflict (mensagem_id, usuario_id) do nothing;

  return true;
end
$$;

revoke all on function public.listar_conversas_professor()
  from public, anon, authenticated;
revoke all on function public.resumo_conversas_nao_lidas()
  from public, anon, authenticated;
revoke all on function public.marcar_conversas_lidas(jsonb)
  from public, anon, authenticated;
revoke all on function public.definir_arquivo_conversa_professor(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.gerenciar_mensagem_professor(uuid, text)
  from public, anon, authenticated;
grant execute on function public.listar_conversas_professor()
  to authenticated;
grant execute on function public.resumo_conversas_nao_lidas()
  to authenticated;
grant execute on function public.marcar_conversas_lidas(jsonb)
  to authenticated;
grant execute on function public.definir_arquivo_conversa_professor(uuid, boolean)
  to authenticated;
grant execute on function public.gerenciar_mensagem_professor(uuid, text)
  to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'mensagens_professor'
  ) then
    execute 'alter publication supabase_realtime add table public.mensagens_professor';
  end if;
end
$$;

commit;
