import type { Review, ReviewStatus } from "@/lib/reviews";

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

const OPEN_STATUSES: ReviewStatus[] = ["new", "under_review", "issues_found"];

function countByStatuses(reviews: Review[], statuses: ReviewStatus[]) {
  const allowed = new Set(statuses);
  return reviews.reduce(
    (total, review) => (allowed.has(review.status) ? total + 1 : total),
    0
  );
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
