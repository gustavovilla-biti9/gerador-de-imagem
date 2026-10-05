import { NextResponse } from "next/server";

import { getGalleryImages } from "@/lib/gallery";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;

  const images = await getGalleryImages(category);
  return NextResponse.json(images);
}
