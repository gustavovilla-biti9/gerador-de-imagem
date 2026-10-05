"use client";

import { useState } from "react";
import Image from "next/image";

import type { GalleryImage } from "@/lib/gallery";

interface AdminGalleryManagerProps {
  initialImages: GalleryImage[];
}

function sortImages(images: GalleryImage[]): GalleryImage[] {
  return [...images].sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.sort_order - b.sort_order,
  );
}

export function AdminGalleryManager({
  initialImages,
}: AdminGalleryManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>(
    sortImages(initialImages),
  );

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !category || !title) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("category", category);
    formData.set("title", title);
    formData.set("sortOrder", sortOrder);

    try {
      const response = await fetch("/api/admin/images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Falha ao salvar a imagem.");
      }

      const data = (await response.json()) as GalleryImage;
      setImages((prev) => sortImages([...prev, data]));
      setFile(null);
      setCategory("");
      setTitle("");
      setSortOrder("0");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(image: GalleryImage) {
    setEditingId(image.id);
    setEditCategory(image.category);
    setEditTitle(image.title);
    setEditSortOrder(String(image.sort_order));
  }

  async function handleSaveEdit(image: GalleryImage) {
    const response = await fetch(`/api/admin/images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: editCategory,
        title: editTitle,
        sortOrder: Number(editSortOrder),
      }),
    });

    if (!response.ok) return;

    const updated = (await response.json()) as GalleryImage;
    setImages((prev) =>
      sortImages(prev.map((item) => (item.id === updated.id ? updated : item))),
    );
    setEditingId(null);
  }

  async function handleDelete(image: GalleryImage) {
    const response = await fetch(
      `/api/admin/images/${image.id}?url=${encodeURIComponent(image.url)}`,
      { method: "DELETE" },
    );

    if (response.ok || response.status === 204) {
      setImages((prev) => prev.filter((item) => item.id !== image.id));
    }
  }

  const byCategory = images.reduce<Record<string, GalleryImage[]>>(
    (acc, image) => {
      acc[image.category] = acc[image.category] ?? [];
      acc[image.category].push(image);
      return acc;
    },
    {},
  );

  return (
    <div className="flex w-full max-w-4xl flex-col gap-10">
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 className="font-medium text-black dark:text-zinc-50">
          Nova imagem de referência
        </h2>
        <input
          type="file"
          name="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Categoria (ex: esporte)"
            className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          />
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título"
            className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          />
          <input
            type="number"
            name="sortOrder"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            placeholder="Ordem"
            className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={uploading || !file || !category || !title}
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? "Enviando..." : "Adicionar"}
        </button>
      </form>

      {Object.entries(byCategory).map(([categoryName, categoryImages]) => (
        <div key={categoryName} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {categoryName}
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categoryImages.map((image) => (
              <div
                key={image.id}
                className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-md">
                  <Image
                    src={image.url}
                    alt={image.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>

                {editingId === image.id ? (
                  <div className="flex flex-col gap-1">
                    <input
                      name={`edit-category-${image.id}`}
                      value={editCategory}
                      onChange={(event) =>
                        setEditCategory(event.target.value)
                      }
                      className="rounded border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
                    />
                    <input
                      name={`edit-title-${image.id}`}
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="rounded border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
                    />
                    <input
                      type="number"
                      name={`edit-sort-order-${image.id}`}
                      value={editSortOrder}
                      onChange={(event) =>
                        setEditSortOrder(event.target.value)
                      }
                      className="rounded border border-zinc-300 bg-transparent px-2 py-1 text-xs dark:border-zinc-700"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(image)}
                        className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                      {image.title}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(image)}
                        className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(image)}
                        className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400"
                      >
                        Remover
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {images.length === 0 && (
        <p className="text-sm text-zinc-500">
          Nenhuma imagem cadastrada ainda.
        </p>
      )}
    </div>
  );
}
