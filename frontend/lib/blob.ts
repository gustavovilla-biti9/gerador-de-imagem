import "server-only";

import { del, put, type PutBlobResult } from "@vercel/blob";

export async function uploadImage(
  pathname: string,
  file: File | Blob,
): Promise<PutBlobResult> {
  return put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
  });
}

export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
