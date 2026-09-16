-- Persist AI disposition recommendation alongside underwriter decision.

alter table public.review_dispositions
  add column if not exists ai_recommended_decision public.review_disposition_decision;

alter table public.review_dispositions
  add column if not exists ai_recommendation_summary text;

alter table public.review_dispositions
  add column if not exists ai_recommendation_rationale jsonb not null default '[]'::jsonb;

alter table public.review_dispositions
  add column if not exists ai_recommendation_confidence numeric(4, 3);
