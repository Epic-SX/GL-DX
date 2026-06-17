from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "GL DX Management System"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = "postgresql://gl_user:gl_password@localhost:5432/gl_dx"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Storage
    STORAGE_TYPE: str = "local"
    UPLOAD_DIR: str = "uploads"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "ap-northeast-1"

    # EC Channels
    YAHOO_AUCTION_CLIENT_ID: str = ""
    YAHOO_AUCTION_CLIENT_SECRET: str = ""
    MERCARI_API_KEY: str = ""
    AMAZON_ACCESS_KEY: str = ""
    AMAZON_SECRET_KEY: str = ""
    AMAZON_SELLER_ID: str = ""
    RAKUTEN_SERVICE_SECRET: str = ""
    RAKUTEN_LICENSE_KEY: str = ""

    # eBay Developer (https://developer.ebay.com/)
    EBAY_APP_ID: str = ""        # Client ID
    EBAY_CERT_ID: str = ""       # Client Secret
    EBAY_DEV_ID: str = ""        # Dev ID
    EBAY_REDIRECT_URI: str = "http://localhost:8000/api/v1/ebay/auth/callback"
    # eBay account-level policy IDs (fetch from eBay after OAuth setup)
    EBAY_FULFILLMENT_POLICY_ID: str = ""
    EBAY_PAYMENT_POLICY_ID: str = ""
    EBAY_RETURN_POLICY_ID: str = ""

    # DeepL Translation (https://www.deepl.com/pro-api)
    DEEPL_API_KEY: str = ""      # Free tier: 500,000 chars/month

    # Sagawa
    SAGAWA_CLIENT_CODE: str = ""
    SAGAWA_API_KEY: str = ""

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
