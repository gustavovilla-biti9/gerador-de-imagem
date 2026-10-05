import replicate

from core.config import get_settings

MODEL = "google/nano-banana"

DEFAULT_PROMPT = (
    "Apply the face and identity from the first image onto the person in the "
    "second image. Keep the second image's background, pose, outfit, lighting "
    "and composition identical. Preserve the facial identity, features and "
    "characteristics from the first image exactly — do not alter them."
)


async def generate_image(
    selfie_url: str, reference_url: str, prompt: str | None = None
) -> str:
    settings = get_settings()
    client = replicate.Client(api_token=settings.replicate_api_token)

    output = await client.async_run(
        MODEL,
        input={
            "image_input": [selfie_url, reference_url],
            "prompt": prompt or DEFAULT_PROMPT,
        },
    )

    if isinstance(output, list):
        return str(output[0])
    return str(output)
