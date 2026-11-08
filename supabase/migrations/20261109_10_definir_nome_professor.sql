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
