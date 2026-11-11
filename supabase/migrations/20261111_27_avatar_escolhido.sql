-- RASCUNHO — NÃO EXECUTAR; aguarda revisão do Claude e autorização do Aylton.

alter table public.perfis
  add column avatar_escolhido text not null default 'masculino'
  check (avatar_escolhido in ('masculino', 'feminino'));

comment on column public.perfis.avatar_escolhido is
  'Avatar padrão da própria conta quando não há foto de perfil.';

create function public.definir_avatar_escolhido(p_avatar_escolhido text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null
     or p_avatar_escolhido is null
     or p_avatar_escolhido not in ('masculino', 'feminino') then
    return false;
  end if;

  update public.perfis
  set avatar_escolhido = p_avatar_escolhido
  where id = v_uid;

  return found;
end;
$$;

create policy perfis_storage_delete_proprio
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'perfis'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_perfil((select auth.uid())))
  );

create policy professores_storage_delete_proprio
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'professores'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_professor((select auth.uid())))
  );

create function public.remover_foto_perfil_propria(p_caminho_storage text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null
     or p_caminho_storage is distinct from (v_uid::text || '/foto')
     or not public.pode_editar_foto_perfil(v_uid) then
    return false;
  end if;

  delete from public.perfis_fotos
  where perfil_id = v_uid
    and caminho_storage = p_caminho_storage;
  if not found then
    return false;
  end if;

  update public.perfis
  set foto_url = null
  where id = v_uid;

  return true;
end;
$$;

create function public.remover_foto_professor_propria(p_caminho_storage text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null
     or p_caminho_storage is distinct from (v_uid::text || '/foto')
     or not public.pode_editar_foto_professor(v_uid) then
    return false;
  end if;

  delete from public.professores_fotos
  where professor_id = v_uid
    and caminho_storage = p_caminho_storage;
  if not found then
    return false;
  end if;

  update public.perfis
  set foto_url = null
  where id = v_uid
    and papel = 'professor';

  return true;
end;
$$;

revoke all on function public.definir_avatar_escolhido(text)
  from public, anon, authenticated;
revoke all on function public.remover_foto_perfil_propria(text)
  from public, anon, authenticated;
revoke all on function public.remover_foto_professor_propria(text)
  from public, anon, authenticated;

grant execute on function public.definir_avatar_escolhido(text) to authenticated;
grant execute on function public.remover_foto_perfil_propria(text) to authenticated;
grant execute on function public.remover_foto_professor_propria(text) to authenticated;
