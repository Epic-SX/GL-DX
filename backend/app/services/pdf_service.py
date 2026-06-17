"""PDF generation service using ReportLab.

Documents generated:
  - generate_sale_certificate  → 売却証明書（領収書）
  - generate_delivery_note_pdf → 納品書
  - generate_receipt_pdf       → 受領書（受取確認証）
"""
import os
from datetime import datetime
from app.core.config import settings


def _get_pdf_path(subdir: str, filename: str) -> tuple[str, str]:
    """Return (filepath, url)"""
    dirpath = os.path.join(settings.UPLOAD_DIR, subdir)
    os.makedirs(dirpath, exist_ok=True)
    filepath = os.path.join(dirpath, filename)
    url = f"/uploads/{subdir}/{filename}"
    return filepath, url


def generate_sale_certificate(order, certificate_number: str) -> str:
    """売却証明書PDFを生成して URLを返す"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        filename = f"{certificate_number}.pdf"
        filepath, url = _get_pdf_path("certificates", filename)

        c = canvas.Canvas(filepath, pagesize=A4)
        w, h = A4

        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(w / 2, h - 50 * mm, "Sale Certificate / 売却証明書")

        c.setFont("Helvetica", 11)
        c.drawString(20 * mm, h - 70 * mm, f"Certificate No.: {certificate_number}")
        c.drawString(20 * mm, h - 80 * mm, f"Order No.: {order.order_number}")
        c.drawString(20 * mm, h - 90 * mm, f"Date: {order.ordered_at.strftime('%Y/%m/%d')}")

        if order.product:
            c.drawString(20 * mm, h - 110 * mm, f"Product: {order.product.name}")
            c.drawString(20 * mm, h - 120 * mm, f"SKU: {order.product.sku}")

        c.drawString(20 * mm, h - 140 * mm, f"Sale Price: ¥{int(order.sale_price):,}")
        c.drawString(20 * mm, h - 150 * mm, f"Buyer: {order.buyer_name or '-'}")

        c.setFont("Helvetica", 8)
        c.drawString(20 * mm, 20 * mm, f"GL株式会社  Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")

        c.save()
        return url
    except Exception as e:
        print(f"PDF generation error: {e}")
        return ""


def generate_delivery_note_pdf(shipment, note_number: str) -> str:
    """納品書PDFを生成して URLを返す"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas

        filename = f"{note_number}.pdf"
        filepath, url = _get_pdf_path("delivery_notes", filename)

        c = canvas.Canvas(filepath, pagesize=A4)
        w, h = A4

        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(w / 2, h - 30 * mm, "Delivery Note / 納品書")

        c.setFont("Helvetica", 11)
        c.drawString(20 * mm, h - 50 * mm, f"Note No.: {note_number}")
        c.drawString(20 * mm, h - 60 * mm, f"Date: {datetime.utcnow().strftime('%Y/%m/%d')}")
        c.drawString(20 * mm, h - 70 * mm, f"Carrier: {shipment.carrier.value}")
        c.drawString(20 * mm, h - 80 * mm, f"Tracking: {shipment.tracking_number or 'TBD'}")

        c.drawString(20 * mm, h - 100 * mm, "Ship To:")
        c.drawString(25 * mm, h - 110 * mm, f"{shipment.recipient_name or '-'}")
        c.drawString(25 * mm, h - 120 * mm, f"〒{shipment.recipient_postal_code or ''}")
        c.drawString(25 * mm, h - 130 * mm, f"{shipment.recipient_address or '-'}")
        c.drawString(25 * mm, h - 140 * mm, f"Tel: {shipment.recipient_phone or '-'}")

        if shipment.order and shipment.order.product:
            p = shipment.order.product
            c.drawString(20 * mm, h - 160 * mm, "Items:")
            c.drawString(25 * mm, h - 170 * mm, f"1. {p.name}  (SKU: {p.sku})")

        c.setFont("Helvetica", 8)
        c.drawString(20 * mm, 20 * mm, "GL株式会社")
        c.save()
        return url
    except Exception as e:
        print(f"PDF generation error: {e}")
        return ""


def generate_receipt_pdf(shipment, receipt_number: str) -> str:
    """受領書PDFを生成して URLを返す（受取確認証）"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas

        filename = f"{receipt_number}.pdf"
        filepath, url = _get_pdf_path("receipts", filename)

        c = canvas.Canvas(filepath, pagesize=A4)
        w, h = A4

        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(w / 2, h - 30 * mm, "Receipt / 受領書")

        c.setFont("Helvetica", 11)
        c.drawString(20 * mm, h - 50 * mm, f"Receipt No.: {receipt_number}")
        c.drawString(20 * mm, h - 60 * mm, f"Date: {datetime.utcnow().strftime('%Y/%m/%d')}")
        c.drawString(20 * mm, h - 70 * mm, f"Carrier: {shipment.carrier.value.upper()}")
        if shipment.tracking_number:
            c.drawString(20 * mm, h - 80 * mm, f"Tracking No.: {shipment.tracking_number}")

        c.setFont("Helvetica-Bold", 11)
        c.drawString(20 * mm, h - 100 * mm, "Recipient / 受取人:")
        c.setFont("Helvetica", 11)
        c.drawString(25 * mm, h - 110 * mm, f"{shipment.recipient_name or '-'}")
        c.drawString(25 * mm, h - 120 * mm, f"〒{shipment.recipient_postal_code or ''}")
        c.drawString(25 * mm, h - 130 * mm, f"{shipment.recipient_address or '-'}")
        c.drawString(25 * mm, h - 140 * mm, f"Tel: {shipment.recipient_phone or '-'}")

        if shipment.order and shipment.order.product:
            p = shipment.order.product
            c.setFont("Helvetica-Bold", 11)
            c.drawString(20 * mm, h - 160 * mm, "Items / 内容品:")
            c.setFont("Helvetica", 11)
            c.drawString(25 * mm, h - 170 * mm, f"1.  {p.name}  (SKU: {p.sku})")
            if shipment.order.sale_price:
                c.drawString(25 * mm, h - 180 * mm, f"    金額: ¥{int(shipment.order.sale_price):,}")

        # Signature box
        c.setFont("Helvetica-Bold", 10)
        c.drawString(20 * mm, h - 220 * mm, "Receiver Signature / 受取人署名:")
        c.rect(20 * mm, h - 250 * mm, 80 * mm, 25 * mm)

        c.setFont("Helvetica", 8)
        c.drawString(20 * mm, 20 * mm, f"GL株式会社  Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
        c.save()
        return url
    except Exception as e:
        print(f"Receipt PDF generation error: {e}")
        return ""
