"""
FastAPI main application
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.schemas import QueryRequest, QueryResponse, HealthResponse
from app.database import get_db, seed_sample_data
from app.services.llm_parser import LLMParser
from app.services.screener import Screener
from app.services.runner import Runner
import time

app = FastAPI(
    title="AI Stock Retrieval API",
    description="Convert natural language queries to SQL and retrieve stock data",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_parser = LLMParser()
screener = Screener()
runner = Runner()


@app.on_event("startup")
async def startup_event():
    """Initialize database and seed sample data on startup"""
    try:
        seed_sample_data()
        print("Database initialized and seeded with sample data.")
    except Exception as e:
        print(f"Warning: Could not seed database: {e}")


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="healthy", message="API is running")


@app.post("/api/query", response_model=QueryResponse)
async def process_query(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Process natural language query and return results
    
    Steps:
    1. Parse natural language to JSON using LLM
    2. Convert JSON to SQL using Screener
    3. Execute SQL using Runner
    4. Return results
    """
    try:
        # Step 1: Parse natural language to JSON
        print(f"Parsing query: {request.query}")
        parsed_json = llm_parser.parse(request.query)
        print(f"Parsed JSON: {parsed_json}")
        
        # Step 2: Convert JSON to SQL
        sql_query = screener.convert_to_sql(parsed_json)
        print(f"Generated SQL: {sql_query}")
        
        # Step 3: Execute query
        results, execution_time = runner.execute(parsed_json, db)
        print(f"Found {len(results)} results in {execution_time:.3f}s")
        
        return QueryResponse(
            parsed_json=parsed_json,
            sql_query=sql_query,
            results=results,
            execution_time=execution_time
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid query: {str(e)}")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Stock Retrieval API",
        "docs": "/docs",
        "health": "/api/health"
    }
