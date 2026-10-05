import { NextResponse } from "next/server";

import { BackendError, callBackend } from "@/lib/backend-client";
import { deleteImage } from "@/lib/blob";
import type { GalleryImage } from "@/lib/gallery";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates: Record<string, unknown> = {};
  if (typeof body.category === "string") updates.category = body.category;
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.sortOrder === "number") updates.sort_order = body.sortOrder;

  try {
    const image = await callBackend<GalleryImage>(`/admin/images/${id}`, {
      method: "PATCH",
      body: updates,
    });
    return NextResponse.json(image);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const blobUrl = searchParams.get("url");

  try {
    await callBackend<void>(`/admin/images/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    throw error;
  }

  if (blobUrl) {
    // Metadata is already gone at this point; a leftover Blob file isn't
    // worth failing the request over, so this cleanup is best-effort.
    await deleteImage(blobUrl).catch(() => {});
  }

  return new NextResponse(null, { status: 204 });
}
