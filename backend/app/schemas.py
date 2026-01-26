"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class QueryRequest(BaseModel):
    """Request schema for natural language query"""
    query: str


class QueryResponse(BaseModel):
    """Response schema for query processing"""
    parsed_json: Dict[str, Any]
    sql_query: str
    results: List[Dict[str, Any]]
    execution_time: Optional[float] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str
