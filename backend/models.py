from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship

from database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user")


class BusinessModel(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    location = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    description = Column(String)
    imageUrl = Column(String)
    verified = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    reviewCount = Column(Integer, default=0)

    reviews = relationship("ReviewModel", back_populates="business")


class ReviewModel(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    author = Column(String)
    rating = Column(Integer)
    comment = Column(String)
    date = Column(String)
    business_id = Column(Integer, ForeignKey("businesses.id"))

    business = relationship("BusinessModel", back_populates="reviews")
