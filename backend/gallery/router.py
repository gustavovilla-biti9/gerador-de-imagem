from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_session
from gallery import service
from gallery.schemas import (
    ReferenceImageCreate,
    ReferenceImageOut,
    ReferenceImageUpdate,
)

router = APIRouter(tags=["gallery"])


@router.get("/gallery", response_model=list[ReferenceImageOut])
async def list_gallery(
    category: str | None = None, session: AsyncSession = Depends(get_session)
) -> list[ReferenceImageOut]:
    images = await service.list_images(session, category)
    return [ReferenceImageOut.model_validate(image) for image in images]


@router.post(
    "/admin/images",
    response_model=ReferenceImageOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_gallery_image(
    payload: ReferenceImageCreate, session: AsyncSession = Depends(get_session)
) -> ReferenceImageOut:
    image = await service.create_image(session, payload)
    return ReferenceImageOut.model_validate(image)


@router.patch("/admin/images/{image_id}", response_model=ReferenceImageOut)
async def update_gallery_image(
    image_id: int,
    payload: ReferenceImageUpdate,
    session: AsyncSession = Depends(get_session),
) -> ReferenceImageOut:
    image = await service.update_image(session, image_id, payload)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
        )
    return ReferenceImageOut.model_validate(image)


@router.delete("/admin/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_image(
    image_id: int, session: AsyncSession = Depends(get_session)
) -> None:
    deleted = await service.delete_image(session, image_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found"
        )
