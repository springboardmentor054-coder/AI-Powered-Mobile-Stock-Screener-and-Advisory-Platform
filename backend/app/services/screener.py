"""
Screener Service: Converts structured JSON to SQL queries
"""
from typing import Dict, Any, List
from sqlalchemy import text
from app.models import Stock


class Screener:
    """Service to convert JSON query structure to SQL"""
    
    # Field mapping from JSON field names to database column names
    FIELD_MAP = {
        "symbol": "symbol",
        "company_name": "company_name",
        "sector": "sector",
        "industry": "industry",
        "price": "price",
        "market_cap": "market_cap",
        "volume": "volume",
        "pe_ratio": "pe_ratio",
        "dividend_yield": "dividend_yield"
    }
    
    def __init__(self):
        self.base_table = "stocks"
    
    def convert_to_sql(self, parsed_json: Dict[str, Any]) -> str:
        """
        Convert parsed JSON to SQL query
        
        Args:
            parsed_json: Dictionary containing filters, order_by, and limit
            
        Returns:
            SQL query string
        """
        # Start building the query
        query_parts = ["SELECT * FROM", self.base_table]
        conditions = []
        params = {}
        param_counter = 0
        
        # Process filters
        filters = parsed_json.get("filters", [])
        for filter_item in filters:
            condition = self._build_condition(filter_item, params, param_counter)
            if condition:
                conditions.append(condition)
                param_counter += 1
        
        # Add WHERE clause if there are conditions
        if conditions:
            query_parts.append("WHERE")
            query_parts.append(" AND ".join(conditions))
        
        # Add ORDER BY clause
        order_by = parsed_json.get("order_by")
        if order_by:
            field = order_by.get("field")
            direction = order_by.get("direction", "asc").upper()
            if field in self.FIELD_MAP:
                query_parts.append(f"ORDER BY {self.FIELD_MAP[field]} {direction}")
        
        # Add LIMIT clause
        limit = parsed_json.get("limit", 100)
        if limit:
            query_parts.append(f"LIMIT {limit}")
        
        sql_query = " ".join(query_parts)
        
        # Replace parameter placeholders with actual values for display
        # (In production, you'd use parameterized queries)
        return self._format_sql_with_values(sql_query, params)
    
    def _build_condition(self, filter_item: Dict[str, Any], params: Dict, param_counter: int) -> str:
        """Build a single SQL condition from a filter item"""
        field = filter_item.get("field")
        operator = filter_item.get("operator")
        value = filter_item.get("value")
        
        if field not in self.FIELD_MAP:
            return None
        
        db_field = self.FIELD_MAP[field]
        param_name = f"param_{param_counter}"
        
        if operator == "eq":
            params[param_name] = value
            return f"{db_field} = :{param_name}"
        
        elif operator == "gt":
            params[param_name] = value
            return f"{db_field} > :{param_name}"
        
        elif operator == "gte":
            params[param_name] = value
            return f"{db_field} >= :{param_name}"
        
        elif operator == "lt":
            params[param_name] = value
            return f"{db_field} < :{param_name}"
        
        elif operator == "lte":
            params[param_name] = value
            return f"{db_field} <= :{param_name}"
        
        elif operator == "between":
            if isinstance(value, list) and len(value) == 2:
                params[f"{param_name}_min"] = value[0]
                params[f"{param_name}_max"] = value[1]
                return f"{db_field} BETWEEN :{param_name}_min AND :{param_name}_max"
        
        elif operator == "like":
            params[param_name] = f"%{value}%"
            return f"{db_field} LIKE :{param_name}"
        
        elif operator == "in":
            if isinstance(value, list):
                placeholders = []
                for i, v in enumerate(value):
                    p_name = f"{param_name}_{i}"
                    params[p_name] = v
                    placeholders.append(f":{p_name}")
                return f"{db_field} IN ({', '.join(placeholders)})"
        
        return None
    
    def _format_sql_with_values(self, sql_query: str, params: Dict) -> str:
        """Format SQL query with actual values for display purposes"""
        formatted = sql_query
        for param_name, param_value in params.items():
            if isinstance(param_value, str):
                formatted = formatted.replace(f":{param_name}", f"'{param_value}'")
            else:
                formatted = formatted.replace(f":{param_name}", str(param_value))
        return formatted
    
    def build_sqlalchemy_query(self, parsed_json: Dict[str, Any], db_session):
        """
        Build SQLAlchemy query object (alternative method using ORM)
        
        Args:
            parsed_json: Dictionary containing filters, order_by, and limit
            db_session: SQLAlchemy database session
            
        Returns:
            SQLAlchemy query object
        """
        query = db_session.query(Stock)
        
        # Apply filters
        filters = parsed_json.get("filters", [])
        for filter_item in filters:
            field = filter_item.get("field")
            operator = filter_item.get("operator")
            value = filter_item.get("value")
            
            if field not in self.FIELD_MAP:
                continue
            
            db_field = getattr(Stock, self.FIELD_MAP[field])
            
            if operator == "eq":
                query = query.filter(db_field == value)
            elif operator == "gt":
                query = query.filter(db_field > value)
            elif operator == "gte":
                query = query.filter(db_field >= value)
            elif operator == "lt":
                query = query.filter(db_field < value)
            elif operator == "lte":
                query = query.filter(db_field <= value)
            elif operator == "between":
                if isinstance(value, list) and len(value) == 2:
                    query = query.filter(db_field.between(value[0], value[1]))
            elif operator == "like":
                query = query.filter(db_field.like(f"%{value}%"))
            elif operator == "in":
                if isinstance(value, list):
                    query = query.filter(db_field.in_(value))
        
        # Apply ordering
        order_by = parsed_json.get("order_by")
        if order_by:
            field = order_by.get("field")
            direction = order_by.get("direction", "asc")
            if field in self.FIELD_MAP:
                db_field = getattr(Stock, self.FIELD_MAP[field])
                if direction == "desc":
                    query = query.order_by(db_field.desc())
                else:
                    query = query.order_by(db_field.asc())
        
        # Apply limit
        limit = parsed_json.get("limit", 100)
        if limit:
            query = query.limit(limit)
        
        return query
