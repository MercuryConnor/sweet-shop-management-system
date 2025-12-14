import os
from sqlalchemy.orm import Session
from app import models

INITIAL_SWEETS = [
    {"name": "Gulab Jamun", "category": "Indian Sweet", "price": 120, "quantity": 25},
    {"name": "Rasgulla", "category": "Indian Sweet", "price": 100, "quantity": 30},
    {"name": "Kaju Katli", "category": "Dry Sweet", "price": 220, "quantity": 15},
    {"name": "Motichoor Laddu", "category": "Indian Sweet", "price": 140, "quantity": 20},
    {"name": "Mysore Pak", "category": "South Indian", "price": 160, "quantity": 18},
    {"name": "Jalebi", "category": "Indian Sweet", "price": 90, "quantity": 40},
    {"name": "Rasmalai", "category": "Milk-based", "price": 180, "quantity": 22},
]


def seed_sweets(db: Session):
    """Idempotent seed: insert defaults only when no sweets exist."""
    # Skip seeding during pytest to avoid interfering with isolated DB state
    if "PYTEST_CURRENT_TEST" in os.environ:
        return

    existing_count = db.query(models.Sweet).count()
    if existing_count > 0:
        return

    for sweet in INITIAL_SWEETS:
        db.add(models.Sweet(**sweet))

    db.commit()
