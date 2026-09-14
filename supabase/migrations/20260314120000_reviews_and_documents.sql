-- Reviews + document metadata. File bytes live in Storage bucket `review-documents`.
-- Auth/roles come later; API routes use the service role for writes for now.

create extension if not exists pgcrypto;

create type public.review_status as enum ('new');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(trim(business_name)) > 0),
  status public.review_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index documents_review_id_idx on public.documents (review_id);
create index reviews_created_at_idx on public.reviews (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reviews_set_updated_at
before update on public.reviews
for each row
execute function public.set_updated_at();

alter table public.reviews enable row level security;
alter table public.documents enable row level security;

-- No anon/authenticated policies yet: access goes through the Next.js API with the service role.

insert into storage.buckets (id, name, public, file_size_limit)
values ('review-documents', 'review-documents', false, 52428800)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit;
