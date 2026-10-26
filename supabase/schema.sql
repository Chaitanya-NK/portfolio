-- =====================================================================
-- PORTFOLIO DATABASE SCHEMA (Supabase / Postgres)
-- Rebuilds everything the app needs on a fresh Supabase project.
--
-- HOW TO USE
--   1. Create a new Supabase project.
--   2. SQL Editor -> New query -> paste this whole file -> Run.
--   3. Authentication -> Users -> Add user (tick auto-confirm). Copy its UUID.
--   4. Run:  insert into public.admins (user_id) values ('PASTE-THE-UUID');
--   5. Authentication -> Multi-Factor: make sure TOTP is enabled (admin 2-step login).
--   6. Authentication -> URL Configuration: set Site URL to your live address.
--   7. Put the new project URL and keys into your environment variables (Vercel and .env.local),
--      redeploy, then use Admin -> Backup & restore to bring your content back.
--
-- It is written to be safe to run more than once, but test it on a NEW project first.
-- Public reads only return published or visible rows, so drafts are not exposed through the API.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Admin helpers
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);

-- True only for admins. Once a verified authenticator exists, an aal2 (code-verified) session is required.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
  and (
    coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = auth.uid() and f.status = 'verified'
    )
  );
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------------
-- 2. Content tables
-- ---------------------------------------------------------------------
create table if not exists public.profile (
  id int primary key default 1 check (id = 1),
  full_name text, headline text, bio text, avatar_url text, resume_url text,
  email text, phone text, location text, availability text,
  stats jsonb not null default '[]', socials jsonb not null default '[]',
  seo jsonb not null default '{}', theme jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  type text not null default 'custom',
  title text not null, subtitle text,
  visible boolean not null default true,
  sort_order int not null default 0,
  config jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections on delete cascade,
  data jsonb not null default '{}',
  published boolean not null default true, sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null, category text, icon_url text,
  published boolean not null default true, sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  category text not null, name text not null,
  level smallint not null default 3 check (level between 1 and 5),
  published boolean not null default true, sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null, company text not null, logo_url text,
  start_date date, end_date date, is_current boolean not null default false,
  summary text, bullets text[] not null default '{}', tech text[] not null default '{}',
  published boolean not null default true, sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.education (
  id uuid primary key default gen_random_uuid(),
  degree text not null, institution text not null, start_year int, end_year int, grade text,
  published boolean not null default true, sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null, issuer text, year int, description text,
  published boolean not null default true, sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title text not null, summary text, description text,
  cover_url text, role text, year int, tags text[] not null default '{}',
  live_url text, repo_url text, metrics jsonb not null default '[]',
  featured boolean not null default false,
  published boolean not null default false, publish_at timestamptz,
  sort_order int not null default 0, updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null, title text, company text, quote text not null, avatar_url text,
  published boolean not null default true, sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text, price_label text, price_note text,
  features text[] not null default '{}', cta_label text, cta_url text,
  featured boolean not null default false,
  published boolean not null default true, sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  body text not null, link_url text, tags text[] not null default '{}',
  pinned boolean not null default false, published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title text not null, excerpt text, cover_url text,
  content_json jsonb, content_html text not null default '',
  tags text[] not null default '{}', reading_minutes int not null default 1,
  status text not null default 'draft' check (status in ('draft','published')),
  publish_at timestamptz, published_at timestamptz,
  seo_title text, seo_description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,''))
  ) stored
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title text not null, headline text, summary text,
  skill_ids uuid[] not null default '{}', experience_ids uuid[] not null default '{}',
  project_ids uuid[] not null default '{}', highlights jsonb not null default '{}'::jsonb,
  show_achievements boolean not null default true, published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Inbox, requests, logs and analytics tables
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text, email text, body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages on delete cascade,
  subject text, body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reply_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null, subject text, body text not null,
  sort_order int not null default 0, created_at timestamptz not null default now()
);

create table if not exists public.testimonial_requests (
  id uuid primary key default gen_random_uuid(),
  token text unique not null, label text,
  status text not null default 'open' check (status in ('open','submitted','approved','rejected')),
  expires_at timestamptz not null,
  name text, title text, company text, quote text, avatar_url text,
  submitted_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor uuid, action text, entity text, entity_id text, meta jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null, referrer text, country text, device text, browser text,
  visitor text not null, created_at timestamptz not null default now()
);

create table if not exists public.click_events (
  id bigint generated always as identity primary key,
  kind text not null, label text, path text, visitor text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.live_presence (
  visitor text primary key, path text not null, seen_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  key text not null, hit_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Columns added over time (safe on both new and existing databases)
-- ---------------------------------------------------------------------
alter table public.experiences add column if not exists roles jsonb not null default '[]'::jsonb;
alter table public.profile
  add column if not exists name_phonetic text,
  add column if not exists name_audio_url text;
alter table public.projects
  add column if not exists problem text, add column if not exists approach text,
  add column if not exists result text, add column if not exists gallery jsonb not null default '[]'::jsonb;
alter table public.messages
  add column if not exists is_starred boolean not null default false,
  add column if not exists replied_at timestamptz,
  add column if not exists labels text[] not null default '{}',
  add column if not exists topic text,
  add column if not exists attachments jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------
-- 5. Indexes
-- ---------------------------------------------------------------------
create index if not exists projects_published_order_idx on public.projects (published, sort_order);
create index if not exists projects_tags_idx on public.projects using gin (tags);
create index if not exists sections_order_idx on public.sections (sort_order);
create index if not exists messages_created_idx on public.messages (created_at desc);
create index if not exists message_replies_idx on public.message_replies (message_id, created_at);
create index if not exists notes_order_idx on public.notes (published, pinned desc, created_at desc);
create index if not exists posts_status_idx on public.posts (status, published_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);
create index if not exists posts_fts_idx on public.posts using gin (fts);
create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists click_events_created_idx on public.click_events (created_at desc);
create index if not exists live_presence_seen_idx on public.live_presence (seen_at desc);
create index if not exists rate_limits_key_idx on public.rate_limits (key, hit_at desc);

-- ---------------------------------------------------------------------
-- 6. Functions
-- ---------------------------------------------------------------------

-- automatic audit trail
create or replace function public.audit_trigger() returns trigger
language plpgsql security definer set search_path = public as $$
declare rec jsonb; changed jsonb := '[]'::jsonb;
begin
  rec := to_jsonb(case when tg_op = 'DELETE' then old else new end);
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(e.key), '[]'::jsonb) into changed
    from jsonb_each(to_jsonb(new)) e
    where e.value is distinct from (to_jsonb(old) -> e.key)
      and e.key not in ('updated_at', 'sort_order', 'fts');
    if jsonb_array_length(changed) = 0 then return new; end if;
  end if;
  insert into public.audit_logs (actor, action, entity, entity_id, meta)
  values (
    auth.uid(), lower(tg_op), tg_table_name,
    coalesce(rec ->> 'id', rec ->> 'key', ''),
    jsonb_build_object(
      'label', coalesce(rec ->> 'title', rec ->> 'name', rec ->> 'role', rec ->> 'degree', rec ->> 'full_name', rec ->> 'key', ''),
      'changed', changed
    )
  );
  return case when tg_op = 'DELETE' then old else new end;
end $$;

-- atomic drag-and-drop reorder
create or replace function public.reorder(tbl text, ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if tbl not in ('sections','tools','skills','experiences','education','achievements','projects','testimonials','section_items','services') then
    raise exception 'bad table'; end if;
  execute format('update public.%I t set sort_order = o.ord from unnest($1) with ordinality as o(id, ord) where t.id = o.id', tbl) using ids;
  insert into public.audit_logs (actor, action, entity, meta)
  values (auth.uid(), 'reorder', tbl, jsonb_build_object('count', coalesce(array_length(ids, 1), 0)));
end $$;

-- rate limiting without any outside service
create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare c int;
begin
  delete from public.rate_limits where hit_at < now() - interval '1 day';
  select count(*) into c from public.rate_limits
    where key = p_key and hit_at > now() - make_interval(secs => p_window_seconds);
  if c >= p_max then return false; end if;
  insert into public.rate_limits (key) values (p_key);
  return true;
end $$;
revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;

-- analytics for the admin dashboard
create or replace function public.analytics_summary(p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_since timestamptz := date_trunc('day', now()) - make_interval(days => greatest(p_days, 1) - 1);
  res jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'views', (select count(*) from page_views where created_at >= v_since),
    'visitors', (select count(distinct visitor) from page_views where created_at >= v_since),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'views', coalesce(v.views, 0),
        'visitors', coalesce(v.visitors, 0)) order by d.day), '[]'::jsonb)
      from (select g::date as day from generate_series(v_since::date, now()::date, interval '1 day') g) d
      left join (
        select created_at::date as day, count(*) as views, count(distinct visitor) as visitors
        from page_views where created_at >= v_since group by 1
      ) v on v.day = d.day
    ),
    'pages', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
      select path as label, count(*) as value from page_views
      where created_at >= v_since group by path order by value desc limit 8) t),
    'referrers', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
      select coalesce(referrer, 'Direct') as label, count(*) as value from page_views
      where created_at >= v_since group by 1 order by value desc limit 8) t),
    'devices', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
      select coalesce(device, 'unknown') as label, count(*) as value from page_views
      where created_at >= v_since group by 1 order by value desc) t),
    'browsers', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
      select coalesce(browser, 'Other') as label, count(*) as value from page_views
      where created_at >= v_since group by 1 order by value desc limit 6) t),
    'countries', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
      select country as label, count(*) as value from page_views
      where created_at >= v_since and country is not null group by country order by value desc limit 8) t),
    'clicks', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
      select kind || coalesce(': ' || nullif(label, ''), '') as label, count(*) as value from click_events
      where created_at >= v_since group by kind, label order by value desc limit 10) t),
    'resume_downloads', (select count(*) from click_events where kind = 'resume' and created_at >= v_since)
  ) into res;
  return res;
end $$;

-- backup and restore
create or replace function public._restore_table(p_tbl text, p_rows jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare cols text; sets text; n int := 0;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then return 0; end if;
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position),
         string_agg(quote_ident(column_name) || ' = excluded.' || quote_ident(column_name), ', ' order by ordinal_position)
           filter (where column_name <> 'id')
    into cols, sets
  from information_schema.columns
  where table_schema = 'public' and table_name = p_tbl and is_generated = 'NEVER';
  if cols is null then raise exception 'Unknown table %', p_tbl; end if;
  execute format(
    'insert into public.%1$I (%2$s) select %2$s from jsonb_populate_recordset(null::public.%1$I, $1) on conflict (id) do update set %3$s',
    p_tbl, cols, sets) using p_rows;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.restore_content(p jsonb, p_replace boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ord text[] := array['profile','sections','section_items','tools','skills','experiences','education',
    'achievements','projects','services','testimonials','posts','notes','reply_templates','resume_versions',
    'messages','message_replies'];
  t text; n int; i int; res jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if coalesce((p->>'version')::int, 0) <> 1 or coalesce(jsonb_typeof(p->'tables'), '') <> 'object' then
    raise exception 'Not a valid backup file';
  end if;

  if p_replace then
    for i in reverse array_length(ord, 1)..1 loop
      t := ord[i];
      if t <> 'profile' and (p->'tables') ? t then
        execute format('delete from public.%I where true', t);
      end if;
    end loop;
  end if;

  foreach t in array ord loop
    if (p->'tables') ? t then
      n := public._restore_table(t, p->'tables'->t);
      res := res || jsonb_build_object(t, n);
    end if;
  end loop;

  delete from public.audit_logs where created_at = now();
  insert into public.audit_logs (actor, action, entity, meta)
    values (auth.uid(), 'restore', 'backup',
      jsonb_build_object('label', case when p_replace then 'replace' else 'merge' end, 'counts', res));
  return res;
end $$;
revoke all on function public._restore_table(text, jsonb) from public, anon, authenticated;
revoke all on function public.restore_content(jsonb, boolean) from public, anon;
grant execute on function public.restore_content(jsonb, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------

-- public (anonymous) reads: only published / visible rows
do $$
declare r record;
begin
  for r in select * from (values
    ('profile',         'true'),
    ('sections',        'visible'),
    ('section_items',   'published'),
    ('tools',           'published'),
    ('skills',          'published'),
    ('experiences',     'published'),
    ('education',       'published'),
    ('achievements',    'published'),
    ('projects',        'published'),
    ('testimonials',    'published'),
    ('services',        'published'),
    ('notes',           'published'),
    ('resume_versions', 'published'),
    ('posts',           $c$status = 'published' and (publish_at is null or publish_at <= now())$c$)
  ) as v(tbl, clause)
  loop
    execute format('alter table public.%I enable row level security', r.tbl);
    execute format('drop policy if exists "public read" on public.%I', r.tbl);
    execute format('create policy "public read" on public.%I for select using (%s)', r.tbl, r.clause);
  end loop;
end $$;

-- admin: full access (needs an admin login, plus the 2-step code once MFA is set up)
do $$
declare t text;
begin
  foreach t in array array[
    'profile','sections','section_items','tools','skills','experiences','education','achievements',
    'projects','testimonials','services','notes','posts','resume_versions',
    'messages','message_replies','reply_templates','testimonial_requests'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- admin read-only logs
alter table public.audit_logs enable row level security;
drop policy if exists "admin read" on public.audit_logs;
create policy "admin read" on public.audit_logs for select using (public.is_admin());

alter table public.page_views enable row level security;
drop policy if exists "admin read" on public.page_views;
create policy "admin read" on public.page_views for select using (public.is_admin());

alter table public.click_events enable row level security;
drop policy if exists "admin read" on public.click_events;
create policy "admin read" on public.click_events for select using (public.is_admin());

alter table public.live_presence enable row level security;
drop policy if exists "admin read" on public.live_presence;
create policy "admin read" on public.live_presence for select using (public.is_admin());

alter table public.admins enable row level security;
drop policy if exists "self read" on public.admins;
create policy "self read" on public.admins for select using (user_id = auth.uid());

-- no policies at all: only the server (service role) can touch it
alter table public.rate_limits enable row level security;

-- ---------------------------------------------------------------------
-- 8. Triggers: updated_at and the audit trail
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profile','sections','section_items','tools','skills','experiences','education','achievements',
    'projects','testimonials','services','notes','posts','resume_versions'
  ] loop
    execute format('drop trigger if exists touch on public.%I', t);
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
    execute format('drop trigger if exists audit on public.%I', t);
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function public.audit_trigger()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9. Storage buckets
-- ---------------------------------------------------------------------
-- media: public images and files (readable by anyone, writable only by the admin)
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects for all
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

-- attachments: private contact-form files (only the admin can open or delete them)
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict (id) do nothing;
drop policy if exists "attachments admin read" on storage.objects;
create policy "attachments admin read" on storage.objects for select using (bucket_id = 'attachments' and public.is_admin());
drop policy if exists "attachments admin delete" on storage.objects;
create policy "attachments admin delete" on storage.objects for delete using (bucket_id = 'attachments' and public.is_admin());

-- ---------------------------------------------------------------------
-- 10. Starter rows
-- ---------------------------------------------------------------------
insert into public.profile (id) values (1) on conflict (id) do nothing;

insert into public.sections (key, type, title, subtitle, sort_order) values
  ('hero',         'hero',         'Hero',         null,              1),
  ('tools',        'tools',        'Tools',        null,              2),
  ('skills',       'skills',       'Skills',       null,              3),
  ('experience',   'experience',   'Experience',   null,              4),
  ('education',    'education',    'Education',    null,              5),
  ('achievements', 'achievements', 'Achievements', null,              6),
  ('projects',     'projects',     'Projects',     null,              7),
  ('services',     'services',     'Services',     null,              8),
  ('testimonials', 'testimonials', 'Testimonials', null,              9),
  ('notes',        'notes',        'Notes',        'Today I learned', 10),
  ('blog',         'blog',         'Blog',         null,              11),
  ('contact',      'contact',      'Contact',      null,              12)
on conflict (key) do nothing;

insert into public.reply_templates (title, subject, body, sort_order)
select * from (values
  ('Thanks for reaching out', 'Re: your message',
   E'Hi {{name}},\n\nThanks for reaching out, I really appreciate it. I''ll go through your message and get back to you within a couple of days.\n\nBest,\n{{my_name}}', 1),
  ('Here''s my availability', 'Re: your message',
   E'Hi {{name}},\n\nThanks for your message. I''m available for a call this week. Please send me two or three time slots that suit you (with your time zone) and I''ll confirm one.\n\nBest,\n{{my_name}}', 2),
  ('Not a fit right now', 'Re: your message',
   E'Hi {{name}},\n\nThank you for thinking of me. Unfortunately I can''t take this on at the moment, but I appreciate the invitation and wish you the best with it.\n\nBest,\n{{my_name}}', 3)
) as t(title, subject, body, sort_order)
where not exists (select 1 from public.reply_templates);

-- ---------------------------------------------------------------------
-- 11. After running this file
-- ---------------------------------------------------------------------
-- insert into public.admins (user_id) values ('PASTE-THE-USER-UUID');
