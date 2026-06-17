import random
import string
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.product import Product


def generate_sku(db: Session) -> str:
    """GL独自SKUを生成: GL-YYYYMMDD-XXXX"""
    date_str = datetime.utcnow().strftime("%Y%m%d")
    prefix = f"GL{date_str}"
    count = db.query(Product).filter(Product.sku.like(f"{prefix}%")).count()
    return f"{prefix}{count + 1:04d}"


def generate_barcode_number() -> str:
    """コンビニ風の13桁バーコード番号を生成 (EAN-13形式)"""
    # Prefix: 491 (Japan)
    body = "491" + "".join([str(random.randint(0, 9)) for _ in range(9)])
    check = _ean13_check_digit(body)
    return body + str(check)


def _ean13_check_digit(code: str) -> int:
    """EAN-13チェックデジット計算"""
    total = 0
    for i, digit in enumerate(code):
        if i % 2 == 0:
            total += int(digit)
        else:
            total += int(digit) * 3
    return (10 - (total % 10)) % 10


def lookup_jan_code(jan_code: str) -> dict:
    """JANコードから商品情報を外部DBで検索（将来実装）"""
    # TODO: Integrate with jancode.net or Rakuten product search API
    return {}
