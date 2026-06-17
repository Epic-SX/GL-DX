import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

# Import all models so Alembic/SQLAlchemy can detect them
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (dev only; use Alembic in production)
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)
        _seed_default_data()
    yield


def _seed_default_data():
    """初期データ投入: 管理者アカウントとチャネルマスタ"""
    from app.core.database import SessionLocal
    from app.core.security import hash_password
    from app.models.user import User, UserRole
    from app.models.channel import Channel, ChannelType

    db = SessionLocal()
    try:
        if not db.query(User).first():
            admin = User(
                email="admin@growlog.jp",
                name="GL管理者",
                password_hash=hash_password("admin1234"),
                role=UserRole.gl,
            )
            db.add(admin)

        channels_data = [
            (ChannelType.yahoo_auction, "ヤフオク", 8.8),
            (ChannelType.mercari, "メルカリShops", 10.0),
            (ChannelType.amazon, "Amazon", 15.0),
            (ChannelType.rakuten, "楽天市場", 10.0),
            (ChannelType.shopify, "自社EC (Shopify)", 0.0),
            (ChannelType.wholesale, "卸販売", 0.0),
            (ChannelType.store, "店舗販売", 0.0),
            (ChannelType.ebay, "eBay（海外）", 12.55),
            (ChannelType.aucnet, "オークネット", 5.0),
            (ChannelType.rk_auction, "RKオークション", 5.0),
            (ChannelType.overseas_auction, "その他海外オークション", 5.0),
            (ChannelType.hp, "自社HP", 0.0),
        ]
        for ch_type, name, fee in channels_data:
            if not db.query(Channel).filter(Channel.channel_type == ch_type).first():
                db.add(Channel(channel_type=ch_type, name=name, fee_rate=fee))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()


app = FastAPI(
    title="GL DX Management System",
    description="中古品買取店向け一括管理システム",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
upload_dir = settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
