"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReviewsCache } from "@/lib/reviews-cache";

export function DocumentQueue() {
  const reviews = useReviewsCache();

  return (
    <Table>
      <TableCaption>
        {reviews.length === 0
          ? "No reviews yet. Create one with New review."
          : `${reviews.length} review${reviews.length === 1 ? "" : "s"} in queue`}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Business title</TableHead>
          <TableHead>Documents</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-muted-foreground">
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
                      {document.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{review.status}</Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
