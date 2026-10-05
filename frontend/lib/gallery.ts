import "server-only";

import { callBackend } from "@/lib/backend-client";

export interface GalleryImage {
  id: number;
  url: string;
  category: string;
  title: string;
  sort_order: number;
}

export async function getGalleryImages(
  category?: string,
): Promise<GalleryImage[]> {
  return callBackend<GalleryImage[]>("/gallery", {
    searchParams: { category },
  });
}
