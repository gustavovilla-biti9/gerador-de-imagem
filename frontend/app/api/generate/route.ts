import { ipAddress } from "@vercel/functions";
import { NextResponse } from "next/server";

import { BackendError, callBackend } from "@/lib/backend-client";
import { uploadImage } from "@/lib/blob";

interface GenerateResponse {
  image_url: string;
}

export const maxDuration = 300;

export async function POST(request: Request) {
  const formData = await request.formData();

  const selfie = formData.get("selfie");
  if (!(selfie instanceof File) || selfie.size === 0) {
    return NextResponse.json(
      { error: "Missing selfie image" },
      { status: 400 },
    );
  }

  const referenceFile = formData.get("referenceFile");
  const referenceImageUrl = formData.get("referenceImageUrl");
  const prompt = formData.get("prompt");

  let referenceUrl: string | null = null;

  if (referenceFile instanceof File && referenceFile.size > 0) {
    const uploaded = await uploadImage(
      `references/${crypto.randomUUID()}-${referenceFile.name}`,
      referenceFile,
    );
    referenceUrl = uploaded.url;
  } else if (
    typeof referenceImageUrl === "string" &&
    referenceImageUrl.length > 0
  ) {
    referenceUrl = referenceImageUrl;
  }

  if (!referenceUrl) {
    return NextResponse.json(
      { error: "Provide a reference image (upload or gallery selection)" },
      { status: 400 },
    );
  }

  const selfieUploaded = await uploadImage(
    `selfies/${crypto.randomUUID()}-${selfie.name}`,
    selfie,
  );

  try {
    const result = await callBackend<GenerateResponse>("/generate", {
      method: "POST",
      clientIp: ipAddress(request),
      body: {
        selfie_url: selfieUploaded.url,
        reference_url: referenceUrl,
        prompt:
          typeof prompt === "string" && prompt.length > 0
            ? prompt
            : undefined,
      },
    });

    return NextResponse.json({ imageUrl: result.image_url });
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Try again in a minute." },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: "Image generation failed" },
        { status: 502 },
      );
    }
    throw error;
  }
}
