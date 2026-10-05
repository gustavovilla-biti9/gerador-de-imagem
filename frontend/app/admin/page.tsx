import { AdminGalleryManager } from "@/components/admin/gallery-manager";
import { getGalleryImages, type GalleryImage } from "@/lib/gallery";

// Always reflect the latest gallery state — this page is behind the admin
// gate already, so there's no caching upside to prerendering it.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let images: GalleryImage[] = [];
  try {
    images = await getGalleryImages();
  } catch {
    images = [];
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-8">
      <main className="flex w-full max-w-4xl flex-col items-center gap-8">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Galeria de referência — admin
        </h1>
        <AdminGalleryManager initialImages={images} />
      </main>
    </div>
  );
}
