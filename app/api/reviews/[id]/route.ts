import { NextResponse } from "next/server";
import type { IdRouteContext } from "@/lib/api/route-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVIEW_DOCUMENTS_BUCKET } from "@/lib/supabase/env";

export async function DELETE(_request: Request, context: IdRouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("review_id", id);

    if (documentsError) {
      return NextResponse.json(
        { error: documentsError.message },
        { status: 500 }
      );
    }

    const storagePaths = (documents ?? [])
      .map((document) => document.storage_path)
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(REVIEW_DOCUMENTS_BUCKET)
        .remove(storagePaths);

      if (storageError) {
        return NextResponse.json(
          { error: storageError.message },
          { status: 500 }
        );
      }
    }

    const { data: deleted, error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    if (!deleted) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
