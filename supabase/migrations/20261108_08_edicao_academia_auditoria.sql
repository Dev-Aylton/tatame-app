-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 08 · edição de academia, conflito e auditoria
-- Suposições não confirmadas:
-- - Somente os campos atuais nome e foto_fundo_url são editados; migrations 01-04 não têm telefone/e-mail.
-- - O Professor edita apenas a academia retornada por academia_atual(); o Adm mantém o escopo atual.
-- - versao_edicao é a revisão otimista; o cliente envia a revisão que leu e interpreta codigo/versao do resultado.
-- - alterado_por guarda o UUID autenticado sem FK para preservar o ator; retenção e leitura do log ficam pendentes.
-- - O executor da migration é dono das tabelas e a função SECURITY DEFINER não está sujeita a RLS forçada.
begin;

alter table public.academias
  add column versao_edicao bigint not null default 1 check (versao_edicao > 0);

comment on column public.academias.versao_edicao is
  'Revisão otimista usada para detectar edições concorrentes.';

create table public.academias_log_edicao (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id) on delete restrict,
  alterado_por uuid not null,
  alterado_em timestamptz not null default now(),
  campos text[] not null
    check (
      cardinality(campos) > 0
      and campos <@ array['nome', 'foto_fundo_url']::text[]
    )
);

create index academias_log_edicao_academia_idx
  on public.academias_log_edicao (academia_id, alterado_em desc);

alter table public.academias_log_edicao enable row level security;
revoke all on table public.academias_log_edicao from anon, authenticated;

revoke update on table public.academias from authenticated;
revoke update (nome, foto_fundo_url) on table public.academias from authenticated;

create function public.atualizar_academia(
  p_academia_id uuid,
  p_nome text,
  p_foto_fundo_url text,
  p_versao_esperada bigint
)
returns table (codigo text, versao bigint)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.papel_atual();
  v_nome_novo text := btrim(coalesce(p_nome, ''));
  v_nome_atual text;
  v_foto_atual text;
  v_versao_atual bigint;
  v_nova_versao bigint;
  v_campos text[] := array[]::text[];
begin
  if v_uid is null then
    return query select 'nao_autenticado'::text, null::bigint;
    return;
  end if;

  if v_papel is distinct from 'adm' and v_papel is distinct from 'professor' then
    return query select 'sem_permissao'::text, null::bigint;
    return;
  end if;

  if char_length(v_nome_novo) not between 2 and 80 then
    return query select 'nome_invalido'::text, null::bigint;
    return;
  end if;

  if p_academia_id is null then
    return query select 'academia_nao_encontrada'::text, null::bigint;
    return;
  end if;

  if v_papel = 'professor'
     and public.academia_atual() is distinct from p_academia_id then
    return query select 'sem_permissao'::text, null::bigint;
    return;
  end if;

  if p_versao_esperada is null then
    return query select 'conflito_versao'::text, null::bigint;
    return;
  end if;

  select a.nome, a.foto_fundo_url, a.versao_edicao
    into v_nome_atual, v_foto_atual, v_versao_atual
  from public.academias a
  where a.id = p_academia_id
  for update;

  if not found then
    return query select 'academia_nao_encontrada'::text, null::bigint;
    return;
  end if;

  if v_versao_atual is distinct from p_versao_esperada then
    return query select 'conflito_versao'::text, null::bigint;
    return;
  end if;

  if v_nome_atual is distinct from v_nome_novo then
    v_campos := pg_catalog.array_append(v_campos, 'nome');
  end if;
  if v_foto_atual is distinct from p_foto_fundo_url then
    v_campos := pg_catalog.array_append(v_campos, 'foto_fundo_url');
  end if;

  if cardinality(v_campos) = 0 then
    return query select 'ok'::text, v_versao_atual;
    return;
  end if;

  update public.academias
  set nome = v_nome_novo,
      foto_fundo_url = p_foto_fundo_url,
      versao_edicao = versao_edicao + 1
  where id = p_academia_id
    and versao_edicao = p_versao_esperada
  returning versao_edicao into v_nova_versao;

  if not found then
    return query select 'conflito_versao'::text, null::bigint;
    return;
  end if;

  insert into public.academias_log_edicao (academia_id, alterado_por, campos)
  values (p_academia_id, v_uid, v_campos);

  return query select 'ok'::text, v_nova_versao;
end
$$;

revoke all on function public.atualizar_academia(uuid, text, text, bigint) from public, anon, authenticated;
grant execute on function public.atualizar_academia(uuid, text, text, bigint) to authenticated;

commit;
