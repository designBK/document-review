"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  getFindingStatusLabel,
  getFindingTypeLabel,
} from "@/lib/findings";
import { fetchJson, getErrorMessage } from "@/lib/http";
import {
  getReviewStatusLabel,
  notifyReviewsChanged,
  REVIEWS_CHANGED_EVENT,
} from "@/lib/reviews";

type SignOffResponse = {
  items: ReadinessItem[];
};

export function SignOffBoard() {
  const [items, setItems] = useState<ReadinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setError(null);
      const payload = await fetchJson<SignOffResponse>("/api/sign-off");
      setItems(payload.items ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load sign-off queue."));
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

  async function approve(dispositionId: string) {
    setApprovingId(dispositionId);
    setError(null);
    try {
      await fetchJson(`/api/sign-off/${dispositionId}`, { method: "POST" });
      notifyReviewsChanged();
      await loadItems();
    } catch (approveError) {
      setError(
        getErrorMessage(approveError, "Failed to approve and notify client.")
      );
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading sign-off…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No packets awaiting manager sign-off. Ready and deny dispositions
          appear here before client notification.
        </p>
      ) : (
        items.map((item) => {
          const expanded = expandedId === item.disposition.id;
          return (
            <Card key={item.disposition.id}>
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{item.businessName}</CardTitle>
                    <CardDescription>
                      Submitted{" "}
                      {new Date(item.disposition.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">
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
                    <span className="font-medium">Underwriter note: </span>
                    {item.disposition.note}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No underwriter note.
                  </p>
                )}
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
                </p>
                <button
                  type="button"
                  className="text-left text-xs font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() =>
                    setExpandedId(expanded ? null : item.disposition.id)
                  }
                >
                  {expanded ? "Hide findings package" : "Show findings package"}{" "}
                  ({item.disposition.findingSnapshot.length})
                </button>
                {expanded ? (
                  item.disposition.findingSnapshot.length === 0 ? (
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
                              {finding.severity}
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
                        </li>
                      ))}
                    </ul>
                  )
                ) : null}
                <div>
                  <Button
                    disabled={approvingId === item.disposition.id}
                    onClick={() => void approve(item.disposition.id)}
                  >
                    {approvingId === item.disposition.id
                      ? "Approving…"
                      : "Approve & notify client"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
