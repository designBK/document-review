-- Manager identity captured when a ready or deny disposition is signed off.

alter table public.review_dispositions
  add column if not exists manager_name text;

alter table public.review_dispositions
  add column if not exists manager_title text;

alter table public.review_dispositions
  add column if not exists manager_signature text;

alter table public.review_dispositions
  add column if not exists manager_signed_at timestamptz;
