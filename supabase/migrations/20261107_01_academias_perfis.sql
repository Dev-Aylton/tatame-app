-- TATAME · SQL parte 1 · academias, perfis e convites de professor
begin;

create table public.academias (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 2 and 80),
  foto_fundo_url text,
  criado_em timestamptz not null default now()
);

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  papel text not null check (papel in ('adm', 'professor', 'instrutor', 'aluno')),
  nome text check (nome is null or char_length(btrim(nome)) between 1 and 80),
  foto_url text,
  academia_id uuid references public.academias (id) on delete restrict,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index perfis_academia_idx on public.perfis (academia_id);

create table public.professores_convidados (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%._%'),
  academia_id uuid not null references public.academias (id) on delete restrict,
  status text not null default 'convidado' check (status in ('convidado', 'ativo', 'revogado')),
  perfil_id uuid references public.perfis (id) on delete set null,
  criado_por uuid default auth.uid() references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now()
);

create function public.papel_atual()
returns text
language sql stable security definer set search_path = ''
as $$ select p.papel from public.perfis p where p.id = auth.uid() and p.ativo $$;

create function public.academia_atual()
returns uuid
language sql stable security definer set search_path = ''
as $$ select p.academia_id from public.perfis p where p.id = auth.uid() and p.ativo $$;

revoke all on function public.papel_atual() from public, anon, authenticated;
revoke all on function public.academia_atual() from public, anon, authenticated;
grant execute on function public.papel_atual() to authenticated;
grant execute on function public.academia_atual() to authenticated;

alter table public.academias enable row level security;
alter table public.perfis enable row level security;
alter table public.professores_convidados enable row level security;

create policy academias_select on public.academias for select to authenticated
  using ((select public.papel_atual()) = 'adm' or id = (select public.academia_atual()));
create policy academias_insert_adm on public.academias for insert to authenticated
  with check ((select public.papel_atual()) = 'adm');
create policy academias_update_adm on public.academias for update to authenticated
  using ((select public.papel_atual()) = 'adm')
  with check ((select public.papel_atual()) = 'adm');

create policy perfis_select_proprio on public.perfis for select to authenticated
  using (id = (select auth.uid()));
create policy perfis_select_adm on public.perfis for select to authenticated
  using ((select public.papel_atual()) = 'adm' and papel in ('professor', 'instrutor'));
create policy perfis_select_quadro on public.perfis for select to authenticated
  using (academia_id is not null
         and academia_id = (select public.academia_atual())
         and papel in ('professor', 'instrutor'));
create policy perfis_update_proprio on public.perfis for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy convidados_select_adm on public.professores_convidados for select to authenticated
  using ((select public.papel_atual()) = 'adm');
create policy convidados_insert_adm on public.professores_convidados for insert to authenticated
  with check ((select public.papel_atual()) = 'adm');
create policy convidados_delete_adm on public.professores_convidados for delete to authenticated
  using ((select public.papel_atual()) = 'adm' and status = 'convidado');

revoke all on table public.academias, public.perfis, public.professores_convidados from anon, authenticated;
grant select on public.academias to authenticated;
grant insert (nome, foto_fundo_url), update (nome, foto_fundo_url) on public.academias to authenticated;
grant select on public.perfis to authenticated;
grant update (nome, foto_url) on public.perfis to authenticated;
grant select, delete on public.professores_convidados to authenticated;
grant insert (email, academia_id) on public.professores_convidados to authenticated;

commit;
