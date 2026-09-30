-- Manager can send a ready or deny packet back to the underwriter.
-- Manager signature columns are included so this script is safe if that
-- earlier migration has not been applied yet.

alter table public.review_dispositions
  add column if not exists manager_name text;

alter table public.review_dispositions
  add column if not exists manager_title text;

alter table public.review_dispositions
  add column if not exists manager_signature text;

alter table public.review_dispositions
  add column if not exists manager_signed_at timestamptz;

alter type public.review_status add value if not exists 'returned_for_review';

alter table public.review_dispositions
  add column if not exists return_reason text;

alter table public.review_dispositions
  add column if not exists returned_at timestamptz;
