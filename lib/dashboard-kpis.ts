import type { Review, ReviewStatus } from "@/lib/reviews";
import {
  EXPECTED_DOCUMENTS,
  detectDocumentKind,
} from "@/lib/underwriting/checklist";

export type DashboardKpiId =
  | "open"
  | "awaiting_client"
  | "manager_review"
  | "accepted"
  | "declined";

export type DashboardKpi = {
  id: DashboardKpiId;
  label: string;
  description: string;
  count: number;
};

export type DispositionMixPoint = {
  label: string;
  open: number;
  awaiting_client: number;
  manager_review: number;
  accepted: number;
  declined: number;
};

export type DocumentCompletenessPoint = {
  docType: string;
  found: number;
  missing: number;
};

const OPEN_STATUSES: ReviewStatus[] = ["new", "under_review", "issues_found"];

const KPI_STATUS_MAP: Record<DashboardKpiId, ReviewStatus[]> = {
  open: OPEN_STATUSES,
  awaiting_client: ["awaiting_client"],
  manager_review: ["ready_for_sign_off"],
  accepted: ["signed_off"],
  declined: ["denied"],
};

function countByStatuses(reviews: Review[], statuses: ReviewStatus[]) {
  const allowed = new Set(statuses);
  return reviews.reduce(
    (total, review) => (allowed.has(review.status) ? total + 1 : total),
    0
  );
}

function kpiIdForStatus(status: ReviewStatus): DashboardKpiId | null {
  for (const [id, statuses] of Object.entries(KPI_STATUS_MAP) as [
    DashboardKpiId,
    ReviewStatus[],
  ][]) {
    if (statuses.includes(status)) return id;
  }
  return null;
}

/** Packet outcome / pipeline KPIs derived from review status. */
export function computeDashboardKpis(reviews: Review[]): DashboardKpi[] {
  return [
    {
      id: "open",
      label: "Open",
      description: "New, under review, or issues found",
      count: countByStatuses(reviews, OPEN_STATUSES),
    },
    {
      id: "awaiting_client",
      label: "Awaiting client",
      description: "Packets requesting more information",
      count: countByStatuses(reviews, ["awaiting_client"]),
    },
    {
      id: "manager_review",
      label: "Manager review",
      description: "Sent for manager sign-off",
      count: countByStatuses(reviews, ["ready_for_sign_off"]),
    },
    {
      id: "accepted",
      label: "Accepted",
      description: "Signed off by manager",
      count: countByStatuses(reviews, ["signed_off"]),
    },
    {
      id: "declined",
      label: "Declined",
      description: "Denied packets",
      count: countByStatuses(reviews, ["denied"]),
    },
  ];
}

type MonthBucket = DispositionMixPoint & {
  year: number;
  monthIndex: number;
};

/**
 * Monthly stacked series for disposition mix (last 6 calendar months),
 * bucketed by review createdAt + current status.
 */
export function computeDispositionMixTrend(
  reviews: Review[],
  monthCount = 6
): DispositionMixPoint[] {
  const now = new Date();
  const months: MonthBucket[] = [];

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      label: date.toLocaleString("en-US", { month: "short" }),
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      open: 0,
      awaiting_client: 0,
      manager_review: 0,
      accepted: 0,
      declined: 0,
    });
  }

  for (const review of reviews) {
    const created = new Date(review.createdAt);
    const bucket = months.find(
      (month) =>
        month.year === created.getFullYear() &&
        month.monthIndex === created.getMonth()
    );
    if (!bucket) continue;
    const kpiId = kpiIdForStatus(review.status);
    if (!kpiId) continue;
    bucket[kpiId] += 1;
  }

  return months.map(
    ({ label, open, awaiting_client, manager_review, accepted, declined }) => ({
      label,
      open,
      awaiting_client,
      manager_review,
      accepted,
      declined,
    })
  );
}

/** Found vs missing expected doc kinds across all packets (counts). */
export function computeDocumentCompleteness(
  reviews: Review[]
): DocumentCompletenessPoint[] {
  return EXPECTED_DOCUMENTS.map((expected) => {
    let found = 0;
    let missing = 0;

    for (const review of reviews) {
      const hasKind = review.documents.some(
        (document) => detectDocumentKind(document.fileName) === expected.kind
      );
      if (hasKind) found += 1;
      else missing += 1;
    }

    return {
      docType: expected.label,
      found,
      missing,
    };
  });
}
