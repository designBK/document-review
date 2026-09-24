-- Insight contract: structured locus on finding evidence
-- (where we observed a value vs where we expected / searched).

create type public.finding_evidence_kind as enum (
  'observed',
  'expected_locus',
  'absence'
);

alter table public.finding_evidence
  add column section text,
  add column kind public.finding_evidence_kind not null default 'observed';

comment on column public.finding_evidence.section is
  'Underwriting section or field path, e.g. Named insured, Limits / occurrence.';
comment on column public.finding_evidence.kind is
  'observed = value found; expected_locus = where we looked; absence = not found in packet/doc.';
