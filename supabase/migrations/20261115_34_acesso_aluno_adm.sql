-- Habilita acesso de Aluno para a única conta Adm ativa; exige vínculo ativo para liberar os recursos.
begin;

lock table public.perfis in share row exclusive mode;

create table public.acessos_aluno_adm (
  perfil_id uuid primary key references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default pg_catalog.now()
);

alter table public.acessos_aluno_adm enable row level security;
revoke all on table public.acessos_aluno_adm from public, anon, authenticated;

do $$
declare
  v_quantidade integer;
  v_adm_id uuid;
begin
  select pg_catalog.count(*)
    into v_quantidade
  from public.perfis
  where papel = 'adm'
    and ativo is true;

  if v_quantidade <> 1 then
    raise exception 'A migration exige exatamente uma conta Adm ativa; nenhuma conta foi habilitada.';
  end if;

  select id
    into v_adm_id
  from public.perfis
  where papel = 'adm'
    and ativo is true;

  insert into public.acessos_aluno_adm (perfil_id)
  values (v_adm_id);
end
$$;

create function public.perfil_aluno_habilitado(p_perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = p_perfil_id
      and p.ativo is true
      and (
        p.papel = 'aluno'
        or (
          p.papel = 'adm'
          and exists (
            select 1
            from public.acessos_aluno_adm acesso
            where acesso.perfil_id = p.id
          )
          and exists (
            select 1
            from public.vinculos v
            join public.perfis professor on professor.id = v.professor_id
            where v.aluno_id = p.id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
      )
      and (
        p.id = (select auth.uid())
        or (
          (select public.papel_atual()) = 'professor'
          and exists (
            select 1
            from public.vinculos v
            where v.aluno_id = p.id
              and v.professor_id = (select auth.uid())
          )
        )
      )
  );
$$;

create function public.tem_acesso_aluno()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.perfil_aluno_habilitado((select auth.uid()));
$$;

revoke all on function public.perfil_aluno_habilitado(uuid) from public, anon, authenticated;
revoke all on function public.tem_acesso_aluno() from public, anon, authenticated;
grant execute on function public.perfil_aluno_habilitado(uuid) to authenticated;
grant execute on function public.tem_acesso_aluno() to authenticated;

create policy perfis_select_adm_aluno_vinculado
  on public.perfis for select to authenticated
  using (
    public.perfil_aluno_habilitado(perfis.id)
    and (select public.papel_atual()) = 'professor'
    and exists (
      select 1
      from public.vinculos v
      where v.aluno_id = perfis.id
        and v.professor_id = (select auth.uid())
    )
  );

drop policy graduacoes_select_aluno on public.graduacoes;

create policy graduacoes_select_aluno
  on public.graduacoes for select to authenticated
  using (
    aluno_id = (select auth.uid())
    and (select public.tem_acesso_aluno())
  );

create policy cobrancas_select_adm_aluno
  on public.cobrancas_mensais for select to authenticated
  using (
    aluno_id = (select auth.uid())
    and (select public.tem_acesso_aluno())
    and enviada_em is not null
    and status <> 'cancelada'
  );

create policy pagamentos_select_adm_aluno
  on public.pagamentos for select to authenticated
  using (
    (select public.tem_acesso_aluno())
    and exists (
      select 1
      from public.cobrancas_mensais c
      where c.id = pagamentos.cobranca_id
        and c.aluno_id = (select auth.uid())
        and c.enviada_em is not null
        and c.status <> 'cancelada'
    )
  );

create policy feedbacks_select_adm_aluno
  on public.feedbacks for select to authenticated
  using (
    aluno_id = (select auth.uid())
    and (select public.tem_acesso_aluno())
  );

create policy metas_select_adm_aluno
  on public.metas for select to authenticated
  using (
    aluno_id = (select auth.uid())
    and (select public.tem_acesso_aluno())
  );

create policy grade_semanal_select_adm_aluno
  on public.grade_semanal for select to authenticated
  using (
    arquivado is false
    and (select public.tem_acesso_aluno())
    and exists (
      select 1
      from public.grade_semanal_publicacao gp
      join public.vinculos v on v.professor_id = gp.professor_id
      join public.perfis professor on professor.id = v.professor_id
      where gp.professor_id = grade_semanal.professor_id
        and gp.publicada is true
        and v.aluno_id = (select auth.uid())
        and professor.papel = 'professor'
        and professor.ativo is true
    )
  );

create policy grade_semanal_publicacao_select_adm_aluno
  on public.grade_semanal_publicacao for select to authenticated
  using (
    publicada is true
    and (select public.tem_acesso_aluno())
    and exists (
      select 1
      from public.vinculos v
      join public.perfis professor on professor.id = v.professor_id
      where v.professor_id = grade_semanal_publicacao.professor_id
        and v.aluno_id = (select auth.uid())
        and professor.papel = 'professor'
        and professor.ativo is true
    )
  );

create policy avisos_select_adm_aluno
  on public.avisos for select to authenticated
  using (
    arquivado is false
    and (select public.tem_acesso_aluno())
    and exists (
      select 1
      from public.vinculos v
      join public.perfis professor on professor.id = v.professor_id
      where v.aluno_id = (select auth.uid())
        and v.professor_id = avisos.professor_id
        and professor.papel = 'professor'
        and professor.ativo is true
    )
  );

create policy faq_select_adm_aluno
  on public.faq for select to authenticated
  using (
    arquivado is false
    and (select public.tem_acesso_aluno())
    and exists (
      select 1
      from public.vinculos v
      join public.perfis professor on professor.id = v.professor_id
      where v.aluno_id = (select auth.uid())
        and v.professor_id = faq.professor_id
        and professor.papel = 'professor'
        and professor.ativo is true
    )
  );

create policy conversas_professor_select_adm_aluno
  on public.conversas_professor for select to authenticated
  using (
    participante_id = (select auth.uid())
    and (select public.tem_acesso_aluno())
    and exists (
      select 1
      from public.vinculos v
      join public.perfis professor on professor.id = v.professor_id
      where v.aluno_id = (select auth.uid())
        and v.professor_id = conversas_professor.professor_id
        and professor.papel = 'professor'
        and professor.ativo is true
    )
  );

create or replace function public.criar_conversa_professor(
  p_destinatario_id uuid,
  p_texto text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
  v_aluno boolean := public.tem_acesso_aluno();
  v_professor_id uuid;
  v_participante_id uuid;
  v_conversa_id uuid;
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
begin
  if v_uid is null or pg_catalog.char_length(v_texto) = 0 then
    return null;
  end if;

  if v_papel = 'professor' then
    v_professor_id := v_uid;
    v_participante_id := p_destinatario_id;
  elsif v_papel in ('aluno', 'instrutor') or v_aluno then
    v_professor_id := p_destinatario_id;
    v_participante_id := v_uid;
  else
    return null;
  end if;

  if not (
    exists (
      select 1
      from public.vinculos v
      join public.perfis professor on professor.id = v.professor_id
      join public.perfis aluno on aluno.id = v.aluno_id
      where v.professor_id = v_professor_id
        and v.aluno_id = v_participante_id
        and professor.papel = 'professor'
        and professor.ativo is true
        and public.perfil_aluno_habilitado(aluno.id)
      )
    or exists (
      select 1
      from public.instrutores_professor ip
      join public.perfis professor on professor.id = ip.professor_id
      join public.perfis instrutor on instrutor.id = ip.instrutor_id
      where ip.professor_id = v_professor_id
        and ip.instrutor_id = v_participante_id
        and professor.papel = 'professor'
        and professor.ativo is true
        and instrutor.papel = 'instrutor'
        and instrutor.ativo is true
    )
  ) then
    return null;
  end if;

  insert into public.conversas_professor (professor_id, participante_id)
  values (v_professor_id, v_participante_id)
  on conflict (professor_id, participante_id)
  do update set professor_id = excluded.professor_id
  returning id into v_conversa_id;

  insert into public.mensagens_professor (conversa_id, remetente_id, texto)
  values (v_conversa_id, v_uid, v_texto);

  return v_conversa_id;
end
$$;

create or replace function public.responder_conversa_professor(
  p_conversa_id uuid,
  p_texto text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
  v_aluno boolean := public.tem_acesso_aluno();
  v_professor_id uuid;
  v_participante_id uuid;
  v_mensagem_id uuid;
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
begin
  if v_uid is null or pg_catalog.char_length(v_texto) = 0 then
    return null;
  end if;

  select c.professor_id, c.participante_id
    into v_professor_id, v_participante_id
  from public.conversas_professor c
  where c.id = p_conversa_id
    and (c.professor_id = v_uid or c.participante_id = v_uid)
  for update;

  if not found
     or not (
       (v_papel = 'professor' and v_uid = v_professor_id)
       or ((v_papel in ('aluno', 'instrutor') or v_aluno) and v_uid = v_participante_id)
     )
     or not (
       exists (
         select 1
         from public.vinculos v
         join public.perfis professor on professor.id = v.professor_id
         join public.perfis aluno on aluno.id = v.aluno_id
         where v.professor_id = v_professor_id
           and v.aluno_id = v_participante_id
           and professor.papel = 'professor'
           and professor.ativo is true
           and public.perfil_aluno_habilitado(aluno.id)
       )
       or exists (
         select 1
         from public.instrutores_professor ip
         join public.perfis professor on professor.id = ip.professor_id
         join public.perfis instrutor on instrutor.id = ip.instrutor_id
         where ip.professor_id = v_professor_id
           and ip.instrutor_id = v_participante_id
           and professor.papel = 'professor'
           and professor.ativo is true
           and instrutor.papel = 'instrutor'
           and instrutor.ativo is true
       )
     ) then
    return null;
  end if;

  insert into public.mensagens_professor (conversa_id, remetente_id, texto)
  values (p_conversa_id, v_uid, v_texto)
  returning id into v_mensagem_id;

  return v_mensagem_id;
end
$$;

create or replace function public.listar_conversas_professor()
returns table (
  conversa_id uuid,
  professor_id uuid,
  participante_id uuid,
  participante_nome text,
  mensagem_id uuid,
  remetente_id uuid,
  texto text,
  enviado_em timestamptz
)
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
  if v_uid is null
     or (v_papel not in ('professor', 'aluno', 'instrutor') and not v_aluno) then
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
         m.enviado_em
  from public.conversas_professor c
  join public.perfis participante on participante.id = c.participante_id
  join public.mensagens_professor m on m.conversa_id = c.id
  where (
    (v_papel = 'professor' and c.professor_id = v_uid)
    or ((v_papel in ('aluno', 'instrutor') or v_aluno) and c.participante_id = v_uid)
  )
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
  order by c.criado_em desc, m.enviado_em, m.id;
end
$$;

create or replace function public.listar_grade_semanal()
returns table (
  id uuid,
  professor_id uuid,
  dias text,
  horario text,
  arquivado boolean,
  publicada boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id,
         g.professor_id,
         g.dias,
         g.horario,
         g.arquivado,
         coalesce(gp.publicada, false)
  from public.grade_semanal g
  left join public.grade_semanal_publicacao gp
    on gp.professor_id = g.professor_id
  where (
    (
      g.professor_id = (select auth.uid())
      and (select public.papel_atual()) = 'professor'
    )
    or (
      g.arquivado is false
      and gp.publicada is true
      and (
        (
          (select public.tem_acesso_aluno())
          and exists (
            select 1
            from public.vinculos v
            join public.perfis professor on professor.id = v.professor_id
            where v.aluno_id = (select auth.uid())
              and v.professor_id = g.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
        or (
          (select public.papel_atual()) = 'instrutor'
          and exists (
            select 1
            from public.instrutores_professor ip
            join public.perfis professor on professor.id = ip.professor_id
            where ip.instrutor_id = (select auth.uid())
              and ip.professor_id = g.professor_id
              and professor.papel = 'professor'
              and professor.ativo is true
          )
        )
      )
    )
  );
$$;

create or replace function public.listar_avisos()
returns table (
  id uuid,
  professor_id uuid,
  titulo text,
  texto text,
  fixado boolean,
  arquivado boolean,
  criado_em timestamptz
)
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
  if v_uid is null or (v_papel not in ('professor', 'instrutor') and not v_aluno) then
    return;
  end if;

  return query
  select a.id, a.professor_id, a.titulo, a.texto, a.fixado, a.arquivado, a.criado_em
  from public.avisos a
  where (
    (v_papel = 'professor' and a.professor_id = v_uid)
    or (
      v_aluno
      and a.arquivado is false
      and exists (
        select 1
        from public.vinculos v
        join public.perfis professor on professor.id = v.professor_id
        where v.aluno_id = v_uid
          and v.professor_id = a.professor_id
          and professor.papel = 'professor'
          and professor.ativo is true
      )
    )
    or (
      v_papel = 'instrutor'
      and a.arquivado is false
      and exists (
        select 1
        from public.instrutores_professor ip
        join public.perfis professor on professor.id = ip.professor_id
        where ip.instrutor_id = v_uid
          and ip.professor_id = a.professor_id
          and professor.papel = 'professor'
          and professor.ativo is true
      )
    )
  )
  order by a.fixado desc, a.criado_em desc, a.id;
end
$$;

create or replace function public.listar_faq()
returns table (
  id uuid,
  professor_id uuid,
  pergunta text,
  resposta text,
  ordem integer,
  arquivado boolean,
  criado_em timestamptz
)
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
  if v_uid is null or (v_papel not in ('professor', 'instrutor') and not v_aluno) then
    return;
  end if;

  return query
  select f.id, f.professor_id, f.pergunta, f.resposta, f.ordem, f.arquivado, f.criado_em
  from public.faq f
  where (
    (v_papel = 'professor' and f.professor_id = v_uid)
    or (
      v_aluno
      and f.arquivado is false
      and exists (
        select 1
        from public.vinculos v
        join public.perfis professor on professor.id = v.professor_id
        where v.aluno_id = v_uid
          and v.professor_id = f.professor_id
          and professor.papel = 'professor'
          and professor.ativo is true
      )
    )
    or (
      v_papel = 'instrutor'
      and f.arquivado is false
      and exists (
        select 1
        from public.instrutores_professor ip
        join public.perfis professor on professor.id = ip.professor_id
        where ip.instrutor_id = v_uid
          and ip.professor_id = f.professor_id
          and professor.papel = 'professor'
          and professor.ativo is true
      )
    )
  )
  order by f.ordem, f.criado_em, f.id;
end
$$;

create or replace function public.listar_feedbacks(p_aluno_id uuid default null)
returns table (
  id uuid,
  professor_id uuid,
  aluno_id uuid,
  texto text,
  criado_em timestamptz
)
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
  if v_uid is null or (v_papel <> 'professor' and not v_aluno) then
    return;
  end if;

  return query
  select f.id, f.professor_id, f.aluno_id, f.texto, f.criado_em
  from public.feedbacks f
  where (
    (v_papel = 'professor' and f.professor_id = v_uid
      and (p_aluno_id is null or f.aluno_id = p_aluno_id))
    or (v_aluno and f.aluno_id = v_uid)
  )
  order by f.criado_em, f.id;
end
$$;

create or replace function public.listar_metas(p_aluno_id uuid default null)
returns table (
  id uuid,
  professor_id uuid,
  aluno_id uuid,
  texto text,
  status text,
  criado_em timestamptz,
  atualizado_em timestamptz
)
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
  if v_uid is null or (v_papel <> 'professor' and not v_aluno) then
    return;
  end if;

  return query
  select m.id, m.professor_id, m.aluno_id, m.texto, m.status, m.criado_em, m.atualizado_em
  from public.metas m
  where (
    (v_papel = 'professor' and m.professor_id = v_uid
      and (p_aluno_id is null or m.aluno_id = p_aluno_id))
    or (v_aluno and m.aluno_id = v_uid)
  )
  order by m.criado_em, m.id;
end
$$;

create or replace function public.atribuir_graduacao(
  p_aluno_id uuid,
  p_faixa text,
  p_grau integer,
  p_data_graduacao date,
  p_observacao text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_graduacao_id uuid;
begin
  if v_uid is null or public.papel_atual() is distinct from 'professor' then
    raise exception 'Somente Professor ativo pode atribuir graduações.';
  end if;

  if p_aluno_id is null then
    raise exception 'Informe um aluno válido.';
  end if;

  if p_faixa is null or p_grau is null or not (
    (p_faixa in ('Branca', 'Azul', 'Roxa', 'Marrom') and p_grau between 0 and 4)
    or (p_faixa = 'Preta' and p_grau between 0 and 6)
    or (p_faixa = 'Coral vermelha e preta' and p_grau = 7)
    or (p_faixa = 'Coral vermelha e branca' and p_grau = 8)
    or (p_faixa = 'Vermelha' and p_grau between 9 and 10)
  ) then
    raise exception 'Faixa ou grau inválido.';
  end if;

  if p_data_graduacao is null or p_data_graduacao > current_date then
    raise exception 'A data da graduação não pode ser futura.';
  end if;

  if p_observacao is not null and pg_catalog.char_length(p_observacao) > 200 then
    raise exception 'A observação deve ter no máximo 200 caracteres.';
  end if;

  if not exists (
    select 1
    from public.vinculos v
    join public.perfis professor on professor.id = v.professor_id
    where v.aluno_id = p_aluno_id
      and v.professor_id = v_uid
      and professor.papel = 'professor'
      and professor.ativo is true
      and public.perfil_aluno_habilitado(p_aluno_id)
  ) then
    raise exception 'O aluno não está vinculado a este Professor ativo.';
  end if;

  insert into public.graduacoes (
    aluno_id,
    professor_id,
    faixa,
    grau,
    data_graduacao,
    observacao
  )
  values (
    p_aluno_id,
    v_uid,
    p_faixa,
    p_grau,
    p_data_graduacao,
    p_observacao
  )
  returning id into v_graduacao_id;

  return v_graduacao_id;
end;
$$;

revoke all on function public.atribuir_graduacao(uuid, text, integer, date, text)
  from public, anon, authenticated;
grant execute on function public.atribuir_graduacao(uuid, text, integer, date, text)
  to authenticated;

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

  return v_id;
end
$$;

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

create or replace function public.registrar_aviso_pagamento(
  p_cobranca_id uuid,
  p_valor_centavos bigint,
  p_tipo text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cobranca public.cobrancas_mensais%rowtype;
  v_pagamento_id uuid;
  v_confirmado numeric;
begin
  if v_uid is null
     or not public.tem_acesso_aluno()
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

create or replace function public.criar_feedback(p_aluno_id uuid, p_texto text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_aluno_id is null
     or pg_catalog.char_length(v_texto) not between 1 and 500
     or not exists (
       select 1
       from public.vinculos v
       where v.professor_id = v_uid
         and v.aluno_id = p_aluno_id
         and public.perfil_aluno_habilitado(v.aluno_id)
     ) then
    return null;
  end if;

  insert into public.feedbacks (professor_id, aluno_id, texto)
  values (v_uid, p_aluno_id, v_texto)
  returning id into v_id;

  return v_id;
end
$$;

create or replace function public.criar_meta(p_aluno_id uuid, p_texto text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or p_aluno_id is null
     or pg_catalog.char_length(v_texto) not between 1 and 200
     or not exists (
       select 1
       from public.vinculos v
       where v.professor_id = v_uid
         and v.aluno_id = p_aluno_id
         and public.perfil_aluno_habilitado(v.aluno_id)
     ) then
    return null;
  end if;

  insert into public.metas (professor_id, aluno_id, texto)
  values (v_uid, p_aluno_id, v_texto)
  returning id into v_id;

  return v_id;
end
$$;

create or replace function public.salvar_nota_privada(
  p_aluno_id uuid,
  p_aluno_sem_conta_id uuid,
  p_texto text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_texto text := pg_catalog.btrim(coalesce(p_texto, ''));
  v_id uuid;
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or (p_aluno_id is null) = (p_aluno_sem_conta_id is null)
     or pg_catalog.char_length(v_texto) not between 1 and 500 then
    return null;
  end if;

  if p_aluno_id is not null and not exists (
    select 1
    from public.vinculos v
    where v.aluno_id = p_aluno_id
      and v.professor_id = v_uid
      and public.perfil_aluno_habilitado(v.aluno_id)
  ) then
    return null;
  end if;

  if p_aluno_sem_conta_id is not null and not exists (
    select 1
    from public.alunos_sem_conta a
    where a.id = p_aluno_sem_conta_id
      and a.professor_id = v_uid
  ) then
    return null;
  end if;

  insert into public.notas_privadas (
    professor_id, aluno_id, aluno_sem_conta_id, texto
  )
  values (
    v_uid, p_aluno_id, p_aluno_sem_conta_id, v_texto
  )
  returning id into v_id;

  return v_id;
end
$$;

create or replace function public.pode_ler_comprovante_pagamento(p_pagamento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.comprovantes_pagamento cp
    join public.pagamentos p on p.id = cp.pagamento_id
    join public.cobrancas_mensais c on c.id = p.cobranca_id
    where cp.pagamento_id = p_pagamento_id
      and p.origem = 'aluno'
      and (
        (
          cp.estado_arquivo = 'ativo'
          and p.status = 'pendente'
          and c.status = 'aberta'
          and cp.criado_em > pg_catalog.now() - interval '30 days'
          and (
            (
              (select public.tem_acesso_aluno())
              and c.aluno_id = (select auth.uid())
            )
            or (
              (select public.papel_atual()) = 'professor'
              and c.professor_id = (select auth.uid())
              and exists (
                select 1
                from public.vinculos v
                where v.aluno_id = c.aluno_id
                  and v.professor_id = (select auth.uid())
              )
            )
          )
        )
        or (
          (select public.tem_acesso_aluno())
          and c.aluno_id = (select auth.uid())
          and p.status = 'pendente'
          and (
            (cp.estado_arquivo = 'ativo'
              and cp.criado_em <= pg_catalog.now() - interval '30 days')
            or (cp.estado_arquivo = 'remocao_pendente'
              and cp.motivo_remocao = '30_dias')
          )
        )
        or (
          (select public.papel_atual()) = 'professor'
          and c.professor_id = (select auth.uid())
          and cp.estado_arquivo <> 'removido'
          and (
            cp.estado_arquivo = 'remocao_pendente'
            or p.status <> 'pendente'
            or cp.criado_em <= pg_catalog.now() - interval '30 days'
          )
          and exists (
            select 1
            from public.vinculos v
            where v.aluno_id = c.aluno_id
              and v.professor_id = (select auth.uid())
          )
        )
      )
  );
$$;

create or replace function public.pode_ver_storage_comprovante_pagamento(p_pagamento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.comprovantes_pagamento cp
    join public.pagamentos p on p.id = cp.pagamento_id
    join public.cobrancas_mensais c on c.id = p.cobranca_id
    where cp.pagamento_id = p_pagamento_id
      and cp.estado_arquivo = 'ativo'
      and cp.criado_em > pg_catalog.now() - interval '30 days'
      and p.origem = 'aluno'
      and p.status = 'pendente'
      and c.status = 'aberta'
      and (
        (
          (select public.tem_acesso_aluno())
          and c.aluno_id = (select auth.uid())
        )
        or (
          (select public.papel_atual()) = 'professor'
          and c.professor_id = (select auth.uid())
          and exists (
            select 1
            from public.vinculos v
            where v.aluno_id = c.aluno_id
              and v.professor_id = (select auth.uid())
          )
        )
      )
  );
$$;

create or replace function public.pode_excluir_comprovante_storage(p_caminho_storage text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pagamento_id uuid;
begin
  if auth.uid() is null
     or p_caminho_storage is null
     or cardinality(string_to_array(p_caminho_storage, '/')) <> 2
     or split_part(p_caminho_storage, '/', 1) !~
       '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
     or split_part(p_caminho_storage, '/', 2) !~
       '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}[.](jpg|png|pdf)$' then
    return false;
  end if;

  v_pagamento_id := split_part(p_caminho_storage, '/', 1)::uuid;
  return exists (
    select 1
    from public.pagamentos p
    join public.cobrancas_mensais c on c.id = p.cobranca_id
    where p.id = v_pagamento_id
      and p.origem = 'aluno'
      and (
        (
          (select public.tem_acesso_aluno())
          and c.aluno_id = (select auth.uid())
          and (
            not exists (
              select 1
              from public.comprovantes_pagamento cp
              where cp.pagamento_id = p.id
            )
            or exists (
              select 1
              from public.comprovantes_pagamento cp
              where cp.pagamento_id = p.id
                and cp.caminho_storage = p_caminho_storage
                and cp.estado_arquivo <> 'removido'
                and p.status = 'pendente'
                and cp.criado_em <= pg_catalog.now() - interval '30 days'
            )
          )
        )
        or (
          (select public.papel_atual()) = 'professor'
          and c.professor_id = (select auth.uid())
          and exists (
            select 1
            from public.vinculos v
            where v.aluno_id = c.aluno_id
              and v.professor_id = (select auth.uid())
          )
          and exists (
            select 1
            from public.comprovantes_pagamento cp
            where cp.pagamento_id = p.id
              and cp.caminho_storage = p_caminho_storage
              and cp.estado_arquivo <> 'removido'
              and (
                cp.estado_arquivo = 'remocao_pendente'
                or p.status <> 'pendente'
                or cp.criado_em <= pg_catalog.now() - interval '30 days'
              )
          )
        )
      )
  );
end;
$$;

drop policy comprovantes_storage_insert_aluno on storage.objects;

create policy comprovantes_storage_insert_aluno
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'comprovantes'
    and (select public.tem_acesso_aluno())
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) ~
      '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
    and split_part(name, '/', 2) ~
      '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}[.](jpg|png|pdf)$'
    and exists (
      select 1
      from public.pagamentos p
      join public.cobrancas_mensais c on c.id = p.cobranca_id
      where p.id::text = split_part(name, '/', 1)
        and p.origem = 'aluno'
        and p.status = 'pendente'
        and c.aluno_id = (select auth.uid())
        and c.enviada_em is not null
        and c.status = 'aberta'
        and not exists (
          select 1
          from public.comprovantes_pagamento cp
          where cp.pagamento_id = p.id
        )
    )
  );

create or replace function public.registrar_comprovante_pagamento(
  p_pagamento_id uuid,
  p_caminho_storage text,
  p_tipo_mime text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tamanho_texto text;
  v_mime_storage text;
  v_tamanho bigint;
begin
  if v_uid is null
     or not public.tem_acesso_aluno()
     or p_pagamento_id is null
     or p_caminho_storage is null
     or p_tipo_mime is null
     or p_tipo_mime not in ('image/jpeg', 'image/png', 'application/pdf')
     or p_caminho_storage !~
       ('^' || p_pagamento_id::text ||
        '/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}[.](jpg|png|pdf)$')
     or not (
       (p_tipo_mime = 'image/jpeg' and p_caminho_storage ~ '[.]jpg$')
       or (p_tipo_mime = 'image/png' and p_caminho_storage ~ '[.]png$')
       or (p_tipo_mime = 'application/pdf' and p_caminho_storage ~ '[.]pdf$')
     ) then
    return false;
  end if;

  perform 1
  from public.pagamentos p
  join public.cobrancas_mensais c on c.id = p.cobranca_id
  where p.id = p_pagamento_id
    and p.origem = 'aluno'
    and p.status = 'pendente'
    and c.aluno_id = v_uid
    and c.enviada_em is not null
    and c.status = 'aberta'
    and not exists (
      select 1
      from public.comprovantes_pagamento cp
      where cp.pagamento_id = p.id
    )
  for update of p;
  if not found then
    return false;
  end if;

  select o.metadata ->> 'size', o.metadata ->> 'mimetype'
    into v_tamanho_texto, v_mime_storage
  from storage.objects o
  where o.bucket_id = 'comprovantes'
    and o.name = p_caminho_storage;
  if not found
     or v_tamanho_texto is null
     or v_mime_storage is distinct from p_tipo_mime
     or v_tamanho_texto !~ '^[0-9]+$' then
    return false;
  end if;

  v_tamanho := v_tamanho_texto::bigint;
  if v_tamanho not between 1 and 10485760 then
    return false;
  end if;

  insert into public.comprovantes_pagamento (
    pagamento_id, caminho_storage, tipo_mime, tamanho_bytes
  )
  values (
    p_pagamento_id, p_caminho_storage, p_tipo_mime, v_tamanho
  )
  on conflict do nothing;

  return found;
end;
$$;

create or replace function public.listar_comprovantes_pagamento_expirados()
returns table (pagamento_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select cp.pagamento_id
  from public.comprovantes_pagamento cp
  join public.pagamentos p on p.id = cp.pagamento_id
  join public.cobrancas_mensais c on c.id = p.cobranca_id
  where cp.estado_arquivo = 'ativo'
    and p.origem = 'aluno'
    and p.status = 'pendente'
    and cp.criado_em <= pg_catalog.now() - interval '30 days'
    and (
      (
        (select public.tem_acesso_aluno())
        and c.aluno_id = (select auth.uid())
      )
      or (
        (select public.papel_atual()) = 'professor'
        and c.professor_id = (select auth.uid())
        and exists (
          select 1
          from public.vinculos v
          where v.aluno_id = c.aluno_id
            and v.professor_id = (select auth.uid())
        )
      )
    )
  order by cp.criado_em;
$$;

create or replace function public.registrar_remocao_comprovante_pagamento(
  p_pagamento_id uuid,
  p_arquivo_removido boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_caminho_storage text;
  v_estado_arquivo text;
  v_criado_em timestamptz;
  v_status_pagamento text;
begin
  if v_uid is null or p_pagamento_id is null or p_arquivo_removido is null then
    return false;
  end if;

  select cp.caminho_storage, cp.estado_arquivo, cp.criado_em, p.status
    into v_caminho_storage, v_estado_arquivo, v_criado_em, v_status_pagamento
  from public.comprovantes_pagamento cp
  join public.pagamentos p on p.id = cp.pagamento_id
  join public.cobrancas_mensais c on c.id = p.cobranca_id
  where cp.pagamento_id = p_pagamento_id
    and p.origem = 'aluno'
    and (
      (
        (select public.tem_acesso_aluno())
        and c.aluno_id = v_uid
      )
      or (
        (select public.papel_atual()) = 'professor'
        and c.professor_id = v_uid
        and exists (
          select 1
          from public.vinculos v
          where v.aluno_id = c.aluno_id
            and v.professor_id = v_uid
        )
      )
    )
  for update of cp;
  if not found then
    return false;
  end if;

  if p_arquivo_removido then
    if v_estado_arquivo <> 'remocao_pendente'
       or exists (
         select 1
         from storage.objects o
         where o.bucket_id = 'comprovantes'
          and o.name = v_caminho_storage
       ) then
      return false;
    end if;

    update public.comprovantes_pagamento
    set estado_arquivo = 'removido',
        arquivo_removido_em = pg_catalog.now(),
        arquivo_removido_por = v_uid
    where pagamento_id = p_pagamento_id;
    return found;
  end if;

  if v_estado_arquivo = 'remocao_pendente'
     or v_estado_arquivo = 'removido' then
    return true;
  end if;

  if (
       v_status_pagamento = 'pendente'
       and v_criado_em <= pg_catalog.now() - interval '30 days'
     )
     or (
       v_status_pagamento <> 'pendente'
       and (select public.papel_atual()) = 'professor'
     ) then
    update public.comprovantes_pagamento
    set estado_arquivo = 'remocao_pendente',
        remocao_solicitada_em = pg_catalog.now(),
        remocao_solicitada_por = v_uid,
        motivo_remocao = case
          when v_status_pagamento = 'pendente' then '30_dias'
          when v_status_pagamento = 'rejeitado' then 'rejeitado'
          else 'confirmado'
        end
    where pagamento_id = p_pagamento_id
      and estado_arquivo = 'ativo';
    return found;
  end if;

  return false;
end;
$$;

create or replace function public.definir_status_aluno_vinculado(
  p_aluno_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null
     or public.papel_atual() is distinct from 'professor'
     or (p_status is not null and p_status is distinct from 'locked') then
    return false;
  end if;

  update public.vinculos v
  set status = p_status,
      trancado_desde = case
        when p_status = 'locked' and v.status is distinct from 'locked'
          then current_date
        else v.trancado_desde
      end,
      trancado_ate = case
        when p_status = 'locked' and v.status is distinct from 'locked'
          then null
        when p_status is null and v.status = 'locked'
          then current_date
        else v.trancado_ate
      end
  from public.perfis aluno
  where v.aluno_id = p_aluno_id
    and v.professor_id = v_uid
    and aluno.id = v.aluno_id
    and aluno.ativo is true
    and public.perfil_aluno_habilitado(aluno.id);

  return found;
end
$$;

create or replace function public.pode_ler_foto_perfil(p_perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis alvo
    where alvo.id = p_perfil_id
      and (alvo.papel <> 'aluno' or alvo.idade_declarada = 'adulto')
      and exists (
        select 1
        from public.perfis_fotos pf
        where pf.perfil_id = p_perfil_id
      )
      and (
        alvo.id = (select auth.uid())
        or (
          alvo.papel in ('aluno', 'instrutor')
          and (select public.papel_atual()) = 'professor'
          and exists (
            select 1
            from public.vinculos v
            where v.professor_id = (select auth.uid())
              and v.aluno_id = alvo.id
          )
        )
        or (
          alvo.papel = 'adm'
          and (select public.papel_atual()) = 'professor'
          and (select public.perfil_aluno_habilitado(alvo.id))
        )
      )
  );
$$;

commit;
