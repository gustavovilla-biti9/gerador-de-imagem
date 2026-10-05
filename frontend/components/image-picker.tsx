"use client";

import { useEffect, useMemo, useRef } from "react";

interface ImagePickerProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

export function ImagePicker({ label, file, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {previewUrl ? (
          // Local object URL preview — next/image can't optimize blob: URLs,
          // and there's nothing to gain optimizing a preview of the user's
          // own just-picked file.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={label || "Imagem selecionada"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="px-4 text-center text-sm text-zinc-500">
            Clique para enviar uma foto
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        name={label ? label.toLowerCase().replace(/\s+/g, "-") : "reference"}
        accept="image/*"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}
