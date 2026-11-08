-- ============================================================================
-- TATAME · schema.sql · DESCRIÇÃO DO ESTADO ATUAL DO BANCO REAL
-- Projeto Supabase: tatame
-- Estado verificado em: 08/11/2026
--
-- ATENÇÃO: este arquivo NÃO é migration e NÃO deve ser executado.
-- O banco real é a fonte da verdade; este arquivo é apenas uma descrição
-- do estado observado, montada a partir de:
--   (A) consultas ao banco real (information_schema, pg_policies, pg_proc);
--   (B) supabase/migrations/20261107_01_academias_perfis.sql
--       supabase/migrations/20261107_02_ativar_professor.sql
--       supabase/migrations/20261107_03_vinculo_aluno_professor.sql
--       supabase/migrations/20261107_04_ajustes_codigo_adm.sql
--       supabase/migrations/20261108_05_alunos_sem_conta.sql
--       supabase/migrations/20261108_06_idade_declarada_perfis.sql
--       supabase/migrations/20261108_07_convites_instrutor.sql
--       supabase/migrations/20261108_08_edicao_academia_auditoria.sql
--       supabase/migrations/20261109_09_trocar_professor.sql
--       supabase/migrations/20261109_10_definir_nome_professor.sql
--       supabase/migrations/20261109_11_consentimento.sql
--       supabase/migrations/20261109_12_criar_perfil_aluno.sql
-- O comportamento das funções das migrations 05 a 12 NÃO foi testado com
-- contas reais; somente estrutura e permissões foram conferidas por leitura.
-- ============================================================================


-- ============================================================================
-- TABELAS (10: 7 das migrations 01-04, mais 1 de _05, 1 de _07 e 1 de _08)
-- ============================================================================

-- public.academias
--   id              uuid        NOT NULL  default gen_random_uuid()   PK
--   nome            text        NOT NULL  check (char_length(btrim(nome)) between 2 and 80)
--   foto_fundo_url  text        NULL
--   criado_em       timestamptz NOT NULL  default now()
--   versao_edicao   bigint      NOT NULL  default 1  check (versao_edicao > 0)
--   Índices: nenhum além da PK.

-- public.perfis
--   id           uuid        NOT NULL  PK, FK -> auth.users(id) on delete cascade
--   papel        text        NOT NULL  check (papel in ('adm','professor','instrutor','aluno'))
--   nome         text        NULL      check (nome is null or char_length(btrim(nome)) between 1 and 80)
--   foto_url     text        NULL
--   academia_id  uuid        NULL      FK -> academias(id) on delete restrict
--   ativo        boolean     NOT NULL  default true
--   criado_em    timestamptz NOT NULL  default now()
--   idade_declarada text     NOT NULL  default 'nao_declarada'
--                                check (idade_declarada in ('nao_declarada','adulto','menor'))
--   Índices: perfis_academia_idx (academia_id).

-- public.professores_convidados
--   email        text        NOT NULL  PK, check (email = lower(btrim(email)) and email like '%_@_%._%')
--   academia_id  uuid        NOT NULL  FK -> academias(id) on delete restrict
--   status       text        NOT NULL  default 'convidado'
--                              check (status in ('convidado','ativo','revogado'))
--   perfil_id    uuid        NULL      FK -> perfis(id) on delete set null
--   criado_por   uuid        NULL      default auth.uid(), FK -> perfis(id) on delete set null
--   criado_em    timestamptz NOT NULL  default now()
--   Índices: nenhum além da PK.

-- public.turmas
--   professor_id  uuid        NOT NULL  PK, FK -> perfis(id) on delete cascade
--   codigo        text        NOT NULL  unique,
--                 check turmas_codigo_check (codigo ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$')
--                 (nome confirmado no banco; alfabeto de 32 caracteres, sem 0, O, 1, I)
--   criado_em     timestamptz NOT NULL  default now()
--   Índices: unique em codigo (além da PK).

-- public.vinculos
--   aluno_id      uuid        NOT NULL  PK, FK -> perfis(id) on delete cascade
--   professor_id  uuid        NOT NULL  FK -> perfis(id) on delete cascade
--   criado_em     timestamptz NOT NULL  default now()
--   Índices: vinculos_professor_idx (professor_id).

-- public.pedidos_vinculo
--   id            uuid        NOT NULL  default gen_random_uuid()   PK
--   aluno_id      uuid        NOT NULL  FK -> perfis(id) on delete cascade
--   professor_id  uuid        NOT NULL  FK -> perfis(id) on delete cascade
--   status        text        NOT NULL  default 'pendente'
--                               check (status in ('pendente','aprovado','recusado','cancelado'))
--   criado_em     timestamptz NOT NULL  default now()
--   decidido_em   timestamptz NULL
--   Índices: pedidos_um_pendente_idx UNIQUE (aluno_id) WHERE status = 'pendente';
--            pedidos_professor_idx (professor_id, status).

-- public.tentativas_codigo
--   aluno_id       uuid        NOT NULL  PK, FK -> perfis(id) on delete cascade
--   erros          integer     NOT NULL  default 0
--   bloqueado_ate  timestamptz NULL
--   Índices: nenhum além da PK.

-- public.alunos_sem_conta
--   id                uuid        NOT NULL  default gen_random_uuid()   PK
--   professor_id      uuid        NOT NULL  FK -> perfis(id) on delete cascade
--   nome              text        NOT NULL  check (char_length(btrim(nome)) between 1 and 80)
--   idade_declarada   text        NOT NULL  default 'nao_declarada'
--                                         check (idade_declarada in ('nao_declarada','adulto','menor'))
--   criado_em         timestamptz NOT NULL  default now()
--   Índices: alunos_sem_conta_professor_idx (professor_id, criado_em DESC), além da PK.

-- public.convites_instrutor
--   id            uuid        NOT NULL  default gen_random_uuid()   PK
--   professor_id  uuid        NOT NULL  FK -> perfis(id) on delete cascade
--   token_hash    text        NOT NULL  UNIQUE; check 64 caracteres hexadecimais minúsculos
--   criado_em     timestamptz NOT NULL  default now()
--   expira_em     timestamptz NOT NULL  check (expira_em > criado_em)
--   consumido_em  timestamptz NULL
--   revogado_em   timestamptz NULL
--   CHECK: não pode estar consumido e revogado ao mesmo tempo.
--   Índices: convites_instrutor_pkey, convites_instrutor_token_hash_key,
--            convites_instrutor_professor_idx (professor_id, criado_em DESC),
--            convites_instrutor_expiracao_idx (expira_em) para convites ativos.

-- public.academias_log_edicao
--   id           uuid        NOT NULL  default gen_random_uuid()   PK
--   academia_id  uuid        NOT NULL  FK -> academias(id) on delete restrict
--   alterado_por uuid        NOT NULL  (UUID autenticado, sem FK)
--   alterado_em  timestamptz NOT NULL  default now()
--   campos       text[]      NOT NULL  check não vazio e limitado a nome/foto_fundo_url
--   Índices: academias_log_edicao_pkey e academias_log_edicao_academia_idx
--            (academia_id, alterado_em DESC).


-- ============================================================================
-- RLS · ligado nas 10 tabelas · 15 políticas (14 base + 1 de _05)
-- ============================================================================

-- academias (3 políticas)
--   academias_select      SELECT  using: ((SELECT papel_atual()) = 'adm' OR id = (SELECT academia_atual()))
--   academias_insert_adm  INSERT  with_check: ((SELECT papel_atual()) = 'adm')
--   academias_update_adm  UPDATE  using e with_check: ((SELECT papel_atual()) = 'adm')

-- perfis (5 políticas)
--   perfis_select_proprio    SELECT  using: (id = (SELECT auth.uid()))
--   perfis_select_adm        SELECT  using: ((SELECT papel_atual()) = 'adm' AND papel IN ('professor','instrutor'))
--   perfis_select_quadro     SELECT  using: (academia_id IS NOT NULL AND academia_id = (SELECT academia_atual())
--                                            AND papel IN ('professor','instrutor'))
--   perfis_select_professor  SELECT  using: (EXISTS (SELECT 1 FROM vinculos v
--                                            WHERE v.aluno_id = perfis.id AND v.professor_id = (SELECT auth.uid()))
--                                     OR EXISTS (SELECT 1 FROM pedidos_vinculo p
--                                            WHERE p.aluno_id = perfis.id AND p.professor_id = (SELECT auth.uid())
--                                              AND p.status = 'pendente'))
--   perfis_update_proprio    UPDATE  using e with_check: (id = (SELECT auth.uid()))

-- professores_convidados (3 políticas)
--   convidados_select_adm  SELECT  using: ((SELECT papel_atual()) = 'adm')
--   convidados_insert_adm  INSERT  with_check: ((SELECT papel_atual()) = 'adm')
--   convidados_delete_adm  DELETE  using: ((SELECT papel_atual()) = 'adm' AND status = 'convidado')

-- turmas (1 política)
--   turmas_select_proprio  SELECT  using: (professor_id = (SELECT auth.uid()))

-- vinculos (1 política)
--   vinculos_select        SELECT  using: (aluno_id = (SELECT auth.uid()) OR professor_id = (SELECT auth.uid()))

-- pedidos_vinculo (1 política)
--   pedidos_select         SELECT  using: (aluno_id = (SELECT auth.uid()) OR professor_id = (SELECT auth.uid()))

-- alunos_sem_conta (1 política)
--   alunos_sem_conta_select_professor
--                           SELECT  using: (professor_id = (SELECT auth.uid())
--                                            AND (SELECT public.papel_atual()) = 'professor')

-- convites_instrutor: RLS ligado e NENHUMA política; authenticated não tem SELECT.
-- academias_log_edicao: RLS ligado e NENHUMA política.
-- _06, _07 e _08 não acrescentam políticas.

-- tentativas_codigo: RLS ligado e NENHUMA política, de propósito
--   (tabela interna, acessada somente pelas funções security definer).


-- ============================================================================
-- PERMISSÕES DE TABELA/COLUNA (conforme grants das migrations)
-- ============================================================================

-- anon: nenhuma permissão em nenhuma das 10 tabelas.
-- authenticated:
--   academias:              SELECT; INSERT (nome, foto_fundo_url); nenhuma permissão UPDATE
--   perfis:                 SELECT; UPDATE (nome); sem UPDATE em foto_url
--   professores_convidados: SELECT, DELETE; INSERT (email, academia_id)
--   turmas:                 SELECT
--   vinculos:               SELECT
--   pedidos_vinculo:        SELECT
--   tentativas_codigo:      nenhuma permissão
--   alunos_sem_conta:       SELECT; nenhuma permissão INSERT/UPDATE/DELETE
--   convites_instrutor:     nenhuma permissão de tabela, inclusive SELECT
--   academias_log_edicao:   nenhuma permissão, inclusive SELECT


-- ============================================================================
-- FUNÇÕES (22: 21 do Tatame + rls_auto_enable) · schema public
-- ============================================================================

-- Funções do Tatame (21 = 11 em _01-04 + 2 em _05 + 2 em _06 + 5 em _07 + 1 em _08):
--   papel_atual()                              returns text     · stable   · sql     · EXECUTE: authenticated · origem: migrations/20261107_01_academias_perfis.sql
--   academia_atual()                           returns uuid     · stable   · sql     · EXECUTE: authenticated · origem: migrations/20261107_01_academias_perfis.sql
--   ativar_professor()                         returns boolean  · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261107_02_ativar_professor.sql
--   resolver_codigo(p_codigo text)             returns uuid     · volatile · plpgsql · EXECUTE: nenhum (função interna) · origem: migrations/20261107_03_vinculo_aluno_professor.sql
--   criar_perfil_aluno(p_nome text)            returns boolean  · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261107_04_ajustes_codigo_adm.sql
--     (versão atual: recusa quem tem e-mail com convite de professor com status 'convidado';
--      a migration 03 traz a versão anterior, substituída pela 04)
--   gerar_codigo()                             returns text     · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261107_04_ajustes_codigo_adm.sql
--     (versão atual: sorteia 6 caracteres do alfabeto de 32 ABCDEFGHJKLMNPQRSTUVWXYZ23456789;
--      a migration 03 traz a versão hexadecimal, substituída pela 04)
--   previa_codigo(p_codigo text)               returns jsonb    · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261107_03_vinculo_aluno_professor.sql
--   solicitar_vinculo(p_codigo text)           returns jsonb    · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261107_03_vinculo_aluno_professor.sql
--   cancelar_pedido()                          returns boolean  · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261107_03_vinculo_aluno_professor.sql
--   decidir_pedido(p_pedido uuid, p_aprovar boolean) returns boolean · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261107_03_vinculo_aluno_professor.sql
--   vincular_adm_professor(p_professor uuid)   returns boolean  · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261107_04_ajustes_codigo_adm.sql
--     (só papel adm; vínculo direto sem código nem aprovação)
--   criar_aluno_sem_conta(p_nome text, p_idade_declarada text default 'nao_declarada')
--                                             returns uuid · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_05_alunos_sem_conta.sql
--   atualizar_idade_aluno_sem_conta(p_aluno_id uuid, p_idade_declarada text) returns boolean · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_05_alunos_sem_conta.sql
--   declarar_idade_conta(p_idade_declarada text) returns boolean · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_06_idade_declarada_perfis.sql
--   definir_foto_perfil(p_foto_url text) returns boolean · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_06_idade_declarada_perfis.sql
--   gerar_convite_instrutor() returns text · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_07_convites_instrutor.sql
--   listar_convites_instrutor() returns table (convite_id, criado_em, expira_em, consumido_em, revogado_em) · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_07_convites_instrutor.sql
--   validar_convite_instrutor(p_token text) returns text · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_07_convites_instrutor.sql
--   consumir_convite_instrutor(p_token text, p_nome text, p_idade_declarada text) returns text · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_07_convites_instrutor.sql
--   revogar_convite_instrutor(p_convite_id uuid) returns boolean · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_07_convites_instrutor.sql
--   atualizar_academia(p_academia_id uuid, p_nome text, p_foto_fundo_url text, p_versao_esperada bigint)
--       returns table (codigo text, versao bigint) · volatile · plpgsql · EXECUTE: authenticated · origem: migrations/20261108_08_edicao_academia_auditoria.sql
--   (todas as 21 com set search_path = ''; anon sem execução em nenhuma)
--
--   rls_auto_enable()                          returns (não verificado) · volatile · criada pelo Supabase,
--     NÃO pertence às migrations. Hipótese não confirmada: efeito da opção
--     "Enable automatic RLS" do Supabase.


-- ============================================================================
-- A CORRIGIR (Parte 2C)
-- ============================================================================
-- (1) RESOLVIDO em 07/11/2026 (migration 04): turmas.codigo usava check
--     ^[0-9A-F]{6}$ e gerar_codigo() gerava hexadecimal; o definitivo é o
--     alfabeto de 32 caracteres ABCDEFGHJKLMNPQRSTUVWXYZ23456789.
--     Nota: o texto da migration 01 ainda diz hexadecimal por ser cópia do que
--     rodou na época; a migration 04 o corrige.
-- (2) RESOLVIDO em 07/11/2026 (migration 04): brecha em que aluno podia criar
--     conta com e-mail de professor convidado antes dele; criar_perfil_aluno()
--     agora recusa e-mail com convite de professor com status 'convidado'.
-- (3) RESOLVIDO em 07/11/2026 (migration 04): criada vincular_adm_professor(),
--     função do Adm para se vincular direto a um professor.
-- (4) PENDENTE: não existe perfil de Adm: entra à mão após o primeiro login
--     Google, que ainda não está configurado.


-- ============================================================================
-- PENDÊNCIAS DO BANCO
-- ============================================================================
-- - Link de uso único para aluno pré-cadastrado, validade de 3 dias.
-- - Funções do Adm.
-- - Remoção de professor/instrutor.
-- - Cobranças.
-- - Pagamentos.
-- - Graduações.
-- - Consentimento.
-- - Travar o e-mail do Adm (hoje quem cadastrar esse e-mail antes como aluno
--   fica aluno).
-- - Função para desfazer o vínculo do Adm.

-- origem: 20261109_09_trocar_professor.sql
-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 09 · troca e ativação exclusiva de Professor por academia
-- A criação do índice falha explicitamente se já houver mais de um Professor
-- ativo na mesma academia. Corrigir os dados antes de aplicar; esta migration
-- não escolhe nem desativa perfis automaticamente.
-- Para uma academia que já tenha ou tenha tido Professor, ativar_professor()
-- registra o perfil aceito como inativo até a transferência feita pelo Adm.
-- Sem Professor ativo, a origem é o Professor inativo do registro de desativação
-- mais recente no log, se o perfil ainda pertencer à academia.
begin;

do $$
begin
  if exists (
    select 1
    from public.perfis p
    where p.papel = 'professor'
      and p.ativo is true
      and p.academia_id is not null
    group by p.academia_id
    having count(*) > 1
  ) then
    raise exception
      'Há mais de um Professor ativo em uma academia; resolva os dados antes de aplicar esta migration.';
  end if;
end
$$;

create unique index perfis_um_professor_ativo_por_academia_idx
  on public.perfis (academia_id)
  where papel = 'professor' and ativo is true and academia_id is not null;

create table public.academia_professor_log (
  academia_id uuid not null
    references public.academias (id) on delete restrict,
  executado_por uuid not null,
  professor_id uuid not null,
  acao text not null
    check (acao in ('trocar_professor_academia', 'desativar_professor', 'reativar_professor')),
  criado_em timestamptz not null default pg_catalog.now()
);

alter table public.academia_professor_log enable row level security;
revoke all on table public.academia_professor_log from public, anon, authenticated;

create or replace function public.ativar_professor()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_academia uuid;
  v_academia_bloqueada uuid;
  v_ja_teve_professor boolean;
begin
  if v_uid is null then
    return false;
  end if;

  select lower(btrim(u.email)) into v_email
  from auth.users u
  where u.id = v_uid
    and u.email_confirmed_at is not null
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
    );

  if v_email is null then
    return false;
  end if;

  if exists (select 1 from public.perfis p where p.id = v_uid) then
    return false;
  end if;

  select c.academia_id into v_academia
  from public.professores_convidados c
  where c.email = v_email and c.status = 'convidado'
  for update;

  if not found then
    return false;
  end if;

  select a.id into v_academia_bloqueada
  from public.academias a
  where a.id = v_academia
  for update;

  if not found then
    return false;
  end if;

  select exists (
    select 1 from public.perfis p
    where p.academia_id = v_academia
      and p.papel = 'professor'
  ) into v_ja_teve_professor;

  insert into public.perfis (id, papel, academia_id, ativo)
  values (v_uid, 'professor', v_academia, not v_ja_teve_professor);

  update public.professores_convidados
  set status = 'ativo', perfil_id = v_uid
  where email = v_email;

  return true;
end
$$;

revoke all on function public.ativar_professor() from public, anon, authenticated;
grant execute on function public.ativar_professor() to authenticated;

create function public.trocar_professor_academia(
  p_academia uuid,
  p_novo_professor uuid
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text;
  v_ativo boolean;
  v_professor_atual uuid;
  v_professor_candidato uuid;
  v_papel_atual text;
  v_ativo_atual boolean;
  v_academia_atual uuid;
  v_papel_novo text;
  v_ativo_novo boolean;
  v_novo_encontrado boolean;
  v_academia_nova uuid;
  v_turma_professor uuid;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select p.papel, p.ativo into v_papel, v_ativo
  from public.perfis p
  where p.id = v_uid;

  if v_papel is distinct from 'adm' or v_ativo is not true then
    return 'sem_permissao';
  end if;

  if p_academia is null then
    return 'academia_nao_encontrada';
  end if;

  perform 1
  from public.academias a
  where a.id = p_academia
  for update;

  if not found then
    return 'academia_nao_encontrada';
  end if;

  if p_novo_professor is null then
    return 'professor_invalido';
  end if;

  select p.id into v_professor_atual
  from public.perfis p
  where p.academia_id = p_academia
    and p.papel = 'professor'
    and p.ativo is true
  for update;

  if not found then
    select l.professor_id into v_professor_candidato
    from public.academia_professor_log l
    where l.acao = 'desativar_professor'
      and l.academia_id = p_academia
      and l.professor_id <> p_novo_professor
      and exists (
        select 1 from public.perfis perfil
        where perfil.id = l.professor_id
          and perfil.papel = 'professor'
          and perfil.ativo is false
          and perfil.academia_id = p_academia
      )
    order by l.criado_em desc
    limit 1;

    if not found then
      return 'sem_professor_atual';
    end if;

    select p.id, p.papel, p.ativo, p.academia_id
      into v_professor_atual, v_papel_atual, v_ativo_atual, v_academia_atual
    from public.perfis p
    where p.id = v_professor_candidato
    for update;

    if not found
       or v_papel_atual is distinct from 'professor'
       or v_ativo_atual is not false
       or v_academia_atual is distinct from p_academia then
      return 'sem_professor_atual';
    end if;
  end if;

  select p.papel, p.ativo, p.academia_id
    into v_papel_novo, v_ativo_novo, v_academia_nova
  from public.perfis p
  where p.id = p_novo_professor
  for update;
  v_novo_encontrado := found;

  if v_professor_atual is not null then
    select t.professor_id into v_turma_professor
    from public.turmas t
    where t.professor_id = v_professor_atual
    for update;
  end if;

  if v_professor_atual is not null
     and p_novo_professor = v_professor_atual then
    return 'mesmo_professor';
  end if;

  if not v_novo_encontrado
     or v_papel_novo is distinct from 'professor'
     or v_ativo_novo is not false
     or v_academia_nova is distinct from p_academia
     or not exists (
       select 1 from public.professores_convidados c
       where c.perfil_id = p_novo_professor
         and c.academia_id = p_academia
         and c.status = 'ativo'
     ) then
    return 'professor_invalido';
  end if;

  if v_professor_atual is null then
    return 'sem_professor_atual';
  end if;

  if exists (
       select 1 from public.turmas t
       where t.professor_id = p_novo_professor
     )
     or exists (
       select 1 from public.vinculos v
       where v.professor_id = p_novo_professor or v.aluno_id = p_novo_professor
     )
     or exists (
       select 1 from public.pedidos_vinculo p
       where p.professor_id = p_novo_professor or p.aluno_id = p_novo_professor
     )
     or exists (
       select 1 from public.alunos_sem_conta a
       where a.professor_id = p_novo_professor
     ) then
    return 'novo_professor_com_dados_proprios';
  end if;

  update public.perfis
  set ativo = false
  where id = v_professor_atual;

  update public.perfis
  set ativo = true
  where id = p_novo_professor;

  update public.vinculos
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual;

  update public.pedidos_vinculo
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual
    and status = 'pendente';

  update public.alunos_sem_conta
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual;

  update public.convites_instrutor
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual;

  -- professor_id é a chave primária; a atualização preserva o código da turma.
  update public.turmas
  set professor_id = p_novo_professor
  where professor_id = v_professor_atual;

  insert into public.academia_professor_log (academia_id, executado_por, professor_id, acao)
  values (p_academia, v_uid, p_novo_professor, 'trocar_professor_academia');

  return 'ok';
end
$$;

create function public.desativar_professor(p_professor uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text;
  v_ativo_adm boolean;
  v_academia uuid;
  v_academia_bloqueada uuid;
  v_papel_professor text;
  v_professor_ativo boolean;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select p.papel, p.ativo into v_papel, v_ativo_adm
  from public.perfis p
  where p.id = v_uid;

  if v_papel is distinct from 'adm' or v_ativo_adm is not true then
    return 'sem_permissao';
  end if;

  if p_professor = v_uid then
    return 'nao_pode_desativar_a_si_mesmo';
  end if;

  select p.academia_id into v_academia
  from public.perfis p
  where p.id = p_professor and p.papel = 'professor';

  if not found or v_academia is null then
    return 'professor_invalido';
  end if;

  select a.id into v_academia_bloqueada
  from public.academias a
  where a.id = v_academia
  for update;

  if not found then
    return 'professor_invalido';
  end if;

  select p.papel, p.ativo, p.academia_id
    into v_papel_professor, v_professor_ativo, v_academia
  from public.perfis p
  where p.id = p_professor
  for update;

  if not found
     or v_papel_professor is distinct from 'professor'
     or v_academia is null then
    return 'professor_invalido';
  end if;

  if v_professor_ativo is not true then
    return 'professor_ja_inativo';
  end if;

  update public.perfis
  set ativo = false
  where id = p_professor;

  insert into public.academia_professor_log (academia_id, executado_por, professor_id, acao)
  values (v_academia, v_uid, p_professor, 'desativar_professor');

  return 'ok';
end
$$;

create function public.reativar_professor(p_professor uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text;
  v_ativo_adm boolean;
  v_academia uuid;
  v_academia_bloqueada uuid;
  v_papel_professor text;
  v_professor_ativo boolean;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select p.papel, p.ativo into v_papel, v_ativo_adm
  from public.perfis p
  where p.id = v_uid;

  if v_papel is distinct from 'adm' or v_ativo_adm is not true then
    return 'sem_permissao';
  end if;

  select p.academia_id into v_academia
  from public.perfis p
  where p.id = p_professor and p.papel = 'professor';

  if not found or v_academia is null then
    return 'professor_invalido';
  end if;

  select a.id into v_academia_bloqueada
  from public.academias a
  where a.id = v_academia
  for update;

  if not found then
    return 'professor_invalido';
  end if;

  select p.papel, p.ativo, p.academia_id
    into v_papel_professor, v_professor_ativo, v_academia
  from public.perfis p
  where p.id = p_professor
  for update;

  if not found
     or v_papel_professor is distinct from 'professor'
     or v_academia is null then
    return 'professor_invalido';
  end if;

  if v_professor_ativo is true then
    return 'professor_ja_ativo';
  end if;

  if exists (
    select 1 from public.perfis p
    where p.academia_id = v_academia
      and p.papel = 'professor'
      and p.ativo is true
      and p.id <> p_professor
  ) then
    return 'professor_ativo_na_academia';
  end if;

  update public.perfis
  set ativo = true
  where id = p_professor;

  insert into public.academia_professor_log (academia_id, executado_por, professor_id, acao)
  values (v_academia, v_uid, p_professor, 'reativar_professor');

  return 'ok';
end
$$;

revoke all on function public.trocar_professor_academia(uuid, uuid) from public, anon, authenticated;
revoke all on function public.desativar_professor(uuid) from public, anon, authenticated;
revoke all on function public.reativar_professor(uuid) from public, anon, authenticated;
grant execute on function public.trocar_professor_academia(uuid, uuid) to authenticated;
grant execute on function public.desativar_professor(uuid) to authenticated;
grant execute on function public.reativar_professor(uuid) to authenticated;

commit;


-- origem: 20261109_10_definir_nome_professor.sql
-- NÃO TESTADO POR EXECUÇÃO
begin;

-- O nome passa a ser alterado somente pela função; hoje authenticated tem UPDATE apenas na coluna nome.
revoke update (nome) on table public.perfis from authenticated;

create function public.definir_nome_professor(p_nome text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text;
  v_ativo boolean;
  v_nome text := pg_catalog.btrim(coalesce(p_nome, ''));
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  select p.papel, p.ativo
    into v_papel, v_ativo
  from public.perfis p
  where p.id = v_uid
  for update;

  if not found
     or v_papel is distinct from 'professor'
     or v_ativo is not true then
    return 'sem_permissao';
  end if;

  if pg_catalog.char_length(v_nome) not between 2 and 80
     or v_nome ~ '[[:cntrl:]]' then
    return 'nome_invalido';
  end if;

  update public.perfis
  set nome = v_nome
  where id = v_uid;

  return 'ok';
end
$$;

revoke all on function public.definir_nome_professor(text) from public, anon, authenticated;
grant execute on function public.definir_nome_professor(text) to authenticated;

commit;


-- origem: 20261109_11_consentimento.sql
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


-- origem: 20261109_12_criar_perfil_aluno.sql
-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 12 · criação de perfil de aluno e consentimento
begin;

drop function if exists public.criar_perfil_aluno(text);

create function public.criar_perfil_aluno(
  p_nome text,
  p_idade_declarada text,
  p_versao text
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := pg_catalog.btrim(coalesce(p_nome, ''));
  v_versao text := pg_catalog.btrim(coalesce(p_versao, ''));
  v_email_confirmado_em timestamptz;
  v_email text;
begin
  if v_uid is null then
    return 'nao_autenticado';
  end if;

  if p_nome is null or pg_catalog.char_length(v_nome) not between 1 and 80 then
    return 'nome_invalido';
  end if;

  if p_idade_declarada is null
     or p_idade_declarada not in ('adulto', 'menor') then
    return 'idade_invalida';
  end if;

  if p_versao is null
     or pg_catalog.char_length(v_versao) not between 1 and 40 then
    return 'versao_invalida';
  end if;

  if exists (
    select 1 from public.perfis p where p.id = v_uid
  ) then
    return 'perfil_ja_existe';
  end if;

  select u.email_confirmed_at
    into v_email_confirmado_em
  from auth.users u
  where u.id = v_uid
  for update;

  if not found or v_email_confirmado_em is null then
    return 'email_nao_confirmado';
  end if;

  select pg_catalog.lower(pg_catalog.btrim(u.email))
    into v_email
  from auth.users u
  where u.id = v_uid;

  if v_email is not null and exists (
    select 1 from public.professores_convidados c
    where c.email = v_email and c.status = 'convidado'
  ) then
    return 'email_convidado_professor';
  end if;

  insert into public.perfis (id, papel, nome, idade_declarada)
  values (v_uid, 'aluno', v_nome, p_idade_declarada);

  insert into public.consentimentos (perfil_id, versao_termo)
  values (v_uid, v_versao)
  on conflict (perfil_id, versao_termo) do nothing;

  return 'ok';
end
$$;

revoke all on function public.criar_perfil_aluno(text, text, text) from public, anon, authenticated;
grant execute on function public.criar_perfil_aluno(text, text, text) to authenticated;

commit;
