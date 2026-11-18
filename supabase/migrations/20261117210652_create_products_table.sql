create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sku text not null,
  quantity integer not null,
  minimum_quantity integer not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint products_name_not_blank check (pg_catalog.btrim(name) <> ''),
  constraint products_sku_normalized check (
    sku <> ''
    and sku = pg_catalog.upper(pg_catalog.btrim(sku))
  ),
  constraint products_quantity_nonnegative check (quantity >= 0),
  constraint products_minimum_quantity_nonnegative check (minimum_quantity >= 0),
  constraint products_user_id_sku_key unique (user_id, sku)
);

create function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_products_updated_at();

revoke execute on function public.set_products_updated_at() from public, anon, authenticated;

alter table public.products enable row level security;

grant usage on schema public to authenticated;

revoke all on table public.products from public, anon, authenticated;

grant select, delete on table public.products to authenticated;
grant insert (user_id, name, sku, quantity, minimum_quantity)
  on table public.products to authenticated;
grant update (name, sku, quantity, minimum_quantity)
  on table public.products to authenticated;

create policy products_select_own
on public.products
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy products_insert_own
on public.products
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy products_update_own
on public.products
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy products_delete_own
on public.products
for delete
to authenticated
using ((select auth.uid()) = user_id);

