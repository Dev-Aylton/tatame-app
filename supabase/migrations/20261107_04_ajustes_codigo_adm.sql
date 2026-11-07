-- TATAME · SQL parte 2C · alfabeto do código, brecha do e-mail convidado, vínculo direto do Adm
begin;

-- 1) alfabeto de 32 caracteres (sem 0, O, 1, I)
alter table public.turmas drop constraint turmas_codigo_check;
alter table public.turmas add constraint turmas_codigo_check
  check (codigo ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$');

create or replace function public.gerar_codigo()
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_alfa constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_b bytea;
  v_cod text;
  i integer;
  k integer;
begin
  if public.papel_atual() is distinct from 'professor' or public.academia_atual() is null then
    return null;
  end if;
  for i in 1..5 loop
    v_b := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_cod := '';
    for k in 0..5 loop
      v_cod := v_cod || substr(v_alfa, (get_byte(v_b, k) % 32) + 1, 1);
    end loop;
    begin
      insert into public.turmas (professor_id, codigo) values (v_uid, v_cod)
      on conflict (professor_id) do update set codigo = excluded.codigo, criado_em = now();
      return v_cod;
    exception when unique_violation then
      null;
    end;
  end loop;
  return null;
end
$$;

-- 2) brecha: quem tem convite pendente de professor não vira aluno
create or replace function public.criar_perfil_aluno(p_nome text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := btrim(coalesce(p_nome, ''));
  v_email text;
begin
  if v_uid is null or char_length(v_nome) not between 1 and 80 then
    return false;
  end if;
  if exists (select 1 from public.perfis where id = v_uid) then
    return false;
  end if;
  select lower(btrim(u.email)) into v_email from auth.users u where u.id = v_uid;
  if v_email is not null and exists (
       select 1 from public.professores_convidados c
       where c.email = v_email and c.status = 'convidado') then
    return false;
  end if;
  insert into public.perfis (id, papel, nome) values (v_uid, 'aluno', v_nome);
  return true;
end
$$;

-- 3) Adm se vincula direto a um professor (sem código, sem aprovação)
create function public.vincular_adm_professor(p_professor uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_academia uuid;
begin
  if public.papel_atual() is distinct from 'adm' then
    return false;
  end if;
  select p.academia_id into v_academia
  from public.perfis p
  where p.id = p_professor and p.papel = 'professor' and p.ativo and p.academia_id is not null;
  if v_academia is null then
    return false;
  end if;
  insert into public.vinculos (aluno_id, professor_id) values (v_uid, p_professor)
  on conflict (aluno_id) do update set professor_id = excluded.professor_id, criado_em = now();
  update public.perfis set academia_id = v_academia where id = v_uid;
  return true;
end
$$;

revoke all on function public.vincular_adm_professor(uuid) from public, anon, authenticated;
grant execute on function public.vincular_adm_professor(uuid) to authenticated;

commit;
