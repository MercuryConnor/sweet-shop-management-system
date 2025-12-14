from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .db.session import engine, Base, get_db, SessionLocal
from . import models, schemas, crud, auth
from .seed import seed_sweets
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sweet Shop API")


@app.on_event("startup")
def startup_seed():
    db = SessionLocal()
    try:
        seed_sweets(db)
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Routes
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_username(db, username=user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Mark users with "admin" in username as admin
    is_admin = "admin" in user_in.username.lower()
    
    try:
        user = crud.create_user(db, user=user_in, is_admin=is_admin)
        return user
    except IntegrityError:
        # Handle race condition: concurrent registration with same username
        # Database constraint prevents duplication; rollback and return proper error
        db.rollback()
        raise HTTPException(status_code=400, detail="Username already registered")


@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# Product Routes
@app.post("/api/products", response_model=schemas.ProductOut)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_product(db, product=product_in)


@app.get("/api/products", response_model=list[schemas.ProductOut])
def get_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.list_products(db, skip=skip, limit=limit)


# Sweet Routes
@app.post("/api/sweets", response_model=schemas.SweetResponse)
def create_sweet(sweet_in: schemas.SweetCreate, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    """Create a new sweet. Requires admin authorization."""
    return crud.create_sweet(db, sweet=sweet_in)


@app.get("/api/sweets", response_model=list[schemas.SweetResponse])
def list_sweets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all sweets with pagination."""
    return crud.list_sweets(db, skip=skip, limit=limit)


@app.put("/api/sweets/{sweet_id}", response_model=schemas.SweetResponse)
def update_sweet_price(
    sweet_id: int,
    sweet_in: schemas.SweetUpdatePrice,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """Update sweet price. Requires admin authorization."""
    sweet, error = crud.update_sweet_price(db=db, sweet_id=sweet_id, price=sweet_in.price)
    if error == "not_found":
        raise HTTPException(status_code=404, detail="Sweet not found")
    return sweet


@app.delete("/api/sweets/{sweet_id}")
def delete_sweet(
    sweet_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """Delete a sweet. Requires admin authorization."""
    deleted, error = crud.delete_sweet(db=db, sweet_id=sweet_id)
    if error == "not_found":
        raise HTTPException(status_code=404, detail="Sweet not found")
    return {"detail": "Sweet deleted"}


@app.get("/api/sweets/search", response_model=list[schemas.SweetResponse])
def search_sweets(
    name: str = None,
    category: str = None,
    min_price: float = None,
    max_price: float = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Search sweets by name, category, and/or price range."""
    return crud.search_sweets(
        db,
        name=name,
        category=category,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=limit
    )


# Inventory Routes
@app.post("/api/sweets/{sweet_id}/purchase", response_model=schemas.SweetResponse)
def purchase_sweet(sweet_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Purchase a sweet by decreasing its quantity by 1. Requires authentication."""
    sweet, error = crud.purchase_sweet(db=db, sweet_id=sweet_id)
    if error == "not_found":
        raise HTTPException(status_code=404, detail="Sweet not found")
    elif error == "out_of_stock":
        raise HTTPException(status_code=400, detail="Out of stock")
    return sweet


@app.post("/api/sweets/{sweet_id}/restock", response_model=schemas.SweetResponse)
def restock_sweet(
    sweet_id: int,
    restock_in: schemas.RestockRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin)
):
    """Restock a sweet. Requires admin authorization."""
    sweet, error = crud.restock_sweet(db=db, sweet_id=sweet_id, quantity=restock_in.quantity)
    if error == "not_found":
        raise HTTPException(status_code=404, detail="Sweet not found")
    return sweet
