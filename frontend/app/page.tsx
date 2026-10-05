import { GeneratorForm } from "@/components/generator-form";
import { getGalleryImages, type GalleryImage } from "@/lib/gallery";

// The gallery is managed live from /admin — never prerender this page
// statically, or newly added images wouldn't show up without a redeploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  let galleryImages: GalleryImage[] = [];
  try {
    galleryImages = await getGalleryImages();
  } catch {
    // The backend/database may not be provisioned yet (e.g. first local
    // run) — degrade to "upload your own reference" instead of crashing.
    galleryImages = [];
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black sm:px-8">
      <main className="flex w-full max-w-3xl flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Gerador de Imagem
          </h1>
          <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
            Envie uma selfie e escolha uma cena de referência — a IA recria o
            cenário mantendo o seu rosto.
          </p>
        </div>

        <GeneratorForm galleryImages={galleryImages} />
      </main>
    </div>
  );
}
