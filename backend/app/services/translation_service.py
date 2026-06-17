import httpx
from app.core.config import settings

# DeepL Free API: api-free.deepl.com  |  Pro API: api.deepl.com
_DEEPL_URL = "https://api-free.deepl.com/v2/translate"


async def translate_ja_to_en(text: str) -> str:
    """Translate Japanese text to English via DeepL. Falls back to original if unconfigured."""
    if not text:
        return ""
    if not settings.DEEPL_API_KEY:
        return text

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                _DEEPL_URL,
                headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
                json={
                    "text": [text],
                    "source_lang": "JA",
                    "target_lang": "EN-US",
                },
            )
            resp.raise_for_status()
            return resp.json()["translations"][0]["text"]
    except Exception:
        return text  # graceful fallback: return original


async def translate_product(product) -> dict:
    """Return English title + description for eBay listing."""
    title_en = await translate_ja_to_en(product.name)

    parts = []
    if product.brand:
        parts.append(f"Brand: {product.brand}")
    if product.model_number:
        parts.append(f"Model: {product.model_number}")
    if product.condition_notes:
        parts.append(f"Condition: {product.condition_notes}")
    if product.accessories:
        parts.append(f"Included accessories: {product.accessories}")
    if product.description:
        parts.append(product.description)

    desc_ja = "\n".join(parts)
    desc_en = await translate_ja_to_en(desc_ja) if desc_ja else ""

    return {"title_en": title_en, "description_en": desc_en}
