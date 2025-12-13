from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from . import models, schemas
from .auth import get_password_hash


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(username=user.username, hashed_password=get_password_hash(user.password), full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(name=product.name, description=product.description, price=product.price)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def list_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()


# Sweet (Sweets) CRUD operations
def create_sweet(db: Session, sweet: schemas.SweetCreate) -> models.Sweet:
    """Create a new sweet in the database."""
    db_sweet = models.Sweet(
        name=sweet.name,
        category=sweet.category,
        price=sweet.price,
        quantity=sweet.quantity
    )
    db.add(db_sweet)
    db.commit()
    db.refresh(db_sweet)
    return db_sweet


def list_sweets(db: Session, skip: int = 0, limit: int = 100) -> list[models.Sweet]:
    """List all sweets with pagination."""
    return db.query(models.Sweet).offset(skip).limit(limit).all()


def search_sweets(
    db: Session,
    name: str = None,
    category: str = None,
    min_price: float = None,
    max_price: float = None,
    skip: int = 0,
    limit: int = 100
) -> list[models.Sweet]:
    """Search sweets with optional filters for name, category, and price range."""
    query = db.query(models.Sweet)
    
    # Apply name filter (case-insensitive)
    if name:
        query = query.filter(models.Sweet.name.ilike(f"%{name}%"))
    
    # Apply category filter (exact match)
    if category:
        query = query.filter(models.Sweet.category == category)
    
    # Apply price range filter
    if min_price is not None:
        query = query.filter(models.Sweet.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Sweet.price <= max_price)
    
    return query.offset(skip).limit(limit).all()
