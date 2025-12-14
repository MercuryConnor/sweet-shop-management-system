from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProductBase(BaseModel):
    name: str
    description: Optional[str]
    price: float


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class SweetCreate(BaseModel):
    name: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    price: float = Field(..., gt=0.0)
    quantity: int = Field(..., ge=0)


class RestockRequest(BaseModel):
    quantity: int = Field(..., ge=0)


class SweetUpdatePrice(BaseModel):
    price: float = Field(..., gt=0.0)


class SweetResponse(BaseModel):
    id: int
    name: str
    category: str
    price: float
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = 1


class OrderCreate(BaseModel):
    items: List[OrderItemBase]


class OrderOut(BaseModel):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
