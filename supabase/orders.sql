-- VITRO · pedidos, existencias y administradores (Supabase)
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Antes tuviste que correr supabase/schema.sql (perfiles). Este archivo se puede correr más de una vez sin borrar nada.
--
-- Seguridad: las tablas orders, stock y admins NO se pueden leer ni escribir desde el navegador
-- (RLS activado y sin políticas). Solo las usa el servidor de VITRO con la llave service_role.
-- Los clientes ven sus propios pedidos únicamente a través de la función my_orders().

-- 0) Utilidad compartida ----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Administradores --------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on table public.admins from anon, authenticated;

-- 2) Pedidos ----------------------------------------------------------------
create table if not exists public.orders (
  id                   text primary key,   -- folio VITRO-XXXX (= external_reference en Mercado Pago)
  status               text not null default 'pending'
                         check (status in ('pending','paid','preparing','shipped','delivered','cancelled','refunded')),
  student              boolean not null default false,
  student_verified     boolean not null default false,
  customer             jsonb not null,     -- name, email, phone, street, colonia, zip, city, state, notes, school
  items                jsonb not null,     -- [{model,color,size,qty,unit_price,name}]
  subtotal             integer not null default 0,
  shipping             integer not null default 0,
  total                integer not null default 0,
  mp_payment_id        text,
  mp_status            text,
  paid_at              timestamptz,
  carrier              text,
  tracking_number      text,
  tracking_url         text,
  shipped_at           timestamptz,
  admin_note           text,
  stock_warning        boolean not null default false,  -- se pagó más de lo que había en existencias
  admin_notified_at    timestamptz,
  customer_notified_at timestamptz,
  shipped_notified_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx  on public.orders (status);
create index if not exists orders_email_idx   on public.orders ((lower(customer ->> 'email')));

alter table public.orders enable row level security;
revoke all on table public.orders from anon, authenticated;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- 3) Existencias ------------------------------------------------------------
create table if not exists public.stock (
  model      text not null,
  color      text not null,
  size       text not null,
  qty        integer not null default 0 check (qty >= 0),
  updated_at timestamptz not null default now(),
  primary key (model, color, size)
);
alter table public.stock enable row level security;
revoke all on table public.stock from anon, authenticated;

-- Existencias iniciales (las de public/catalog.js). Si ya existen, no se tocan.
insert into public.stock (model, color, size, qty) values
  ('mujer',  'navy',  'XS', 3), ('mujer',  'navy',  'S', 4), ('mujer',  'navy',  'M', 3),
  ('mujer',  'vino',  'XS', 1), ('mujer',  'vino',  'S', 3), ('mujer',  'vino',  'M', 1),
  ('mujer',  'verde', 'XS', 2), ('mujer',  'verde', 'S', 2), ('mujer',  'verde', 'M', 1),
  ('unisex', 'navy',  'XS', 2), ('unisex', 'navy',  'S', 5), ('unisex', 'navy',  'M', 3),
  ('unisex', 'vino',  'XS', 1), ('unisex', 'vino',  'S', 2), ('unisex', 'vino',  'M', 2),
  ('unisex', 'verde', 'XS', 2), ('unisex', 'verde', 'S', 2), ('unisex', 'verde', 'M', 1)
on conflict (model, color, size) do nothing;

-- 4) Marcar un pedido como pagado: una sola vez, descontando existencias ----
-- Devuelve true solo la PRIMERA vez que el pedido pasa a pagado (así los avisos y el descuento no se repiten
-- aunque Mercado Pago mande la misma notificación varias veces).
create or replace function public.mark_order_paid(p_id text, p_payment_id text, p_mp_status text)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  o     public.orders%rowtype;
  it    jsonb;
  need  integer;
  have  integer;
  short boolean := false;
begin
  select * into o from public.orders where id = p_id for update;
  if not found then
    return false;
  end if;

  if o.paid_at is not null or o.status not in ('pending', 'cancelled') then
    update public.orders
       set mp_payment_id = coalesce(p_payment_id, mp_payment_id), mp_status = p_mp_status
     where id = p_id;
    return false;
  end if;

  for it in select * from jsonb_array_elements(o.items) loop
    need := coalesce((it ->> 'qty')::integer, 0);
    select s.qty into have from public.stock s
     where s.model = it ->> 'model' and s.color = it ->> 'color' and s.size = it ->> 'size'
       for update;
    if have is null or have < need then
      short := true;
    end if;
    update public.stock s
       set qty = greatest(s.qty - need, 0), updated_at = now()
     where s.model = it ->> 'model' and s.color = it ->> 'color' and s.size = it ->> 'size';
  end loop;

  update public.orders
     set status = 'paid', paid_at = now(), mp_payment_id = p_payment_id, mp_status = p_mp_status, stock_warning = short
   where id = p_id;
  return true;
end;
$$;
revoke all on function public.mark_order_paid(text, text, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, text, text) to service_role;

-- 5) "Mis pedidos": cada cliente ve solo los pedidos hechos con el correo de su cuenta ---
create or replace function public.my_orders()
returns table (
  id text, status text, created_at timestamptz, paid_at timestamptz, items jsonb,
  subtotal integer, shipping integer, total integer, student boolean,
  carrier text, tracking_number text, tracking_url text, shipped_at timestamptz
)
language sql security definer stable set search_path = '' as $$
  select o.id, o.status, o.created_at, o.paid_at, o.items,
         o.subtotal, o.shipping, o.total, o.student,
         o.carrier, o.tracking_number, o.tracking_url, o.shipped_at
    from public.orders o
   where coalesce(auth.jwt() ->> 'email', '') <> ''
     and lower(o.customer ->> 'email') = lower(auth.jwt() ->> 'email')
     and (o.status <> 'pending' or o.created_at > now() - interval '7 days')
   order by o.created_at desc
   limit 50;
$$;
revoke all on function public.my_orders() from public, anon;
grant execute on function public.my_orders() to authenticated, service_role;

-- 6) Darte acceso de administrador -----------------------------------------
-- Primero crea tu cuenta en https://www.vitroscrubs.com/cuenta y confirma tu correo.
-- Luego cambia TU_CORREO por el correo de esa cuenta y corre SOLO este bloque:
--
--   insert into public.admins (user_id)
--   select id from auth.users where lower(email) = lower('TU_CORREO')
--   on conflict do nothing;

-- 7) Que la API de Supabase vea las tablas y funciones nuevas de inmediato
notify pgrst, 'reload schema';
