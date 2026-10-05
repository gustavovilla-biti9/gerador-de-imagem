import { NextResponse } from "next/server";

import { callBackend } from "@/lib/backend-client";
import { uploadImage } from "@/lib/blob";
import type { GalleryImage } from "@/lib/gallery";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const category = formData.get("category");
  const title = formData.get("title");
  const sortOrder = formData.get("sortOrder");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }
  if (typeof category !== "string" || !category) {
    return NextResponse.json({ error: "Missing category" }, { status: 400 });
  }
  if (typeof title !== "string" || !title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const uploaded = await uploadImage(
    `gallery/${category}/${crypto.randomUUID()}-${file.name}`,
    file,
  );

  const image = await callBackend<GalleryImage>("/admin/images", {
    method: "POST",
    body: {
      url: uploaded.url,
      category,
      title,
      sort_order:
        typeof sortOrder === "string" && sortOrder ? Number(sortOrder) : 0,
    },
  });

  return NextResponse.json(image, { status: 201 });
}
