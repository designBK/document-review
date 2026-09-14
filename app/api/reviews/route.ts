import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVIEW_DOCUMENTS_BUCKET } from "@/lib/supabase/env";
import { mapReview } from "@/lib/reviews-mapper";

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
}

function getUploadFiles(formData: FormData) {
  return formData.getAll("files").flatMap((value) => {
    if (!(value instanceof Blob) || value.size <= 0) {
      return [];
    }

    const fileName =
      value instanceof File && value.name
        ? value.name
        : "upload.bin";

    return [
      {
        blob: value,
        fileName,
        mimeType: value.type || "application/octet-stream",
        sizeBytes: value.size,
      },
    ];
  });
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        business_name,
        status,
        created_at,
        updated_at,
        documents (
          id,
          file_name,
          mime_type,
          size_bytes,
          storage_path,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      reviews: (data ?? []).map(mapReview),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load reviews";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const businessName = String(formData.get("businessName") ?? "").trim();
    const files = getUploadFiles(formData);

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name is required." },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Upload at least one document." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        business_name: businessName,
        status: "new",
      })
      .select("id, business_name, status, created_at, updated_at")
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: reviewError?.message ?? "Failed to create review." },
        { status: 500 }
      );
    }

    const uploadedPaths: string[] = [];
    const documentRows: {
      id: string;
      review_id: string;
      file_name: string;
      mime_type: string;
      size_bytes: number;
      storage_path: string;
    }[] = [];

    try {
      for (const file of files) {
        const documentId = crypto.randomUUID();
        const storagePath = `${review.id}/${documentId}/${sanitizeFileName(file.fileName)}`;
        const bytes = Buffer.from(await file.blob.arrayBuffer());

        const { error: uploadError } = await supabase.storage
          .from(REVIEW_DOCUMENTS_BUCKET)
          .upload(storagePath, bytes, {
            contentType: file.mimeType,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        uploadedPaths.push(storagePath);
        documentRows.push({
          id: documentId,
          review_id: review.id,
          file_name: file.fileName,
          mime_type: file.mimeType,
          size_bytes: file.sizeBytes,
          storage_path: storagePath,
        });
      }

      const { data: documents, error: documentsError } = await supabase
        .from("documents")
        .insert(documentRows)
        .select(
          "id, file_name, mime_type, size_bytes, storage_path, created_at"
        );

      if (documentsError || !documents) {
        throw new Error(documentsError?.message ?? "Failed to save documents.");
      }

      return NextResponse.json(
        {
          review: mapReview({
            ...review,
            documents,
          }),
        },
        { status: 201 }
      );
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from(REVIEW_DOCUMENTS_BUCKET)
          .remove(uploadedPaths);
      }
      await supabase.from("reviews").delete().eq("id", review.id);

      const message =
        error instanceof Error ? error.message : "Failed to upload documents";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
