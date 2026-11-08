-- NÃO TESTADO POR EXECUÇÃO
-- TATAME · Rascunho 06 · declaração de idade e foto do perfil
-- Suposições não confirmadas:
-- - A declaração é feita uma vez, com valores adulto ou menor, sem data de nascimento.
-- - Foto de perfil só pode ser definida após declaração adulto; declaração menor apaga a foto existente.
-- - A aplicação envia a foto por public.definir_foto_perfil; authenticated não escreve foto_url diretamente.
-- - A role proprietária das funções SECURITY DEFINER pode atualizar perfis, sem RLS forçada.
begin;

alter table public.perfis
  add column idade_declarada text not null default 'nao_declarada'
  check (idade_declarada in ('nao_declarada', 'adulto', 'menor'));

comment on column public.perfis.idade_declarada is
  'Declaração sem data de nascimento; menor não pode manter foto_url.';

revoke update (foto_url) on table public.perfis from authenticated;

create function public.declarar_idade_conta(p_idade_declarada text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null
     or public.papel_atual() is null
     or p_idade_declarada is null
     or p_idade_declarada not in ('adulto', 'menor') then
    return false;
  end if;

  update public.perfis
  set idade_declarada = p_idade_declarada,
      foto_url = case when p_idade_declarada = 'menor' then null else foto_url end
  where id = v_uid and idade_declarada = 'nao_declarada';

  return found;
end
$$;

create function public.definir_foto_perfil(p_foto_url text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or public.papel_atual() is null then
    return false;
  end if;
  if p_foto_url is not null and char_length(p_foto_url) > 2048 then
    return false;
  end if;

  update public.perfis
  set foto_url = p_foto_url
  where id = v_uid
    and (p_foto_url is null or idade_declarada = 'adulto');

  return found;
end
$$;

revoke all on function public.declarar_idade_conta(text) from public, anon, authenticated;
revoke all on function public.definir_foto_perfil(text) from public, anon, authenticated;
grant execute on function public.declarar_idade_conta(text) to authenticated;
grant execute on function public.definir_foto_perfil(text) to authenticated;

commit;
