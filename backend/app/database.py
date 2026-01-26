import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models import Base, Stock

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./stocks.db"
)

engine = create_engine(
    DATABASE_URL,
    echo=True,
    future=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

# Dependency
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize the database by creating all tables"""
    Base.metadata.create_all(bind=engine)


def seed_sample_data():
    """Seed the database with sample stock data if it's empty"""
    db: Session = SessionLocal()
    try:
        # Check if data already exists
        if db.query(Stock).first():
            return

        # Define symbols to fetch (Top ~100 stocks by market cap)
        symbols = [
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "BRK-B", "TSM", "UNH",
            "JNJ", "JPM", "V", "XOM", "LLY", "WMT", "PG", "MA", "AVGO", "HD",
            "CVX", "MRK", "KO", "PEP", "ABBV", "COST", "ADBE", "CSCO", "MCD", "TMO",
            "CRM", "PFE", "ACN", "CMCSA", "LIN", "AMD", "NFLX", "DHR", "ABT", "ORCL",
            "NKE", "TXN", "DIS", "PM", "WFC", "UPS", "BMY", "NEE", "QCOM", "UNP",
            "RTX", "HON", "MS", "BA", "INTC", "IBM", "LOW", "AMGN", "CAT", "SPGI",
            "GE", "INTU", "DE", "PLD", "SBUX", "GS", "COP", "BLK", "MDLZ", "MDT",
            "LMT", "T", "ISRG", "TJX", "ADP", "BKNG", "GILD", "MMC", "VRTX", "ADI",
            "C", "SYK", "AMT", "ELV", "CI", "AXP", "CB", "REGN", "LRCX",
            "PYPL", "BSX", "ZTS", "BDX", "ETN", "SLB", "FI", "EOG", "CME", "MU"
        ]
        
        # Fetch data using the service
        from app.services import fetch_stock_data
        sample_stocks = fetch_stock_data(symbols)

        
        
        db.add_all(sample_stocks)
        db.commit()
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()
