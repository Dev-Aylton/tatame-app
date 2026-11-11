-- RASCUNHO — NÃO EXECUTADA; aguarda revisão do Claude e autorização do Aylton
-- Limites: 10 MiB por comprovante e 5 MiB por foto para limitar custo e uso de dados móveis.
-- Caminhos sem nome/e-mail: pagamento_uuid/arquivo_uuid.ext, academia_uuid/foto, professor_uuid/foto.
-- academias.foto_fundo_url permanece como campo legado; os novos caminhos ficam nas tabelas de fotos.
-- NÃO CONFIRMADO: permissões de execução SQL e configuração Storage desta instância ainda não foram verificadas.
-- A remoção física é solicitada pelo cliente autenticado via API do Storage e policy DELETE restrita.
begin;

create table public.comprovantes_pagamento (
  pagamento_id uuid primary key
    references public.pagamentos (id) on delete restrict,
  caminho_storage text not null unique
    check (
      caminho_storage ~ (
        '^' || pagamento_id::text ||
        '/[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}[.](jpg|png|pdf)$'
      )
    ),
  tipo_mime text not null
    check (tipo_mime in ('image/jpeg', 'image/png', 'application/pdf')),
  tamanho_bytes bigint not null
    check (tamanho_bytes between 1 and 10485760),
  estado_arquivo text not null default 'ativo'
    check (estado_arquivo in ('ativo', 'remocao_pendente', 'removido')),
  criado_em timestamptz not null default pg_catalog.now(),
  remocao_solicitada_em timestamptz,
  remocao_solicitada_por uuid,
  motivo_remocao text
    check (motivo_remocao is null or motivo_remocao in ('confirmado', 'rejeitado', '30_dias')),
  arquivo_removido_em timestamptz,
  arquivo_removido_por uuid,
  constraint comprovantes_pagamento_remocao_check check (
    (estado_arquivo = 'ativo'
      and remocao_solicitada_em is null
      and motivo_remocao is null
      and arquivo_removido_em is null
      and arquivo_removido_por is null)
    or (estado_arquivo = 'remocao_pendente'
      and remocao_solicitada_em is not null
      and motivo_remocao is not null
      and arquivo_removido_em is null
      and arquivo_removido_por is null)
    or (estado_arquivo = 'removido'
      and remocao_solicitada_em is not null
      and motivo_remocao is not null
      and arquivo_removido_em is not null
      and arquivo_removido_por is not null)
  )
);

create index comprovantes_pagamento_remocao_idx
  on public.comprovantes_pagamento (estado_arquivo, criado_em);

create table public.academias_fotos (
  academia_id uuid primary key
    references public.academias (id) on delete restrict,
  caminho_storage text not null unique
    check (caminho_storage = (academia_id::text || '/foto')),
  tipo_mime text not null
    check (tipo_mime in ('image/jpeg', 'image/png')),
  tamanho_bytes bigint not null
    check (tamanho_bytes between 1 and 5242880),
  alterado_por uuid not null,
  atualizado_em timestamptz not null default pg_catalog.now()
);

create table public.professores_fotos (
  professor_id uuid primary key
    references public.perfis (id) on delete restrict,
  caminho_storage text not null unique
    check (caminho_storage = (professor_id::text || '/foto')),
  tipo_mime text not null
    check (tipo_mime in ('image/jpeg', 'image/png')),
  tamanho_bytes bigint not null
    check (tamanho_bytes between 1 and 5242880),
  atualizado_em timestamptz not null default pg_catalog.now()
);

alter table public.comprovantes_pagamento enable row level security;
alter table public.academias_fotos enable row level security;
alter table public.professores_fotos enable row level security;

revoke all on table public.comprovantes_pagamento, public.academias_fotos, public.professores_fotos
  from public, anon, authenticated;
grant select on table public.comprovantes_pagamento, public.academias_fotos, public.professores_fotos
  to authenticated;

create function public.pode_ler_comprovante_pagamento(p_pagamento_id uuid)
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
              (select public.papel_atual()) = 'aluno'
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
          (select public.papel_atual()) = 'aluno'
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

create function public.pode_ver_storage_comprovante_pagamento(p_pagamento_id uuid)
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
          (select public.papel_atual()) = 'aluno'
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

create function public.pode_excluir_comprovante_storage(p_caminho_storage text)
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
          (select public.papel_atual()) = 'aluno'
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

create function public.pode_ler_foto_professor(p_professor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = p_professor_id
      and p.papel = 'professor'
      and (
        (select public.papel_atual()) = 'adm'
        or p.id = (select auth.uid())
        or exists (
          select 1
          from public.vinculos v
          where v.professor_id = p.id
            and v.aluno_id = (select auth.uid())
        )
      )
  );
$$;

create function public.pode_editar_foto_academia(p_academia_id uuid)
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
    and (select public.papel_atual()) in ('adm', 'professor')
    and (
      (select public.papel_atual()) = 'adm'
      or (
        (select public.papel_atual()) = 'professor'
        and p_academia_id = (select public.academia_atual())
        and exists (
          select 1
          from public.perfis p
          where p.id = (select auth.uid())
            and p.papel = 'professor'
            and p.ativo
        )
      )
    );
$$;

create function public.pode_editar_foto_professor(p_professor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_professor_id = (select auth.uid())
    and (select public.papel_atual()) = 'professor'
    and exists (
      select 1
      from public.perfis p
      where p.id = p_professor_id
        and p.papel = 'professor'
        and p.ativo
        and p.idade_declarada = 'adulto'
    );
$$;

create policy comprovantes_pagamento_select_participantes
  on public.comprovantes_pagamento for select to authenticated
  using ((select public.pode_ler_comprovante_pagamento(pagamento_id)));

create policy academias_fotos_select_autenticados
  on public.academias_fotos for select to authenticated
  using ((select auth.uid()) is not null);

create policy professores_fotos_select_vinculados_adm
  on public.professores_fotos for select to authenticated
  using ((select public.pode_ler_foto_professor(professor_id)));

do $bucket$
begin
  if to_regclass('storage.buckets') is null then
    raise exception 'O schema Storage não está disponível; não foi possível criar os buckets por SQL.';
  end if;

  if exists (
    select 1
    from storage.buckets b
    where b.id = 'comprovantes'
      and (
        b.name is distinct from 'comprovantes'
        or
        b.public is distinct from false
        or b.file_size_limit is distinct from 10485760
        or b.allowed_mime_types is distinct from
          array['image/jpeg', 'image/png', 'application/pdf']::text[]
      )
  ) then
    raise exception 'O bucket comprovantes já existe com configuração diferente.';
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'comprovantes',
    'comprovantes',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'application/pdf']::text[]
  )
  on conflict (id) do nothing;

  if exists (
    select 1
    from storage.buckets b
    where b.id = 'academias'
      and (
        b.name is distinct from 'academias'
        or
        b.public is distinct from false
        or b.file_size_limit is distinct from 5242880
        or b.allowed_mime_types is distinct from array['image/jpeg', 'image/png']::text[]
      )
  ) then
    raise exception 'O bucket academias já existe com configuração diferente.';
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('academias', 'academias', false, 5242880, array['image/jpeg', 'image/png']::text[])
  on conflict (id) do nothing;

  if exists (
    select 1
    from storage.buckets b
    where b.id = 'professores'
      and (
        b.name is distinct from 'professores'
        or
        b.public is distinct from false
        or b.file_size_limit is distinct from 5242880
        or b.allowed_mime_types is distinct from array['image/jpeg', 'image/png']::text[]
      )
  ) then
    raise exception 'O bucket professores já existe com configuração diferente.';
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('professores', 'professores', false, 5242880, array['image/jpeg', 'image/png']::text[])
  on conflict (id) do nothing;
end;
$bucket$;

create policy comprovantes_storage_insert_aluno
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'comprovantes'
    and (select public.papel_atual()) = 'aluno'
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

create policy comprovantes_storage_select_participantes
  on storage.objects for select to authenticated
  using (
    bucket_id = 'comprovantes'
    and exists (
      select 1
      from public.comprovantes_pagamento cp
      where cp.caminho_storage = storage.objects.name
        and (select public.pode_ver_storage_comprovante_pagamento(cp.pagamento_id))
    )
  );

create policy comprovantes_storage_delete_participantes
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'comprovantes'
    and (select public.pode_excluir_comprovante_storage(name))
  );

create policy academias_storage_insert_editor
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'academias'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 2) = 'foto'
    and split_part(name, '/', 1) ~
      '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
    and (select public.pode_editar_foto_academia(
      case
        when split_part(name, '/', 1) ~
          '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
        then split_part(name, '/', 1)::uuid
        else null
      end
    ))
  );

create policy academias_storage_update_editor
  on storage.objects for update to authenticated
  using (
    bucket_id = 'academias'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_academia(
      case
        when split_part(name, '/', 1) ~
          '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
        then split_part(name, '/', 1)::uuid
        else null
      end
    ))
  )
  with check (
    bucket_id = 'academias'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_academia(
      case
        when split_part(name, '/', 1) ~
          '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$'
        then split_part(name, '/', 1)::uuid
        else null
      end
    ))
  );

create policy academias_storage_select_autenticados
  on storage.objects for select to authenticated
  using (
    bucket_id = 'academias'
    and exists (
      select 1
      from public.academias_fotos af
      where af.caminho_storage = storage.objects.name
    )
  );

create policy professores_storage_insert_proprio
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'professores'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_professor((select auth.uid())))
  );

create policy professores_storage_update_proprio
  on storage.objects for update to authenticated
  using (
    bucket_id = 'professores'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_professor((select auth.uid())))
  )
  with check (
    bucket_id = 'professores'
    and cardinality(string_to_array(name, '/')) = 2
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'foto'
    and (select public.pode_editar_foto_professor((select auth.uid())))
  );

create policy professores_storage_select_vinculados_adm
  on storage.objects for select to authenticated
  using (
    bucket_id = 'professores'
    and exists (
      select 1
      from public.professores_fotos pf
      where pf.caminho_storage = storage.objects.name
        and (select public.pode_ler_foto_professor(pf.professor_id))
    )
  );

create function public.registrar_comprovante_pagamento(
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
     or (select public.papel_atual()) is distinct from 'aluno'
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

create function public.registrar_foto_academia(
  p_academia_id uuid,
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
     or not public.pode_editar_foto_academia(p_academia_id)
     or p_caminho_storage is distinct from (p_academia_id::text || '/foto')
     or p_tipo_mime is null
     or p_tipo_mime not in ('image/jpeg', 'image/png') then
    return false;
  end if;

  select o.metadata ->> 'size', o.metadata ->> 'mimetype'
    into v_tamanho_texto, v_mime_storage
  from storage.objects o
  where o.bucket_id = 'academias'
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

  insert into public.academias_fotos (
    academia_id, caminho_storage, tipo_mime, tamanho_bytes, alterado_por
  )
  values (
    p_academia_id, p_caminho_storage, p_tipo_mime, v_tamanho, v_uid
  )
  on conflict (academia_id) do update
  set caminho_storage = excluded.caminho_storage,
      tipo_mime = excluded.tipo_mime,
      tamanho_bytes = excluded.tamanho_bytes,
      alterado_por = excluded.alterado_por,
      atualizado_em = pg_catalog.now();

  return true;
end;
$$;

create function public.registrar_foto_professor(
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
     or not public.pode_editar_foto_professor(v_uid)
     or p_caminho_storage is distinct from (v_uid::text || '/foto')
     or p_tipo_mime is null
     or p_tipo_mime not in ('image/jpeg', 'image/png') then
    return false;
  end if;

  select o.metadata ->> 'size', o.metadata ->> 'mimetype'
    into v_tamanho_texto, v_mime_storage
  from storage.objects o
  where o.bucket_id = 'professores'
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

  insert into public.professores_fotos (
    professor_id, caminho_storage, tipo_mime, tamanho_bytes
  )
  values (
    v_uid, p_caminho_storage, p_tipo_mime, v_tamanho
  )
  on conflict (professor_id) do update
  set caminho_storage = excluded.caminho_storage,
      tipo_mime = excluded.tipo_mime,
      tamanho_bytes = excluded.tamanho_bytes,
      atualizado_em = pg_catalog.now();

  return true;
end;
$$;

create function public.comprovantes_pagamento_apos_decisao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'pendente'
     and new.status in ('confirmado', 'rejeitado')
     and new.origem = 'aluno' then
    update public.comprovantes_pagamento
    set estado_arquivo = 'remocao_pendente',
        remocao_solicitada_em = pg_catalog.now(),
        remocao_solicitada_por = auth.uid(),
        motivo_remocao = new.status
    where pagamento_id = new.id
      and estado_arquivo = 'ativo';
  end if;
  return new;
end;
$$;

create trigger pagamentos_comprovante_apos_decisao
  after update of status on public.pagamentos
  for each row
  execute function public.comprovantes_pagamento_apos_decisao();

create function public.listar_comprovantes_pagamento_expirados()
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
        (select public.papel_atual()) = 'aluno'
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

create function public.registrar_remocao_comprovante_pagamento(
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
        (select public.papel_atual()) = 'aluno'
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

revoke all on function public.pode_ler_comprovante_pagamento(uuid)
  from public, anon, authenticated;
revoke all on function public.pode_ver_storage_comprovante_pagamento(uuid)
  from public, anon, authenticated;
revoke all on function public.pode_excluir_comprovante_storage(text)
  from public, anon, authenticated;
revoke all on function public.pode_ler_foto_professor(uuid)
  from public, anon, authenticated;
revoke all on function public.pode_editar_foto_academia(uuid)
  from public, anon, authenticated;
revoke all on function public.pode_editar_foto_professor(uuid)
  from public, anon, authenticated;
revoke all on function public.registrar_comprovante_pagamento(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.registrar_foto_academia(uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.registrar_foto_professor(text, text)
  from public, anon, authenticated;
revoke all on function public.listar_comprovantes_pagamento_expirados()
  from public, anon, authenticated;
revoke all on function public.registrar_remocao_comprovante_pagamento(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.comprovantes_pagamento_apos_decisao()
  from public, anon, authenticated;

grant execute on function public.pode_ler_comprovante_pagamento(uuid) to authenticated;
grant execute on function public.pode_ver_storage_comprovante_pagamento(uuid) to authenticated;
grant execute on function public.pode_excluir_comprovante_storage(text) to authenticated;
grant execute on function public.pode_ler_foto_professor(uuid) to authenticated;
grant execute on function public.pode_editar_foto_academia(uuid) to authenticated;
grant execute on function public.pode_editar_foto_professor(uuid) to authenticated;
grant execute on function public.registrar_comprovante_pagamento(uuid, text, text) to authenticated;
grant execute on function public.registrar_foto_academia(uuid, text, text) to authenticated;
grant execute on function public.registrar_foto_professor(text, text) to authenticated;
grant execute on function public.listar_comprovantes_pagamento_expirados() to authenticated;
grant execute on function public.registrar_remocao_comprovante_pagamento(uuid, boolean) to authenticated;

commit;
