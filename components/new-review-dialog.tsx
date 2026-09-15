"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_ACCEPT_LABEL,
  notifyReviewsChanged,
} from "@/lib/reviews";
import { formatFileSize } from "@/lib/format";
import { fetchJson, getErrorMessage } from "@/lib/http";

export function NewReviewDialog() {
  const businessNameId = useId();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickingFilesRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;

    const handleCancel = (event: Event) => {
      pickingFilesRef.current = false;
      event.stopPropagation();
      setOpen(true);
    };

    input.addEventListener("cancel", handleCancel);
    return () => input.removeEventListener("cancel", handleCancel);
  }, []);

  function resetForm() {
    setBusinessName("");
    setFiles([]);
    setError(null);
    pickingFilesRef.current = false;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleOpenChange(
    nextOpen: boolean,
    details: DialogPrimitive.Root.ChangeEventDetails
  ) {
    // Keep the dialog mounted while the OS file picker is open. Otherwise the
    // file input unmounts and selected files never reach React state.
    if (
      !nextOpen &&
      (pickingFilesRef.current || details.reason === "focus-out")
    ) {
      details.cancel();
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  }

  function openFilePicker() {
    pickingFilesRef.current = true;
    queueMicrotask(() => {
      fileInputRef.current?.click();
    });
  }

  function handleFilesSelected(selected: FileList | null) {
    pickingFilesRef.current = false;
    if (!selected?.length) return;

    const selectedFiles = Array.from(selected);
    setFiles((current) => {
      const next = [...current];
      for (const file of selectedFiles) {
        const duplicate = next.some(
          (existing) =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );
        if (!duplicate) {
          next.push(file);
        }
      }
      return next;
    });
    setError(null);
    setOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = businessName.trim();
    if (!name) {
      setError("Enter a business name.");
      return;
    }
    if (files.length === 0) {
      setError("Upload at least one document.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("businessName", name);
      for (const file of files) {
        formData.append("files", file, file.name);
      }

      await fetchJson("/api/reviews", {
        method: "POST",
        body: formData,
      });

      notifyReviewsChanged();
      setOpen(false);
      resetForm();
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Failed to create review."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Keep outside DialogContent so it stays mounted during OS file picking. */}
      <input
        ref={fileInputRef}
        id={fileInputId}
        type="file"
        multiple
        accept={DOCUMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => handleFilesSelected(event.target.files)}
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={<Button />}>New review</DialogTrigger>
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>New review</DialogTitle>
              <DialogDescription>
                Add a business name and upload documents. Reviews are saved to
                Supabase with status new, and files go to document storage.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor={businessNameId}>Business name</Label>
              <Input
                id={businessNameId}
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Acme Corp"
                autoComplete="organization"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={fileInputId}>Documents</Label>
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-input bg-muted/30 px-4 py-6 text-center">
                <UploadIcon className="size-5 text-muted-foreground" />
                <div className="grid gap-1">
                  <span className="text-sm font-medium">
                    Upload one or more documents
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {DOCUMENT_ACCEPT_LABEL}
                  </span>
                </div>
                <Button type="button" variant="outline" onClick={openFilePicker}>
                  Choose files
                </Button>
              </div>

              {files.length > 0 ? (
                <ul className="grid max-h-40 gap-1 overflow-y-auto rounded-md border border-border p-2">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">
                          {file.name}
                        </p>
                        <p className="text-[0.625rem] text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => removeFile(index)}
                      >
                        <XIcon />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
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
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating…" : "Create review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
