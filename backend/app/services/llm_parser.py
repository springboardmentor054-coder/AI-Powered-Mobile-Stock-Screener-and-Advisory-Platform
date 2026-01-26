"""
LLM Parser Service: Converts natural language queries to structured JSON
"""
import json
import os
from groq import Groq
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()


class LLMParser:
    """Service to parse natural language queries into structured JSON"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = Groq(api_key=api_key)
        
        # Define the schema for stock queries
        self.schema = {
            "type": "object",
            "properties": {
                "filters": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "field": {
                                "type": "string",
                                "enum": ["symbol", "company_name", "sector", "industry", "price", 
                                        "market_cap", "volume", "pe_ratio", "dividend_yield"]
                            },
                            "operator": {
                                "type": "string",
                                "enum": ["eq", "gt", "gte", "lt", "lte", "between", "like", "in"]
                            },
                            "value": {
                                "type": ["string", "number", "array"]
                            }
                        },
                        "required": ["field", "operator", "value"]
                    }
                },
                "order_by": {
                    "type": "object",
                    "properties": {
                        "field": {
                            "type": "string",
                            "enum": ["symbol", "company_name", "sector", "price", 
                                    "market_cap", "volume", "pe_ratio", "dividend_yield"]
                        },
                        "direction": {
                            "type": "string",
                            "enum": ["asc", "desc"]
                        }
                    }
                },
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 1000
                }
            }
        }
    
    def parse(self, query: str) -> Dict[str, Any]:
        """
        Parse natural language query into structured JSON
        
        Args:
            query: Natural language query string
            
        Returns:
            Dictionary containing parsed query structure
        """
        system_prompt = """You are a query parser for a stock database. 
        Parse the user's natural language query into a structured JSON format.
        
        Available fields:
        - symbol: Stock ticker symbol (string)
        - company_name: Company name (string)
        - sector: Business sector (string)
        - industry: Industry type (string)
        - price: Stock price (number)
        - market_cap: Market capitalization in billions (number)
        - volume: Trading volume (number)
        - pe_ratio: Price-to-earnings ratio (number)
        - dividend_yield: Dividend yield percentage (number)
        
        Available operators:
        - eq: equals
        - gt: greater than
        - gte: greater than or equal
        - lt: less than
        - lte: less than or equal
        - between: value is between two numbers (use array [min, max])
        - like: contains text (for strings)
        - in: value is in a list (use array)
        
        Examples:
        - "Show me stocks with price above $100" -> {"filters": [{"field": "price", "operator": "gt", "value": 100}]}
        - "Find tech stocks" -> {"filters": [{"field": "sector", "operator": "eq", "value": "Technology"}]}
        - "Get stocks where volume is above 1 million and price is between $50 and $200" -> 
          {"filters": [{"field": "volume", "operator": "gt", "value": 1000000}, 
                      {"field": "price", "operator": "between", "value": [50, 200]}]}
        
        Return ONLY valid JSON, no additional text."""
        
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate and normalize the result
            return self._normalize_result(result)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {e}")
        except Exception as e:
            raise RuntimeError(f"LLM parsing failed: {e}")
    
    def _normalize_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize and validate the parsed result"""
        normalized = {
            "filters": result.get("filters", []),
            "order_by": result.get("order_by"),
            "limit": result.get("limit", 100)
        }
        
        # Ensure filters is a list
        if not isinstance(normalized["filters"], list):
            normalized["filters"] = []
        
        return normalized
