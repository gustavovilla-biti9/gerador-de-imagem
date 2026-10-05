from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from gallery.models import ReferenceImage
from gallery.schemas import ReferenceImageCreate, ReferenceImageUpdate


async def list_images(
    session: AsyncSession, category: str | None = None
) -> list[ReferenceImage]:
    stmt = select(ReferenceImage).order_by(
        ReferenceImage.category, ReferenceImage.sort_order
    )
    if category:
        stmt = stmt.where(ReferenceImage.category == category)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def create_image(
    session: AsyncSession, payload: ReferenceImageCreate
) -> ReferenceImage:
    image = ReferenceImage(**payload.model_dump())
    session.add(image)
    await session.commit()
    await session.refresh(image)
    return image


async def update_image(
    session: AsyncSession, image_id: int, payload: ReferenceImageUpdate
) -> ReferenceImage | None:
    values = {k: v for k, v in payload.model_dump().items() if v is not None}
    if values:
        await session.execute(
            update(ReferenceImage)
            .where(ReferenceImage.id == image_id)
            .values(**values)
        )
        await session.commit()
    return await session.get(ReferenceImage, image_id)


async def delete_image(session: AsyncSession, image_id: int) -> bool:
    result = await session.execute(
        delete(ReferenceImage).where(ReferenceImage.id == image_id)
    )
    await session.commit()
    return result.rowcount > 0
