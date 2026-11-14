-- Somente o Adm pode editar os dados e a foto da academia.
begin;

create or replace function public.atualizar_academia(
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

  if public.papel_atual() is distinct from 'adm' then
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

create or replace function public.pode_editar_foto_academia(p_academia_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_academia_id is not null
    and exists (
      select 1
      from public.academias a
      where a.id = p_academia_id
    )
    and (select public.papel_atual()) = 'adm';
$$;

revoke all on function public.atualizar_academia(uuid, text, text, bigint)
  from public, anon, authenticated;
grant execute on function public.atualizar_academia(uuid, text, text, bigint)
  to authenticated;

revoke all on function public.pode_editar_foto_academia(uuid)
  from public, anon, authenticated;
grant execute on function public.pode_editar_foto_academia(uuid)
  to authenticated;

commit;
