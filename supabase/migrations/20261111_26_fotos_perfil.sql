-- RASCUNHO: não aplicar sem autorização do Aylton.

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'perfis', 'perfis', false, 5242880, array['image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table public.perfis_fotos (
  perfil_id uuid primary key
    references public.perfis (id) on delete restrict,
  caminho_storage text not null unique
    check (caminho_storage = (perfil_id::text || '/foto')),
  tipo_mime text not null
    check (tipo_mime in ('image/jpeg', 'image/png')),
  tamanho_bytes bigint not null
    check (tamanho_bytes between 1 and 5242880),
  atualizado_em timestamptz not null default pg_catalog.now()
);

alter table public.perfis_fotos enable row level security;
revoke all on table public.perfis_fotos from public, anon, authenticated;

create function public.pode_editar_foto_perfil(p_perfil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_perfil_id = (select auth.uid())
    and exists (
      select 1
      from public.perfis p
      where p.id = p_perfil_id
        and p.ativo
        and (
          p.papel in ('adm', 'professor', 'instrutor')
          or (p.papel = 'aluno' and p.idade_declarada = 'adulto')
        )
    );
$$;

create function public.pode_ler_foto_perfil(p_perfil_id uuid)
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
      )
  );
$$;

create policy perfis_storage_select_visivel
  on storage.objects for select to authenticated
  using (
    bucket_id = 'perfis'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_ler_foto_perfil(
      case
        when split_part(name, '/', 1) ~
          '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
        then split_part(name, '/', 1)::uuid
        else null
      end
    ))
  );

create policy perfis_storage_insert_proprio
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'perfis'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_perfil((select auth.uid())))
  );

create policy perfis_storage_update_proprio
  on storage.objects for update to authenticated
  using (
    bucket_id = 'perfis'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_perfil((select auth.uid())))
  )
  with check (
    bucket_id = 'perfis'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_perfil((select auth.uid())))
  );

create function public.registrar_foto_perfil(
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
     or not public.pode_editar_foto_perfil(v_uid)
     or p_caminho_storage is distinct from (v_uid::text || '/foto')
     or p_tipo_mime is null
     or p_tipo_mime not in ('image/jpeg', 'image/png') then
    return false;
  end if;

  select o.metadata ->> 'size', o.metadata ->> 'mimetype'
    into v_tamanho_texto, v_mime_storage
  from storage.objects o
  where o.bucket_id = 'perfis'
    and o.name = p_caminho_storage;
  if not found
     or v_tamanho_texto is null
     or v_mime_storage is distinct from p_tipo_mime
     or v_tamanho_texto !~ '^[0-9]+$' then
    return false;
  end if;

  v_tamanho := v_tamanho_texto::bigint;
  if v_tamanho not between 1 and 5242880 then
    return false;
  end if;

  insert into public.perfis_fotos (
    perfil_id, caminho_storage, tipo_mime, tamanho_bytes
  )
  values (
    v_uid, p_caminho_storage, p_tipo_mime, v_tamanho
  )
  on conflict (perfil_id) do update
  set caminho_storage = excluded.caminho_storage,
      tipo_mime = excluded.tipo_mime,
      tamanho_bytes = excluded.tamanho_bytes,
      atualizado_em = pg_catalog.now();

  return true;
end;
$$;

create function public.obter_foto_perfil(p_perfil_id uuid)
returns table (caminho_storage text)
language sql
stable
security definer
set search_path = ''
as $$
  select pf.caminho_storage
  from public.perfis_fotos pf
  where pf.perfil_id = p_perfil_id
    and (select public.pode_ler_foto_perfil(pf.perfil_id));
$$;

revoke all on function public.pode_editar_foto_perfil(uuid)
  from public, anon, authenticated;
revoke all on function public.pode_ler_foto_perfil(uuid)
  from public, anon, authenticated;
revoke all on function public.registrar_foto_perfil(text, text)
  from public, anon, authenticated;
revoke all on function public.obter_foto_perfil(uuid)
  from public, anon, authenticated;

grant execute on function public.pode_editar_foto_perfil(uuid) to authenticated;
grant execute on function public.pode_ler_foto_perfil(uuid) to authenticated;
grant execute on function public.registrar_foto_perfil(text, text) to authenticated;
grant execute on function public.obter_foto_perfil(uuid) to authenticated;
