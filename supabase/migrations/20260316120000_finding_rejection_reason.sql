-- Require a human comment when a finding is rejected; accept needs no reason.

alter table public.findings
  add column if not exists rejection_reason text;

-- Backfill any already-rejected rows before enforcing the check.
update public.findings
set rejection_reason = 'Rejected before rejection reasons were required.'
where status = 'rejected'
  and (
    rejection_reason is null
    or char_length(trim(rejection_reason)) = 0
  );

alter table public.findings
  drop constraint if exists findings_rejection_reason_check;

alter table public.findings
  add constraint findings_rejection_reason_check
  check (
    status <> 'rejected'::public.finding_status
    or (
      rejection_reason is not null
      and char_length(trim(rejection_reason)) > 0
    )
  );
