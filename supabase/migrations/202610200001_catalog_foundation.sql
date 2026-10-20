-- KEI Computer Store catalog foundation.
-- Initial migration for a fresh Supabase project only. Do not use this as a schema
-- reconciliation script for an existing/production project. IF NOT EXISTS does not
-- validate an existing object's definition; before first application, confirm no
-- pre-existing KEI tables, indexes, helper functions, policies, or a product-images
-- bucket need reconciliation. The bucket upsert below intentionally sets its private
-- visibility and upload limits when that bucket already exists.
-- Named functions and policies are intentionally maintained by this migration on rerun.
-- It depends on Supabase-provided auth/storage schemas, roles, and functions, plus the
-- extensions schema.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 100),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists categories_slug_lower_uq on public.categories (lower(slug));

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- CHECK helper: true only when a JSON array contains an object with nonblank string
-- label and value properties. This function reads no table data and is immutable.
create or replace function public.has_meaningful_product_specification(specifications jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if specifications is null or pg_catalog.jsonb_typeof(specifications) <> 'array' then
    return false;
  end if;

  return exists (
    select 1
    from pg_catalog.jsonb_array_elements(specifications) as item(specification)
    where pg_catalog.jsonb_typeof(item.specification) = 'object'
      and pg_catalog.jsonb_typeof(item.specification -> 'label') = 'string'
      and (item.specification ->> 'label') ~ '[^[:space:]]'
      and pg_catalog.jsonb_typeof(item.specification -> 'value') = 'string'
      and (item.specification ->> 'value') ~ '[^[:space:]]'
  );
end;
$$;
revoke all on function public.has_meaningful_product_specification(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.has_meaningful_product_specification(jsonb) to authenticated, service_role;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  slug text not null default '' check (slug = '' or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text not null default '',
  brand text not null default '',
  model text not null default '',
  category_id uuid references public.categories(id) on delete restrict,
  condition text check (condition in ('new_sealed', 'new_open_box', 'used', 'refurbished')),
  description text,
  price numeric(12,2) check (price is null or price > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  availability_status text check (availability_status in ('in_stock', 'out_of_stock', 'check_at_store')),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  specifications jsonb not null default '[]'::jsonb check (jsonb_typeof(specifications) = 'array'),
  included_accessories text[] not null default '{}',
  warranty_details text,
  condition_notes text,
  known_defects text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  constraint products_sku_nonblank check (
    publication_status <> 'published' or pg_catalog.regexp_replace(sku, '^[[:space:]]+|[[:space:]]+$', '', 'g') <> ''
  ),
  constraint products_published_complete check (
    publication_status <> 'published' or (
      length(btrim(name)) > 0 and length(btrim(slug)) > 0 and length(btrim(sku)) > 0
      and length(btrim(brand)) > 0 and length(btrim(model)) > 0 and category_id is not null
      and condition is not null and availability_status is not null and description is not null
      and length(btrim(description)) > 0 and price is not null and price > 0
      and public.has_meaningful_product_specification(specifications)
    )
  )
);
create unique index if not exists products_sku_normalized_uq
  on public.products (lower(pg_catalog.regexp_replace(sku, '^[[:space:]]+|[[:space:]]+$', '', 'g')))
  where pg_catalog.regexp_replace(sku, '^[[:space:]]+|[[:space:]]+$', '', 'g') <> '';
create unique index if not exists products_slug_lower_uq on public.products (lower(slug)) where slug <> '';
create index if not exists products_public_catalog_idx on public.products (publication_status, category_id, name);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique check (storage_path like 'products/%'),
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_sort_idx on public.product_images (product_id, sort_order, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- CREATE TRIGGER has no IF NOT EXISTS. Skip only the expected active BEFORE UPDATE
-- row trigger without a column filter or WHEN condition; raise on same-name conflicts.
do $$
declare
  existing_function oid;
  existing_type smallint;
  existing_enabled text;
  existing_has_condition boolean;
  existing_has_column_filter boolean;
begin
  select trigger_row.tgfoid, trigger_row.tgtype, trigger_row.tgenabled,
         trigger_row.tgqual is not null, coalesce(pg_catalog.array_length(trigger_row.tgattr, 1), 0) > 0
    into existing_function, existing_type, existing_enabled, existing_has_condition, existing_has_column_filter
    from pg_catalog.pg_trigger as trigger_row
   where trigger_row.tgrelid = 'public.categories'::regclass
     and trigger_row.tgname = 'categories_set_updated_at'
     and not trigger_row.tgisinternal;

  if found then
    if existing_function <> 'public.set_updated_at()'::regprocedure::oid
       or existing_type <> 19
       or existing_enabled <> 'O'
       or existing_has_condition
       or existing_has_column_filter then
      raise exception 'Trigger public.categories.categories_set_updated_at exists with a different definition.';
    end if;
  else
    create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
  end if;
end;
$$;

do $$
declare
  existing_function oid;
  existing_type smallint;
  existing_enabled text;
  existing_has_condition boolean;
  existing_has_column_filter boolean;
begin
  select trigger_row.tgfoid, trigger_row.tgtype, trigger_row.tgenabled,
         trigger_row.tgqual is not null, coalesce(pg_catalog.array_length(trigger_row.tgattr, 1), 0) > 0
    into existing_function, existing_type, existing_enabled, existing_has_condition, existing_has_column_filter
    from pg_catalog.pg_trigger as trigger_row
   where trigger_row.tgrelid = 'public.products'::regclass
     and trigger_row.tgname = 'products_set_updated_at'
     and not trigger_row.tgisinternal;

  if found then
    if existing_function <> 'public.set_updated_at()'::regprocedure::oid
       or existing_type <> 19
       or existing_enabled <> 'O'
       or existing_has_condition
       or existing_has_column_filter then
      raise exception 'Trigger public.products.products_set_updated_at exists with a different definition.';
    end if;
  else
    create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
  end if;
end;
$$;

-- SECURITY DEFINER reads admin_users outside its RLS policy to prevent recursion.
create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users as admin
    where admin.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.admin_users enable row level security;

revoke all on public.categories, public.products, public.product_images, public.admin_users from public, anon, authenticated;
grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images to authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Public reads active categories" on public.categories;
create policy "Public reads active categories" on public.categories for select to anon using (is_active);
drop policy if exists "Authenticated reads active categories or admin manages categories" on public.categories;
create policy "Authenticated reads active categories or admin manages categories" on public.categories for select to authenticated using (is_active or (select public.is_store_admin()));
drop policy if exists "Admins create categories" on public.categories;
create policy "Admins create categories" on public.categories for insert to authenticated with check ((select public.is_store_admin()));
drop policy if exists "Admins update categories" on public.categories;
create policy "Admins update categories" on public.categories for update to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
drop policy if exists "Admins delete categories" on public.categories;
create policy "Admins delete categories" on public.categories for delete to authenticated using ((select public.is_store_admin()));

drop policy if exists "Public reads published products" on public.products;
create policy "Public reads published products" on public.products for select to anon using (
  publication_status = 'published' and exists (select 1 from public.categories as category where category.id = category_id and category.is_active)
);
drop policy if exists "Authenticated reads published products or admin reads all" on public.products;
create policy "Authenticated reads published products or admin reads all" on public.products for select to authenticated using (
  (publication_status = 'published' and exists (select 1 from public.categories as category where category.id = category_id and category.is_active))
  or (select public.is_store_admin())
);
drop policy if exists "Admins create products" on public.products;
create policy "Admins create products" on public.products for insert to authenticated with check ((select public.is_store_admin()));
drop policy if exists "Admins update products" on public.products;
create policy "Admins update products" on public.products for update to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
drop policy if exists "Admins delete products" on public.products;
create policy "Admins delete products" on public.products for delete to authenticated using ((select public.is_store_admin()));

drop policy if exists "Public reads images for published products" on public.product_images;
create policy "Public reads images for published products" on public.product_images for select to anon using (
  exists (select 1 from public.products as product join public.categories as category on category.id = product.category_id where product.id = product_id and product.publication_status = 'published' and category.is_active)
);
drop policy if exists "Authenticated reads published images or admin reads all" on public.product_images;
create policy "Authenticated reads published images or admin reads all" on public.product_images for select to authenticated using (
  (select public.is_store_admin()) or exists (select 1 from public.products as product join public.categories as category on category.id = product.category_id where product.id = product_id and product.publication_status = 'published' and category.is_active)
);
drop policy if exists "Admins create product images" on public.product_images;
create policy "Admins create product images" on public.product_images for insert to authenticated with check ((select public.is_store_admin()));
drop policy if exists "Admins update product images" on public.product_images;
create policy "Admins update product images" on public.product_images for update to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
drop policy if exists "Admins delete product images" on public.product_images;
create policy "Admins delete product images" on public.product_images for delete to authenticated using ((select public.is_store_admin()));

drop policy if exists "Users read own admin membership and admins read membership list" on public.admin_users;
create policy "Users read own admin membership and admins read membership list" on public.admin_users for select to authenticated using (user_id = (select auth.uid()) or (select public.is_store_admin()));

-- Create the private product image bucket here. Configure storage.objects access
-- policies separately in Supabase Dashboard -> Storage -> Policies: the managed
-- Storage table is not altered or granted privileges by this migration.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Category taxonomy only; no fictitious product rows are inserted.
insert into public.categories (name, slug, description) values
  ('Laptops', 'laptops', 'Portable computers'),
  ('Desktop computers', 'desktop-computers', 'Desktop computers and workstations'),
  ('PC components', 'pc-components', 'Components for computer builds and upgrades'),
  ('Monitors', 'monitors', 'Computer displays'),
  ('Peripherals', 'peripherals', 'Keyboards, mice, and other peripherals'),
  ('Accessories', 'accessories', 'Computer accessories'),
  ('Custom PC builds', 'custom-pc-builds', 'Custom computer build listings')
on conflict do nothing;
