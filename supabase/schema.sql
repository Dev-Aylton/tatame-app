-- ============================================================================
-- TATAME · schema.sql · DESCRIÇÃO DO ESTADO ATUAL DO BANCO REAL
-- Projeto Supabase: tatame
-- Estado verificado em: 07/11/2026
--
-- ATENÇÃO: este arquivo NÃO é migration e NÃO deve ser executado.
-- O banco real é a fonte da verdade; este arquivo é apenas uma descrição
-- do estado observado, montada a partir de:
--   (A) consultas ao banco real (information_schema, pg_policies, pg_proc);
--   (B) supabase/migrations/20261107_01_academias_perfis.sql
--       supabase/migrations/20261107_02_ativar_professor.sql
--       supabase/migrations/20261107_03_vinculo_aluno_professor.sql
-- ============================================================================


-- ============================================================================
-- TABELAS (7)
-- ============================================================================

-- public.academias
--   id              uuid        NOT NULL  default gen_random_uuid()   PK
--   nome            text        NOT NULL  check (char_length(btrim(nome)) between 2 and 80)
--   foto_fundo_url  text        NULL
--   criado_em       timestamptz NOT NULL  default now()
--   Índices: nenhum além da PK.

-- public.perfis
--   id           uuid        NOT NULL  PK, FK -> auth.users(id) on delete cascade
--   papel        text        NOT NULL  check (papel in ('adm','professor','instrutor','aluno'))
--   nome         text        NULL      check (nome is null or char_length(btrim(nome)) between 1 and 80)
--   foto_url     text        NULL
--   academia_id  uuid        NULL      FK -> academias(id) on delete restrict
--   ativo        boolean     NOT NULL  default true
--   criado_em    timestamptz NOT NULL  default now()
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


-- ============================================================================
-- RLS · ligado nas 7 tabelas · 14 políticas (todas para o papel authenticated)
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

-- tentativas_codigo: RLS ligado e NENHUMA política, de propósito
--   (tabela interna, acessada somente pelas funções security definer).


-- ============================================================================
-- PERMISSÕES DE TABELA/COLUNA (conforme grants das migrations)
-- ============================================================================

-- anon: nenhuma permissão em nenhuma das 7 tabelas.
-- authenticated:
--   academias:              SELECT; INSERT (nome, foto_fundo_url); UPDATE (nome, foto_fundo_url)
--   perfis:                 SELECT; UPDATE (nome, foto_url)
--   professores_convidados: SELECT, DELETE; INSERT (email, academia_id)
--   turmas:                 SELECT
--   vinculos:               SELECT
--   pedidos_vinculo:        SELECT
--   tentativas_codigo:      nenhuma permissão


-- ============================================================================
-- FUNÇÕES (12) · todas security definer, schema public
-- ============================================================================

-- Funções do Tatame (11) · texto completo no arquivo de origem indicado:
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
--   (todas as 11 com set search_path = ''; anon sem execução em nenhuma)
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
-- - Link de uso único (instrutor / aluno pré-cadastrado, validade de 3 dias).
-- - Funções do Adm.
-- - Promoção a instrutor.
-- - Remoção de professor/instrutor.
-- - Cobranças.
-- - Pagamentos.
-- - Graduações.
-- - Consentimento.
-- - Travar o e-mail do Adm (hoje quem cadastrar esse e-mail antes como aluno
--   fica aluno).
-- - Função para desfazer o vínculo do Adm.
