"""
eBay Sell API integration
OAuth 2.0 + Inventory API + Offer API + Fulfillment API

Setup steps:
1. Register app at https://developer.ebay.com/
2. Set EBAY_APP_ID, EBAY_CERT_ID, EBAY_DEV_ID, EBAY_REDIRECT_URI in .env
3. Visit GET /api/v1/ebay/auth/url → open the returned URL in browser to authorize
4. eBay redirects to /api/v1/ebay/auth/callback → tokens stored in DB
5. After OAuth, fetch policy IDs via eBay account API and set in .env
"""
import base64
from datetime import datetime, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ebay_token import EbayToken
from app.models.product import Product, ProductCondition

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_AUTH_URL = "https://auth.ebay.com/oauth2/authorize"
_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token"
_API = "https://api.ebay.com"

_SCOPES = " ".join([
    "https://api.ebay.com/oauth/api_scope/sell.inventory",
    "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
    "https://api.ebay.com/oauth/api_scope/sell.account",
])

_CONDITION_MAP = {
    ProductCondition.S: "NEW",
    ProductCondition.A: "LIKE_NEW",
    ProductCondition.B: "VERY_GOOD",
    ProductCondition.C: "GOOD",
    ProductCondition.D: "ACCEPTABLE",
}

# eBay category IDs for common second-hand goods
_CATEGORY_MAP = {
    "カメラ": "625", "デジタルカメラ": "625",
    "スマートフォン": "15032", "スマホ": "15032", "iphone": "15032",
    "ゲーム": "1249", "ゲームソフト": "1249",
    "腕時計": "14324", "時計": "14324",
    "バッグ": "169291", "鞄": "169291",
    "アパレル": "11450", "服": "11450",
    "本": "267", "書籍": "267",
    "レコード": "176985", "cd": "176985",
}
_DEFAULT_CATEGORY = "293"  # Consumer Electronics


# ---------------------------------------------------------------------------
# OAuth helpers
# ---------------------------------------------------------------------------

def get_auth_url() -> str:
    """Return the eBay consent page URL. Admin opens this to authorize the app."""
    import urllib.parse
    params = {
        "client_id": settings.EBAY_APP_ID,
        "response_type": "code",
        "redirect_uri": settings.EBAY_REDIRECT_URI,
        "scope": _SCOPES,
    }
    return f"{_AUTH_URL}?{urllib.parse.urlencode(params)}"


def _basic_auth() -> str:
    creds = f"{settings.EBAY_APP_ID}:{settings.EBAY_CERT_ID}"
    return base64.b64encode(creds.encode()).decode()


async def exchange_code_for_tokens(code: str, db: Session) -> EbayToken:
    """Exchange one-time auth code for access + refresh tokens; persist in DB."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            _TOKEN_URL,
            headers={
                "Authorization": f"Basic {_basic_auth()}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.EBAY_REDIRECT_URI,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    now = datetime.utcnow()
    token = db.query(EbayToken).first() or EbayToken()
    token.access_token = data["access_token"]
    token.refresh_token = data.get("refresh_token")
    token.access_token_expires_at = now + timedelta(seconds=data.get("expires_in", 7200))
    token.refresh_token_expires_at = now + timedelta(seconds=data.get("refresh_token_expires_in", 47304000))
    token.is_active = True
    db.add(token)
    db.commit()
    db.refresh(token)
    return token


async def get_valid_access_token(db: Session) -> Optional[str]:
    """Return a valid access token, refreshing automatically if needed."""
    token = db.query(EbayToken).filter(EbayToken.is_active == True).first()
    if not token or not token.refresh_token:
        return None

    now = datetime.utcnow()
    buffer = timedelta(minutes=5)

    if token.access_token and token.access_token_expires_at:
        if token.access_token_expires_at > now + buffer:
            return token.access_token

    # Refresh
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            _TOKEN_URL,
            headers={
                "Authorization": f"Basic {_basic_auth()}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "refresh_token",
                "refresh_token": token.refresh_token,
                "scope": _SCOPES,
            },
        )
        if resp.status_code != 200:
            return None
        data = resp.json()

    token.access_token = data["access_token"]
    token.access_token_expires_at = now + timedelta(seconds=data.get("expires_in", 7200))
    db.commit()
    return token.access_token


# ---------------------------------------------------------------------------
# Inventory + Offer API
# ---------------------------------------------------------------------------

def _guess_category(product: Product) -> str:
    text = f"{product.category or ''} {product.subcategory or ''} {product.name or ''}".lower()
    for keyword, cat_id in _CATEGORY_MAP.items():
        if keyword.lower() in text:
            return cat_id
    return _DEFAULT_CATEGORY


async def create_inventory_item(
    access_token: str,
    product: Product,
    title_en: str,
    description_en: str,
) -> None:
    """PUT /sell/inventory/v1/inventory_item/{sku} — create or update item."""
    condition = _CONDITION_MAP.get(product.condition, "GOOD")

    body: dict = {
        "product": {
            "title": title_en[:80],
            "description": f"<p>{description_en}</p>",
            "aspects": {},
        },
        "condition": condition,
        "conditionDescription": product.condition_notes or "",
        "availability": {
            "shipToLocationAvailability": {
                "quantity": max(1, product.stock_quantity or 1)
            }
        },
    }

    if product.brand:
        body["product"]["aspects"]["Brand"] = [product.brand]
    if product.weight_g:
        body["packageWeightAndSize"] = {
            "weight": {"unit": "GRAM", "value": product.weight_g}
        }

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.put(
            f"{_API}/sell/inventory/v1/inventory_item/{product.sku}",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Content-Language": "en-US",
            },
            json=body,
        )
        if resp.status_code not in (200, 204):
            raise ValueError(f"eBay inventory error {resp.status_code}: {resp.text}")


async def create_and_publish_offer(
    access_token: str,
    product: Product,
    usd_price: float,
    description_en: str,
) -> dict:
    """Create an offer and publish it. Returns listing_id and listing_url."""
    offer_body: dict = {
        "sku": product.sku,
        "marketplaceId": "EBAY_US",
        "format": "FIXED_PRICE",
        "availableQuantity": 1,
        "categoryId": _guess_category(product),
        "listingDescription": f"<p>{description_en}</p>",
        "pricingSummary": {
            "price": {"currency": "USD", "value": f"{usd_price:.2f}"}
        },
        "includeCatalogProductDetails": False,
    }

    # Attach account policies if configured
    policies = {}
    if settings.EBAY_FULFILLMENT_POLICY_ID:
        policies["fulfillmentPolicyId"] = settings.EBAY_FULFILLMENT_POLICY_ID
    if settings.EBAY_PAYMENT_POLICY_ID:
        policies["paymentPolicyId"] = settings.EBAY_PAYMENT_POLICY_ID
    if settings.EBAY_RETURN_POLICY_ID:
        policies["returnPolicyId"] = settings.EBAY_RETURN_POLICY_ID
    if policies:
        offer_body["listingPolicies"] = policies

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Content-Language": "en-US",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        # 1. Create offer
        r1 = await client.post(
            f"{_API}/sell/inventory/v1/offer",
            headers=headers,
            json=offer_body,
        )
        if r1.status_code not in (200, 201):
            raise ValueError(f"eBay offer create error {r1.status_code}: {r1.text}")
        offer_id = r1.json().get("offerId")

        # 2. Publish offer → becomes live listing
        r2 = await client.post(
            f"{_API}/sell/inventory/v1/offer/{offer_id}/publish",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if r2.status_code not in (200, 201):
            raise ValueError(f"eBay publish error {r2.status_code}: {r2.text}")
        listing_id = r2.json().get("listingId")

    return {
        "offer_id": offer_id,
        "listing_id": listing_id,
        "listing_url": f"https://www.ebay.com/itm/{listing_id}" if listing_id else None,
    }


# ---------------------------------------------------------------------------
# Order sync
# ---------------------------------------------------------------------------

async def sync_ebay_orders(access_token: str) -> list:
    """Fetch recent eBay orders (last 90 days)."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            f"{_API}/sell/fulfillment/v1/order",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"limit": 50},
        )
        if resp.status_code != 200:
            return []
        return resp.json().get("orders", [])


async def get_account_policies(access_token: str) -> dict:
    """Helper: fetch fulfillment/payment/return policy IDs for initial setup."""
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        fp = await client.get(f"{_API}/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US", headers=headers)
        pp = await client.get(f"{_API}/sell/account/v1/payment_policy?marketplace_id=EBAY_US", headers=headers)
        rp = await client.get(f"{_API}/sell/account/v1/return_policy?marketplace_id=EBAY_US", headers=headers)
    return {
        "fulfillment_policies": fp.json() if fp.status_code == 200 else {},
        "payment_policies": pp.json() if pp.status_code == 200 else {},
        "return_policies": rp.json() if rp.status_code == 200 else {},
    }
