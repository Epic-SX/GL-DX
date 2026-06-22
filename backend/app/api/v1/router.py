from fastapi import APIRouter
from app.api.v1 import auth, products, orders, shipments, channels, analytics, alerts, ebay, clients, accounting

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(shipments.router)
api_router.include_router(channels.router)
api_router.include_router(analytics.router)
api_router.include_router(alerts.router)
api_router.include_router(ebay.router)
api_router.include_router(clients.router)
api_router.include_router(accounting.router)
