"""
Database models for stocks data
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()


class Stock(Base):
    """Stock model representing stock data in the database"""
    __tablename__ = "stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    company_name = Column(String, nullable=False)
    sector = Column(String, index=True)
    industry = Column(String)
    price = Column(Float, nullable=False)
    market_cap = Column(Float, index=True)
    volume = Column(Integer, index=True)
    pe_ratio = Column(Float)
    dividend_yield = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Stock(symbol={self.symbol}, price={self.price})>"


# Database setup
def get_engine(database_url: str = "sqlite:///./stocks.db"):
    """Create database engine"""
    return create_engine(database_url, connect_args={"check_same_thread": False})


def get_session(engine):
    """Create database session"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()


def init_db(database_url: str = "sqlite:///./stocks.db"):
    """Initialize database with tables"""
    engine = get_engine(database_url)
    Base.metadata.create_all(bind=engine)
    return engine
