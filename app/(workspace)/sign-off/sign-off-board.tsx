"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/ui/signature";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "cn";
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
  type DispositionDecision,
  type ReadinessItem,
} from "@/lib/dispositions";
import {
  getFindingSeverityBadgeVariant,
  getFindingSeverityLabel,
  getFindingStatusLabel,
  getFindingTypeLabel,
} from "@/lib/findings";
import { fetchJson, getErrorMessage } from "@/lib/http";
import {
  getReviewStatusBadgeVariant,
  getReviewStatusLabel,
  notifyReviewsChanged,
  REVIEWS_CHANGED_EVENT,
} from "@/lib/reviews";
import { getSignOffHref } from "@/lib/workspace-tabs";

type SignOffResponse = {
  items: ReadinessItem[];
};

type ManagerSignOff = {
  managerName: string;
  managerTitle: string;
  signature: string;
};

export function SignOffBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review");
  const [items, setItems] = useState<ReadinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const item = useMemo(
    () => items.find((entry) => entry.reviewId === reviewId) ?? null,
    [items, reviewId]
  );

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

  async function approve(dispositionId: string, signOff: ManagerSignOff) {
    setApprovingId(dispositionId);
    setError(null);
    try {
      await fetchJson(`/api/sign-off/${dispositionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signOff),
      });
      notifyReviewsChanged();
      await loadItems();
      router.replace(getSignOffHref());
    } catch (approveError) {
      setError(
        getErrorMessage(approveError, "Failed to approve and notify client.")
      );
    } finally {
      setApprovingId(null);
    }
  }

  async function returnForReview(dispositionId: string, reason: string) {
    setReturningId(dispositionId);
    setError(null);
    try {
      await fetchJson(`/api/sign-off/${dispositionId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      notifyReviewsChanged();
      await loadItems();
      router.replace(getSignOffHref());
    } finally {
      setReturningId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading sign-off…</p>;
  }

  if (!reviewId) {
    const queueDescription = error
      ? error
      : items.length === 0
        ? "No packets awaiting sign-off"
        : `${items.length} packet${items.length === 1 ? "" : "s"} awaiting sign-off`;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Sign-off queue</CardTitle>
          <CardDescription>{queueDescription}</CardDescription>
        </CardHeader>
        <CardContent className="pt-(--card-spacing)">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business title</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0 text-right whitespace-nowrap">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Ready and deny dispositions appear here before client
                    notification.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((entry) => (
                  <TableRow key={entry.disposition.id}>
                    <TableCell className="font-medium">
                      {entry.businessName}
                    </TableCell>
                    <TableCell>
                      {new Date(entry.disposition.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getReviewStatusBadgeVariant(entry.status)}>
                        {getReviewStatusLabel(entry.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-0 whitespace-nowrap">
                      <div className="flex justify-end">
                        <Link
                          href={getSignOffHref(entry.reviewId)}
                          aria-label={`Review ${entry.businessName}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "icon-sm",
                          })}
                        >
                          <EyeIcon />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (!item) {
    if (error) {
      return (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      );
    }

    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Packet not in the sign-off queue</CardTitle>
          <CardDescription>
            This packet is no longer waiting for manager sign-off.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-(--card-spacing)">
          <Link
            href={getSignOffHref()}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to queue
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-card px-4 py-3 shadow-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-medium">{item.businessName}</h2>
              <Badge variant={getReviewStatusBadgeVariant(item.status)}>
                {getReviewStatusLabel(item.status)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted {new Date(item.disposition.createdAt).toLocaleString()}
            </p>
          </div>
          <Link
            href={getSignOffHref()}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to queue
          </Link>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-(--card-spacing)">
          {item.disposition.note ? (
            <p className="text-sm">
              <span className="font-medium">Underwriter note: </span>
              {item.disposition.note}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No underwriter note.</p>
          )}
          {item.disposition.aiRecommendedDecision ? (
            <p className="text-xs text-muted-foreground">
              AI recommended{" "}
              {getDispositionDecisionLabel(item.disposition.aiRecommendedDecision)}
              {item.disposition.aiRecommendedDecision !== item.disposition.decision
                ? " (underwriter overrode)"
                : null}
              {item.disposition.aiRecommendationSummary
                ? ` — ${item.disposition.aiRecommendationSummary}`
                : null}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Notification:{" "}
            {getNotificationStatusLabel(item.disposition.notificationStatus)}
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium">
              Findings ({item.disposition.findingSnapshot.length})
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
                      <span className="text-xs font-medium">{finding.title}</span>
                      <Badge
                        variant={getFindingSeverityBadgeVariant(finding.severity)}
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
                    <p className="text-xs text-muted-foreground">{finding.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <ManagerSignOffForm
            dispositionId={item.disposition.id}
            decision={item.disposition.decision}
            submitting={approvingId === item.disposition.id}
            returning={returningId === item.disposition.id}
            onSubmit={(signOff) => void approve(item.disposition.id, signOff)}
            onReturn={(reason) => returnForReview(item.disposition.id, reason)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ManagerSignOffForm({
  dispositionId,
  decision,
  submitting,
  returning,
  onSubmit,
  onReturn,
}: {
  dispositionId: string;
  decision: DispositionDecision;
  submitting: boolean;
  returning: boolean;
  onSubmit: (signOff: ManagerSignOff) => void;
  onReturn: (reason: string) => Promise<void>;
}) {
  const [managerName, setManagerName] = useState("");
  const [managerTitle, setManagerTitle] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const canSubmit =
    managerName.trim().length > 0 &&
    managerTitle.trim().length > 0 &&
    Boolean(signature);

  const actionLabel =
    decision === "denied" ? "Confirm denial & notify client" : "Approve & notify client";

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <p className="text-xs font-medium">Manager sign-off</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`manager-name-${dispositionId}`}>Name</Label>
          <Input
            id={`manager-name-${dispositionId}`}
            value={managerName}
            disabled={submitting || returning}
            autoComplete="name"
            placeholder="Full name"
            onChange={(event) => setManagerName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`manager-title-${dispositionId}`}>Title</Label>
          <Input
            id={`manager-title-${dispositionId}`}
            value={managerTitle}
            disabled={submitting || returning}
            autoComplete="organization-title"
            placeholder="Underwriting manager"
            onChange={(event) => setManagerTitle(event.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Signature</Label>
        <SignaturePad disabled={submitting || returning} onChange={setSignature} />
        <p className="text-xs text-muted-foreground">
          Name, title, and signature are required for approval and denial.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!canSubmit || submitting || returning}
          onClick={() => {
            if (!signature) return;
            onSubmit({
              managerName: managerName.trim(),
              managerTitle: managerTitle.trim(),
              signature,
            });
          }}
        >
          {submitting ? "Signing off…" : actionLabel}
        </Button>
        <ReturnForReviewDialog
          disabled={submitting}
          submitting={returning}
          onSubmit={onReturn}
        />
      </div>
    </div>
  );
}

function ReturnForReviewDialog({
  disabled,
  submitting,
  onSubmit,
}: {
  disabled: boolean;
  submitting: boolean;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canSubmit = reason.trim().length > 0 && !submitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;
        setOpen(nextOpen);
        if (!nextOpen) {
          setReason("");
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" disabled={disabled || submitting} />
        }
      >
        Return for re-review
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>Return for re-review</DialogTitle>
          <DialogDescription>
            Send this packet back to the underwriter. The client is not
            notified.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-reason">Reason for re-review</Label>
          <Textarea
            id="return-reason"
            value={reason}
            disabled={submitting}
            placeholder="What should the underwriter look at again?"
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError(null);
            }}
          />
        </div>
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              void (async () => {
                setError(null);
                try {
                  await onSubmit(reason.trim());
                  setOpen(false);
                  setReason("");
                } catch (submitError) {
                  setError(
                    getErrorMessage(
                      submitError,
                      "Failed to return packet for re-review."
                    )
                  );
                }
              })();
            }}
          >
            {submitting ? "Returning…" : "Return for re-review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
