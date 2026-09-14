-- Expand review lifecycle statuses.
-- Postgres requires ADD VALUE per statement (and not in a transaction block on older versions).
-- Supabase SQL editor runs this fine as a script.

alter type public.review_status add value if not exists 'under_review';
alter type public.review_status add value if not exists 'issues_found';
alter type public.review_status add value if not exists 'awaiting_client';
alter type public.review_status add value if not exists 'ready_for_sign_off';
alter type public.review_status add value if not exists 'signed_off';
alter type public.review_status add value if not exists 'denied';
alter type public.review_status add value if not exists 'cancelled';
