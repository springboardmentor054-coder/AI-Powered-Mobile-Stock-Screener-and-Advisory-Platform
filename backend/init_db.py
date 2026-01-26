"""
Database initialization script
"""
from app.database import init_db, seed_sample_data

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Seeding sample data...")
    seed_sample_data()
    print("Database setup complete!")
