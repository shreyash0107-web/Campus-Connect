-- Apply once to a new Supabase project through migrations or the SQL editor.
-- Email is private through column grants; RLS alone does not hide columns.
begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- array_to_string is generally STABLE because element types can have mutable
-- output functions. This wrapper accepts only text[], so its result is immutable.
create function public.cc_search_tags(value text[])
returns text
language sql immutable strict parallel safe
set search_path = pg_catalog
as $$
  select coalesce(array_to_string(value, ' '), '');
$$;

create function public.cc_valid_tags(value text[])
returns boolean
language sql immutable strict parallel safe
set search_path = pg_catalog
as $$
  select cardinality(value) <= 12
    and coalesce(array_ndims(value), 1) = 1
    and not exists (
      select 1 from unnest(value) as tag
      where tag is null or char_length(btrim(tag)) < 1 or char_length(tag) > 32
    );
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) >= 2 and char_length(full_name) <= 80),
  email text not null,
  branch text not null check (char_length(btrim(branch)) >= 2 and char_length(branch) <= 100),
  year integer not null default 1 check (year between 1 and 6),
  bio text not null default '' check (char_length(bio) <= 500),
  skills text[] not null default '{}'::text[] check (public.cc_valid_tags(skills)),
  interests text[] not null default '{}'::text[] check (public.cc_valid_tags(interests)),
  avatar_url text check (char_length(avatar_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text generated always as (
    full_name || ' ' || public.cc_search_tags(skills) || ' ' || public.cc_search_tags(interests)
  ) stored
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) >= 8 and char_length(title) <= 120),
  description text not null check (char_length(btrim(description)) >= 30 and char_length(description) <= 3000),
  category text not null check (category in ('Project', 'Study Partner', 'Skill Sharing', 'Other')),
  skills_required text[] not null default '{}'::text[] check (public.cc_valid_tags(skills_required)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_text text generated always as (
    title || ' ' || description || ' ' || public.cc_search_tags(skills_required)
  ) stored
);

create index profiles_search_text_idx on public.profiles using gin (search_text extensions.gin_trgm_ops);
create index profiles_branch_year_idx on public.profiles (branch, year);
create index profiles_year_idx on public.profiles (year);
create index profiles_created_at_idx on public.profiles (created_at desc, id desc);
create index profiles_skills_idx on public.profiles using gin (skills);
create index profiles_interests_idx on public.profiles using gin (interests);
create index posts_search_text_idx on public.posts using gin (search_text extensions.gin_trgm_ops);
create index posts_category_created_at_idx on public.posts (category, created_at desc);
create index posts_created_at_idx on public.posts (created_at desc, id desc);
create index posts_user_id_idx on public.posts (user_id);
create index posts_skills_required_idx on public.posts using gin (skills_required);

create function public.cc_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.cc_set_updated_at();

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.cc_set_updated_at();

-- Metadata is untrusted. Only string names/branches and a single valid year
-- digit are consumed; other/malformed values fall back rather than abort signup.
create function public.cc_handle_new_user()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  safe_name text := 'New student';
  safe_branch text := 'Undeclared';
  safe_year integer := 1;
  candidate text;
begin
  if jsonb_typeof(new.raw_user_meta_data -> 'full_name') = 'string' then
    candidate := btrim(left(btrim(new.raw_user_meta_data ->> 'full_name'), 80));
    if char_length(candidate) >= 2 then safe_name := candidate; end if;
  end if;
  if jsonb_typeof(new.raw_user_meta_data -> 'branch') = 'string' then
    candidate := btrim(left(btrim(new.raw_user_meta_data ->> 'branch'), 100));
    if char_length(candidate) >= 2 then safe_branch := candidate; end if;
  end if;
  candidate := new.raw_user_meta_data ->> 'year';
  if candidate ~ '^[1-6]$' then safe_year := candidate::integer; end if;

  insert into public.profiles (id, full_name, email, branch, year)
  values (new.id, safe_name, coalesce(new.email, ''), safe_branch, safe_year);
  return new;
end;
$$;

create trigger on_auth_user_created_campusconnect
after insert on auth.users
for each row execute function public.cc_handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

create policy profiles_authenticated_read on public.profiles
for select to authenticated using (true);
create policy profiles_owner_update on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy posts_authenticated_read on public.posts
for select to authenticated using (true);
create policy posts_owner_insert on public.posts
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy posts_owner_update on public.posts
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy posts_owner_delete on public.posts
for delete to authenticated using ((select auth.uid()) = user_id);

-- Supabase may have default grants; explicitly remove them before adding the
-- minimum privileges. Never select('*') from profiles in application code.
revoke all on table public.profiles, public.posts from public, anon, authenticated;
grant usage on schema public to authenticated, service_role;
grant select (
  id, full_name, branch, year, bio, skills, interests, avatar_url,
  created_at, updated_at, search_text
) on public.profiles to authenticated;
grant update (full_name, branch, year, bio, skills, interests, avatar_url)
on public.profiles to authenticated;
grant select on public.posts to authenticated;
grant insert (user_id, title, description, category, skills_required)
on public.posts to authenticated;
grant update (title, description, category, skills_required)
on public.posts to authenticated;
grant delete on public.posts to authenticated;
grant all privileges on table public.profiles, public.posts to service_role;

revoke all on function public.cc_search_tags(text[]), public.cc_valid_tags(text[])
from public, anon, authenticated;
grant execute on function public.cc_search_tags(text[]), public.cc_valid_tags(text[])
to authenticated, service_role;
revoke all on function public.cc_set_updated_at(), public.cc_handle_new_user()
from public, anon, authenticated;

comment on column public.profiles.email is
  'Private Auth email snapshot. No authenticated SELECT/UPDATE grant; use Auth for own current email.';
comment on column public.profiles.search_text is
  'Generated public full-name/skills/interests search; escape backslash, percent, underscore for literal ILIKE.';
comment on column public.posts.search_text is
  'Generated title/description/required-skills search; use exact count with 12-row ranges.';
commit;
