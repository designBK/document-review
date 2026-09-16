-- Packet disposition: underwriter handoff from Document Review → Readiness.

create type public.review_disposition_decision as enum (
  'ready_for_sign_off',
  'awaiting_client',
  'denied'
);

create table public.review_dispositions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  decision public.review_disposition_decision not null,
  note text,
  finding_snapshot jsonb not null default '[]'::jsonb,
  notification_provider text not null default 'stub',
  notification_message_id text,
  notification_status text not null default 'pending_sign_off',
  notification_summary text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint review_dispositions_note_required check (
    decision = 'ready_for_sign_off'::public.review_disposition_decision
    or (
      note is not null
      and char_length(trim(note)) > 0
    )
  )
);

create index review_dispositions_review_id_idx
  on public.review_dispositions (review_id);

create index review_dispositions_created_at_idx
  on public.review_dispositions (created_at desc);

alter table public.review_dispositions enable row level security;
