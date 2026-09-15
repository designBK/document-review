-- Analysis runs + findings for Document Review POC (pluggable provider; stub first).

create type public.finding_type as enum (
  'missing_field',
  'unclear_field',
  'conflict',
  'stale_document',
  'pack_incomplete'
);

create type public.finding_severity as enum ('blocker', 'warning', 'info');

create type public.finding_status as enum (
  'open',
  'accepted',
  'rejected',
  'edited'
);

create type public.analysis_run_status as enum (
  'pending',
  'completed',
  'failed'
);

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  provider text not null default 'stub',
  status public.analysis_run_status not null default 'pending',
  summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  analysis_run_id uuid not null references public.analysis_runs (id) on delete cascade,
  type public.finding_type not null,
  severity public.finding_severity not null,
  status public.finding_status not null default 'open',
  field_key text,
  title text not null,
  summary text not null,
  suggested_action text,
  expected_value text,
  observed_values jsonb not null default '[]'::jsonb,
  confidence numeric(4, 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finding_evidence (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.findings (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  page_number integer,
  snippet text not null,
  created_at timestamptz not null default now()
);

create index analysis_runs_review_id_idx on public.analysis_runs (review_id);
create index findings_review_id_idx on public.findings (review_id);
create index findings_analysis_run_id_idx on public.findings (analysis_run_id);
create index finding_evidence_finding_id_idx on public.finding_evidence (finding_id);

create trigger findings_set_updated_at
before update on public.findings
for each row
execute function public.set_updated_at();

alter table public.analysis_runs enable row level security;
alter table public.findings enable row level security;
alter table public.finding_evidence enable row level security;
