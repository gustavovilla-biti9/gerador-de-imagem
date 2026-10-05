from fastapi import APIRouter, Depends

from core.rate_limit import enforce_rate_limit
from generation.schemas import GenerateRequest, GenerateResponse
from generation.service import generate_image

router = APIRouter(tags=["generation"])


@router.post(
    "/generate",
    response_model=GenerateResponse,
    dependencies=[Depends(enforce_rate_limit)],
)
async def generate(payload: GenerateRequest) -> GenerateResponse:
    image_url = await generate_image(
        selfie_url=str(payload.selfie_url),
        reference_url=str(payload.reference_url),
        prompt=payload.prompt,
    )
    return GenerateResponse(image_url=image_url)
