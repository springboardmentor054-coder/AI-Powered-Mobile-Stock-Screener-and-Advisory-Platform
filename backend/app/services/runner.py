"""
Runner Service: Executes SQL queries and returns results
"""
import time
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import Stock
from app.services.screener import Screener


class Runner:
    """Service to execute SQL queries and return results"""
    
    def __init__(self):
        self.screener = Screener()
    
    def execute(self, parsed_json: Dict[str, Any], db_session: Session) -> tuple[List[Dict[str, Any]], float]:
        """
        Execute query using SQLAlchemy ORM approach
        
        Args:
            parsed_json: Parsed JSON query structure
            db_session: Database session
            
        Returns:
            Tuple of (results list, execution time in seconds)
        """
        start_time = time.time()
        
        try:
            # Build SQLAlchemy query
            query = self.screener.build_sqlalchemy_query(parsed_json, db_session)
            
            # Execute query
            stocks = query.all()
            
            # Convert to dictionaries
            results = []
            for stock in stocks:
                results.append({
                    "id": stock.id,
                    "symbol": stock.symbol,
                    "company_name": stock.company_name,
                    "sector": stock.sector,
                    "industry": stock.industry,
                    "price": stock.price,
                    "market_cap": stock.market_cap,
                    "volume": stock.volume,
                    "pe_ratio": stock.pe_ratio,
                    "dividend_yield": stock.dividend_yield,
                    "created_at": stock.created_at.isoformat() if stock.created_at else None
                })
            
            execution_time = time.time() - start_time
            
            return results, execution_time
            
        except Exception as e:
            execution_time = time.time() - start_time
            raise RuntimeError(f"Query execution failed: {str(e)}")
    
    def execute_raw_sql(self, sql_query: str, db_session: Session) -> tuple[List[Dict[str, Any]], float]:
        """
        Execute raw SQL query (alternative method)
        
        Args:
            sql_query: Raw SQL query string
            db_session: Database session
            
        Returns:
            Tuple of (results list, execution time in seconds)
        """
        start_time = time.time()
        
        try:
            result = db_session.execute(text(sql_query))
            rows = result.fetchall()
            
            # Get column names
            columns = result.keys()
            
            # Convert to dictionaries
            results = []
            for row in rows:
                results.append(dict(zip(columns, row)))
            
            execution_time = time.time() - start_time
            
            return results, execution_time
            
        except Exception as e:
            execution_time = time.time() - start_time
            raise RuntimeError(f"SQL execution failed: {str(e)}")
