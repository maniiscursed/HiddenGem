from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.staticfiles import StaticFiles
import os
import shutil
import uuid
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import engine, Base, get_db
import models
import auth
from fastapi.security import OAuth2PasswordRequestForm

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hidden Gem API")

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

# Serve the 'uploads' directory statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS for the frontend React application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class Review(BaseModel):
    id: int
    author: str
    rating: int  # 1-5
    comment: str
    date: str

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ReviewCreate(BaseModel):
    author: str
    rating: int
    comment: str

class Business(BaseModel):
    id: int
    name: str
    category: str
    location: str
    lat: float
    lng: float
    description: str
    imageUrl: str
    verified: bool = False
    rating: float = 0.0
    reviewCount: int = 0

    class Config:
        from_attributes = True

class BusinessCreate(BaseModel):
    name: str
    category: str
    location: str
    lat: float
    lng: float
    description: str
    imageUrl: str

class VibeCheckResponse(BaseModel):
    vibe: str

class AdminStatsResponse(BaseModel):
    totalUsers: int
    totalBusinesses: int
    totalReviews: int
    averageRating: float

# --- API Endpoints ---

@app.post("/api/auth/register", response_model=Token)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.UserModel).filter(models.UserModel.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    # the first user created can be an admin, others are regular users
    is_first_user = db.query(models.UserModel).count() == 0
    role = "admin" if is_first_user else "user"
    
    db_user = models.UserModel(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = auth.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": db_user}

@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.UserModel).filter(models.UserModel.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image and return its URL."""
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"imageUrl": f"http://localhost:8000/uploads/{filename}"}


@app.get("/api/businesses", response_model=List[Business])
def get_businesses(db: Session = Depends(get_db)):
    """Retrieve all local businesses."""
    businesses = db.query(models.BusinessModel).all()
    return businesses


@app.get("/api/businesses/{business_id}", response_model=Business)
def get_business(business_id: int, db: Session = Depends(get_db)):
    """Retrieve a single business by ID."""
    biz = db.query(models.BusinessModel).filter(models.BusinessModel.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@app.post("/api/businesses", response_model=Business)
def create_business(business: BusinessCreate, db: Session = Depends(get_db), current_user: models.UserModel = Depends(auth.get_current_user)):
    """Register a new hidden gem business (Onboarding Wizard flow)."""
    new_biz = models.BusinessModel(
        name=business.name,
        category=business.category,
        location=business.location,
        lat=business.lat,
        lng=business.lng,
        description=business.description,
        imageUrl=business.imageUrl,
        verified=False,
        rating=0.0,
        reviewCount=0
    )
    db.add(new_biz)
    db.commit()
    db.refresh(new_biz)
    return new_biz


@app.get("/api/businesses/{business_id}/reviews", response_model=List[Review])
def get_reviews(business_id: int, db: Session = Depends(get_db)):
    """Get all reviews for a business."""
    biz = db.query(models.BusinessModel).filter(models.BusinessModel.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return db.query(models.ReviewModel).filter(models.ReviewModel.business_id == business_id).all()


@app.post("/api/businesses/{business_id}/reviews", response_model=Review)
def create_review(business_id: int, review: ReviewCreate, db: Session = Depends(get_db), current_user: models.UserModel = Depends(auth.get_current_user)):
    """Submit a new review for a business."""
    biz = db.query(models.BusinessModel).filter(models.BusinessModel.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    new_review = models.ReviewModel(
        author=review.author,
        rating=review.rating,
        comment=review.comment,
        date=datetime.now().strftime("%Y-%m-%d"),
        business_id=business_id
    )
    db.add(new_review)

    # Update the business aggregate rating and review count
    all_reviews = db.query(models.ReviewModel).filter(models.ReviewModel.business_id == business_id).all()
    # including the new one
    total_rating = sum(r.rating for r in all_reviews) + review.rating
    total_count = len(all_reviews) + 1
    
    biz.rating = round(total_rating / total_count, 1)
    biz.reviewCount = total_count

    db.commit()
    db.refresh(new_review)
    return new_review


@app.get("/api/businesses/{business_id}/vibe", response_model=VibeCheckResponse)
def get_business_vibe(business_id: int, db: Session = Depends(get_db)):
    """Generate a mock AI vibe check based on reviews."""
    biz = db.query(models.BusinessModel).filter(models.BusinessModel.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
        
    reviews = db.query(models.ReviewModel).filter(models.ReviewModel.business_id == business_id).all()
    
    if len(reviews) == 0:
        return {"vibe": "This place is a true hidden gem waiting to be discovered! Be the first to leave a review and set the vibe."}
        
    avg_rating = biz.rating
    comments = " ".join([r.comment.lower() for r in reviews])
    
    vibe = ""
    if avg_rating >= 4.5:
        vibe = "Absolutely adored by the community! People love the fantastic service and amazing quality."
    elif avg_rating >= 3.5:
        vibe = "A solid neighborhood spot. Most visitors have positive experiences, making it a reliable choice."
    else:
        vibe = "A mixed bag. Some folks love it, while others think there's room for improvement."
        
    # Extracted pseudo-keywords
    keywords = []
    if "best" in comments or "amazing" in comments or "great" in comments:
        keywords.append("highly praised")
    if "friendly" in comments or "nice" in comments or "staff" in comments:
        keywords.append("welcoming atmosphere")
    if "delicious" in comments or "tasty" in comments or "yummy" in comments:
        keywords.append("mouth-watering food")
    if "cheap" in comments or "affordable" in comments or "value" in comments:
        keywords.append("budget-friendly")
        
    if keywords:
        vibe += f" It's known for being {', '.join(keywords)}."

    return {"vibe": vibe}


@app.get("/api/admin/stats", response_model=AdminStatsResponse)
def get_admin_stats(db: Session = Depends(get_db), current_user: models.UserModel = Depends(auth.get_current_admin)):
    """Get statistics for the admin dashboard."""
    total_users = db.query(models.UserModel).count()
    total_businesses = db.query(models.BusinessModel).count()
    total_reviews = db.query(models.ReviewModel).count()
    
    businesses = db.query(models.BusinessModel).all()
    if businesses:
        total_rating = sum(biz.rating for biz in businesses if biz.rating > 0)
        businesses_with_rating = sum(1 for biz in businesses if biz.rating > 0)
        avg_rating = round(total_rating / businesses_with_rating, 1) if businesses_with_rating > 0 else 0.0
    else:
        avg_rating = 0.0
        
    return {
        "totalUsers": total_users,
        "totalBusinesses": total_businesses,
        "totalReviews": total_reviews,
        "averageRating": avg_rating
    }


@app.delete("/api/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), current_user: models.UserModel = Depends(auth.get_current_admin)):
    """Delete a specific review (Admin only)"""
    review = db.query(models.ReviewModel).filter(models.ReviewModel.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    business_id = review.business_id
    db.delete(review)
    
    # Recalculate business rating
    biz = db.query(models.BusinessModel).filter(models.BusinessModel.id == business_id).first()
    if biz:
        remaining_reviews = db.query(models.ReviewModel).filter(models.ReviewModel.business_id == business_id).all()
        if remaining_reviews:
            biz.rating = round(sum(r.rating for r in remaining_reviews) / len(remaining_reviews), 1)
            biz.reviewCount = len(remaining_reviews)
        else:
            biz.rating = 0.0
            biz.reviewCount = 0
            
    db.commit()
    return {"message": "Review deleted successfully"}


@app.delete("/api/businesses/{business_id}")
def delete_business(business_id: int, db: Session = Depends(get_db), current_user: models.UserModel = Depends(auth.get_current_admin)):
    """Delete a business (Admin only)"""
    biz = db.query(models.BusinessModel).filter(models.BusinessModel.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Delete reviews first due to FK
    db.query(models.ReviewModel).filter(models.ReviewModel.business_id == business_id).delete()
    db.delete(biz)
    db.commit()
    return {"message": "Business deleted successfully"}

@app.get("/")
def read_root():
    return {"message": "Welcome to the Hidden Gem API. Go to /docs for the Swagger UI."}
