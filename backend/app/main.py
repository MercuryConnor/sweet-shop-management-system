from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .db.session import engine, Base, get_db
from . import models, schemas, crud, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sweet Shop API")


# Authentication Routes
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_username(db, username=user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    user = crud.create_user(db, user=user_in)
    return user


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
def create_sweet(sweet_in: schemas.SweetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Create a new sweet. Requires authentication."""
    return crud.create_sweet(db, sweet=sweet_in)


@app.get("/api/sweets", response_model=list[schemas.SweetResponse])
def list_sweets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all sweets with pagination."""
    return crud.list_sweets(db, skip=skip, limit=limit)


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
