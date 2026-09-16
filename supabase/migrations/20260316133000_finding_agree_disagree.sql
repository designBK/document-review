-- SME feedback wording: accept/reject → agree/disagree.

alter table public.findings
  drop constraint if exists findings_rejection_reason_check;

alter type public.finding_status rename value 'accepted' to 'agreed';
alter type public.finding_status rename value 'rejected' to 'disagreed';

alter table public.findings
  rename column rejection_reason to disagreement_reason;

alter table public.findings
  drop constraint if exists findings_disagreement_reason_check;

alter table public.findings
  add constraint findings_disagreement_reason_check
  check (
    status <> 'disagreed'::public.finding_status
    or (
      disagreement_reason is not null
      and char_length(trim(disagreement_reason)) > 0
    )
  );

update public.findings
set disagreement_reason = 'Disagreed before disagreement reasons were required.'
where status = 'disagreed'
  and disagreement_reason = 'Rejected before rejection reasons were required.';
