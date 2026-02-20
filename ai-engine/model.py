import nest_asyncio
nest_asyncio.apply()

# models.py

from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class KYCStatus(str, enum.Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    REJECTED = "Rejected"

class UserType(str, enum.Enum):
    BUYER = "Buyer"
    SELLER = "Seller"
    ADMIN = "Admin"

class OrderStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)  
    mfa_secret = Column(String, nullable=True) 
    account_status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    user_type = Column(Enum(UserType))

    seller_profile = relationship("Seller", back_populates="user", uselist=False)
    risk_score = relationship("RiskScore", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="buyer")
    reviews = relationship("Review", back_populates="buyer")

class Seller(Base):
    __tablename__ = "sellers"
    seller_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    business_name = Column(String)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.PENDING)
    trust_rating = Column(Float, default=0.0) 
    responsiveness_score = Column(Float, default=100.0)

    user = relationship("User", back_populates="seller_profile")
    documents = relationship("VerificationDocument", back_populates="seller")
    products = relationship("Product", back_populates="seller")
    reviews_received = relationship("Review", back_populates="seller")

class VerificationDocument(Base):
    __tablename__ = "verification_documents"
    doc_id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("sellers.seller_id"))
    doc_type = Column(String) 
    document_url = Column(String) 
    validation_status = Column(String, default="Pending")
    seller = relationship("Seller", back_populates="documents")

class RiskScore(Base):
    __tablename__ = "risk_scores"
    score_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    graph_risk_score = Column(Float) 
    last_updated = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="risk_score")

class Product(Base):
    __tablename__ = "products"
    product_id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("sellers.seller_id"))
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    category = Column(String)
    stock_quantity = Column(Integer)

    seller = relationship("Seller", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product")

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.user_id"))
    total_amount = Column(Float)
    current_status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    quantity = Column(Integer)
    price_at_purchase = Column(Float)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
    review = relationship("Review", back_populates="order_item", uselist=False)

class Review(Base):
    __tablename__ = "reviews"
    review_id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.user_id"))
    seller_id = Column(Integer, ForeignKey("sellers.seller_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    order_item_id = Column(Integer, ForeignKey("order_items.order_item_id"))
    rating = Column(Float)
    comment = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("User", back_populates="reviews")
    seller = relationship("Seller", back_populates="reviews_received")
    product = relationship("Product", back_populates="reviews")
    order_item = relationship("OrderItem", back_populates="review")