"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDispositionDecisionLabel,
  getNotificationStatusLabel,
  type ReadinessItem,
} from "@/lib/dispositions";
import {
  getFindingSeverityBadgeVariant,
  getFindingSeverityLabel,
  getFindingStatusLabel,
  getFindingTypeLabel,
} from "@/lib/findings";
import { fetchJson, getErrorMessage } from "@/lib/http";
import { getReviewStatusBadgeVariant, getReviewStatusLabel, REVIEWS_CHANGED_EVENT } from "@/lib/reviews";
import {
  getDashboardHref,
  getDocumentReadinessHref,
  getDocumentReviewHref,
} from "@/lib/workspace-tabs";
import { cn } from "cn";

type ReadinessResponse = {
  items: ReadinessItem[];
};

export function DocumentReadinessBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const reviewId = searchParams.get("review");
  const [items, setItems] = useState<ReadinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const item = useMemo(
    () => items.find((entry) => entry.reviewId === reviewId) ?? null,
    [items, reviewId]
  );

  const loadItems = useCallback(async () => {
    try {
      setError(null);
      const payload = await fetchJson<ReadinessResponse>("/api/readiness");
      setItems(payload.items ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load readiness board."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    function handleReviewsChanged() {
      void loadItems();
    }
    window.addEventListener(REVIEWS_CHANGED_EVENT, handleReviewsChanged);
    return () => {
      window.removeEventListener(REVIEWS_CHANGED_EVENT, handleReviewsChanged);
    };
  }, [loadItems]);

  function dismissNotice() {
    router.replace(
      getDocumentReadinessHref(reviewId ? { reviewId } : undefined)
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading readiness…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {notice === "sent-to-sign-off" ? (
        <Alert>
          <AlertTitle>Sent to manager sign-off</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              Ready and deny decisions wait for a manager. Switch to the Manager
              role in the header to open Sign Off.
            </span>
            <button
              type="button"
              className="w-fit text-xs font-medium underline-offset-4 hover:underline"
              onClick={dismissNotice}
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {notice === "awaiting-client" ? (
        <Alert>
          <AlertTitle>Client information requested</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              The stub client notification was queued. This packet now sits on
              the readiness board as awaiting client.
            </span>
            <button
              type="button"
              className="w-fit text-xs font-medium underline-offset-4 hover:underline"
              onClick={dismissNotice}
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!reviewId ? (
        <Alert>
          <AlertTitle>No packet selected</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>Open a packet from the Dashboard to view its readiness.</span>
            <Link
              href={getDashboardHref()}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit"
              )}
            >
              Back to Dashboard
            </Link>
          </AlertDescription>
        </Alert>
      ) : !item ? (
        <Alert>
          <AlertTitle>Packet not ready</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              This packet has not been disposed yet. Complete the review to
              see its readiness package.
            </span>
            <Link
              href={getDocumentReviewHref(reviewId)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit"
              )}
            >
              Back to Document Review
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
            <Card key={item.disposition.id}>
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{item.businessName}</CardTitle>
                    <CardDescription>
                      Disposed{" "}
                      {new Date(item.disposition.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={getReviewStatusBadgeVariant(item.status)}>
                      {getReviewStatusLabel(item.status)}
                    </Badge>
                    <Badge variant="outline">
                      {getDispositionDecisionLabel(item.disposition.decision)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-(--card-spacing)">
                {item.disposition.note ? (
                  <p className="text-sm">
                    <span className="font-medium">Note: </span>
                    {item.disposition.note}
                  </p>
                ) : null}
                {item.disposition.aiRecommendedDecision ? (
                  <p className="text-xs text-muted-foreground">
                    AI recommended{" "}
                    {getDispositionDecisionLabel(
                      item.disposition.aiRecommendedDecision
                    )}
                    {item.disposition.aiRecommendedDecision !==
                    item.disposition.decision
                      ? " (underwriter overrode)"
                      : null}
                    {item.disposition.aiRecommendationSummary
                      ? ` — ${item.disposition.aiRecommendationSummary}`
                      : null}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Notification:{" "}
                  {getNotificationStatusLabel(
                    item.disposition.notificationStatus
                  )}
                  {item.disposition.notificationSummary
                    ? ` — ${item.disposition.notificationSummary}`
                    : null}
                </p>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium">
                    Findings package ({item.disposition.findingSnapshot.length})
                  </p>
                  {item.disposition.findingSnapshot.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No findings included in this package.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {item.disposition.findingSnapshot.map((finding) => (
                        <li
                          key={finding.id}
                          className="rounded-md border border-border p-2"
                        >
                          <div className="mb-1 flex flex-wrap gap-1">
                            <span className="text-xs font-medium">
                              {finding.title}
                            </span>
                            <Badge
                              variant={getFindingSeverityBadgeVariant(
                                finding.severity
                              )}
                            >
                              {getFindingSeverityLabel(finding.severity)}
                            </Badge>
                            <Badge variant="outline">
                              {getFindingTypeLabel(finding.type)}
                            </Badge>
                            <Badge variant="secondary">
                              {getFindingStatusLabel(finding.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {finding.summary}
                          </p>
                          {finding.disagreementReason ? (
                            <p className="mt-1 text-xs">
                              <span className="font-medium">Disagree: </span>
                              {finding.disagreementReason}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
      )}
    </div>
  );
}
