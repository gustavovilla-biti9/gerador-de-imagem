"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { ImagePicker } from "@/components/image-picker";
import type { GalleryImage } from "@/lib/gallery";

interface GeneratorFormProps {
  galleryImages: GalleryImage[];
}

type ReferenceMode = "gallery" | "upload";
type Status = "idle" | "loading" | "error";

export function GeneratorForm({ galleryImages }: GeneratorFormProps) {
  const categories = useMemo(
    () => Array.from(new Set(galleryImages.map((image) => image.category))),
    [galleryImages],
  );

  const [selfie, setSelfie] = useState<File | null>(null);
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>(
    galleryImages.length > 0 ? "gallery" : "upload",
  );
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] =
    useState<GalleryImage | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0] ?? null,
  );

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const visibleGalleryImages = activeCategory
    ? galleryImages.filter((image) => image.category === activeCategory)
    : galleryImages;

  const canGenerate =
    selfie !== null &&
    (referenceMode === "upload"
      ? referenceFile !== null
      : selectedGalleryImage !== null);

  async function handleGenerate() {
    if (!selfie) return;

    setStatus("loading");
    setErrorMessage(null);
    setResultUrl(null);

    const formData = new FormData();
    formData.set("selfie", selfie);

    if (referenceMode === "upload" && referenceFile) {
      formData.set("referenceFile", referenceFile);
    } else if (referenceMode === "gallery" && selectedGalleryImage) {
      formData.set("referenceImageUrl", selectedGalleryImage.url);
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Falha ao gerar a imagem.");
      }

      const data = await response.json();
      setResultUrl(data.imageUrl);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Falha ao gerar a imagem.",
      );
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ImagePicker label="Sua selfie" file={selfie} onChange={setSelfie} />

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Imagem de referência
          </span>

          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setReferenceMode("gallery")}
              disabled={galleryImages.length === 0}
              className={`rounded-full px-3 py-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                referenceMode === "gallery"
                  ? "bg-foreground text-background"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              Escolher da galeria
            </button>
            <button
              type="button"
              onClick={() => setReferenceMode("upload")}
              className={`rounded-full px-3 py-1 transition ${
                referenceMode === "upload"
                  ? "bg-foreground text-background"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              Enviar minha própria
            </button>
          </div>

          {referenceMode === "upload" ? (
            <ImagePicker
              label=""
              file={referenceFile}
              onChange={setReferenceFile}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`rounded-full px-3 py-1 transition ${
                        activeCategory === category
                          ? "bg-foreground text-background"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {visibleGalleryImages.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedGalleryImage(image)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                      selectedGalleryImage?.id === image.id
                        ? "border-foreground"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.title}
                      fill
                      sizes="(max-width: 640px) 33vw, 160px"
                      className="object-cover"
                    />
                  </button>
                ))}
                {visibleGalleryImages.length === 0 && (
                  <p className="col-span-3 text-sm text-zinc-500">
                    Nenhuma imagem cadastrada nesta categoria ainda.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate || status === "loading"}
        className="rounded-full bg-foreground px-6 py-3 text-center font-medium text-background transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "loading" ? "Gerando..." : "Gerar imagem"}
      </button>

      {errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      {resultUrl && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="relative h-[360px] w-full max-w-md">
            <Image
              src={resultUrl}
              alt="Resultado gerado"
              fill
              sizes="(max-width: 640px) 100vw, 480px"
              className="rounded-lg object-contain"
            />
          </div>
          <a
            href={`/api/download?url=${encodeURIComponent(resultUrl)}`}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
          >
            Baixar imagem
          </a>
        </div>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        A IA recria a cena da referência (fundo, pose, estilo) preservando o
        rosto enviado — o resultado fica muito próximo da referência, mas não
        é uma cópia pixel a pixel.
      </p>
    </div>
  );
}
