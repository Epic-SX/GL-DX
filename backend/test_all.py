"""
Full integration test suite using SQLite in-memory database.
Tests every API endpoint added/modified in this project.
Run: cd c:\GL\backend && venv\Scripts\python -m pytest test_all.py -v
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_temp.db"
os.environ["SECRET_KEY"] = "test-secret-key-123"
os.environ["ENVIRONMENT"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app

# ── SQLite test engine ─────────────────────────────────────────────────────
SQLITE_URL = "sqlite:///./test_temp.db"
engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

# Enable FK constraints in SQLite
@event.listens_for(engine, "connect")
def enable_fk(conn, _):
    conn.execute("PRAGMA foreign_keys=ON")

TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create all tables
Base.metadata.create_all(bind=engine)

# Seed admin user and channels (lifespan only runs in development mode)
def _seed_test_data():
    from app.core.security import hash_password
    from app.models.user import User, UserRole
    from app.models.channel import Channel, ChannelType

    db = TestingSession()
    try:
        if not db.query(User).first():
            db.add(User(
                email="admin@growlog.jp",
                name="GL管理者",
                password_hash=hash_password("admin1234"),
                role=UserRole.gl,
            ))
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
    finally:
        db.close()

_seed_test_data()

client = TestClient(app)

# ── Helpers ────────────────────────────────────────────────────────────────
def get_token():
    """Get JWT token for admin user (seeded by lifespan)."""
    r = client.post("/api/v1/auth/login", json={"email": "admin@growlog.jp", "password": "admin1234"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]

def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════
class TestAuth:
    def test_login_success(self):
        r = client.post("/api/v1/auth/login", json={"email": "admin@growlog.jp", "password": "admin1234"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self):
        r = client.post("/api/v1/auth/login", json={"email": "admin@growlog.jp", "password": "wrong"})
        assert r.status_code == 401

    def test_me(self):
        token = get_token()
        r = client.get("/api/v1/auth/me", headers=auth(token))
        assert r.status_code == 200
        assert r.json()["email"] == "admin@growlog.jp"

    def test_unauthenticated(self):
        r = client.get("/api/v1/auth/me")
        # HTTPBearer returns 403 when no Authorization header is provided
        assert r.status_code in (401, 403)


# ══════════════════════════════════════════════════════════════════════════
# PRODUCTS
# ══════════════════════════════════════════════════════════════════════════
class TestProducts:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = get_token()
        self.h = auth(self.token)

    def test_create_product(self):
        r = client.post("/api/v1/products", json={
            "name": "テスト商品 Canon EOS",
            "brand": "Canon",
            "category": "カメラ",
            "condition": "A",
            "cost_price": 10000,
            "selling_price": 18000,
            "stock_quantity": 1,
        }, headers=self.h)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "テスト商品 Canon EOS"
        assert d["sku"].startswith("GL")
        self.__class__.product_id = d["id"]

    def test_list_products(self):
        r = client.get("/api/v1/products", headers=self.h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_product(self):
        pid = getattr(self.__class__, "product_id", None)
        if not pid:
            pytest.skip("No product created")
        r = client.get(f"/api/v1/products/{pid}", headers=self.h)
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_update_product(self):
        pid = getattr(self.__class__, "product_id", None)
        if not pid:
            pytest.skip("No product created")
        r = client.patch(f"/api/v1/products/{pid}", json={"shelf_location": "A-1-1"}, headers=self.h)
        assert r.status_code == 200
        assert r.json()["shelf_location"] == "A-1-1"

    def test_move_product(self):
        pid = getattr(self.__class__, "product_id", None)
        if not pid:
            pytest.skip("No product created")
        r = client.post(f"/api/v1/products/{pid}/move", json={
            "to_location": "B-2-3",
            "reason": "transfer",
            "quantity": 1,
        }, headers=self.h)
        assert r.status_code == 200
        assert r.json()["to"] == "B-2-3"

    def test_get_movements(self):
        pid = getattr(self.__class__, "product_id", None)
        if not pid:
            pytest.skip("No product created")
        r = client.get(f"/api/v1/products/{pid}/movements", headers=self.h)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_search_by_category(self):
        r = client.get("/api/v1/products?category=カメラ", headers=self.h)
        assert r.status_code == 200

    def test_barcode_lookup(self):
        pid = getattr(self.__class__, "product_id", None)
        if not pid:
            pytest.skip("No product created")
        product = client.get(f"/api/v1/products/{pid}", headers=self.h).json()
        sku = product["sku"]
        r = client.get(f"/api/v1/products/barcode/{sku}", headers=self.h)
        assert r.status_code == 200
        assert r.json()["sku"] == sku


# ══════════════════════════════════════════════════════════════════════════
# CHANNELS
# ══════════════════════════════════════════════════════════════════════════
class TestChannels:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = get_token()
        self.h = auth(self.token)

    def test_list_channels(self):
        r = client.get("/api/v1/channels", headers=self.h)
        assert r.status_code == 200
        channels = r.json()
        assert len(channels) >= 1
        names = [c["channel_type"] for c in channels]
        # Verify new channel types are seeded
        assert "ebay" in names, f"ebay not in channels: {names}"
        assert "aucnet" in names
        assert "rk_auction" in names

    def test_bulk_list(self):
        r = client.get("/api/v1/channels", headers=self.h)
        channels = r.json()
        pid = getattr(TestProducts, "product_id", None)
        if not pid or not channels:
            pytest.skip("Need product and channels")
        cid = channels[0]["id"]
        r2 = client.post(f"/api/v1/channels/bulk-list?product_id={pid}&channel_ids={cid}&price=18000", headers=self.h)
        assert r2.status_code in (200, 422), r2.text


# ══════════════════════════════════════════════════════════════════════════
# ORDERS (including auto fee rate)
# ══════════════════════════════════════════════════════════════════════════
class TestOrders:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = get_token()
        self.h = auth(self.token)

    def _get_channel_id(self, channel_type="yahoo_auction"):
        r = client.get("/api/v1/channels", headers=self.h)
        for c in r.json():
            if c["channel_type"] == channel_type:
                return c["id"]
        return None

    def _create_product(self):
        r = client.post("/api/v1/products", json={
            "name": "Order Test Product",
            "condition": "B",
            "cost_price": 5000,
            "selling_price": 15000,
            "stock_quantity": 1,
        }, headers=self.h)
        return r.json()["id"]

    def test_create_order_with_auto_fee(self):
        pid = self._create_product()
        cid = self._get_channel_id("yahoo_auction")
        r = client.post("/api/v1/orders", json={
            "product_id": pid,
            "channel_id": cid,
            "sale_price": 15000,
            "shipping_fee": 500,
            "platform_fee": 0,  # Should be auto-calculated from yahoo fee_rate=8.8%
            "buyer_name": "テスト購入者",
        }, headers=self.h)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["commission_rate"] is not None
        # Yahoo fee = 8.8%, so platform_fee should be approx 1320
        assert float(d["platform_fee"]) > 0, "Platform fee should be auto-applied"
        self.__class__.order_id = d["id"]

    def test_list_orders(self):
        r = client.get("/api/v1/orders", headers=self.h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_order(self):
        oid = getattr(self.__class__, "order_id", None)
        if not oid:
            pytest.skip("No order created")
        r = client.get(f"/api/v1/orders/{oid}", headers=self.h)
        assert r.status_code == 200
        assert "fulfillment_steps" in r.json()
        assert len(r.json()["fulfillment_steps"]) == 5

    def test_update_order_status(self):
        oid = getattr(self.__class__, "order_id", None)
        if not oid:
            pytest.skip("No order created")
        r = client.patch(f"/api/v1/orders/{oid}", json={"status": "confirmed"}, headers=self.h)
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

    def test_complete_fulfillment_step(self):
        oid = getattr(self.__class__, "order_id", None)
        if not oid:
            pytest.skip("No order created")
        order = client.get(f"/api/v1/orders/{oid}", headers=self.h).json()
        step_id = order["fulfillment_steps"][0]["id"]
        r = client.post(f"/api/v1/orders/{oid}/fulfillment/{step_id}/complete", headers=self.h)
        assert r.status_code == 200

    def test_issue_sale_certificate(self):
        oid = getattr(self.__class__, "order_id", None)
        if not oid:
            pytest.skip("No order created")
        r = client.post(f"/api/v1/orders/{oid}/certificate", headers=self.h)
        assert r.status_code == 200
        assert "certificate_number" in r.json()

    def test_export_orders_csv(self):
        r = client.get("/api/v1/orders/export/csv", headers=self.h)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        # CSV should have headers row
        content = r.content.decode("utf-8-sig")
        assert "受注番号" in content


# ══════════════════════════════════════════════════════════════════════════
# CLIENTS (CRM)
# ══════════════════════════════════════════════════════════════════════════
class TestClients:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = get_token()
        self.h = auth(self.token)

    def test_create_client(self):
        r = client.post("/api/v1/clients", json={
            "name": "山田 太郎",
            "company": "テスト株式会社",
            "client_type": "wholesale",
            "email": "yamada@test.co.jp",
            "phone": "03-1234-5678",
            "payment_terms": "月末締め翌月末払い",
        }, headers=self.h)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "山田 太郎"
        assert d["client_type"] == "wholesale"
        self.__class__.client_id = d["id"]

    def test_list_clients(self):
        r = client.get("/api/v1/clients", headers=self.h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_search_clients(self):
        r = client.get("/api/v1/clients?q=山田", headers=self.h)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_filter_by_type(self):
        r = client.get("/api/v1/clients?client_type=wholesale", headers=self.h)
        assert r.status_code == 200
        for c in r.json():
            assert c["client_type"] == "wholesale"

    def test_get_client(self):
        cid = getattr(self.__class__, "client_id", None)
        if not cid:
            pytest.skip("No client created")
        r = client.get(f"/api/v1/clients/{cid}", headers=self.h)
        assert r.status_code == 200
        assert r.json()["id"] == cid

    def test_update_client(self):
        cid = getattr(self.__class__, "client_id", None)
        if not cid:
            pytest.skip("No client created")
        r = client.patch(f"/api/v1/clients/{cid}", json={"notes": "重要取引先"}, headers=self.h)
        assert r.status_code == 200
        assert r.json()["notes"] == "重要取引先"

    def test_deactivate_client(self):
        cid = getattr(self.__class__, "client_id", None)
        if not cid:
            pytest.skip("No client created")
        r = client.delete(f"/api/v1/clients/{cid}", headers=self.h)
        assert r.status_code == 200
        # Verify deactivated
        r2 = client.get("/api/v1/clients?active_only=true", headers=self.h)
        ids = [c["id"] for c in r2.json()]
        assert cid not in ids


# ══════════════════════════════════════════════════════════════════════════
# ANALYTICS
# ══════════════════════════════════════════════════════════════════════════
class TestAnalytics:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = get_token()
        self.h = auth(self.token)

    def test_summary(self):
        r = client.get("/api/v1/analytics/summary", headers=self.h)
        assert r.status_code == 200
        d = r.json()
        assert "total_inventory" in d
        assert "month_sales" in d
        assert "stagnant_30_days" in d

    def test_monthly_sales(self):
        r = client.get("/api/v1/analytics/sales/monthly?year=2026", headers=self.h)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 12  # All 12 months

    def test_by_channel(self):
        r = client.get("/api/v1/analytics/sales/by-channel", headers=self.h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_stagnant_inventory(self):
        r = client.get("/api/v1/analytics/inventory/stagnant?days=30", headers=self.h)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ══════════════════════════════════════════════════════════════════════════
# ALERTS
# ══════════════════════════════════════════════════════════════════════════
class TestAlerts:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = get_token()
        self.h = auth(self.token)

    def test_list_alerts(self):
        r = client.get("/api/v1/alerts", headers=self.h)
        assert r.status_code == 200

    def test_unread_count(self):
        r = client.get("/api/v1/alerts/unread-count", headers=self.h)
        assert r.status_code == 200
        assert "count" in r.json()

    def test_mark_all_read(self):
        r = client.post("/api/v1/alerts/read-all", headers=self.h)
        assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════
# EBAY STATUS (no API keys needed to test status endpoint)
# ══════════════════════════════════════════════════════════════════════════
class TestEbay:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.token = get_token()
        self.h = auth(self.token)

    def test_ebay_status_not_connected(self):
        r = client.get("/api/v1/ebay/status", headers=self.h)
        assert r.status_code == 200
        assert r.json()["connected"] == False

    def test_ebay_translate_no_key(self):
        pid = getattr(TestProducts, "product_id", None)
        if not pid:
            pytest.skip("No product created")
        r = client.get(f"/api/v1/ebay/translate/{pid}", headers=self.h)
        assert r.status_code == 200
        d = r.json()
        assert "title_en" in d
        assert "deepl_configured" in d
        assert d["deepl_configured"] == False  # No DEEPL_API_KEY set


# ══════════════════════════════════════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════════════════════════════════════
class TestHealth:
    def test_health(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


if __name__ == "__main__":
    import subprocess, sys
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v", "--tb=short"]))
