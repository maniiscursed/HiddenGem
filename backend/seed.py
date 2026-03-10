from database import SessionLocal, engine, Base
from models import BusinessModel, ReviewModel
from datetime import datetime

# Create tables
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(BusinessModel).first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database with fake data...")

    fake_db = [
        {
            "id": 1,
            "name": "Mama's Tacos",
            "category": "Food",
            "location": "Downtown Square",
            "lat": 40.7128,
            "lng": -74.0060,
            "description": "The best authentic street tacos in the city. Try the Al Pastor — regulars say it's life-changing.",
            "imageUrl": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80",
            "verified": True,
        },
        {
            "id": 2,
            "name": "Joe's Bike Repair",
            "category": "Services",
            "location": "Northside Avenue",
            "lat": 40.7200,
            "lng": -73.9900,
            "description": "Fast and cheap bike repairs. Walk-ins welcome. 20+ years of experience keeping the city rolling.",
            "imageUrl": "https://images.unsplash.com/photo-1517521873998-ee99fc285ff0?w=600&q=80",
            "verified": False,
        },
        {
            "id": 3,
            "name": "Lakshmi's Tailoring",
            "category": "Services",
            "location": "East Market Street",
            "lat": 40.7050,
            "lng": -73.9980,
            "description": "Expert alterations and custom stitching. Bridal wear, suits, and everyday clothing done with love and precision.",
            "imageUrl": "https://images.unsplash.com/photo-1558171813-82b6f96c0702?w=600&q=80",
            "verified": True,
        },
        {
            "id": 4,
            "name": "Vinyl Haven",
            "category": "Retail",
            "location": "The Arts Quarter",
            "lat": 40.7300,
            "lng": -74.0100,
            "description": "A treasure trove of rare and second-hand vinyl records. Jazz, soul, indie, and everything in between.",
            "imageUrl": "https://images.unsplash.com/photo-1603048588665-791ca4e98b61?w=600&q=80",
            "verified": False,
        },
        {
            "id": 5,
            "name": "The Chai Corner",
            "category": "Food",
            "location": "Little India District",
            "lat": 40.7180,
            "lng": -73.9820,
            "description": "Authentic masala chai, filter coffee, and South Indian snacks. A warm refuge from the city hustle.",
            "imageUrl": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
            "verified": True,
        },
    ]

    fake_reviews_db = {
        1: [
            {"id": 1, "author": "Maria G.", "rating": 5, "comment": "Absolute best tacos in the city! The Al Pastor is legendary. A true hidden gem!", "date": "2025-02-14"},
            {"id": 2, "author": "James T.", "rating": 4, "comment": "Great food, tiny spot. A bit of a wait but totally worth it.", "date": "2025-01-30"},
            {"id": 3, "author": "Priya S.", "rating": 5, "comment": "Stumbled upon this place by chance — now I come every week. Incredible value!", "date": "2025-03-01"},
        ],
        2: [
            {"id": 1, "author": "Lucas R.", "rating": 5, "comment": "Fixed my flat tire in 10 minutes for $5. Joe is a legend.", "date": "2025-02-20"},
            {"id": 2, "author": "Nina K.", "rating": 4, "comment": "Honest pricing, quick work. Highly recommend for any bike issues.", "date": "2025-01-18"},
        ],
        3: [
            {"id": 1, "author": "Chen W.", "rating": 5, "comment": "She tailored my suit perfectly in just 2 days. Incredible skill!", "date": "2025-02-10"},
            {"id": 2, "author": "Sara P.", "rating": 5, "comment": "Best alterations shop I've found. Very reasonable prices and fast turnaround.", "date": "2025-01-25"},
        ],
        4: [
            {"id": 1, "author": "Amir H.", "rating": 4, "comment": "Great selection of rare vinyl. The owner really knows his music.", "date": "2025-02-28"},
            {"id": 2, "author": "Lily M.", "rating": 5, "comment": "Found a first pressing of my favorite album here for $12. Unreal!", "date": "2025-03-02"},
        ],
        5: [
            {"id": 1, "author": "Omar F.", "rating": 5, "comment": "The best chai I've had outside of my grandmother's kitchen. So cozy.", "date": "2025-02-05"},
            {"id": 2, "author": "Ana V.", "rating": 4, "comment": "Wonderful little tea house, serene atmosphere. The masala chai is divine.", "date": "2025-01-12"},
        ],
    }

    # Insert Businesses
    for biz_data in fake_db:
        # Calculate rating and reviewCount
        reviews_data = fake_reviews_db.get(biz_data["id"], [])
        rating = sum(r["rating"] for r in reviews_data) / len(reviews_data) if reviews_data else 0.0
        reviewCount = len(reviews_data)
        
        biz = BusinessModel(
            id=biz_data["id"],
            name=biz_data["name"],
            category=biz_data["category"],
            location=biz_data["location"],
            lat=biz_data["lat"],
            lng=biz_data["lng"],
            description=biz_data["description"],
            imageUrl=biz_data["imageUrl"],
            verified=biz_data["verified"],
            rating=round(rating, 1),
            reviewCount=reviewCount
        )
        db.add(biz)
        
        # Insert Reviews mapping to this business
        for rev_data in reviews_data:
            review = ReviewModel(
                author=rev_data["author"],
                rating=rev_data["rating"],
                comment=rev_data["comment"],
                date=rev_data["date"],
                business_id=biz.id
            )
            db.add(review)

    db.commit()
    db.close()
    print("Database seeding complete!")

if __name__ == "__main__":
    seed_data()
