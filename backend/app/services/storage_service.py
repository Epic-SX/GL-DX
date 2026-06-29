"""Storage abstraction layer.

Persists files either to the local filesystem (development) or to AWS S3
(production), selected by ``settings.STORAGE_TYPE`` ("local" | "s3").

Public API:
    save_bytes(content, key, content_type) -> str   # returns a public URL
"""
import os
from functools import lru_cache
from app.core.config import settings


@lru_cache(maxsize=1)
def _s3_client():
    import boto3

    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
    )


def save_bytes(content: bytes, key: str, content_type: str = "application/octet-stream") -> str:
    """Persist ``content`` under ``key`` (e.g. ``products/12/uuid.jpg``).

    Returns a public URL: an absolute ``https://...`` S3 URL when STORAGE_TYPE
    is "s3", otherwise a ``/uploads/...`` path served by the app.
    """
    key = key.lstrip("/")

    if settings.STORAGE_TYPE == "s3":
        _s3_client().put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"

    # Local filesystem fallback
    filepath = os.path.join(settings.UPLOAD_DIR, key)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(content)
    return f"/uploads/{key}"
