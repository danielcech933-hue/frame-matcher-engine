create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null default '',
  why_it_matters text not null default '',
  category text not null default 'trh',
  importance text not null default 'normal' check (importance in ('normal','important','critical')),
  published_at timestamptz not null default now(),
  source_name text not null default '',
  source_url text not null unique,
  image_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.news_articles to anon, authenticated;
grant all on public.news_articles to service_role;
alter table public.news_articles enable row level security;
drop policy if exists "news_public_read" on public.news_articles;
create policy "news_public_read" on public.news_articles for select to anon, authenticated using (true);
create index if not exists news_articles_published_idx on public.news_articles (published_at desc);
create index if not exists news_articles_category_idx on public.news_articles (category);

create table if not exists public.news_refresh_state (
  id boolean primary key default true,
  last_refreshed_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
insert into public.news_refresh_state (id) values (true) on conflict (id) do nothing;
grant select on public.news_refresh_state to anon, authenticated;
grant all on public.news_refresh_state to service_role;
alter table public.news_refresh_state enable row level security;
drop policy if exists "news_refresh_state_public_read" on public.news_refresh_state;
create policy "news_refresh_state_public_read" on public.news_refresh_state for select to anon, authenticated using (true);

create or replace function public.set_news_updated_at() returns trigger
language plpgsql set search_path = public as $fn$
begin new.updated_at = now(); return new; end;
$fn$;

drop trigger if exists news_articles_updated_at on public.news_articles;
create trigger news_articles_updated_at before update on public.news_articles
for each row execute function public.set_news_updated_at();

drop trigger if exists news_refresh_state_updated_at on public.news_refresh_state;
create trigger news_refresh_state_updated_at before update on public.news_refresh_state
for each row execute function public.set_news_updated_at();

do $outer$
begin
  if not exists (select 1 from cron.job where jobname = 'refresh-market-news-hourly') then
    perform cron.schedule(
      'refresh-market-news-hourly',
      '0 * * * *',
      $cron$select net.http_post(
        url := 'https://ntzjirsejfvgvuhmbqvt.supabase.co/functions/v1/refresh-news',
        headers := '{"Content-Type":"application/json"}'::jsonb,
        body := '{"trigger":"cron"}'::jsonb,
        timeout_milliseconds := 55000
      ) as request_id;$cron$
    );
  end if;
end
$outer$;
