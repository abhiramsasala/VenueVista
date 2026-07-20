-- Run once in the Supabase SQL editor.
create type public.user_role as enum ('customer', 'owner', 'admin');
create type public.booking_status as enum ('enquiry_sent', 'pending_payment', 'confirmed', 'cancelled', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  description text,
  location text not null,
  district text not null,
  latitude double precision,
  longitude double precision,
  capacity integer not null check (capacity > 0),
  price_per_day integer not null check (price_per_day >= 0),
  cover_image text,
  gallery jsonb not null default '[]',
  amenities text[] not null default '{}',
  architecture_notes text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id),
  customer_id uuid not null references public.profiles(id),
  event_date date not null,
  slot text not null,
  guest_count integer,
  customer_name text not null,
  customer_phone text not null,
  status public.booking_status not null default 'enquiry_sent',
  amount integer,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  unique (venue_id, event_date, slot)
);

create table public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_id)
);

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id);
create policy "published venues public" on public.venues for select using (is_published or owner_id = auth.uid());
create policy "owners manage venues" on public.venues for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "customers create bookings" on public.bookings for insert with check (customer_id = auth.uid());
create policy "booking parties read" on public.bookings for select using (customer_id = auth.uid() or exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));
create policy "owners update bookings" on public.bookings for update using (exists (select 1 from public.venues v where v.id = venue_id and v.owner_id = auth.uid()));
create policy "customers update own bookings" on public.bookings for update using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "users manage favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
