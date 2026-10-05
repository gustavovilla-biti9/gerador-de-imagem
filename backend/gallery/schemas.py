from pydantic import BaseModel, ConfigDict


class ReferenceImageBase(BaseModel):
    url: str
    category: str
    title: str
    sort_order: int = 0


class ReferenceImageCreate(ReferenceImageBase):
    pass


class ReferenceImageUpdate(BaseModel):
    category: str | None = None
    title: str | None = None
    sort_order: int | None = None


class ReferenceImageOut(ReferenceImageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
