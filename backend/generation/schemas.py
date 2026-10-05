from pydantic import BaseModel, HttpUrl


class GenerateRequest(BaseModel):
    selfie_url: HttpUrl
    reference_url: HttpUrl
    prompt: str | None = None


class GenerateResponse(BaseModel):
    image_url: str
