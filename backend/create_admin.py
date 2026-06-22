"""Run once to create the initial admin user."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
import app.models  # ensure all models are registered

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    existing = db.query(User).filter(User.email == "admin@gl.co.jp").first()
    if existing:
        print("Admin user already exists.")
    else:
        user = User(
            email="admin@gl.co.jp",
            name="GL管理者",
            password_hash=hash_password("admin1234"),
            role=UserRole.gl,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print("Admin user created:")
        print("  Email:    admin@gl.co.jp")
        print("  Password: admin1234")
finally:
    db.close()
