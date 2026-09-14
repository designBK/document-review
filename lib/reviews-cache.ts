"use client";

import { useSyncExternalStore } from "react";
import type { CachedDocument, Review } from "@/lib/reviews";

let reviews: Review[] = [];
const EMPTY_REVIEWS: Review[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return reviews;
}

function getServerSnapshot() {
  return EMPTY_REVIEWS;
}

export function useReviewsCache() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function createReview(input: {
  businessName: string;
  files: File[];
}): Review {
  const documents: CachedDocument[] = input.files.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    lastModified: file.lastModified,
    file,
  }));

  const review: Review = {
    id: crypto.randomUUID(),
    businessName: input.businessName.trim(),
    status: "new",
    documents,
    createdAt: new Date().toISOString(),
  };

  reviews = [review, ...reviews];
  emit();
  return review;
}
