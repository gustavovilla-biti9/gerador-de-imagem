from fastapi import FastAPI

from generation.router import router as generation_router
from gallery.router import router as gallery_router

# This service has no public rewrite in vercel.json, so it is only reachable
# via the "backend" service binding declared by the frontend service — never
# directly from the internet. No CORS/auth layer is needed here for that
# reason; see vercel.json + docs/services/bindings.
app = FastAPI(title="Gerador de Imagem — Backend")

app.include_router(generation_router)
app.include_router(gallery_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
