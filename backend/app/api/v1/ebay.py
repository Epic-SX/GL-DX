from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_gl, require_staff
from app.core.config import settings
from app.core.database import get_db
from app.models.channel import Channel, ChannelType, Listing, ListingStatus
from app.models.ebay_token import EbayToken
from app.models.product import Product
from app.models.user import User
from app.services import ebay_service, translation_service

router = APIRouter(prefix="/ebay", tags=["ebay"])


@router.get("/status")
async def ebay_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if eBay OAuth is connected."""
    token = db.query(EbayToken).filter(EbayToken.is_active == True).first()
    configured = bool(settings.EBAY_APP_ID and settings.EBAY_CERT_ID)
    if not token or not token.refresh_token:
        return {"connected": False, "configured": configured}
    return {
        "connected": True,
        "configured": configured,
        "refresh_token_expires_at": token.refresh_token_expires_at,
    }


@router.get("/auth/url")
async def get_ebay_auth_url(current_user: User = Depends(require_gl)):
    """Get the eBay OAuth consent URL (GL admin only)."""
    if not settings.EBAY_APP_ID:
        raise HTTPException(400, "EBAY_APP_ID が .env に未設定です")
    return {"url": ebay_service.get_auth_url()}


@router.get("/auth/callback")
async def ebay_auth_callback(
    code: str,
    db: Session = Depends(get_db),
):
    """eBay redirects here after user consents. Exchanges code for tokens."""
    try:
        await ebay_service.exchange_code_for_tokens(code, db)
        return {"status": "connected", "message": "eBay OAuth 認証が完了しました。このタブを閉じてください。"}
    except Exception as e:
        raise HTTPException(400, f"eBay認証エラー: {str(e)}")


@router.get("/policies")
async def get_ebay_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_gl),
):
    """Fetch eBay account policy IDs (run once after OAuth to copy IDs into .env)."""
    token = await ebay_service.get_valid_access_token(db)
    if not token:
        raise HTTPException(400, "eBayが未連携です")
    return await ebay_service.get_account_policies(token)


@router.get("/translate/{product_id}")
async def preview_translation(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview auto-translated English title + description for eBay."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "商品が見つかりません")
    translated = await translation_service.translate_product(product)
    return {
        "title_ja": product.name,
        "title_en": translated["title_en"],
        "description_en": translated["description_en"],
        "deepl_configured": bool(settings.DEEPL_API_KEY),
    }


class EbayListRequest(BaseModel):
    usd_price: float


@router.post("/list/{product_id}")
async def list_on_ebay(
    product_id: int,
    data: EbayListRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Translate product and publish it to eBay (EBAY_US marketplace)."""
    if data.usd_price <= 0:
        raise HTTPException(400, "USD価格を入力してください")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "商品が見つかりません")

    access_token = await ebay_service.get_valid_access_token(db)
    if not access_token:
        raise HTTPException(400, "eBayが未連携です。OAuth認証を先に完了してください。")

    translated = await translation_service.translate_product(product)

    await ebay_service.create_inventory_item(
        access_token, product,
        translated["title_en"], translated["description_en"],
    )

    result = await ebay_service.create_and_publish_offer(
        access_token, product,
        data.usd_price, translated["description_en"],
    )

    ebay_ch = db.query(Channel).filter(Channel.channel_type == ChannelType.ebay).first()
    if ebay_ch:
        listing = Listing(
            product_id=product.id,
            channel_id=ebay_ch.id,
            external_id=result.get("listing_id"),
            status=ListingStatus.active,
            listed_price=int(data.usd_price * 100),  # USD cents
            listed_at=datetime.utcnow(),
        )
        db.add(listing)
        db.commit()

    return {
        "status": "listed",
        "listing_id": result.get("listing_id"),
        "listing_url": result.get("listing_url"),
        "title_en": translated["title_en"],
    }


@router.post("/sync/orders")
async def sync_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_gl),
):
    """Pull recent eBay orders (GL admin only)."""
    access_token = await ebay_service.get_valid_access_token(db)
    if not access_token:
        raise HTTPException(400, "eBayが未連携です")
    orders = await ebay_service.sync_ebay_orders(access_token)
    return {"synced": len(orders), "orders": orders}
