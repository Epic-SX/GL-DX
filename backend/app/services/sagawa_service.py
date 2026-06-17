"""佐川急便 e飛伝 CSV出力サービス"""
import io
import csv


SAGAWA_CSV_HEADERS = [
    "お客様管理番号", "送り状種別", "クール区分", "伝票番号",
    "出荷予定日", "お届け予定日", "配達時間帯", "お届け先電話番号",
    "お届け先電話番号枝番", "お届け先郵便番号", "お届け先住所1",
    "お届け先住所2", "お届け先名称1", "お届け先名称2",
    "ご依頼主電話番号", "ご依頼主電話番号枝番", "ご依頼主郵便番号",
    "ご依頼主住所", "ご依頼主名称1", "ご依頼主名称2",
    "品名1", "品名2", "荷扱1", "荷扱2",
    "記事", "コレクト代金引換額（税込）", "内消費税額等",
    "止め置き", "止め置き支店コード", "営業所留め置き支店コード",
    "お届け先コード", "複数口くくり番号", "便種", "発払い・着払い",
    "産直商品コード", "指定シール", "ご依頼主コード", "地図情報コード",
    "投函予定メール利用区分", "メールアドレス", "荷物個数",
    "補助番号", "重量", "サイズ区分",
]


def export_sagawa_csv(shipments) -> bytes:
    """佐川急便CSVをShift-JISで出力"""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(SAGAWA_CSV_HEADERS)

    for s in shipments:
        row = [""] * len(SAGAWA_CSV_HEADERS)
        # お客様管理番号
        row[0] = str(s.id)
        # 送り状種別: 0=一般
        row[1] = "0"
        # お届け先
        row[7] = s.recipient_phone or ""
        row[9] = (s.recipient_postal_code or "").replace("-", "")
        row[10] = s.recipient_address or ""
        row[12] = s.recipient_name or ""
        # ご依頼主
        row[14] = s.sender_phone or ""
        row[16] = (s.sender_postal_code or "").replace("-", "")
        row[17] = s.sender_address or ""
        row[18] = s.sender_name or "GL株式会社"
        # 品名
        if s.order and s.order.product:
            row[20] = s.order.product.name[:30] if s.order.product.name else ""
        # 荷物個数
        row[40] = "1"
        # サイズ区分
        row[43] = s.size_code or "60"

        writer.writerow(row)

    csv_str = output.getvalue()
    return csv_str.encode("shift-jis", errors="replace")
