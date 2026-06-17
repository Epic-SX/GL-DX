from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class ChannelType(str, enum.Enum):
    yahoo_auction = "yahoo_auction"     # ヤフオク
    mercari = "mercari"                 # メルカリShops
    amazon = "amazon"                   # Amazon
    rakuten = "rakuten"                 # 楽天市場
    rakuten_rakuma = "rakuten_rakuma"   # ラクマ
    shopify = "shopify"                 # Shopify自社EC
    wholesale = "wholesale"             # 卸販売
    store = "store"                     # 店舗販売
    ebay = "ebay"                       # eBay（海外）
    aucnet = "aucnet"                   # オークネット
    rk_auction = "rk_auction"          # RKオークション
    overseas_auction = "overseas_auction"  # その他海外オークション
    hp = "hp"                           # 自社HP


class ListingStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    sold = "sold"
    cancelled = "cancelled"
    error = "error"


class Channel(Base):
    __tablename__ = "channels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    channel_type = Column(Enum(ChannelType), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    api_config = Column(Text, nullable=True)  # JSON: API keys etc.
    fee_rate = Column(Numeric(5, 2), nullable=True)  # 手数料率 %
    created_at = Column(DateTime, default=datetime.utcnow)

    listings = relationship("Listing", back_populates="channel")

    def __repr__(self):
        return f"<Channel {self.channel_type}>"


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=False)

    external_id = Column(String(200), nullable=True, index=True)  # Platform listing ID
    status = Column(Enum(ListingStatus), default=ListingStatus.draft, nullable=False)
    listed_price = Column(Numeric(10, 0), nullable=False)
    listed_at = Column(DateTime, nullable=True)
    sold_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="listings")
    channel = relationship("Channel", back_populates="listings")
