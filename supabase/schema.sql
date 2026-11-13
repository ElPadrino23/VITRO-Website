-- VITRO · cuentas de clientes (Supabase)
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- El correo y la contraseña los maneja Supabase Auth (tabla auth.users);
-- aquí solo se guardan los datos básicos del perfil. No se guarda ningún dato de pago.

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '' check (char_length(full_name) <= 120),
  phone      text not null default '' check (char_length(phone) <= 20),
  school     text not null default '' check (char_length(school) <= 120),
  career     text not null default '' check (char_length(career) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cada persona solo puede ver y editar su propio perfil
alter table public.profiles enable row level security;

drop policy if exists "perfil: ver el propio" on public.profiles;
create policy "perfil: ver el propio" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "perfil: crear el propio" on public.profiles;
create policy "perfil: crear el propio" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "perfil: editar el propio" on public.profiles;
create policy "perfil: editar el propio" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Mantener updated_at al día
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Al registrarse alguien, crear su perfil con los datos del formulario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, phone, school, career)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 20),
    left(coalesce(new.raw_user_meta_data ->> 'school', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'career', ''), 120)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
