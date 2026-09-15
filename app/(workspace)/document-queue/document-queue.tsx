"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReviews } from "@/hooks/use-reviews";
import { fetchJson, getErrorMessage } from "@/lib/http";
import {
  getReviewStatusLabel,
  notifyReviewsChanged,
} from "@/lib/reviews";
import { getDocumentReviewHref } from "@/lib/workspace-tabs";

type PendingDelete = {
  id: string;
  businessName: string;
};

export function DocumentQueue() {
  const { reviews, loading, error } = useReviews({
    listenForChanges: true,
  });
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function closeDeleteDialog() {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await fetchJson(`/api/reviews/${pendingDelete.id}`, {
        method: "DELETE",
      });
      setPendingDelete(null);
      notifyReviewsChanged();
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Failed to delete review."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Table>
        <TableCaption>
          {loading
            ? "Loading reviews…"
            : error
              ? error
              : reviews.length === 0
                ? "No reviews yet. Create one with New review."
                : `${reviews.length} review${reviews.length === 1 ? "" : "s"} in queue`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Business title</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-0 text-right whitespace-nowrap">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-destructive">
                {error}
              </TableCell>
            </TableRow>
          ) : reviews.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground">
                No created reviews to display.
              </TableCell>
            </TableRow>
          ) : (
            reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">
                  {review.businessName}
                </TableCell>
                <TableCell>
                  <div className="flex max-w-md flex-wrap gap-1">
                    {review.documents.map((document) => (
                      <Badge key={document.id} variant="outline">
                        {document.fileName}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getReviewStatusLabel(review.status)}
                  </Badge>
                </TableCell>
                <TableCell className="w-0 whitespace-nowrap">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={getDocumentReviewHref(review.id)}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      View
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete({
                          id: review.id,
                          businessName: review.businessName,
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete review</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Delete “${pendingDelete.businessName}”? This permanently removes its documents and findings.`
                : "This permanently removes the review, its documents, and findings."}
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={closeDeleteDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Deleting…" : "Delete review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
