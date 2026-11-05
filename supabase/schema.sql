-- Esquema inicial para operadoresC4 en Supabase.
-- Ejecutar en Supabase > SQL Editor > New query.
-- La clave service_role NUNCA debe utilizarse en GitHub Pages.

create extension if not exists pgcrypto;

create table if not exists public.c4_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.c4_assessment_results (
  id uuid primary key default gen_random_uuid(),
  participant_name text not null check (char_length(trim(participant_name)) between 2 and 120),
  participant_email text not null check (char_length(trim(participant_email)) between 5 and 254),
  module_code text not null check (module_code in ('emotions','communication')),
  correct_answers integer not null check (correct_answers between 0 and 10),
  total_questions integer not null default 10 check (total_questions = 10),
  score numeric(2,1) not null check (score between 0 and 5),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.c4_admin_users enable row level security;
alter table public.c4_assessment_results enable row level security;

-- El administrador autenticado puede comprobar su propio registro de autorización.
drop policy if exists "admin can read own role" on public.c4_admin_users;
create policy "admin can read own role"
on public.c4_admin_users for select
to authenticated
using (user_id = auth.uid());

-- El formulario puede insertar resultados; no se permite lectura pública.
drop policy if exists "public can submit assessment" on public.c4_assessment_results;
create policy "public can submit assessment"
on public.c4_assessment_results for insert
to anon, authenticated
with check (
  char_length(trim(participant_name)) between 2 and 120
  and char_length(trim(participant_email)) between 5 and 254
  and module_code in ('emotions','communication')
  and correct_answers between 0 and 10
  and total_questions = 10
  and score between 0 and 5
);

-- Solo usuarios incluidos en c4_admin_users pueden consultar los resultados.
drop policy if exists "only admins can read results" on public.c4_assessment_results;
create policy "only admins can read results"
on public.c4_assessment_results for select
to authenticated
using (
  exists (
    select 1 from public.c4_admin_users a
    where a.user_id = auth.uid()
  )
);

grant insert on public.c4_assessment_results to anon, authenticated;
grant select on public.c4_assessment_results to authenticated;
grant select on public.c4_admin_users to authenticated;

-- Después de crear/invitar al usuario administrador en Authentication > Users,
-- ejecuta este INSERT reemplazando el correo por el correo real del administrador:
-- insert into public.c4_admin_users (user_id)
-- select id from auth.users where email = 'CORREO_ADMIN@DOMINIO.COM'
-- on conflict (user_id) do nothing;
